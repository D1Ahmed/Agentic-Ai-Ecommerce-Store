"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import ChatWindow from "@/components/ChatWindow";
import {
  ShoppingBag,
  ArrowLeft,
  SlidersHorizontal,
  ArrowUpDown,
  Check,
  Zap,
  Sparkles,
  Menu,
  Search,
} from "lucide-react";

// --- DATA MANIFEST ---
export const NEW_ARRIVALS = [
  {
    id: 201,
    name: "Cyberpunk Bomber",
    price: 180,
    category: "Streetwear",
    image_url:
      "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&q=80",
    description: "Limited edition tech-wear jacket.",
  },
  {
    id: 202,
    name: "Neon Knit Beanie",
    price: 35,
    category: "Accessories",
    image_url:
      "https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?w=800&q=80",
    description: "High-visibility winter gear.",
  },
  {
    id: 203,
    name: "Obsidian Chelsea Boots",
    price: 140,
    category: "Formal",
    image_url:
      "https://images.unsplash.com/photo-1614777553093-ec8c79c83664?w=800&q=80",
    description: "Italian leather, modern cut.",
  },
  {
    id: 204,
    name: "Graphic Oversized Tee",
    price: 50,
    category: "Streetwear",
    image_url:
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&q=80",
    description: "Abstract art print on heavy cotton.",
  },
];

const CATEGORIES = ["All", "Streetwear", "Formal", "Accessories"];

export default function NewArrivalsPage() {
  const { cart, setCart } = useStore();
  const [activeCategory, setActiveCategory] = useState("All");
  const [sortOption, setSortOption] = useState("newest");
  const [isChatOpen, setIsChatOpen] = useState(false);

  const getProcessedProducts = () => {
    let result =
      activeCategory === "All"
        ? [...NEW_ARRIVALS]
        : NEW_ARRIVALS.filter((p) => p.category === activeCategory);
    if (sortOption === "asc") result.sort((a, b) => a.price - b.price);
    else if (sortOption === "desc") result.sort((a, b) => b.price - a.price);
    return result;
  };

  const visibleProducts = getProcessedProducts();
  const addToCart = (product: any) =>
    setCart((prev: any) => [...prev, product]);

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      {/* 1. GLOBAL NAVIGATION BAR (Home Style) */}
      <nav className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8">
            {/* Brand Identity */}
            <Link
              href="/"
              className="font-black text-2xl tracking-tighter uppercase italic"
            >
              HD<span className="text-blue-600">wear</span>
            </Link>

            {/* Nav Links */}
            <div className="hidden lg:flex items-center gap-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <Link
                href="/new-arrivals"
                className="text-blue-600 border-b-2 border-blue-600 pb-1 transition-all"
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
                className="hover:text-slate-900 transition-all"
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

      {/* 2. Video Header Portion */}
      <div className="relative h-[40vh] bg-black overflow-hidden flex items-center justify-center">
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
            Inventory Synchronization Active
          </p>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white to-transparent" />
      </div>

      <main className="max-w-7xl mx-auto px-6 py-16">
        {/* 3. Filter/Sorting Logic Bar */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-16 gap-6 border-b border-slate-100 pb-10">
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar w-full md:w-auto">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${
                  activeCategory === cat
                    ? "bg-slate-900 text-white border-slate-900"
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
              <span>{visibleProducts.length} Items Indexed</span>
            </div>
            {/* Sort Logic remains the same */}
          </div>
        </div>

        {/* 4. Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-20">
          {visibleProducts.map((product) => (
            <div key={product.id} className="group">
              <Link href={`/collections/${product.id}`} target="_blank">
                <div className="relative aspect-[3/4] bg-slate-50 rounded-[2rem] overflow-hidden mb-6 shadow-sm group-hover:shadow-2xl transition-all duration-700">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-[2000ms]"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 bg-white/20 backdrop-blur-md border border-white/30 text-white px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.4em]">
                      Inspect Item
                    </div>
                  </div>
                </div>
              </Link>
              <div className="flex justify-between items-end mb-1">
                <h3 className="font-black text-slate-900 text-sm uppercase tracking-tighter">
                  {product.name}
                </h3>
                <span className="font-black text-slate-900 italic">
                  ${product.price}
                </span>
              </div>
              <button
                onClick={() => addToCart(product)}
                className="w-full mt-4 bg-slate-100 py-3 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all"
              >
                Add to Cart
              </button>
            </div>
          ))}
        </div>
      </main>

      {/* 5. AI Consultant (Chat Button) */}
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-10 left-10 bg-black text-white p-5 rounded-full shadow-2xl hover:bg-blue-600 transition-all z-50 group flex items-center gap-3 border border-white/10"
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
        <div className="fixed bottom-28 left-10 z-50 shadow-2xl rounded-3xl overflow-hidden">
          <ChatWindow onClose={() => setIsChatOpen(false)} />
        </div>
      )}
    </div>
  );
}
