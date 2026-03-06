import React from "react";
import { Product } from "../types";
import { ExternalLink, Tag } from "lucide-react";
import { motion } from "motion/react";

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const handleClick = async () => {
    try {
      await fetch(`/api/products/${product.id}/click`, { method: "POST" });
    } catch (e) {
      console.error("Failed to track click", e);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="group bg-white rounded-2xl border border-neutral-200 overflow-hidden transition-all hover:shadow-xl hover:shadow-black/5 flex flex-col h-full"
    >
      <div className="relative aspect-square overflow-hidden bg-neutral-100">
        <img
          src={product.image || "https://picsum.photos/seed/product/400/400"}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          referrerPolicy="no-referrer"
          loading="lazy"
        />
        {product.featured === 1 && (
          <div className="absolute top-3 left-3 bg-black text-white text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md flex items-center gap-1.5 shadow-lg">
            <Tag className="w-3 h-3" />
            Destaque
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col flex-1">
        <div className="mb-2">
          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">
            {product.category_name} • {product.subcategory_name}
          </p>
          <h3 className="font-bold text-neutral-900 line-clamp-2 group-hover:text-black transition-colors leading-tight">
            {product.name}
          </h3>
        </div>

        <p className="text-sm text-neutral-500 line-clamp-2 mb-4 leading-relaxed">
          {product.description}
        </p>

        <div className="mt-auto pt-4 flex items-center justify-between gap-4 border-t border-neutral-100">
          {product.price && (
            <div className="flex flex-col">
              <span className="text-[10px] text-neutral-400 font-medium uppercase tracking-wider">A partir de</span>
              <span className="text-lg font-black text-black">
                R$ {product.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}
          <a
            href={product.link_afiliado}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleClick}
            className="flex-1 bg-black text-white text-sm font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-neutral-800 transition-all active:scale-95 shadow-lg shadow-black/10"
          >
            Ver Oferta
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
