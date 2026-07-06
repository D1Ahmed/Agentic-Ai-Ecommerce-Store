"use client";
import React, { useMemo } from "react";
import { useStore } from "@/context/StoreContext";
import Navbar from "@/components/Navbar";
import ProductCard from "@/components/ProductCard";
import { Percent, Zap } from "lucide-react";

export default function SalePage() {
  const { products = [] } = useStore() || {};

  const saleProducts = useMemo(() => {
    if (!products || products.length === 0) return [];
    return products.filter((p: any) => p.is_on_sale && p.sale_percentage > 0);
  }, [products]);

  if (!products || products.length === 0) {
    return (
      <div className="h-screen bg-white flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-400 font-black uppercase tracking-widest text-xs">
          Scanning Vault for Discounts...
        </p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 font-sans selection:bg-red-100">
      <Navbar />

      <section className="relative h-[50vh] bg-red-600 flex items-center justify-center overflow-hidden pt-20">
        <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1472851294608-062f824d29cc?q=80')] bg-cover bg-center grayscale mix-blend-overlay" />

        <div className="relative z-10 text-center px-4 animate-in fade-in zoom-in duration-1000">
          <div className="inline-flex items-center gap-2 bg-white text-red-600 px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.4em] mb-6 shadow-xl">
            <Zap size={12} fill="currentColor" /> Clearance Protocol Active
          </div>
          <h1 className="text-7xl md:text-9xl font-black text-white uppercase italic tracking-tighter leading-none mb-4">
            Archive <span className="text-slate-900">Sale.</span>
          </h1>
          <p className="text-red-100 text-sm font-bold uppercase tracking-[0.5em] opacity-80">
            Vault Access: Priority Discounts on {saleProducts.length} Assets
          </p>
        </div>

        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-50 to-transparent" />
      </section>

      <div className="max-w-7xl mx-auto px-6 md:px-12 py-24">
        <div className="flex items-center gap-4 mb-16 border-l-4 border-red-600 pl-6">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900">
              Limited Time Deals
            </h2>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.4em]">
              Inventory Clearance Sequence: Priority Alpha
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12">
          {saleProducts.map((product: any) => (
            <div key={product.id}>
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>

      <footer className="mt-20 py-20 bg-white border-t border-slate-200 text-center">
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.5em]">
          HDwear Urban Retail Protocol • Sale Edition 2026
        </p>
      </footer>
    </main>
  );
}
