"use client";
import React, { useState, useMemo, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useStore } from "@/context/StoreContext";
import Navbar from "@/components/Navbar";
import ProductCard from "@/components/ProductCard";
import {
  SlidersHorizontal,
  ArrowUpDown,
  Check,
  X,
  Search,
} from "lucide-react";

const CATEGORIES = [
  "All",
  "Men Summer",
  "Men Winter",
  "Women Summer",
  "Women Winter",
  "Shoes",
];

function CollectionsContent() {
  const searchParams = useSearchParams();
  const queryFromUrl = searchParams.get("q") || "";

  const { products } = useStore();
  const [activeCategory, setActiveCategory] = useState("All");
  const [sortOption, setSortOption] = useState("recommended");
  const [searchInput, setSearchInput] = useState(queryFromUrl);

  // Sync search input with URL query param
  useEffect(() => {
    setSearchInput(queryFromUrl);
  }, [queryFromUrl]);

  // Filter products based on search + category + sort
  const filteredProducts = useMemo(() => {
    if (!products || products.length === 0) return [];

    let result = [...products];

    // 1. Text search filter
    const query = searchInput.toLowerCase().trim();
    if (query) {
      const terms = query.split(/\s+/);
      result = result.filter((p: any) => {
        const searchable = `${p.name} ${p.description} ${p.category} ${p.color} ${p.sub_category} ${p.season} ${p.gender} ${p.detailed_description}`.toLowerCase();
        return terms.every((term: string) => searchable.includes(term));
      });
    }

    // 2. Category filter
    if (activeCategory !== "All") {
      if (activeCategory === "Shoes") {
        result = result.filter((p: any) => p.sub_category === "Shoes");
      } else {
        result = result.filter((p: any) => p.category === activeCategory);
      }
    }

    // 3. Sort
    if (sortOption === "asc") {
      result.sort((a: any, b: any) => a.price - b.price);
    } else if (sortOption === "desc") {
      result.sort((a: any, b: any) => b.price - a.price);
    } else if (sortOption === "rating") {
      result.sort((a: any, b: any) => b.rating - a.rating);
    }

    return result;
  }, [products, searchInput, activeCategory, sortOption]);

  if (!products || products.length === 0) {
    return (
      <div className="h-screen bg-white flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-400 font-black uppercase tracking-widest text-xs">
          Syncing with Supabase Warehouse...
        </p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      <Navbar />

      {/* COLLECTION HEADER */}
      <header className="pt-28 px-6 md:px-12 max-w-7xl mx-auto mb-8">
        <div className="border-l-4 border-blue-600 pl-6">
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-slate-900">
            {searchInput ? (
              <>
                Search <span className="text-blue-600">Results</span>
              </>
            ) : (
              <>
                The Full <span className="text-blue-600">Archive.</span>
              </>
            )}
          </h1>
          <p className="text-slate-500 font-medium mt-2">
            Showing {filteredProducts.length} of {products.length} products
          </p>
        </div>
      </header>

      {/* SEARCH + FILTER + SORT BAR */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 mb-10">
        {/* Inline search bar */}
        <div className="relative mb-6">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name, color, type... (e.g. blue shirt, winter jacket, red shoes)"
            className="w-full pl-12 pr-12 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent placeholder:text-slate-400 shadow-sm"
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Category Filters */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex overflow-x-auto gap-2 w-full md:w-auto no-scrollbar">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${
                  activeCategory === cat
                    ? "bg-slate-900 text-white border-slate-900 shadow-xl"
                    : "bg-white text-slate-400 border-slate-100 hover:border-slate-300 hover:text-slate-900"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="relative group flex-shrink-0">
            <div className="flex items-center gap-3 cursor-pointer bg-white hover:bg-slate-50 px-6 py-2.5 rounded-full transition-all border border-slate-200">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">
                Sort:{" "}
                <span className="text-blue-600">
                  {sortOption === "asc"
                    ? "Price ↑"
                    : sortOption === "desc"
                      ? "Price ↓"
                      : sortOption === "rating"
                        ? "Top Rated"
                        : "Default"}
                </span>
              </span>
              <ArrowUpDown size={14} className="text-slate-400" />
            </div>
            <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-slate-100 rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 overflow-hidden">
              {[
                { key: "recommended", label: "Default" },
                { key: "asc", label: "Price: Low to High" },
                { key: "desc", label: "Price: High to Low" },
                { key: "rating", label: "Top Rated" },
              ].map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setSortOption(opt.key)}
                  className="w-full text-left px-6 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 flex justify-between items-center"
                >
                  {opt.label}
                  {sortOption === opt.key && (
                    <Check size={14} className="text-blue-600" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PRODUCT GRID */}
      <section className="max-w-7xl mx-auto px-6 md:px-12">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <p className="text-slate-400 font-bold text-lg mb-2">
              No products found
            </p>
            <p className="text-slate-300 text-sm">
              Try a different search term or clear your filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12">
            {filteredProducts.map((product: any) => (
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

export default function CollectionsPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen bg-white flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-slate-400 font-black uppercase tracking-widest text-xs">
            Loading Collections...
          </p>
        </div>
      }
    >
      <CollectionsContent />
    </Suspense>
  );
}
