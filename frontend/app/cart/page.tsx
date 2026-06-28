"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import {
  Trash2,
  ArrowLeft,
  ShoppingBag,
  CreditCard,
  Truck,
  CheckCircle,
  User,
  Tag,
  TicketPercent,
  Loader2,
  Package,
} from "lucide-react";
import Swal from "sweetalert2";

export default function CartPage() {
  const {
    cart,
    setCart,
    forceBillingView,
    setForceBillingView,
    discountPercentage,
    executeOrder,
    isPlacingOrder,
    isAuthenticated,
    promptSignIn,
    cartHasStockIssues,
    refreshCartStock,
  } = useStore();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cod");

  useEffect(() => {
    if (!forceBillingView) return;
    setForceBillingView(false);
    if (!isAuthenticated) {
      promptSignIn();
      return;
    }
    setIsCheckingOut(true);
  }, [forceBillingView, setForceBillingView, isAuthenticated, promptSignIn]);

  useEffect(() => {
    if (isAuthenticated) {
      refreshCartStock();
    }
  }, [isAuthenticated, refreshCartStock]);

  const itemHasStockIssue = (item: any) =>
    item.out_of_stock || item.insufficient_stock || item.stock <= 0;

  const handleProceedToBilling = async () => {
    if (!isAuthenticated) {
      await promptSignIn();
      return;
    }
    if (cartHasStockIssues) {
      await Swal.fire({
        title: "Stock issue",
        text: "Some items in your bag are unavailable. Please remove or update them first.",
        icon: "warning",
        confirmButtonColor: "#2563eb",
      });
      return;
    }
    setIsCheckingOut(true);
  };

  const rawSubtotal = cart.reduce(
    (sum: number, item: any) => sum + item.price * (item.quantity || 1),
    0,
  );

  const discountAmount = rawSubtotal * (discountPercentage / 100);
  const subtotalAfterDiscount = rawSubtotal - discountAmount;
  const tax = subtotalAfterDiscount * 0.08;
  const total = subtotalAfterDiscount + tax;

  const removeFromCart = (indexToRemove: number) => {
    setCart(cart.filter((_: any, index: number) => index !== indexToRemove));
  };

  const handlePlaceOrder = () => {
    if (isPlacingOrder || cart.length === 0) return;
    executeOrder();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <button
            onClick={() =>
              isCheckingOut
                ? setIsCheckingOut(false)
                : (window.location.href = "/")
            }
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition font-bold uppercase text-xs tracking-widest"
          >
            <ArrowLeft size={16} />
            {isCheckingOut ? "Back to Bag" : "Continue Shopping"}
          </button>
          <div className="font-black text-2xl tracking-tighter uppercase italic">
            HD<span className="text-blue-600">wear</span>
          </div>
          <div className="w-24"></div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {!isCheckingOut ? (
          <>
            <h1 className="text-4xl font-black uppercase tracking-tight mb-12 flex items-center gap-4">
              Your Bag{" "}
              <span className="text-slate-400 text-2xl font-medium normal-case">
                ({cart.length} unique assets)
              </span>
            </h1>

            {cart.length === 0 ? (
              <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                <div className="inline-flex p-6 bg-slate-50 rounded-full mb-6 text-slate-300">
                  <ShoppingBag size={48} />
                </div>
                <h2 className="text-xl font-bold mb-2">Your bag is empty</h2>
                <p className="text-slate-500 mb-8">
                  No archive items selected.
                </p>
                <Link
                  href="/"
                  className="bg-slate-900 text-white px-8 py-3 rounded-full font-bold uppercase text-xs tracking-widest hover:bg-blue-600 transition"
                >
                  Start Shopping
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 space-y-6">
                  {cart.map((item: any, index: number) => (
                    <div
                      key={`${item.id}-${index}`}
                      className={`flex gap-6 p-6 bg-white border rounded-2xl shadow-sm hover:shadow-md transition ${
                        itemHasStockIssue(item)
                          ? "border-red-200 bg-red-50/30"
                          : "border-slate-100"
                      }`}
                    >
                      <div className="h-32 w-28 flex-shrink-0 bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
                        <img
                          src={item.image_url || "/placeholder.png"}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      </div>

                      <div className="flex-1 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-lg text-slate-900">
                              {item.name}
                            </h3>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">
                              {item.category}
                            </p>

                            <div className="flex items-center gap-2 bg-blue-50 text-blue-600 px-3 py-1 rounded-lg w-fit border border-blue-100">
                              <Tag size={12} />
                              <span className="text-[10px] font-black uppercase tracking-widest">
                                Qty: {item.quantity || 1}
                              </span>
                            </div>
                            {itemHasStockIssue(item) && (
                              <p className="text-[10px] font-black uppercase tracking-widest text-red-600 mt-2">
                                {item.out_of_stock || item.stock <= 0
                                  ? "Out of stock — remove to continue"
                                  : `Only ${item.stock} left — reduce quantity`}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-black text-lg text-slate-900">
                              Rs {(item.price * (item.quantity || 1)).toLocaleString()}
                            </p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              Rs {item.price.toLocaleString()} / unit
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => removeFromCart(index)}
                          className="self-start flex items-center gap-2 text-red-500 hover:text-red-700 text-xs font-bold uppercase tracking-wider mt-4"
                        >
                          <Trash2 size={14} /> Remove from Archive
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="lg:col-span-1">
                  <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl sticky top-28">
                    <h2 className="text-xl font-black uppercase tracking-tight mb-6">
                      Order Summary
                    </h2>
                    <div className="space-y-4 text-sm text-slate-600 mb-8 border-b border-slate-100 pb-8">
                      <div className="flex justify-between">
                        <span>Original Subtotal</span>
                        <span className="font-medium text-slate-500">
                          Rs {rawSubtotal.toLocaleString()}
                        </span>
                      </div>

                      {discountPercentage > 0 && (
                        <div className="flex justify-between items-center text-green-600 bg-green-50 p-3 rounded-lg border border-green-100">
                          <span className="flex items-center gap-2 font-bold">
                            <TicketPercent size={16} /> Clerk AI Discount (
                            {discountPercentage}%)
                          </span>
                          <span className="font-bold">
                            -Rs {discountAmount.toLocaleString()}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between">
                        <span>Shipping</span>
                        <span className="text-green-600 font-bold">Free</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tax (8%)</span>
                        <span className="font-bold text-slate-900">
                          Rs {Math.round(tax).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mb-8">
                      <span className="text-lg font-bold">Total</span>
                      <span className="text-3xl font-black text-blue-600">
                        Rs {Math.round(total).toLocaleString()}
                      </span>
                    </div>
                    <button
                      onClick={handleProceedToBilling}
                      disabled={cartHasStockIssues}
                      className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold uppercase text-sm tracking-widest hover:bg-blue-600 transition-all shadow-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <CreditCard size={18} /> Proceed to Billing
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="max-w-5xl mx-auto space-y-8">
            <h1 className="text-4xl font-black uppercase tracking-tight text-slate-900">
              Billing Protocol
            </h1>

            {/* Order items recap — so the user knows exactly what they are buying */}
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-4 border-b border-slate-100 pb-4 mb-6">
                <Package className="text-blue-600" size={20} />
                <h3 className="font-black uppercase text-sm tracking-widest">
                  Your Order ({cart.length} {cart.length === 1 ? "item" : "items"})
                </h3>
              </div>

              <div className="space-y-4">
                {cart.map((item: any, index: number) => (
                  <div
                    key={`checkout-${item.id}-${index}`}
                    className={`flex gap-4 items-center p-4 rounded-2xl border ${
                      itemHasStockIssue(item)
                        ? "bg-red-50 border-red-200"
                        : "bg-slate-50 border-slate-100"
                    }`}
                  >
                    <div className="h-16 w-16 flex-shrink-0 bg-white rounded-xl overflow-hidden border border-slate-200">
                      <img
                        src={item.image_url || "/placeholder.png"}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm text-slate-900 truncate">
                        {item.name}
                      </h4>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-0.5">
                        {item.category}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                          Qty: {item.quantity || 1}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Rs {item.price.toLocaleString()} each
                        </span>
                      </div>
                      {itemHasStockIssue(item) && (
                        <p className="text-[10px] font-black uppercase tracking-widest text-red-600 mt-2">
                          {item.out_of_stock || item.stock <= 0
                            ? "Out of stock"
                            : `Only ${item.stock} available`}
                        </p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-black text-base text-slate-900">
                        Rs {(item.price * (item.quantity || 1)).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-slate-100 space-y-3 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-medium">Rs {rawSubtotal.toLocaleString()}</span>
                </div>
                {discountPercentage > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span className="flex items-center gap-2">
                      <TicketPercent size={14} /> Discount ({discountPercentage}%)
                    </span>
                    <span className="font-bold">-Rs {discountAmount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Shipping</span>
                  <span className="text-green-600 font-bold">Free</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Tax (8%)</span>
                  <span className="font-bold">Rs {Math.round(tax).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                  <span className="font-black uppercase text-xs tracking-widest text-slate-500">
                    Total Payable
                  </span>
                  <span className="text-2xl font-black text-blue-600">
                    Rs {Math.round(total).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                <div className="flex items-center gap-4 border-b pb-4">
                  <User className="text-blue-600" size={20} />
                  <h3 className="font-black uppercase text-sm tracking-widest">
                    Courier Info
                  </h3>
                </div>
                <input
                  type="text"
                  placeholder="Full Name"
                  className="w-full bg-slate-50 border-none rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-blue-600 outline-none"
                />
                <input
                  type="text"
                  placeholder="Phone Number"
                  className="w-full bg-slate-50 border-none rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-blue-600 outline-none"
                />
                <textarea
                  placeholder="Shipping Address"
                  rows={3}
                  className="w-full bg-slate-50 border-none rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                <div className="flex items-center gap-4 border-b pb-4">
                  <Truck className="text-blue-600" size={20} />
                  <h3 className="font-black uppercase text-sm tracking-widest">
                    Payment
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("cod")}
                  className={`w-full flex items-center justify-between p-6 rounded-2xl border-2 transition-all ${paymentMethod === "cod" ? "border-blue-600 bg-blue-50" : "border-slate-100"}`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-2 rounded-full ${paymentMethod === "cod" ? "bg-blue-600 text-white" : "bg-slate-100"}`}
                    >
                      <CheckCircle size={16} />
                    </div>
                    <span className="font-bold text-sm uppercase tracking-widest">
                      Cash on Delivery (COD)
                    </span>
                  </div>
                </button>

                <p className="text-xs text-slate-500 leading-relaxed">
                  Review your items above, then confirm to place your order. You will
                  pay Rs {Math.round(total).toLocaleString()} when your package arrives.
                </p>

                <button
                  type="button"
                  onClick={handlePlaceOrder}
                  disabled={isPlacingOrder || cart.length === 0 || cartHasStockIssues}
                  className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:bg-slate-900 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-blue-600 flex items-center justify-center gap-3"
                >
                  {isPlacingOrder ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Placing Order...
                    </>
                  ) : (
                    "Confirm Order"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
