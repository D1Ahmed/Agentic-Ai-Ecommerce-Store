"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import ChatWindow from "@/components/ChatWindow";
import {
  ShoppingBag,
  SlidersHorizontal,
  ArrowUpDown,
  Check,
  Footprints,
  Sparkles,
  Search,
} from "lucide-react";

const SHOE_COLLECTION = [
  {
    id: 301,
    name: "Apex Tech Sneakers",
    price: 160,
    category: "Sneakers",
    image_url:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80",
    description: "Cloud-knit comfort sneakers.",
  },
  {
    id: 302,
    name: "Heritage Leather Boots",
    price: 210,
    category: "Boots",
    image_url:
      "https://images.unsplash.com/photo-1520639889313-7272175b1c39?w=800&q=80",
    description: "Urban trail waterproof boots.",
  },
  {
    id: 303,
    name: "Midnight Suede Loafers",
    price: 130,
    category: "Formal",
    image_url:
      "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=800&q=80",
    description: "Hand-stitched formal loafers.",
  },
  {
    id: 304,
    name: "Vanguard High-Tops",
    price: 190,
    category: "Sneakers",
    image_url:
      "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&q=80",
    description: "Limited retro-future silhouette.",
  },
  {
    id: 305,
    name: "Desert Storm Boots",
    price: 175,
    category: "Boots",
    image_url:
      "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=800&q=80",
    description: "Tactical lightweight frame.",
  },
  {
    id: 306,
    name: "Neon Runner X",
    price: 110,
    category: "Sneakers",
    image_url:
      "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800&q=80",
    description: "Vibrant high-visibility runs.",
  },
];

const CATEGORIES = ["All", "Sneakers", "Boots", "Formal"];

export default function ShoesPage() {
  const { cart, setCart } = useStore();
  const [activeCategory, setActiveCategory] = useState("All");
  const [sortOption, setSortOption] = useState("recommended");
  const [isChatOpen, setIsChatOpen] = useState(false);

  // --- FILTER & SORT LOGIC ---
  const getProcessedProducts = () => {
    let result =
      activeCategory === "All"
        ? [...SHOE_COLLECTION]
        : SHOE_COLLECTION.filter((p) => p.category === activeCategory);

    if (sortOption === "asc") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortOption === "desc") {
      result.sort((a, b) => b.price - a.price);
    }
    return result;
  };

  const visibleProducts = getProcessedProducts();
  const addToCart = (product: any) =>
    setCart((prev: any) => [...prev, product]);

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      {/* 1. GLOBAL NAVIGATION BAR */}
      <nav className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="font-black text-2xl tracking-tighter uppercase italic text-slate-900"
            >
              HD<span className="text-blue-600">wear</span>
            </Link>
            <div className="hidden lg:flex items-center gap-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <Link
                href="/new-arrivals"
                className="hover:text-blue-600 transition-all"
              >
                New Arrivals
              </Link>
              <Link
                href="/collections"
                className="hover:text-slate-900 transition-all"
              >
                Collections
              </Link>
              <Link
                href="/shoes"
                className="text-blue-600 border-b-2 border-blue-600 pb-1 transition-all"
              >
                Shoes
              </Link>
              <Link href="/sale" className="hover:text-red-600 transition-all">
                Sale
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-slate-50 rounded-full transition-colors">
              <Search size={18} />
            </button>
            <Link href="/cart">
              <button className="relative p-3 bg-slate-900 text-white rounded-full hover:bg-blue-600 transition-all shadow-lg">
                <ShoppingBag size={20} />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-white text-blue-600 text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-black border-2 border-slate-900">
                    {cart.length}
                  </span>
                )}
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* 2. CINEMATIC VIDEO HEADER */}
      <div className="relative h-[40vh] bg-black overflow-hidden flex items-center justify-center">
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
        {/* 3. FILTER & SORTING CONTROL BAR */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-16 gap-6 border-b border-slate-100 pb-10">
          {/* Category Filter */}
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
              <span>{visibleProducts.length} Pairs Indexed</span>
            </div>

            {/* Sort Dropdown */}
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
                <button
                  onClick={() => setSortOption("recommended")}
                  className="w-full text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 flex justify-between items-center"
                >
                  Recommended{" "}
                  {sortOption === "recommended" && (
                    <Check size={14} className="text-blue-600" />
                  )}
                </button>
                <button
                  onClick={() => setSortOption("asc")}
                  className="w-full text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 flex justify-between items-center"
                >
                  Price: Low to High{" "}
                  {sortOption === "asc" && (
                    <Check size={14} className="text-blue-600" />
                  )}
                </button>
                <button
                  onClick={() => setSortOption("desc")}
                  className="w-full text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 flex justify-between items-center"
                >
                  Price: High to Low{" "}
                  {sortOption === "desc" && (
                    <Check size={14} className="text-blue-600" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-20">
          {visibleProducts.map((product) => (
            <div key={product.id} className="group">
              <Link href={`/collections/${product.id}`} target="_blank">
                <div className="relative aspect-square bg-slate-50 rounded-[3rem] overflow-hidden mb-8 shadow-sm group-hover:shadow-2xl transition-all duration-700 border border-slate-100">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-[2000ms]"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
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
                <span className="font-black text-xl italic text-slate-900 transition-colors">
                  ${product.price}
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

      {/* 5. AI CONSULTANT */}
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-10 left-10 bg-black text-white p-5 rounded-full shadow-2xl hover:bg-blue-600 hover:scale-110 transition-all z-50 group flex items-center gap-3 border border-white/10"
      >
        <Sparkles
          size={22}
          className="group-hover:rotate-12 transition-transform duration-500"
        />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-700 font-black uppercase tracking-[0.3em] text-[10px] whitespace-nowrap">
          Consultant
        </span>
      </button>
      {isChatOpen && (
        <div className="fixed bottom-28 left-10 z-50 shadow-2xl rounded-3xl overflow-hidden border border-slate-100">
          <ChatWindow onClose={() => setIsChatOpen(false)} />
        </div>
      )}

      <footer className="bg-slate-50 border-t py-24 px-8 text-center mt-20">
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.5em]">
          HDwear Footwear Sequence • 2026 Edition
        </p>
      </footer>
    </div>
  );
}
