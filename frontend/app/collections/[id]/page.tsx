"use client";
import React, { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { useStore } from "@/context/StoreContext";
import Navbar from "@/components/Navbar";
import {
  Star,
  ShieldCheck,
  Truck,
  RotateCcw,
  Users,
} from "lucide-react";

export default function InspectionWindow() {
  const { id } = useParams();
  const { products, cart, setCart } = useStore();
  const [selectedSize, setSelectedSize] = useState("M");

  const product = useMemo(() => {
    return products.find((p: any) => String(p.id) === String(id));
  }, [id, products]);

  if (!product)
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center text-white font-black uppercase tracking-[0.5em]">
        <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        Syncing Archive...
      </div>
    );

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <Navbar />

      <div className="flex flex-col lg:flex-row pt-20">
        {/* Left Side: Image Section */}
        <section className="lg:w-3/5 h-[70vh] lg:h-[calc(100vh-80px)] bg-slate-100 relative overflow-hidden group">
          <img
            src={product.image_url}
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
            alt={product.name}
          />
          <div className="absolute bottom-10 left-10 z-20">
            <div className="bg-black text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.4em] flex items-center gap-2">
              <ShieldCheck size={14} className="text-blue-400" /> Authenticity
              Verified
            </div>
          </div>
        </section>

        {/* Right Side: Product Details */}
        <section className="lg:w-2/5 p-8 lg:p-16 flex flex-col bg-white overflow-y-auto lg:h-[calc(100vh-80px)] no-scrollbar">
          <div className="flex-grow">
            <div className="flex justify-between items-center mb-6">
              <span className="bg-slate-100 text-slate-900 px-3 py-1 rounded text-[9px] font-black uppercase tracking-widest border border-slate-200">
                {product.category}
              </span>
              <div className="flex items-center gap-2 text-blue-600 font-black text-sm">
                <Star size={16} fill="currentColor" /> {product.rating}
                <span className="text-slate-300 font-medium text-xs">
                  ({product.reviews_count} reviews)
                </span>
              </div>
            </div>

            <h1 className="text-5xl font-black uppercase tracking-tighter mb-4 leading-none text-slate-900">
              {product.name}
            </h1>

            <div className="flex items-baseline gap-4 mb-4">
              <span className="text-3xl font-black text-slate-900 italic">
                Rs {product.price.toLocaleString()}
              </span>
              <span className="text-green-600 text-[10px] font-black uppercase tracking-widest">
                Free Shipping Included
              </span>
            </div>

            {/* Color & Season Info */}
            <div className="flex items-center gap-3 mb-8">
              {product.color && (
                <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-blue-100">
                  {product.color}
                </span>
              )}
              {product.season && (
                <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-slate-200">
                  {product.season}
                </span>
              )}
            </div>

            {/* Detailed Description Section */}
            <div className="space-y-6 mb-12">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 border-b pb-2">
                Technical Specifications
              </h3>
              <p className="text-slate-600 text-sm font-medium leading-relaxed">
                {product.detailed_description ||
                  "Premium urban wear designed for maximum performance and style."}
              </p>
            </div>

            {/* Size Selector */}
            {product.sub_category === "Clothes" && (
              <div className="mb-10">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4">
                  Select Size
                </h3>
                <div className="grid grid-cols-4 gap-3">
                  {["S", "M", "L", "XL"].map((s) => (
                    <button
                      key={s}
                      onClick={() => setSelectedSize(s)}
                      className={`py-4 rounded-xl font-black text-xs border transition-all ${
                        selectedSize === s
                          ? "bg-black text-white shadow-xl scale-105"
                          : "border-slate-100 text-slate-300 hover:border-slate-400 hover:text-slate-900"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Shoe Sizes */}
            {product.sub_category === "Shoes" && (
              <div className="mb-10">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4">
                  Select Size
                </h3>
                <div className="grid grid-cols-5 gap-3">
                  {["38", "39", "40", "41", "42", "43", "44"].map((s) => (
                    <button
                      key={s}
                      onClick={() => setSelectedSize(s)}
                      className={`py-3 rounded-xl font-black text-xs border transition-all ${
                        selectedSize === s
                          ? "bg-black text-white shadow-xl scale-105"
                          : "border-slate-100 text-slate-300 hover:border-slate-400 hover:text-slate-900"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Inventory Status */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 mb-10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users size={18} className="text-slate-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Currently being viewed by {Math.floor(Math.random() * 15) + 3} others
                </span>
              </div>
              <span
                className={`text-[10px] font-black uppercase tracking-widest ${product.stock < 5 ? "text-red-600" : "text-slate-900"}`}
              >
                Only {product.stock} Left
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <button
              onClick={() =>
                setCart((prev: any) => [
                  ...prev,
                  { ...product, size: selectedSize },
                ])
              }
              className="w-full bg-blue-600 text-white py-6 rounded-full font-black uppercase text-[11px] tracking-[0.4em] hover:bg-black transition-all shadow-2xl active:scale-95"
            >
              Add to Cart
            </button>

            <div className="grid grid-cols-3 gap-4 py-6 border-t mt-6">
              <div className="flex flex-col items-center text-center gap-2">
                <Truck size={16} className="text-slate-400" />
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 font-sans">
                  Fast Delivery
                </span>
              </div>
              <div className="flex flex-col items-center text-center gap-2 border-x">
                <RotateCcw size={16} className="text-slate-400" />
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">
                  30 Day Return
                </span>
              </div>
              <div className="flex flex-col items-center text-center gap-2">
                <Users size={16} className="text-slate-400" />
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">
                  Gift Wrapped
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
