"use client";
import React, { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { useStore } from "@/context/StoreContext";
import { ShoppingBag, ChevronRight, Search } from "lucide-react";
import Link from "next/link";

// --- UNIVERSAL MASTER MANIFEST ---
// This ensures that clicking an item from any page (New Arrivals, Shoes, Sale) works in the inspection tab.
const MASTER_ASSETS = [
  // New Arrivals
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
  // Shoes
  {
    id: 301,
    name: "Apex Tech Sneakers",
    price: 160,
    category: "Sneakers",
    image_url:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80",
    description: "Cloud-knit comfort sneakers.",
  },
  {
    id: 302,
    name: "Heritage Leather Boots",
    price: 210,
    category: "Boots",
    image_url:
      "https://images.unsplash.com/photo-1520639889313-7272175b1c39?w=800&q=80",
    description: "Urban trail waterproof boots.",
  },
  // Sale
  {
    id: 401,
    name: "Urban Windbreaker",
    price: 120,
    salePrice: 85,
    category: "Sale",
    image_url:
      "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&q=80",
    description: "Weather-resistant tech shell.",
  },
];

export default function InspectionWindow() {
  const { id } = useParams();
  const { products, setCart } = useStore();
  const [selectedSize, setSelectedSize] = useState("M");

  // Sync Logic: Check global store first, then fall back to hardcoded MASTER_ASSETS
  const product = useMemo(() => {
    const combinedList = [...(products || []), ...MASTER_ASSETS];
    return combinedList.find((p: any) => String(p.id) === String(id));
  }, [id, products]);

  if (!product)
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center text-white font-black uppercase tracking-[0.5em]">
        <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        Scanning Archive...
      </div>
    );

  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col lg:flex-row">
      <section className="lg:w-3/5 h-[65vh] lg:h-screen bg-slate-50 relative overflow-hidden group">
        <img
          src={product.image_url}
          className="w-full h-full object-cover transition-transform duration-700 hover:scale-125"
        />
        <div className="absolute top-10 left-10 z-20 font-black text-xl italic uppercase">
          HD<span className="text-blue-600">wear</span>
        </div>
      </section>

      <section className="lg:w-2/5 p-12 lg:p-20 flex flex-col bg-white overflow-y-auto">
        <div className="flex-grow">
          <div className="flex justify-between items-start mb-8 border-b border-slate-100 pb-4">
            <span className="bg-black text-white px-3 py-1 rounded text-[9px] font-black uppercase tracking-widest">
              {product.category}
            </span>
            <span className="text-2xl font-black text-blue-600 italic">
              ${product.salePrice || product.price}
            </span>
          </div>

          <h1 className="text-4xl font-black uppercase tracking-tighter mb-6 leading-none">
            {product.name}
          </h1>
          <p className="text-slate-400 text-[10px] font-bold tracking-[0.4em] uppercase mb-12 border-l-2 border-slate-100 pl-6">
            {product.description}
          </p>

          <div className="grid grid-cols-4 gap-2 mb-12">
            {["S", "M", "L", "XL"].map((s) => (
              <button
                key={s}
                onClick={() => setSelectedSize(s)}
                className={`py-4 rounded-xl font-black text-xs border transition-all ${selectedSize === s ? "bg-black text-white" : "border-slate-100 text-slate-300"}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() =>
            setCart((prev: any) => [
              ...prev,
              { ...product, size: selectedSize },
            ])
          }
          className="w-full bg-blue-600 text-white py-6 rounded-full font-black uppercase text-[10px] tracking-[0.4em] hover:bg-black transition-all shadow-xl"
        >
          Add to Cart
        </button>
      </section>
    </main>
  );
}
