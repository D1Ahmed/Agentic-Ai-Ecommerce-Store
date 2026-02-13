"use client";
import React from "react";
import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import { Trash2, ArrowLeft, ShoppingBag, CreditCard } from "lucide-react";

export default function CartPage() {
  const { cart, setCart } = useStore();

  // Calculate Total
  const total = cart.reduce((sum: number, item: any) => sum + item.price, 0);

  // Remove Item Logic
  const removeFromCart = (indexToRemove: number) => {
    setCart(cart.filter((_: any, index: number) => index !== indexToRemove));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* 1. Simplified Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition font-bold uppercase text-xs tracking-widest"
          >
            <ArrowLeft size={16} />
            Continue Shopping
          </Link>
          <div className="font-black text-2xl tracking-tighter uppercase italic">
            HD<span className="text-blue-600">wear</span>
          </div>
          <div className="w-24"></div> {/* Spacer for alignment */}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-black uppercase tracking-tight mb-12 flex items-center gap-4">
          Your Bag{" "}
          <span className="text-slate-400 text-2xl font-medium normal-case">
            ({cart.length} items)
          </span>
        </h1>

        {cart.length === 0 ? (
          /* Empty State */
          <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <div className="inline-flex p-6 bg-slate-50 rounded-full mb-6 text-slate-300">
              <ShoppingBag size={48} />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              Your bag is empty
            </h2>
            <p className="text-slate-500 mb-8">
              Looks like you haven't found your style yet.
            </p>
            <Link
              href="/"
              className="bg-slate-900 text-white px-8 py-3 rounded-full font-bold uppercase text-xs tracking-widest hover:bg-blue-600 transition"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          /* Cart Grid */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Left: Cart Items List */}
            <div className="lg:col-span-2 space-y-6">
              {cart.map((item: any, index: number) => (
                <div
                  key={`${item.id}-${index}`}
                  className="flex gap-6 p-6 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition"
                >
                  {/* Product Image */}
                  <div className="h-32 w-28 flex-shrink-0 bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
                    <img
                      src={item.image_url || "/placeholder.png"}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-lg text-slate-900">
                          {item.name}
                        </h3>
                        <p className="font-black text-lg">${item.price}</p>
                      </div>
                      <p className="text-slate-500 text-sm mt-1">
                        {item.category}
                      </p>
                    </div>

                    <button
                      onClick={() => removeFromCart(index)}
                      className="self-start flex items-center gap-2 text-red-500 hover:text-red-700 text-xs font-bold uppercase tracking-wider mt-4"
                    >
                      <Trash2 size={14} /> Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Right: Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl sticky top-28">
                <h2 className="text-xl font-black uppercase tracking-tight mb-6">
                  Order Summary
                </h2>

                <div className="space-y-4 text-sm text-slate-600 mb-8 border-b border-slate-100 pb-8">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-bold text-slate-900">
                      ${total.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span className="text-green-600 font-bold">Free</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax (Estimated)</span>
                    <span className="font-bold text-slate-900">
                      ${(total * 0.08).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center mb-8">
                  <span className="text-lg font-bold text-slate-900">
                    Total
                  </span>
                  <span className="text-3xl font-black text-blue-600">
                    ${(total * 1.08).toFixed(2)}
                  </span>
                </div>

                <button className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold uppercase text-sm tracking-widest hover:bg-blue-600 hover:scale-[1.02] active:scale-95 transition-all shadow-lg flex items-center justify-center gap-3">
                  <CreditCard size={18} />
                  Checkout
                </button>

                <p className="text-center text-xs text-slate-400 mt-4 font-medium">
                  Secure Checkout powered by HDwear
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
