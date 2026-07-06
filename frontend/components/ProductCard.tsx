"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import { Plus, Minus, Eye, Star } from "lucide-react";

export default function ProductCard({ product }: { product: any }) {
  const { cart, setCart } = useStore();
  const [qty, setQty] = useState(1); // Local state for quantity

  const addToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    // Logic: If item exists in cart, update its quantity. If not, add new.
    const existingItem = cart.find((item: any) => item.id === product.id);
    if (existingItem) {
      setCart(
        cart.map((item: any) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + qty }
            : item,
        ),
      );
    } else {
      setCart([...cart, { ...product, quantity: qty }]);
    }
    setQty(1); // Reset for next interaction
  };

  const stockCount = product.stock ?? 0;

  return (
    <div className="group relative bg-white border border-slate-100 rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 flex flex-col h-full">
      <Link
        href={`/collections/${product.id}`}
        className="flex-grow cursor-pointer"
      >
        <div className="relative h-64 w-full overflow-hidden bg-slate-100">
          <img
            src={product.image_url || "/placeholder.png"}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
          <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
            <span className="bg-black/80 backdrop-blur-md text-white px-2 py-1 rounded-lg text-[10px] font-black flex items-center gap-1 shadow-xl w-fit">
              <Star size={10} fill="yellow" className="text-yellow-400" />{" "}
              {product.rating || "4.5"}
            </span>
            {product.is_on_sale && product.sale_percentage > 0 && (
              <span className="bg-red-600 backdrop-blur-md text-white px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-xl w-fit">
                {product.sale_percentage}% OFF
              </span>
            )}
          </div>
        </div>

        <div className="p-6">
          <div className="flex justify-between items-start gap-3 mb-2">
            <h3 className="font-black text-base uppercase tracking-tighter leading-snug group-hover:text-blue-600 transition-colors flex-1 min-w-0">
              {product.name}
            </h3>
            <div className="flex flex-col items-end">
              {product.is_on_sale && product.sale_percentage > 0 ? (
                <>
                  <span className="font-bold text-slate-400 line-through text-[10px]">
                    Rs {product.price.toLocaleString()}
                  </span>
                  <span className="font-black text-red-600 whitespace-nowrap flex-shrink-0 text-sm italic">
                    Rs {(product.price * (1 - product.sale_percentage / 100)).toLocaleString()}
                  </span>
                </>
              ) : (
                <span className="font-bold text-blue-600 whitespace-nowrap flex-shrink-0 text-sm">
                  Rs {product.price.toLocaleString()}
                </span>
              )}
            </div>
          </div>
          <p className="text-slate-500 text-xs line-clamp-1 mb-4 italic">
            {product.description}
          </p>

          {/* --- RESTORED STOCK INDICATOR --- */}
          <div className="flex items-center gap-2 mb-2">
            <div
              className={`w-1.5 h-1.5 rounded-full ${stockCount > 5 ? "bg-green-500" : stockCount > 0 ? "bg-orange-500 animate-pulse" : "bg-red-500"}`}
            />
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
              {stockCount > 0 ? `${stockCount} Units in Vault` : "Out of Stock"}
            </span>
          </div>
        </div>
      </Link>

      <div className="px-6 pb-6 space-y-4">
        {/* --- QUANTITY SELECTOR --- */}
        <div className="flex items-center justify-between bg-slate-50 rounded-xl p-2 border border-slate-100">
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-2">
            Quantity
          </span>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setQty(Math.max(1, qty - 1))}
              className="p-1 hover:bg-white rounded-md transition-colors text-slate-400 hover:text-black"
            >
              <Minus size={14} />
            </button>
            <span className="font-black text-sm w-4 text-center">{qty}</span>
            <button
              onClick={() => setQty(Math.min(stockCount, qty + 1))}
              className="p-1 hover:bg-white rounded-md transition-colors text-slate-400 hover:text-black"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        <button
          onClick={addToCart}
          disabled={stockCount === 0}
          className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold uppercase text-xs tracking-widest transition-all shadow-lg active:scale-95 ${stockCount > 0 ? "bg-slate-900 text-white hover:bg-blue-600" : "bg-slate-100 text-slate-300 cursor-not-allowed"}`}
        >
          <Plus size={16} /> {stockCount > 0 ? "Add to Cart" : "Out of Stock"}
        </button>
      </div>
    </div>
  );
}
