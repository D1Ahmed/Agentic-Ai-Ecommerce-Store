"use client";
import React, { useState, useMemo } from "react";
import { useStore } from "@/context/StoreContext";
import ChatWindow from "@/components/ChatWindow";
import {
  ShoppingBag,
  Sparkles,
  Tag,
  Search,
  Percent,
  Zap,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

const SALE_COLLECTION = [
  {
    id: 401,
    name: "Urban Windbreaker",
    price: 120,
    salePrice: 85,
    category: "Outerwear",
    image_url:
      "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&q=80",
    description: "Weather-resistant tactical shell.",
  },
  {
    id: 402,
    name: "Tactical Cargo",
    price: 95,
    salePrice: 60,
    category: "Bottoms",
    image_url:
      "https://images.unsplash.com/photo-1594932224828-b4b05a832971?w=800&q=80",
    description: "Reinforced multi-pocket tech gear.",
  },
];

export default function SalePage() {
  const { products = [], cart = [], setCart } = useStore() || {};
  const [isChatOpen, setIsChatOpen] = useState(false);

  const saleProducts = useMemo(() => {
    const liveSale = products.filter(
      (p: any) => p.onSale || p.salePrice < p.price,
    );
    return liveSale.length > 0 ? liveSale : SALE_COLLECTION;
  }, [products]);

  return (
    <main className="min-h-screen bg-white font-sans selection:bg-red-100">
      {/* 1. HIGH-CONTRAST NAVIGATION */}
      <nav className="bg-white/80 backdrop-blur-xl border-b border-slate-100 sticky top-0 z-40 h-20 px-10 flex items-center justify-between">
        <div className="flex items-center gap-12">
          <Link
            href="/"
            className="font-black text-2xl tracking-tighter uppercase italic text-slate-900"
          >
            HD<span className="text-blue-600">wear</span>
          </Link>
          <div className="hidden lg:flex gap-8 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
            <Link
              href="/new-arrivals"
              className="hover:text-blue-600 transition-all"
            >
              New Arrivals
            </Link>
            <Link
              href="/collections"
              className="hover:text-blue-600 transition-all"
            >
              Collections
            </Link>
            <Link href="/shoes" className="hover:text-blue-600 transition-all">
              Shoes
            </Link>
            <Link
              href="/sale"
              className="text-red-600 border-b-2 border-red-600 pb-1"
            >
              Sale
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <button className="text-slate-400 hover:text-slate-900 transition-colors">
            <Search size={18} />
          </button>
          <Link href="/cart">
            <button className="relative p-3 bg-slate-900 text-white rounded-full hover:bg-red-600 transition-all shadow-xl">
              <ShoppingBag size={20} />
              {cart?.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-white text-red-600 text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-black border-2 border-slate-900">
                  {cart.length}
                </span>
              )}
            </button>
          </Link>
        </div>
      </nav>

      {/* 2. CINEMATIC HERO SECTION */}
      <section className="relative h-[55vh] bg-red-600 flex items-center justify-center overflow-hidden">
        {/* Grayscale Architectural Overlay */}
        <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1472851294608-062f824d29cc?q=80')] bg-cover bg-center grayscale mix-blend-overlay" />

        <div className="relative z-10 text-center px-4 animate-in fade-in zoom-in duration-1000">
          <div className="inline-flex items-center gap-2 bg-white text-red-600 px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.4em] mb-6 shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
            <Zap size={12} fill="currentColor" /> Limited Protocol Alpha
          </div>
          <h1 className="text-7xl md:text-9xl font-black text-white uppercase italic tracking-tighter leading-none mb-4">
            Season <span className="text-slate-900">Archive.</span>
          </h1>
          <p className="text-red-100 text-sm font-bold uppercase tracking-[0.5em] opacity-80">
            Vault Access: Up to 50% Efficiency Discount
          </p>
        </div>

        {/* Bottom Gradient for smooth transition */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* 3. ASSET GRID */}
      <div className="max-w-7xl mx-auto px-10 py-24">
        <div className="flex items-center gap-4 mb-16">
          <div className="h-[2px] w-12 bg-red-600" />
          <h2 className="text-[10px] font-black uppercase tracking-[0.6em] text-slate-400">
            Inventory Clearance Sequence
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-20">
          {saleProducts.map((product: any) => {
            const discount = Math.round(
              ((product.price - (product.salePrice || product.price)) /
                product.price) *
                100,
            );

            return (
              <div
                key={product.id}
                className="group animate-in fade-in slide-in-from-bottom-10 duration-700"
              >
                <Link
                  href={`/collections/${product.id}`}
                  target="_blank"
                  className="block relative aspect-[3/4] rounded-[2.5rem] overflow-hidden bg-slate-50 border border-slate-100 mb-6 shadow-sm group-hover:shadow-2xl transition-all duration-700"
                >
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-[3000ms] group-hover:scale-110"
                  />

                  {/* Status Badges */}
                  <div className="absolute top-6 left-6 flex flex-col gap-2">
                    <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1 shadow-lg">
                      <Percent size={10} /> {discount}% Off
                    </div>
                  </div>

                  {/* Hover Interaction Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 flex items-center justify-center transition-all duration-500">
                    <div className="opacity-0 group-hover:opacity-100 bg-white/90 backdrop-blur-md px-6 py-2.5 rounded-full shadow-2xl flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-all">
                      <span className="text-black font-black text-[9px] uppercase tracking-widest">
                        Inspect Asset
                      </span>
                      <ArrowRight size={12} className="text-red-600" />
                    </div>
                  </div>
                </Link>

                {/* Data Section */}
                <div className="px-4">
                  <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1 block">
                    {product.category}
                  </span>
                  <h3 className="font-black text-slate-900 text-sm uppercase tracking-tighter mb-2 group-hover:text-red-600 transition-colors">
                    {product.name}
                  </h3>

                  <div className="flex gap-4 items-center mb-6">
                    <span className="text-red-600 font-black text-2xl italic tracking-tighter">
                      ${product.salePrice || product.price}
                    </span>
                    <span className="text-slate-300 line-through text-xs font-bold">
                      ${product.price}
                    </span>
                  </div>

                  <button
                    onClick={() => setCart((prev: any) => [...prev, product])}
                    className="w-full bg-slate-50 py-4 rounded-full text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 hover:bg-black hover:text-white transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2"
                  >
                    Add to Archive <ShoppingBag size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. AI NEGOTIATOR TRIGGER */}
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-10 left-10 bg-red-600 text-white p-6 rounded-full shadow-[0_20px_50px_rgba(220,38,38,0.4)] hover:bg-slate-900 hover:scale-110 transition-all z-50 flex items-center gap-3 group border border-white/10"
      >
        <Sparkles
          size={24}
          className="group-hover:rotate-12 transition-transform duration-500"
        />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-700 font-black uppercase tracking-[0.3em] text-[10px] whitespace-nowrap">
          Haggle Prices
        </span>
        {/* Subtle Pulse Effect */}
        <div className="absolute inset-0 rounded-full animate-ping bg-red-600/20 -z-10" />
      </button>

      {isChatOpen && (
        <div className="fixed bottom-32 left-10 z-[60] animate-in slide-in-from-bottom-10 duration-500 shadow-2xl rounded-[2.5rem] overflow-hidden">
          <ChatWindow onClose={() => setIsChatOpen(false)} />
        </div>
      )}

      {/* 5. MINIMALIST FOOTER */}
      <footer className="bg-slate-50 border-t border-slate-100 py-24 text-center mt-20">
        <div className="font-black text-2xl tracking-tighter uppercase italic text-slate-200 mb-6">
          HD<span className="text-slate-300">wear</span>
        </div>
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.5em]">
          © 2026 Urban Intelligent Retail Protocol
        </p>
      </footer>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </main>
  );
}
