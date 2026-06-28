"use client";
import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import Navbar from "@/components/Navbar";
import {
  SlidersHorizontal,
  ArrowUpDown,
  Check,
  Footprints,
} from "lucide-react";

const CATEGORIES = ["All", "Sneakers", "Boots", "Loafers", "Slides", "Chappal", "Heels"];

export default function ShoesPage() {
  const { products, cart, setCart } = useStore();
  const [activeCategory, setActiveCategory] = useState("All");
  const [sortOption, setSortOption] = useState("recommended");

  const shoeProductsFromDB = useMemo(() => {
    if (!products) return [];
    return products.filter((p: any) => p.sub_category === "Shoes");
  }, [products]);

  const visibleProducts = useMemo(() => {
    let result =
      activeCategory === "All"
        ? [...shoeProductsFromDB]
        : shoeProductsFromDB.filter((p: any) => {
            const searchable = `${p.name} ${p.description}`.toLowerCase();
            return searchable.includes(activeCategory.toLowerCase());
          });

    if (sortOption === "asc") {
      result.sort((a: any, b: any) => a.price - b.price);
    } else if (sortOption === "desc") {
      result.sort((a: any, b: any) => b.price - a.price);
    }
    return result;
  }, [shoeProductsFromDB, activeCategory, sortOption]);

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
          Loading Footwear Archive...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      <Navbar />

      {/* HEADER */}
      <div className="relative h-[45vh] bg-black overflow-hidden flex items-center justify-center pt-20">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        >
          <source src="/shoes-video.mp4" type="video/mp4" />
        </video>
        <div className="relative z-10 text-center px-6">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">
            <Footprints size={12} className="text-blue-400" /> Archive Footwear
            Sequence
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white to-transparent" />
      </div>

      <main className="max-w-7xl mx-auto px-6 py-16">
        {/* FILTER & SORTING */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-16 gap-6 border-b border-slate-100 pb-10">
          <div className="flex overflow-x-auto gap-2 w-full md:w-auto no-scrollbar">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${
                  activeCategory === cat
                    ? "bg-slate-900 text-white border-slate-900 shadow-xl"
                    : "bg-white text-slate-400 border-slate-100 hover:border-slate-300 hover:text-slate-900"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-300">
              <SlidersHorizontal size={14} />{" "}
              <span>{visibleProducts.length} Pairs Found</span>
            </div>

            <div className="relative group">
              <div className="flex items-center gap-3 cursor-pointer bg-slate-50 hover:bg-slate-100 px-6 py-3 rounded-full transition-all border border-slate-100">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">
                  Sort:{" "}
                  <span className="text-blue-600">
                    {sortOption === "asc"
                      ? "Low-High"
                      : sortOption === "desc"
                        ? "High-Low"
                        : "Recommended"}
                  </span>
                </span>
                <ArrowUpDown size={14} className="text-slate-400" />
              </div>
              <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 overflow-hidden">
                <button onClick={() => setSortOption("recommended")} className="w-full text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 flex justify-between items-center">
                  Recommended {sortOption === "recommended" && <Check size={14} className="text-blue-600" />}
                </button>
                <button onClick={() => setSortOption("asc")} className="w-full text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 flex justify-between items-center">
                  Price: Low to High {sortOption === "asc" && <Check size={14} className="text-blue-600" />}
                </button>
                <button onClick={() => setSortOption("desc")} className="w-full text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 flex justify-between items-center">
                  Price: High to Low {sortOption === "desc" && <Check size={14} className="text-blue-600" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-20">
          {visibleProducts.map((product: any) => (
            <div key={product.id} className="group">
              <Link href={`/collections/${product.id}`}>
                <div className="relative aspect-square bg-slate-50 rounded-[3rem] overflow-hidden mb-8 shadow-sm group-hover:shadow-2xl transition-all duration-700 border border-slate-100">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-[2000ms]"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 bg-white/20 backdrop-blur-md border border-white/30 text-white px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-widest">
                      Inspect Item
                    </div>
                  </div>
                </div>
              </Link>
              <div className="flex justify-between items-end px-4 mb-2">
                <h3 className="font-black text-slate-900 text-lg uppercase tracking-tighter group-hover:text-blue-600 transition-colors">
                  {product.name}
                </h3>
                <span className="font-black text-xl italic text-slate-900">
                  Rs {product.price.toLocaleString()}
                </span>
              </div>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em] px-4 mb-6">
                {product.description}
              </p>
              <button
                onClick={() => addToCart(product)}
                className="w-full bg-slate-100 py-4 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all shadow-lg active:scale-95"
              >
                Add to Cart
              </button>
            </div>
          ))}
        </div>
      </main>

      <footer className="bg-slate-50 border-t py-24 px-8 text-center mt-20">
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.5em]">
          HDwear Footwear Sequence • 2026 Edition
        </p>
      </footer>
    </div>
  );
}
