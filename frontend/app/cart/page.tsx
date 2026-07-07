"use client";
import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  Plus,
  Minus,
  Zap,
  AlertTriangle,
  Info,
} from "lucide-react";
import Swal from "sweetalert2";

export default function CartPage() {
  const {
    cart,
    setCart,
    forceBillingItemId,
    setForceBillingItemId,
    discountPercentage,
    executeOrder,
    placePartialOrder,
    isPlacingOrder,
    isAuthenticated,
    promptSignIn,
    cartHasStockIssues,
    refreshCartStock,
    user,
    updateProfile,
  } = useStore();

  const router = useRouter();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  // null = buy all valid items; specific array = buy only those items (individual/partial)
  const [checkoutItemIds, setCheckoutItemIds] = useState<number[] | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");

  useEffect(() => {
    if (user) {
      setFullName(user.name || "");
      setPhoneNumber(user.phone_number || "");
      setAddress(user.address || "");
    }
  }, [user]);

  // Refresh stock on mount for logged-in users
  useEffect(() => {
    if (isAuthenticated) {
      refreshCartStock();
    }
  }, [isAuthenticated, refreshCartStock]);

  useEffect(() => {
    if (!forceBillingItemId) return;
    
    if (!isAuthenticated) {
      promptSignIn();
      setForceBillingItemId(null);
      return;
    }
    
    setCheckoutItemIds([forceBillingItemId]);
    setIsCheckingOut(true);
    setForceBillingItemId(null);
  }, [forceBillingItemId, setForceBillingItemId, isAuthenticated, promptSignIn]);



  // ── Helpers ────────────────────────────────────────────────────────────────

  const itemHasStockIssue = (item: any) =>
    item.out_of_stock || item.insufficient_stock || item.stock <= 0;

  // Valid items = not out of stock
  const validItems = cart.filter((item: any) => !itemHasStockIssue(item));
  const invalidItems = cart.filter((item: any) => itemHasStockIssue(item));

  useEffect(() => {
    // If user deletes the items they are checking out, return to bag view
    if (isCheckingOut && checkoutItemIds) {
      const stillValid = validItems.filter((item: any) => checkoutItemIds.includes(item.id));
      if (stillValid.length === 0) {
        setIsCheckingOut(false);
        setCheckoutItemIds(null);
      }
    }
  }, [isCheckingOut, checkoutItemIds, validItems]);

  // The items that will actually be bought in the current checkout flow
  const effectiveCheckoutItems = checkoutItemIds
    ? validItems.filter((item: any) => checkoutItemIds.includes(item.id))
    : validItems;

  const removeFromCart = (itemId: number) => {
    setCart((prev: any[]) => prev.filter((item: any) => item.id !== itemId));
  };

  const updateQuantity = (itemId: number, newQty: number) => {
    setCart((prev: any[]) =>
      prev.map((item: any) => {
        if (item.id !== itemId) return item;
        const clamped = Math.max(1, Math.min(newQty, item.stock || 1));
        return { ...item, quantity: clamped };
      }),
    );
  };

  const handleProceedToBilling = async () => {
    if (!isAuthenticated) {
      await promptSignIn();
      return;
    }
    if (validItems.length === 0) {
      Swal.fire({
        title: "Nothing to buy",
        text: "All items in your bag are out of stock. Remove them or check back later.",
        icon: "warning",
        confirmButtonColor: "#2563eb",
      });
      return;
    }
    setCheckoutItemIds(null); // buy all valid items
    setIsCheckingOut(true);
  };

  const handleBuyThisItem = async (item: any) => {
    if (!isAuthenticated) {
      await promptSignIn();
      return;
    }
    setCheckoutItemIds([item.id]);
    setIsCheckingOut(true);
  };

  // ── Totals (based on effective checkout items) ─────────────────────────────

  const rawSubtotal = effectiveCheckoutItems.reduce(
    (sum: number, item: any) => sum + item.price * (item.quantity || 1),
    0,
  );
  const discountAmount = rawSubtotal * (discountPercentage / 100);
  const subtotalAfterDiscount = rawSubtotal - discountAmount;
  const tax = subtotalAfterDiscount * 0.08;
  const total = subtotalAfterDiscount + tax;

  // Bag view summary is always all valid items
  const bagSubtotal = validItems.reduce(
    (sum: number, item: any) => sum + item.price * (item.quantity || 1),
    0,
  );
  const bagDiscount = bagSubtotal * (discountPercentage / 100);
  const bagSubtotalAfterDiscount = bagSubtotal - bagDiscount;
  const bagTax = bagSubtotalAfterDiscount * 0.08;
  const bagTotal = bagSubtotalAfterDiscount + bagTax;

  // ── Order handlers ─────────────────────────────────────────────────────────

  const handlePlaceOrder = async () => {
    if (isPlacingOrder || effectiveCheckoutItems.length === 0) return;
    if (!address.trim() || !phoneNumber.trim() || !city.trim() || !province) {
      Swal.fire({
        title: "Details Required",
        text: "Please provide your phone number, shipping address, city, and province to confirm your order.",
        icon: "warning",
        confirmButtonColor: "#2563eb",
      });
      return;
    }

    if (user && (address !== user.address || phoneNumber !== user.phone_number)) {
      try {
        await updateProfile(address, phoneNumber);
      } catch (e) {
        console.error("Failed to update profile", e);
      }
    }

    const isPartial = checkoutItemIds !== null;

    if (isPartial) {
      // Individual item purchase
      try {
        await placePartialOrder(effectiveCheckoutItems, city, province);
        await Swal.fire({
          title: "Order Confirmed!",
          text: `Your ${effectiveCheckoutItems.length === 1 ? "item has" : "items have"} been ordered successfully!`,
          icon: "success",
          confirmButtonColor: "#2563eb",
          confirmButtonText: "Back to Bag",
        });
        setIsCheckingOut(false);
        setCheckoutItemIds(null);
      } catch (error: any) {
        const message =
          error?.response?.data?.detail ||
          "Something went wrong. Please try again.";
        await Swal.fire({
          title: "Order Failed",
          text: message,
          icon: "error",
          confirmButtonColor: "#ef4444",
        });
        await refreshCartStock();
      }
    } else {
      // Full cart checkout — uses executeOrder from context which handles Swal + redirect
      executeOrder(city, province);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <button
            onClick={() => {
              if (isCheckingOut) {
                setIsCheckingOut(false);
                setCheckoutItemIds(null);
              } else {
                router.back();
              }
            }}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition font-bold uppercase text-xs tracking-widest"
          >
            <ArrowLeft size={16} />
            {isCheckingOut ? "Back to Bag" : "Continue Shopping"}
          </button>
          <Link href="/" className="font-black text-2xl tracking-tighter uppercase italic hover:opacity-80 transition-opacity">
            HD<span className="text-blue-600">wear</span>
          </Link>
          <div className="w-24"></div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {!isCheckingOut ? (
          /* ─────────────── BAG VIEW ─────────────── */
          <>
            <h1 className="text-4xl font-black uppercase tracking-tight mb-3 flex items-center gap-4">
              Your Bag{" "}
              <span className="text-slate-400 text-2xl font-medium normal-case">
                ({cart.length} {cart.length === 1 ? "item" : "items"})
              </span>
            </h1>

            {/* Out-of-stock notice */}
            {invalidItems.length > 0 && (
              <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3 mb-8 text-amber-700 text-sm font-medium">
                <AlertTriangle size={16} className="flex-shrink-0" />
                <span>
                  <strong>{invalidItems.length} item{invalidItems.length > 1 ? "s are" : " is"} out of stock</strong>{" "}
                  and will be excluded from your order. You can still check out the rest.
                </span>
              </div>
            )}

            {cart.length === 0 ? (
              <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                <div className="inline-flex p-6 bg-slate-50 rounded-full mb-6 text-slate-300">
                  <ShoppingBag size={48} />
                </div>
                <h2 className="text-xl font-bold mb-2">Your bag is empty</h2>
                <p className="text-slate-500 mb-8">No archive items selected.</p>
                <Link
                  href="/"
                  className="bg-slate-900 text-white px-8 py-3 rounded-full font-bold uppercase text-xs tracking-widest hover:bg-blue-600 transition"
                >
                  Start Shopping
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* ── Cart items list ── */}
                <div className="lg:col-span-2 space-y-5">
                  {cart.map((item: any) => {
                    const outOfStock = itemHasStockIssue(item);
                    const stock = item.stock ?? 0;
                    return (
                      <div
                        key={item.id}
                        className={`flex gap-5 p-5 bg-white border rounded-2xl shadow-sm transition ${
                          outOfStock
                            ? "border-red-200 bg-red-50/30 opacity-70"
                            : "border-slate-100 hover:shadow-md"
                        }`}
                      >
                        {/* Image */}
                        <div className="h-36 w-28 flex-shrink-0 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 relative">
                          <img
                            src={item.image_url || "/placeholder.png"}
                            alt={item.name}
                            className={`h-full w-full object-cover ${outOfStock ? "grayscale" : ""}`}
                          />
                          {outOfStock && (
                            <div className="absolute inset-0 flex items-center justify-center bg-red-900/30">
                              <span className="bg-red-600 text-white text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg">
                                Out of Stock
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 flex flex-col justify-between min-w-0">
                          {/* Top row */}
                          <div className="flex flex-col sm:flex-row justify-between items-start gap-2 sm:gap-3">
                            <div className="min-w-0 w-full">
                              <h3 className="font-bold text-base text-slate-900 leading-snug truncate">
                                {item.name}
                              </h3>
                              <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1 flex flex-wrap gap-x-2 gap-y-1">
                                <span>{item.category}</span>
                                {item.selected_size && <span>| Size: {item.selected_size}</span>}
                                {item.selected_color && <span>| Color: {item.selected_color}</span>}
                              </div>

                              {/* Stock badge */}
                              <div className="mt-2 flex items-center gap-2">
                                {outOfStock ? (
                                  <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border border-red-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
                                    Out of Stock
                                  </span>
                                ) : stock <= 3 ? (
                                  <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border border-orange-200 animate-pulse">
                                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block" />
                                    Only {stock} left!
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border border-green-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                                    {stock} in stock
                                  </span>
                                )}
                              </div>

                              {/* Insufficient stock warning */}
                              {item.insufficient_stock && !item.out_of_stock && (
                                <p className="text-[10px] font-black uppercase tracking-widest text-orange-600 mt-1">
                                  Reduce qty — only {stock} available
                                </p>
                              )}
                            </div>

                            {/* Price */}
                            <div className="text-left sm:text-right flex-shrink-0 mt-2 sm:mt-0">
                              <p className="font-black text-lg text-slate-900">
                                Rs {(item.price * (item.quantity || 1)).toLocaleString()}
                              </p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                Rs {item.price.toLocaleString()} / unit
                              </p>
                            </div>
                          </div>

                          {/* Bottom row: qty + actions */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-4 gap-3">
                            {/* Quantity controls — only if in stock */}
                            {!outOfStock && (
                              <div className="flex items-center gap-1 bg-slate-50 rounded-xl border border-slate-200 overflow-hidden w-fit">
                                <button
                                  onClick={() => updateQuantity(item.id, (item.quantity || 1) - 1)}
                                  disabled={(item.quantity || 1) <= 1}
                                  className="px-3 py-2 text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                  <Minus size={13} />
                                </button>
                                <span className="px-3 font-black text-sm text-slate-900 min-w-[2rem] text-center">
                                  {item.quantity || 1}
                                </span>
                                <button
                                  onClick={() => updateQuantity(item.id, (item.quantity || 1) + 1)}
                                  disabled={(item.quantity || 1) >= (item.stock || 1)}
                                  className="px-3 py-2 text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                  <Plus size={13} />
                                </button>
                              </div>
                            )}

                            {/* Actions */}
                            <div className="flex items-center gap-2 sm:ml-auto w-full sm:w-auto">
                              <button
                                onClick={() => removeFromCart(item.id)}
                                className="flex-1 sm:flex-none justify-center flex items-center gap-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 text-[10px] font-black uppercase tracking-wider px-3 py-2.5 rounded-xl transition border border-red-100 hover:border-red-200"
                              >
                                <Trash2 size={13} /> Remove
                              </button>
                              {!outOfStock && (
                                <button
                                  onClick={() => handleBuyThisItem(item)}
                                  className="flex-1 sm:flex-none justify-center flex items-center gap-1.5 bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider px-4 py-2.5 rounded-xl hover:bg-slate-900 transition shadow-lg active:scale-95"
                                >
                                  <Zap size={13} /> Buy Now
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* ── Order summary ── */}
                <div className="lg:col-span-1">
                  <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl sticky top-28">
                    <h2 className="text-xl font-black uppercase tracking-tight mb-6">
                      Order Summary
                    </h2>

                    {invalidItems.length > 0 && (
                      <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5 text-amber-700 text-[11px] font-medium leading-snug">
                        <Info size={14} className="flex-shrink-0 mt-0.5" />
                        <span>
                          {invalidItems.length} out-of-stock {invalidItems.length === 1 ? "item" : "items"} excluded from total
                        </span>
                      </div>
                    )}

                    <div className="space-y-4 text-sm text-slate-600 mb-8 border-b border-slate-100 pb-8">
                      <div className="flex justify-between">
                        <span>Subtotal ({validItems.length} items)</span>
                        <span className="font-medium text-slate-500">
                          Rs {bagSubtotal.toLocaleString()}
                        </span>
                      </div>
                      {discountPercentage > 0 && (
                        <div className="flex justify-between items-center text-green-600 bg-green-50 p-3 rounded-lg border border-green-100">
                          <span className="flex items-center gap-2 font-bold">
                            <TicketPercent size={16} /> Discount ({discountPercentage}%)
                          </span>
                          <span className="font-bold">-Rs {bagDiscount.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Shipping</span>
                        <span className="text-green-600 font-bold">Free</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tax (8%)</span>
                        <span className="font-bold text-slate-900">
                          Rs {Math.round(bagTax).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center mb-8">
                      <span className="text-lg font-bold">Total</span>
                      <span className="text-3xl font-black text-blue-600">
                        Rs {Math.round(bagTotal).toLocaleString()}
                      </span>
                    </div>

                    <button
                      onClick={handleProceedToBilling}
                      disabled={validItems.length === 0}
                      className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold uppercase text-sm tracking-widest hover:bg-blue-600 transition-all shadow-lg flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <CreditCard size={18} />
                      {validItems.length === 0 ? "No Items Available" : "Proceed to Billing"}
                    </button>

                    {cart.length > 0 && validItems.length < cart.length && (
                      <p className="text-center text-[10px] text-slate-400 mt-3 font-medium">
                        {invalidItems.length} out-of-stock {invalidItems.length === 1 ? "item" : "items"} won't be included
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          /* ─────────────── BILLING VIEW ─────────────── */
          <div className="max-w-5xl mx-auto space-y-8">
            <div>
              <h1 className="text-4xl font-black uppercase tracking-tight text-slate-900">
                Checkout
              </h1>
              {checkoutItemIds !== null && (
                <p className="text-sm text-blue-600 font-bold mt-1">
                  ⚡ Quick Buy — {checkoutItemIds.length === 1 ? "1 item" : `${checkoutItemIds.length} items`} selected
                </p>
              )}
            </div>

            {/* Order items recap */}
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-4 border-b border-slate-100 pb-4 mb-6">
                <Package className="text-blue-600" size={20} />
                <h3 className="font-black uppercase text-sm tracking-widest">
                  Your Order ({effectiveCheckoutItems.length}{" "}
                  {effectiveCheckoutItems.length === 1 ? "item" : "items"})
                </h3>
              </div>

              <div className="space-y-3">
                {effectiveCheckoutItems.map((item: any) => (
                  <div
                    key={`checkout-${item.id}`}
                    className="flex gap-4 items-center p-4 rounded-2xl border bg-slate-50 border-slate-100"
                  >
                    <div className="h-16 w-16 flex-shrink-0 bg-white rounded-xl overflow-hidden border border-slate-200">
                      <img
                        src={item.image_url || "/placeholder.png"}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm text-slate-900 truncate">{item.name}</h4>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-0.5 flex gap-2">
                        <span>{item.category}</span>
                        {item.selected_size && <span>| Size: {item.selected_size}</span>}
                        {item.selected_color && <span>| Color: {item.selected_color}</span>}
                      </p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <div className="flex items-center gap-1 bg-white rounded border border-slate-200 overflow-hidden">
                          <button
                            onClick={() => updateQuantity(item.id, (item.quantity || 1) - 1)}
                            disabled={(item.quantity || 1) <= 1}
                            className="px-2 py-1 text-slate-500 hover:bg-slate-100 transition disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Minus size={10} />
                          </button>
                          <span className="px-2 font-bold text-xs text-slate-900 text-center">
                            {item.quantity || 1}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, (item.quantity || 1) + 1)}
                            disabled={(item.quantity || 1) >= (item.stock || 1)}
                            className="px-2 py-1 text-slate-500 hover:bg-slate-100 transition disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Plus size={10} />
                          </button>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          Rs {item.price.toLocaleString()} each
                        </span>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="ml-1 flex items-center gap-1 text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded transition"
                          title="Remove item"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
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
              {/* Billing details */}
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-5">
                <div className="flex items-center gap-4 border-b pb-4">
                  <User className="text-blue-600" size={20} />
                  <h3 className="font-black uppercase text-sm tracking-widest">Billing Details</h3>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={!!user?.name}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-blue-600 outline-none disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 03001234567"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
                    Shipping Address
                  </label>
                  <textarea
                    placeholder="Street/House details"
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-blue-600 outline-none resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
                      City *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Lahore"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-blue-600 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
                      Province *
                    </label>
                    <select
                      value={province}
                      onChange={(e) => setProvince(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-blue-600 outline-none"
                    >
                      <option value="" disabled>Select Province</option>
                      <option value="Punjab">Punjab</option>
                      <option value="Sindh">Sindh</option>
                      <option value="Khyber Pakhtunkhwa">Khyber Pakhtunkhwa</option>
                      <option value="Balochistan">Balochistan</option>
                      <option value="Gilgit-Baltistan">Gilgit-Baltistan</option>
                      <option value="AJK">AJK</option>
                      <option value="Islamabad Capital Territory">Islamabad</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Payment + confirm */}
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                <div className="flex items-center gap-4 border-b pb-4">
                  <Truck className="text-blue-600" size={20} />
                  <h3 className="font-black uppercase text-sm tracking-widest">Payment</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("cod")}
                  className={`w-full flex items-center justify-between p-5 rounded-2xl border-2 transition-all ${
                    paymentMethod === "cod" ? "border-blue-600 bg-blue-50" : "border-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-2 rounded-full ${
                        paymentMethod === "cod" ? "bg-blue-600 text-white" : "bg-slate-100"
                      }`}
                    >
                      <CheckCircle size={16} />
                    </div>
                    <span className="font-bold text-sm uppercase tracking-widest text-slate-900">
                      Cash on Delivery (COD)
                    </span>
                  </div>
                </button>

                <p className="text-xs text-slate-500 leading-relaxed">
                  Review your items above, then confirm to place your order. You will pay{" "}
                  <strong>Rs {Math.round(total).toLocaleString()}</strong> when your package arrives.
                </p>

                <button
                  type="button"
                  onClick={handlePlaceOrder}
                  disabled={isPlacingOrder || effectiveCheckoutItems.length === 0}
                  className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:bg-slate-900 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  {isPlacingOrder ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Placing Order...
                    </>
                  ) : (
                    `Confirm Order — Rs ${Math.round(total).toLocaleString()}`
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
