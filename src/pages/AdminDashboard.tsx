import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthState, Category, Product } from "../types";
import { 
  LayoutDashboard, 
  Package, 
  Plus, 
  LogOut, 
  Trash2, 
  Edit3, 
  BarChart3, 
  ExternalLink, 
  MousePointer2, 
  Check, 
  X,
  Image as ImageIcon,
  Tag
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useForm } from "react-hook-form";

interface AdminDashboardProps {
  auth: AuthState;
  onLogout: () => void;
  categories: Category[];
}

interface Stats {
  totalProducts: number;
  totalClicks: number;
  topProducts: { name: string; clicks: number }[];
}

export default function AdminDashboard({ auth, onLogout, categories }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<"stats" | "products" | "add">("stats");
  const [stats, setStats] = useState<Stats | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const navigate = useNavigate();

  const { register, handleSubmit, reset, watch, setValue } = useForm();
  const selectedCategoryId = watch("category_id");

  useEffect(() => {
    if (!auth.token) {
      navigate("/admin/login");
      return;
    }
    fetchStats();
    fetchProducts();
  }, [auth.token]);

  const fetchStats = async () => {
    const res = await fetch("/api/stats", {
      headers: { Authorization: `Bearer ${auth.token}` }
    });
    if (res.ok) setStats(await res.json());
  };

  const fetchProducts = async () => {
    const res = await fetch("/api/products");
    if (res.ok) setProducts(await res.json());
  };

  const onSubmit = async (data: any) => {
    const url = editingProduct ? `/api/products/${editingProduct.id}` : "/api/products";
    const method = editingProduct ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${auth.token}`
      },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      reset();
      setEditingProduct(null);
      setActiveTab("products");
      fetchProducts();
      fetchStats();
    }
  };

  const deleteProduct = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este produto?")) return;
    const res = await fetch(`/api/products/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${auth.token}` }
    });
    if (res.ok) {
      fetchProducts();
      fetchStats();
    }
  };

  const startEdit = (product: Product) => {
    setEditingProduct(product);
    setValue("name", product.name);
    setValue("description", product.description);
    setValue("image", product.image);
    setValue("price", product.price);
    setValue("link_afiliado", product.link_afiliado);
    setValue("category_id", product.category_id);
    setValue("subcategory_id", product.subcategory_id);
    setValue("featured", product.featured === 1);
    setActiveTab("add");
  };

  const selectedCategory = categories.find(c => c.id.toString() === selectedCategoryId?.toString());

  return (
    <div className="min-h-screen bg-neutral-50 flex font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-black text-white flex flex-col sticky top-0 h-screen">
        <div className="p-8 flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <Package className="w-5 h-5 text-black" />
          </div>
          <span className="font-black text-lg tracking-tight">AdminHub</span>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <button
            onClick={() => { setActiveTab("stats"); setEditingProduct(null); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-bold ${activeTab === "stats" ? "bg-white/10 text-white" : "text-neutral-400 hover:text-white hover:bg-white/5"}`}
          >
            <BarChart3 className="w-5 h-5" />
            Estatísticas
          </button>
          <button
            onClick={() => { setActiveTab("products"); setEditingProduct(null); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-bold ${activeTab === "products" ? "bg-white/10 text-white" : "text-neutral-400 hover:text-white hover:bg-white/5"}`}
          >
            <Package className="w-5 h-5" />
            Produtos
          </button>
          <button
            onClick={() => setActiveTab("add")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-bold ${activeTab === "add" ? "bg-white/10 text-white" : "text-neutral-400 hover:text-white hover:bg-white/5"}`}
          >
            <Plus className="w-5 h-5" />
            {editingProduct ? "Editar Produto" : "Novo Produto"}
          </button>
        </nav>

        <div className="p-4 mt-auto border-t border-white/10">
          <div className="flex items-center gap-3 px-4 py-3 mb-4">
            <div className="w-8 h-8 bg-neutral-800 rounded-full flex items-center justify-center text-xs font-bold">
              {auth.user?.name[0]}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold truncate max-w-[120px]">{auth.user?.name}</span>
              <span className="text-[10px] text-neutral-500 uppercase tracking-widest">Administrador</span>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-all text-sm font-bold"
          >
            <LogOut className="w-5 h-5" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-neutral-900">
              {activeTab === "stats" && "Visão Geral"}
              {activeTab === "products" && "Gerenciar Produtos"}
              {activeTab === "add" && (editingProduct ? "Editar Produto" : "Adicionar Novo Produto")}
            </h1>
            <p className="text-neutral-500 mt-1">
              Bem-vindo de volta, {auth.user?.name}. Aqui está o que está acontecendo hoje.
            </p>
          </div>
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 bg-white border border-neutral-200 px-4 py-2 rounded-xl text-sm font-bold hover:bg-neutral-50 transition-all shadow-sm"
          >
            <ExternalLink className="w-4 h-4" />
            Ver Site
          </button>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === "stats" && stats && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
                    <Package className="w-6 h-6" />
                  </div>
                  <p className="text-neutral-500 text-sm font-medium">Total de Produtos</p>
                  <p className="text-4xl font-black mt-1">{stats.totalProducts}</p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4">
                    <MousePointer2 className="w-6 h-6" />
                  </div>
                  <p className="text-neutral-500 text-sm font-medium">Cliques Totais</p>
                  <p className="text-4xl font-black mt-1">{stats.totalClicks}</p>
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
                  <h2 className="font-black text-lg">Produtos mais clicados</h2>
                  <BarChart3 className="w-5 h-5 text-neutral-400" />
                </div>
                <div className="p-6">
                  {stats.topProducts.length > 0 ? (
                    <div className="space-y-4">
                      {stats.topProducts.map((p, i) => (
                        <div key={i} className="flex items-center justify-between group">
                          <div className="flex items-center gap-4">
                            <span className="w-6 text-neutral-300 font-black text-xl italic">{i + 1}</span>
                            <span className="font-bold text-neutral-700 group-hover:text-black transition-colors">{p.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-lg">{p.clicks}</span>
                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">cliques</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center py-8 text-neutral-400 text-sm">Nenhum dado de clique disponível ainda.</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "products" && (
            <motion.div
              key="products"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-3xl border border-neutral-200 shadow-sm overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-neutral-50 border-b border-neutral-100">
                      <th className="px-6 py-4 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Produto</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Categoria</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-neutral-400 uppercase tracking-widest text-center">Cliques</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-neutral-400 uppercase tracking-widest text-center">Destaque</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-neutral-400 uppercase tracking-widest text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-50">
                    {products.map(product => (
                      <tr key={product.id} className="hover:bg-neutral-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img src={product.image} className="w-10 h-10 rounded-lg object-cover bg-neutral-100" referrerPolicy="no-referrer" />
                            <div>
                              <p className="font-bold text-sm text-neutral-900 line-clamp-1">{product.name}</p>
                              <p className="text-[10px] text-neutral-400 font-medium">R$ {product.price?.toLocaleString("pt-BR")}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-semibold text-neutral-600 bg-neutral-100 px-2 py-1 rounded-md">
                            {product.category_name}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-sm font-black text-neutral-700">{product.clicks}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {product.featured === 1 ? (
                            <Check className="w-5 h-5 text-emerald-500 mx-auto" />
                          ) : (
                            <X className="w-5 h-5 text-neutral-200 mx-auto" />
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => startEdit(product)}
                              className="p-2 text-neutral-400 hover:text-black hover:bg-neutral-100 rounded-lg transition-all"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteProduct(product.id)}
                              className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === "add" && (
            <motion.div
              key="add"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl"
            >
              <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-3xl border border-neutral-200 shadow-sm p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest ml-1">Nome do Produto</label>
                    <input
                      {...register("name", { required: true })}
                      placeholder="Ex: iPhone 15 Pro Max"
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-black/5 focus:border-black transition-all text-sm outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest ml-1">Preço (Opcional)</label>
                    <input
                      type="number"
                      step="0.01"
                      {...register("price")}
                      placeholder="0.00"
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-black/5 focus:border-black transition-all text-sm outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest ml-1">Descrição Curta</label>
                  <textarea
                    {...register("description", { required: true })}
                    rows={3}
                    placeholder="Descreva as principais características do produto..."
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-black/5 focus:border-black transition-all text-sm outline-none resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest ml-1">URL da Imagem</label>
                    <div className="relative">
                      <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                      <input
                        {...register("image", { required: true })}
                        placeholder="https://exemplo.com/imagem.jpg"
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-xl py-3 pl-11 pr-4 focus:ring-2 focus:ring-black/5 focus:border-black transition-all text-sm outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest ml-1">Link de Afiliado</label>
                    <div className="relative">
                      <ExternalLink className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                      <input
                        {...register("link_afiliado", { required: true })}
                        placeholder="https://amazon.com.br/..."
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-xl py-3 pl-11 pr-4 focus:ring-2 focus:ring-black/5 focus:border-black transition-all text-sm outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest ml-1">Categoria</label>
                    <select
                      {...register("category_id", { required: true })}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-black/5 focus:border-black transition-all text-sm outline-none appearance-none"
                    >
                      <option value="">Selecione uma categoria</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest ml-1">Subcategoria</label>
                    <select
                      {...register("subcategory_id", { required: true })}
                      disabled={!selectedCategoryId}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-black/5 focus:border-black transition-all text-sm outline-none appearance-none disabled:opacity-50"
                    >
                      <option value="">Selecione uma subcategoria</option>
                      {selectedCategory?.subcategories.map(sub => (
                        <option key={sub.id} value={sub.id}>{sub.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-neutral-50 rounded-2xl border border-neutral-100">
                  <input
                    type="checkbox"
                    id="featured"
                    {...register("featured")}
                    className="w-5 h-5 rounded-md border-neutral-300 text-black focus:ring-black"
                  />
                  <label htmlFor="featured" className="text-sm font-bold text-neutral-700 flex items-center gap-2 cursor-pointer">
                    <Tag className="w-4 h-4 text-amber-500" />
                    Destacar este produto na página inicial
                  </label>
                </div>

                <div className="flex items-center gap-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-black text-white font-bold py-4 rounded-xl hover:bg-neutral-800 transition-all active:scale-[0.98] shadow-xl shadow-black/10"
                  >
                    {editingProduct ? "Salvar Alterações" : "Cadastrar Produto"}
                  </button>
                  {editingProduct && (
                    <button
                      type="button"
                      onClick={() => { setEditingProduct(null); reset(); setActiveTab("products"); }}
                      className="px-8 bg-neutral-100 text-neutral-600 font-bold py-4 rounded-xl hover:bg-neutral-200 transition-all"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
