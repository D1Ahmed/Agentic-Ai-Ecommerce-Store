"use client";
import React from "react";
import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import ProductCard from "@/components/ProductCard";
import Navbar from "@/components/Navbar";
import { Bot, ArrowLeft } from "lucide-react";

export default function AiCollectionsPage() {
  const { aiSearchResults } = useStore();

  if (!aiSearchResults || aiSearchResults.length === 0) {
    return (
      <div className="h-screen bg-white flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-400 font-black uppercase tracking-widest text-xs">
          The Clerk is preparing your tailored archive...
        </p>
        <Link
          href="/"
          className="mt-8 text-[10px] uppercase font-black tracking-widest text-slate-400 flex items-center gap-2 hover:text-slate-900"
        >
          <ArrowLeft size={14} /> Return to Main Vault
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      <Navbar />

      <header className="pt-32 px-6 md:px-12 max-w-7xl mx-auto mb-12">
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-l-4 border-blue-600 pl-6 bg-white p-8 rounded-3xl shadow-sm border-r border-t border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 text-blue-600 mb-2">
              <Bot size={18} />
              <span className="text-[10px] font-black uppercase tracking-[0.4em]">
                Curated by The Clerk
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-slate-900">
              Your Personal <span className="text-blue-600">Selection.</span>
            </h1>
            <p className="text-slate-500 font-medium mt-2">
              Based on your request, I've pulled these {aiSearchResults.length}{" "}
              specific assets from the vault.
            </p>
          </div>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12">
          {aiSearchResults.map((product: any) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </main>
  );
}
