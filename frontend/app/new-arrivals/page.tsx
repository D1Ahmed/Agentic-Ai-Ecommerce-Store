"use client";
import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import Navbar from "@/components/Navbar";
import { SlidersHorizontal, Sparkles } from "lucide-react";

const CATEGORIES = [
  "All",
  "Men Summer",
  "Men Winter",
  "Women Summer",
  "Women Winter",
  "Shoes",
];

export default function NewArrivalsPage() {
  const { products, cart, setCart } = useStore();
  const [activeCategory, setActiveCategory] = useState("All");

  const newestProducts = useMemo(() => {
    if (!products) return [];
    return [...products].reverse().slice(0, 8);
  }, [products]);

  const visibleProducts = useMemo(() => {
    let filtered =
      activeCategory === "All"
        ? newestProducts
        : newestProducts.filter((p: any) => p.category === activeCategory);
    return filtered;
  }, [newestProducts, activeCategory]);

  const addToCart = (product: any) => {
    setCart((prev: any) => {
      const existingItem = prev.find((item: any) => item.id === product.id);
      if (existingItem) {
        return prev.map((item: any) =>
          item.id === product.id
            ? { ...item, quantity: (item.quantity || 1) + 1 }
            : item,
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  if (!products || products.length === 0) {
    return (
      <div className="h-screen bg-white flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-400 font-black uppercase tracking-widest text-xs">
          Fetching Latest Drops...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      <Navbar />

      <div className="relative h-[45vh] bg-black overflow-hidden flex items-center justify-center pt-20">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        >
          <source src="/new-arrivals-video.mp4" type="video/mp4" />
        </video>
        <div className="relative z-10 text-center px-6">
          <h1 className="text-6xl md:text-8xl font-black text-white uppercase tracking-tighter leading-none mb-2">
            New <span className="text-blue-500">Drops.</span>
          </h1>
          <p className="text-white/50 text-[10px] font-black uppercase tracking-[0.5em]">
            Database Sync: {newestProducts.length} Items Live
          </p>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white to-transparent" />
      </div>

      <main className="max-w-7xl mx-auto px-6 py-16">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-16 gap-6 border-b border-slate-100 pb-10">
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar w-full md:w-auto">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border whitespace-nowrap ${
                  activeCategory === cat
                    ? "bg-slate-900 text-white border-slate-900 shadow-xl"
                    : "bg-white text-slate-400 border-slate-100 hover:border-slate-300"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-300">
              <SlidersHorizontal size={14} />{" "}
              <span>Filtering {visibleProducts.length} New Assets</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-20">
          {visibleProducts.map((product: any) => (
            <div key={product.id} className="group">
              <Link href={`/collections/${product.id}`}>
                <div className="relative aspect-[3/4] bg-slate-50 rounded-[2.5rem] overflow-hidden mb-6 shadow-sm group-hover:shadow-2xl transition-all duration-700 border border-slate-100">
                  <img
                    src={product.image_url || "/placeholder.png"}
                    alt={product.name}
                    className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-[2000ms]"
                  />
                  {product.is_on_sale && product.sale_percentage > 0 && (
                    <div className="absolute top-4 left-4 z-20">
                      <span className="bg-red-600 backdrop-blur-md text-white px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-xl">
                        {product.sale_percentage}% OFF
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 bg-white/20 backdrop-blur-md border border-white/30 text-white px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.4em]">
                      Inspect Asset
                    </div>
                  </div>
                </div>
              </Link>
              <div className="flex justify-between items-end mb-1 px-2">
                <h3 className="font-black text-slate-900 text-sm uppercase tracking-tighter line-clamp-1 flex-1 pr-2">
                  {product.name}
                </h3>
                <div className="text-right shrink-0">
                  {product.is_on_sale && product.sale_percentage > 0 ? (
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 line-through font-bold">
                        Rs {product.price.toLocaleString()}
                      </span>
                      <span className="font-black text-red-600 italic">
                        Rs {(product.price * (1 - product.sale_percentage / 100)).toLocaleString()}
                      </span>
                    </div>
                  ) : (
                    <span className="font-black text-slate-900 italic">
                      Rs {product.price.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => addToCart(product)}
                className="w-full mt-4 bg-slate-100 py-4 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all shadow-sm active:scale-95"
              >
                Add to Cart
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
