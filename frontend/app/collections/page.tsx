"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import ChatWindow from "@/components/ChatWindow";
import { ShoppingBag, Plus, Sparkles, Search } from "lucide-react";

export default function CollectionsPage() {
  const { products, cart, setCart } = useStore();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // --- 1. RESOLVED AUTO-SCROLL LOGIC (WITH NULL CHECK) ---
  const scrollNext = useCallback(() => {
    // FIX: Guard clause to prevent "reading scrollTop of null"
    if (
      !rightPanelRef.current ||
      !products ||
      products.length === 0 ||
      isChatOpen
    )
      return;

    setIsTransitioning(true);

    setTimeout(() => {
      // Calculate next position safely
      const container = rightPanelRef.current;
      if (!container) return; // Double check inside timeout

      const currentScroll = container.scrollTop;
      const nextIndex =
        (Math.floor(currentScroll / window.innerHeight) + 1) % products.length;

      setCurrentIndex(nextIndex);

      container.scrollTo({
        top: nextIndex * window.innerHeight,
        behavior: "auto",
      });

      setTimeout(() => setIsTransitioning(false), 300);
    }, 400);
  }, [products, isChatOpen]);

  useEffect(() => {
    if (isHovered || isChatOpen) return;
    const timer = setInterval(scrollNext, 3000);
    return () => clearInterval(timer);
  }, [scrollNext, isHovered, isChatOpen]);

  const addToCart = (product: any) => {
    setCart((prev: any) => [...prev, product]);
  };

  if (!products || products.length === 0) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <p className="text-white font-black uppercase tracking-[0.5em] animate-pulse italic text-xs">
          Connecting to Warehouse...
        </p>
      </div>
    );
  }

  return (
    <main className="flex flex-col lg:flex-row bg-white overflow-hidden h-screen relative">
      {/* --- 2. HIGH-VISIBILITY NAVIGATION (BLACK TEXT) --- */}
      <nav className="fixed top-0 left-0 w-full z-[120] bg-white/80 backdrop-blur-xl border-b border-slate-200 h-20 px-10 flex items-center justify-between">
        <div className="flex items-center gap-12">
          <Link
            href="/"
            className="font-black text-2xl tracking-tighter uppercase italic text-slate-900"
          >
            HD<span className="text-blue-600">wear</span>
          </Link>

          <div className="hidden lg:flex items-center gap-8 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
            <Link
              href="/new-arrivals"
              className="hover:text-blue-600 transition-all"
            >
              New Arrivals
            </Link>
            <Link
              href="/collections"
              className="text-slate-900 border-b-2 border-slate-900 pb-1"
            >
              Collections
            </Link>
            <Link href="/shoes" className="hover:text-blue-600 transition-all">
              Shoes
            </Link>
            <Link href="/sale" className="hover:text-red-600 transition-all">
              Sale
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <button className="text-slate-400 hover:text-slate-900 transition-colors">
            <Search size={18} />
          </button>
          <Link href="/cart">
            <button className="relative p-3 bg-slate-900 text-white rounded-full hover:bg-blue-600 transition-all shadow-lg">
              <ShoppingBag size={20} />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[9px] w-5 h-5 rounded-full flex items-center justify-center font-black border-2 border-white">
                  {cart.length}
                </span>
              )}
            </button>
          </Link>
        </div>
      </nav>

      {/* 3. LEFT SIDE: FIXED CINEMATIC VIDEO */}
      <section className="lg:w-1/2 h-[40vh] lg:h-screen lg:sticky lg:top-0 bg-black overflow-hidden relative">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover opacity-60"
        >
          <source src="/collections-video.mp4" type="video/mp4" />
        </video>
        <div className="absolute bottom-8 left-8 z-20">
          <p className="text-white/30 text-[9px] font-bold uppercase tracking-[0.4em] italic">
            Archive Sequence Protocol 2026
          </p>
        </div>
      </section>

      {/* 4. RIGHT SIDE: THE AUTO-SHUTTER RUNWAY */}
      <section
        ref={rightPanelRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="w-full lg:w-1/2 h-screen overflow-y-scroll snap-y snap-mandatory no-scrollbar bg-white relative pt-20"
      >
        <div
          className={`fixed inset-y-0 right-0 w-full lg:w-1/2 bg-black z-[100] transition-opacity duration-300 pointer-events-none ${isTransitioning ? "opacity-100" : "opacity-0"}`}
        />

        {products.map((product: any, index: number) => (
          <div
            key={product.id}
            className="h-screen w-full snap-start flex flex-col justify-center items-center px-10 md:px-24 py-12"
          >
            {/* Visual Frame - h-[45vh] to prevent overlaps */}
            <div className="relative mb-8 w-full max-w-[420px]">
              <Link
                href={`/collections/${product.id}`}
                target="_blank"
                className="cursor-zoom-in block"
              >
                <div className="h-[45vh] w-full overflow-hidden bg-slate-50 rounded-3xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] border border-slate-100 group relative">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[4000ms]"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 bg-white/20 backdrop-blur-md border border-white/30 text-white px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.4em]">
                      Inspect Item
                    </div>
                  </div>
                </div>
              </Link>
              <div className="absolute -top-3 -right-3 bg-black text-white h-10 w-10 rounded-full flex items-center justify-center font-black text-[10px] shadow-xl">
                {String(index + 1).padStart(2, "0")}
              </div>
            </div>

            {/* Product Details Section */}
            <div className="max-w-[420px] w-full space-y-4">
              <div className="flex justify-between items-end border-b border-slate-100 pb-3">
                <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900 leading-none">
                  {product.name}
                </h2>
                <span className="text-xl font-black text-blue-600 italic">
                  ${product.price}
                </span>
              </div>
              <p className="text-slate-400 text-[9px] font-bold tracking-[0.4em] uppercase leading-relaxed">
                {product.description}
              </p>
              <button
                onClick={() => addToCart(product)}
                className="w-full bg-black text-white py-4 rounded-full font-black uppercase text-[9px] tracking-[0.4em] hover:bg-blue-600 shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Plus size={14} /> Add to Cart
              </button>
            </div>
          </div>
        ))}
      </section>

      {/* AI Stylist Trigger */}
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-10 left-10 bg-black text-white p-5 rounded-full shadow-2xl hover:bg-blue-600 hover:scale-110 transition-all z-[130] group flex items-center gap-3 border border-white/10"
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
        <div className="fixed bottom-28 left-10 z-[130] shadow-2xl rounded-3xl overflow-hidden border border-slate-100">
          <ChatWindow onClose={() => setIsChatOpen(false)} />
        </div>
      )}

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
