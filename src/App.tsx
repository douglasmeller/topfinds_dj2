import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate, useSearchParams } from "react-router-dom";
import { Category, Product, AuthState } from "./types";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";

export default function App() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [auth, setAuth] = useState<AuthState>(() => {
    const saved = localStorage.getItem("auth");
    return saved ? JSON.parse(saved) : { token: null, user: null };
  });

  useEffect(() => {
    fetch("/api/categories")
      .then(res => res.json())
      .then(setCategories);
  }, []);

  const handleLogin = (token: string, user: any) => {
    const state = { token, user };
    setAuth(state);
    localStorage.setItem("auth", JSON.stringify(state));
  };

  const handleLogout = () => {
    setAuth({ token: null, user: null });
    localStorage.removeItem("auth");
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout categories={categories}><Home categories={categories} /></Layout>} />
        <Route path="/admin/login" element={<AdminLogin onLogin={handleLogin} />} />
        <Route path="/admin" element={<AdminDashboard auth={auth} onLogout={handleLogout} categories={categories} />} />
      </Routes>
    </Router>
  );
}
