import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("database.sqlite");
const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key";

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS subcategories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category_id INTEGER NOT NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    UNIQUE(name, category_id)
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    image TEXT,
    price REAL,
    link_afiliado TEXT NOT NULL,
    category_id INTEGER NOT NULL,
    subcategory_id INTEGER NOT NULL,
    featured INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (subcategory_id) REFERENCES subcategories(id)
  );
`);

// Seed Admin User if not exists
const adminExists = db.prepare("SELECT * FROM users WHERE email = ?").get("admin@affiliatehub.com");
if (!adminExists) {
  const hashedPassword = bcrypt.hashSync("admin123", 10);
  db.prepare("INSERT INTO users (name, email, password) VALUES (?, ?, ?)").run("Admin", "admin@affiliatehub.com", hashedPassword);
}

// Seed Initial Categories
const categories = [
  { name: "Tech", subcategories: ["Promoções imperdíveis", "15 itens que você TEM que comprar", "Periféricos", "Hardware", "Itens Geek", "Escritório", "Games"] },
  { name: "Moda", subcategories: ["Masculino", "Feminino", "Verão", "Inverno", "Camisas", "Shorts", "Tênis", "10 peças que você TEM que ter no seu guarda-roupa"] },
  { name: "Casa", subcategories: ["Cozinha", "Banheiro", "Quarto", "Sala", "Escritório", "10 itens que você TEM que ter para sua casa"] }
];

for (const cat of categories) {
  const catResult = db.prepare("INSERT OR IGNORE INTO categories (name) VALUES (?)").run(cat.name);
  let catId;
  if (catResult.changes > 0) {
    catId = catResult.lastInsertRowid;
  } else {
    catId = (db.prepare("SELECT id FROM categories WHERE name = ?").get(cat.name) as any).id;
  }

  for (const sub of cat.subcategories) {
    db.prepare("INSERT OR IGNORE INTO subcategories (name, category_id) VALUES (?, ?)").run(sub, catId);
  }
}

// Seed Sample Products
const productCount = db.prepare("SELECT COUNT(*) as count FROM products").get() as any;
if (productCount.count === 0) {
  const techId = (db.prepare("SELECT id FROM categories WHERE name = 'Tech'").get() as any).id;
  const peripheralId = (db.prepare("SELECT id FROM subcategories WHERE name = 'Periféricos' AND category_id = ?").get(techId) as any).id;
  const gameId = (db.prepare("SELECT id FROM subcategories WHERE name = 'Games' AND category_id = ?").get(techId) as any).id;

  db.prepare(`
    INSERT INTO products (name, description, image, price, link_afiliado, category_id, subcategory_id, featured)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    "Logitech G Pro X Superlight",
    "O mouse gamer mais leve e rápido da Logitech, usado pelos melhores pro players do mundo.",
    "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&q=80&w=800",
    799.90,
    "https://amazon.com.br",
    techId,
    peripheralId,
    1
  );

  db.prepare(`
    INSERT INTO products (name, description, image, price, link_afiliado, category_id, subcategory_id, featured)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    "PlayStation 5 Slim",
    "Experimente o carregamento extremamente rápido com um SSD de altíssima velocidade.",
    "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&q=80&w=800",
    3799.00,
    "https://amazon.com.br",
    techId,
    gameId,
    1
  );
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // Auth Middleware
  const authenticate = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (e) {
      res.status(401).json({ error: "Invalid token" });
    }
  };

  // API Routes
  app.post("/api/login", (req, res) => {
    const { email, password } = req.body;
    const user: any = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "1d" });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  });

  // Categories & Subcategories
  app.get("/api/categories", (req, res) => {
    const cats = db.prepare("SELECT * FROM categories").all();
    const result = cats.map((cat: any) => ({
      ...cat,
      subcategories: db.prepare("SELECT * FROM subcategories WHERE category_id = ?").all(cat.id)
    }));
    res.json(result);
  });

  // Products
  app.get("/api/products", (req, res) => {
    const { category, subcategory, featured, search } = req.query;
    let query = `
      SELECT p.*, c.name as category_name, s.name as subcategory_name 
      FROM products p
      JOIN categories c ON p.category_id = c.id
      JOIN subcategories s ON p.subcategory_id = s.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (category) {
      query += " AND p.category_id = ?";
      params.push(category);
    }
    if (subcategory) {
      query += " AND p.subcategory_id = ?";
      params.push(subcategory);
    }
    if (featured === "true") {
      query += " AND p.featured = 1";
    }
    if (search) {
      query += " AND (p.name LIKE ? OR p.description LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    query += " ORDER BY p.created_at DESC";
    const products = db.prepare(query).all(...params);
    res.json(products);
  });

  app.post("/api/products", authenticate, (req, res) => {
    const { name, description, image, price, link_afiliado, category_id, subcategory_id, featured } = req.body;
    const result = db.prepare(`
      INSERT INTO products (name, description, image, price, link_afiliado, category_id, subcategory_id, featured)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(name, description, image, price, link_afiliado, category_id, subcategory_id, featured ? 1 : 0);
    res.json({ id: result.lastInsertRowid });
  });

  app.put("/api/products/:id", authenticate, (req, res) => {
    const { id } = req.params;
    const { name, description, image, price, link_afiliado, category_id, subcategory_id, featured } = req.body;
    db.prepare(`
      UPDATE products 
      SET name = ?, description = ?, image = ?, price = ?, link_afiliado = ?, category_id = ?, subcategory_id = ?, featured = ?
      WHERE id = ?
    `).run(name, description, image, price, link_afiliado, category_id, subcategory_id, featured ? 1 : 0, id);
    res.json({ success: true });
  });

  app.delete("/api/products/:id", authenticate, (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM products WHERE id = ?").run(id);
    res.json({ success: true });
  });

  // Click Tracking
  app.post("/api/products/:id/click", (req, res) => {
    const { id } = req.params;
    db.prepare("UPDATE products SET clicks = clicks + 1 WHERE id = ?").run(id);
    res.json({ success: true });
  });

  // Stats
  app.get("/api/stats", authenticate, (req, res) => {
    const totalProducts = db.prepare("SELECT COUNT(*) as count FROM products").get() as any;
    const totalClicks = db.prepare("SELECT SUM(clicks) as count FROM products").get() as any;
    const topProducts = db.prepare("SELECT name, clicks FROM products ORDER BY clicks DESC LIMIT 5").all();
    res.json({
      totalProducts: totalProducts.count,
      totalClicks: totalClicks.count || 0,
      topProducts
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
