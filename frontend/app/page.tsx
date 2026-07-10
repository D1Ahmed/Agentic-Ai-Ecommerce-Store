"use client";
import React, { useState, useEffect } from "react";
import { useStore } from "@/context/StoreContext";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import ProductCard from "@/components/ProductCard";

export default function Home() {
  const { products, isProductsLoading, productsLoadTime } = useStore();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 overflow-x-hidden">
      {/* Dynamic Navigation */}
      <Navbar transparent={!isScrolled} />

      {/* Full-Screen Cinematic Hero */}
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

        <div className="relative z-10 p-12 pb-48 animate-in fade-in zoom-in duration-1000">
          <Link href="#collections">
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

      {/* Collections Section */}
      <section id="collections" className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="mb-12 border-l-4 border-blue-600 pl-6 flex justify-between items-end">
          <div>
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-slate-900">
              All <span className="text-blue-600">Collections.</span>
            </h2>
            <p className="text-slate-500 font-medium mt-2">
              Explore our complete archive of premium apparel.
            </p>
          </div>
          {productsLoadTime !== null && (
            <div className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400"></span>
              Loaded in {productsLoadTime.toFixed(0)}ms
            </div>
          )}
        </div>

        {!isMounted || isProductsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex flex-col gap-4">
                <div className="aspect-[4/5] bg-slate-200 rounded-3xl animate-pulse"></div>
                <div className="space-y-2">
                  <div className="h-5 bg-slate-200 rounded animate-pulse w-3/4"></div>
                  <div className="h-4 bg-slate-200 rounded animate-pulse w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12">
            {products.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* FOOTER */}
      <footer className="mt-20 py-20 bg-white border-t border-slate-200 text-center">
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.5em]">
          HDwear Urban Retail Protocol • 2026
        </p>
      </footer>
    </main>
  );
}
