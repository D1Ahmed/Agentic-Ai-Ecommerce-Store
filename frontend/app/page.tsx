"use client";
import React, { useState } from "react";
import { useStore } from "@/context/StoreContext";
import ProductCard from "@/components/ProductCard";
import ChatWindow from "@/components/ChatWindow";
import { ShoppingBag, Sparkles, User, Search, Menu } from "lucide-react";
import Link from "next/link";
export default function Home() {
  const { products, cart } = useStore();
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <main className="min-h-screen bg-white text-slate-900">
      {/* 1. HDwear Premium Navbar */}
      <nav className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <button className="lg:hidden p-2 -ml-2">
              <Menu size={24} />
            </button>
            <div className="font-black text-2xl tracking-tighter uppercase italic">
              HD<span className="text-blue-600">wear</span>
            </div>
            <div className="hidden lg:flex items-center gap-6 text-sm font-bold uppercase tracking-widest text-slate-500">
              <a href="#" className="hover:text-blue-600 transition">
                New Arrivals
              </a>
              <a href="#" className="hover:text-blue-600 transition">
                Collections
              </a>
              <a href="#" className="hover:text-blue-600 transition">
                Sale
              </a>
            </div>
          </div>

          <div className="flex items-center gap-4 md:gap-6">
            <button className="p-2 hover:bg-slate-100 rounded-full transition">
              <Search size={20} />
            </button>
            <button className="hidden md:flex items-center gap-2 font-bold text-sm uppercase tracking-wider px-2 py-1">
              <User size={18} />
              <span>Login</span>
            </button>
            {/* The Cart Button - Now Linked! */}
            <Link href="/cart">
              <button className="relative p-3 bg-slate-900 text-white rounded-full hover:bg-blue-600 transition shadow-lg">
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

      {/* 2. Hero Section: The "Shopkeeper" Hook */}
      <section className="relative h-[60vh] flex items-center justify-center bg-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-40 bg-[url('https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=2070')] bg-cover bg-center" />
        <div className="relative z-10 text-center px-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-blue-600/20 border border-blue-400/30 text-blue-400 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-[0.2em] mb-6">
            <Sparkles size={14} />
            AI Enabled Storefront
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 uppercase">
            Evolution of <br />{" "}
            <span className="text-blue-500">Urban Style.</span>
          </h1>
          <p className="text-slate-300 text-lg md:text-xl font-medium mb-8 leading-relaxed">
            Standard shopping is boring. Click the bubble on the left to
            negotiate prices, find outfits, and shop with our AI Shopper.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-slate-900 px-8 py-4 rounded-full font-black uppercase text-sm tracking-widest hover:bg-blue-600 hover:text-white transition shadow-xl">
              Shop The Drop
            </button>
          </div>
        </div>
      </section>

      {/* 3. The Product Grid (The "Body") [cite: 9] */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="flex flex-col md:flex-row justify-between items-end gap-4 mb-12 border-l-4 border-blue-600 pl-6">
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900">
              Current Inventory [cite: 16]
            </h2>
            <p className="text-slate-500 font-medium">
              Curated pieces for the modern enthusiast.
            </p>
          </div>
          <div className="text-xs font-black uppercase tracking-[0.2em] text-blue-600 border-b-2 border-blue-600 pb-1 cursor-pointer">
            Explore All {products.length} Items
          </div>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-32 border-2 border-dashed rounded-3xl">
            <div className="animate-bounce mb-4 text-blue-600">
              <Sparkles size={48} className="mx-auto" />
            </div>
            <p className="text-slate-400 font-bold uppercase tracking-widest">
              HDwear AI is indexing the warehouse...
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
            {products.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>

      {/* 4. The AI Shopper Trigger (Moved to Bottom-Left) */}
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-10 left-10 bg-slate-900 text-white p-5 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:bg-blue-600 hover:scale-110 transition-all active:scale-95 group z-50 flex items-center gap-3"
      >
        <Sparkles
          size={28}
          className="group-hover:rotate-12 transition-transform"
        />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 font-black uppercase tracking-widest text-xs whitespace-nowrap">
          Talk to Clerk
        </span>
      </button>

      {/* 5. Chat Window Component (Need to align with bottom-left trigger) */}
      {isChatOpen && (
        <div className="fixed bottom-28 left-10 z-50">
          <ChatWindow onClose={() => setIsChatOpen(false)} />
        </div>
      )}

      {/* Footer for extra Visual Polish  */}
      <footer className="bg-slate-50 border-t py-12 px-6 text-center">
        <div className="font-black text-xl tracking-tighter uppercase italic mb-4">
          HD<span className="text-blue-600">wear</span>
        </div>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.3em]">
          © 2026 Urban Intelligent Retail
        </p>
      </footer>
    </main>
  );
}
