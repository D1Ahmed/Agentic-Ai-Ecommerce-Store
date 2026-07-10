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
      <div className="h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6 text-blue-600">
          <Bot size={32} />
        </div>
        <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900 mb-2">
          No Products Found
        </h2>
        <p className="text-slate-500 font-medium mb-8 max-w-md text-center">
          The Clerk couldn't find any specific items matching those exact criteria in the current inventory.
        </p>
        <Link
          href="/"
          className="bg-slate-900 text-white px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest hover:bg-blue-600 transition-colors"
        >
          Return to Main Vault
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
