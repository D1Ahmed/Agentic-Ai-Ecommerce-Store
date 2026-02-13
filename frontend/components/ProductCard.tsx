"use client";
import { useStore } from "@/context/StoreContext";
import { Plus } from "lucide-react";

export default function ProductCard({ product }: { product: any }) {
  const { cart, setCart } = useStore();

  const addToCart = () => {
    setCart([...cart, product]);
    // Optional: Add a toast notification here
  };

  return (
    <div className="group relative bg-white border border-slate-100 rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
      {/* Image Container */}
      <div className="relative h-72 w-full overflow-hidden bg-slate-100">
        <img
          src={product.image_url || "/placeholder.png"}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
        <div className="absolute top-4 right-4">
          <span className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">
            {product.category || "New Drop"}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-black text-lg uppercase tracking-tighter leading-tight">
            {product.name}
          </h3>
          <span className="font-bold text-blue-600">${product.price}</span>
        </div>

        <p className="text-slate-500 text-sm line-clamp-2 mb-6 font-medium">
          {product.description}
        </p>

        <button
          onClick={addToCart}
          className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-4 rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-blue-600 transition-colors"
        >
          <Plus size={16} />
          Add to Cart
        </button>
      </div>
    </div>
  );
}
