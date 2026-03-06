import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Category, Subcategory } from "../types";
import { Menu, X, Search, ChevronRight, ShoppingBag, Laptop, Home as HomeIcon, Shirt } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LayoutProps {
  children: React.ReactNode;
  categories: Category[];
}

export default function Layout({ children, categories }: LayoutProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");

  const activeCategoryId = searchParams.get("category");
  const activeSubcategoryId = searchParams.get("subcategory");

  const activeCategory = categories.find(c => c.id.toString() === activeCategoryId);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    if (searchQuery) newParams.set("search", searchQuery);
    else newParams.delete("search");
    setSearchParams(newParams);
  };

  const setCategory = (id: string | null) => {
    const newParams = new URLSearchParams();
    if (id) newParams.set("category", id);
    setSearchParams(newParams);
  };

  const setSubcategory = (id: string | null) => {
    const newParams = new URLSearchParams(searchParams);
    if (id) newParams.set("subcategory", id);
    else newParams.delete("subcategory");
    setSearchParams(newParams);
  };

  const getIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case "tech": return <Laptop className="w-5 h-5" />;
      case "moda": return <Shirt className="w-5 h-5" />;
      case "casa": return <HomeIcon className="w-5 h-5" />;
      default: return <ShoppingBag className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-50 h-16 flex items-center px-4 md:px-6">
        <div className="flex items-center gap-4 w-full max-w-7xl mx-auto">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors md:hidden"
          >
            {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          
          <Link to="/" onClick={() => setCategory(null)} className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight hidden sm:block">AffiliateHub</span>
          </Link>

          <form onSubmit={handleSearch} className="flex-1 max-w-2xl relative ml-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Buscar produtos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-100 border-none rounded-full py-2 pl-10 pr-4 focus:ring-2 focus:ring-black/5 transition-all text-sm"
            />
          </form>

          <div className="flex items-center gap-2 ml-auto">
            <Link to="/admin/login" className="text-sm font-medium text-neutral-500 hover:text-black transition-colors">
              Admin
            </Link>
          </div>
        </div>
      </header>

      <div className="flex flex-1 max-w-7xl mx-auto w-full relative">
        {/* Sidebar */}
        <aside className={cn(
          "fixed md:sticky top-16 h-[calc(100vh-4rem)] bg-white border-r border-neutral-200 transition-all duration-300 z-40",
          isSidebarOpen ? "w-64 left-0" : "w-0 -left-64 md:w-20 md:left-0"
        )}>
          <div className="p-4 flex flex-col gap-2 overflow-y-auto h-full">
            <div className="mb-4">
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest px-3 mb-2">Categorias</p>
              <button
                onClick={() => setCategory(null)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium group",
                  !activeCategoryId ? "bg-black text-white shadow-lg shadow-black/10" : "text-neutral-600 hover:bg-neutral-100"
                )}
              >
                <div className={cn("shrink-0 transition-colors", !activeCategoryId ? "text-white" : "text-neutral-400 group-hover:text-black")}>
                  <ShoppingBag className="w-5 h-5" />
                </div>
                {isSidebarOpen && <span>Todos os Produtos</span>}
              </button>
            </div>

            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id.toString())}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium group",
                  activeCategoryId === cat.id.toString() ? "bg-black text-white shadow-lg shadow-black/10" : "text-neutral-600 hover:bg-neutral-100"
                )}
              >
                <div className={cn("shrink-0 transition-colors", activeCategoryId === cat.id.toString() ? "text-white" : "text-neutral-400 group-hover:text-black")}>
                  {getIcon(cat.name)}
                </div>
                {isSidebarOpen && <span>{cat.name}</span>}
              </button>
            ))}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-w-0">
          {/* Subcategories Bar */}
          {activeCategory && (
            <div className="bg-white border-b border-neutral-200 sticky top-16 z-30 overflow-x-auto no-scrollbar">
              <div className="flex items-center gap-2 p-3 px-6 min-w-max">
                <button
                  onClick={() => setSubcategory(null)}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-xs font-semibold transition-all border",
                    !activeSubcategoryId ? "bg-neutral-900 text-white border-neutral-900" : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400"
                  )}
                >
                  Ver Tudo
                </button>
                {activeCategory.subcategories.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => setSubcategory(sub.id.toString())}
                    className={cn(
                      "px-4 py-1.5 rounded-full text-xs font-semibold transition-all border",
                      activeSubcategoryId === sub.id.toString() ? "bg-neutral-900 text-white border-neutral-900" : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400"
                    )}
                  >
                    {sub.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
