"use client";
import React, { useState } from "react";
import { useStore } from "@/context/StoreContext";
import ChatWindow from "@/components/ChatWindow";
import { ShoppingBag, Sparkles, Search, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const { cart } = useStore();
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <main className="min-h-screen bg-white text-slate-900 overflow-hidden">
      {/* 1. Transparent Global Navigation */}
      <nav className="absolute top-0 left-0 w-full z-50">
        <div className="max-w-7xl mx-auto px-8 h-24 flex items-center justify-between">
          <div className="flex items-center gap-12">
            <div className="font-black text-2xl tracking-tighter uppercase italic text-white drop-shadow-md">
              HD<span className="text-blue-500">wear</span>
            </div>

            <div className="hidden lg:flex items-center gap-8 text-[10px] font-black uppercase tracking-[0.4em] text-white/60">
              <Link
                href="/new-arrivals"
                className="hover:text-white transition-colors duration-300"
              >
                New Arrivals
              </Link>
              <Link
                href="/collections"
                className="hover:text-white transition-colors duration-300"
              >
                Collections
              </Link>
              <Link
                href="/shoes"
                className="hover:text-white transition-colors duration-300"
              >
                Shoes
              </Link>
              <Link
                href="/sale"
                className="hover:text-white transition-colors duration-300 text-blue-400"
              >
                Sale
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button className="text-white/60 hover:text-white transition-colors">
              <Search size={18} />
            </button>
            <Link href="/cart">
              <button className="relative p-3 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full hover:bg-white hover:text-black transition-all duration-500">
                <ShoppingBag size={20} />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-black border border-white shadow-lg">
                    {cart.length}
                  </span>
                )}
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* 2. Full-Screen Cinematic Hero Only */}
      <section className="relative h-screen flex items-end justify-end bg-black overflow-hidden">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-90"
        >
          <source src="/hero-video.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* --- MODIFIED: Button now links to /collections --- */}
        <div className="relative z-10 p-12 pb-48 animate-in fade-in zoom-in duration-1000">
          <Link href="/collections">
            <button className="group flex items-center gap-4 bg-transparent backdrop-blur-sm border border-white/30 text-white px-8 py-4 rounded-full font-black uppercase text-[10px] tracking-[0.3em] hover:bg-white hover:text-black hover:border-white transition-all duration-500 shadow-2xl">
              Explore Collections
              <ArrowRight
                size={14}
                className="group-hover:translate-x-1 transition-transform"
              />
            </button>
          </Link>
        </div>

        {/* Cinematic Vignette */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/20 pointer-events-none" />
      </section>

      {/* AI Stylist Trigger */}
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-10 left-10 bg-black text-white p-5 rounded-full shadow-2xl hover:bg-blue-600 hover:scale-110 transition-all active:scale-95 group z-50 flex items-center gap-3 border border-white/10"
      >
        <Sparkles
          size={24}
          className="group-hover:rotate-12 transition-transform duration-500"
        />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-700 font-black uppercase tracking-[0.3em] text-[10px] whitespace-nowrap">
          AI Stylist
        </span>
      </button>

      {isChatOpen && (
        <div className="fixed bottom-28 left-10 z-50 shadow-2xl rounded-3xl overflow-hidden">
          <ChatWindow onClose={() => setIsChatOpen(false)} />
        </div>
      )}
    </main>
  );
}
