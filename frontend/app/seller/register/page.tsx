"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/context/StoreContext";
import Navbar from "@/components/Navbar";
import { registerStore } from "@/lib/api";
import { Store, MapPin, Phone, FileText, Tag, ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";

const STORE_CATEGORIES = [
  "Clothing",
  "Shoes",
  "Perfumes",
  "Watches",
  "Bags",
  "Accessories",
  "Jewelry",
  "Sportswear",
];

export default function SellerRegisterPage() {
  const { user, isAuthenticated, refreshSession } = useStore();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    address: "",
    phone: "",
    description: "",
    categories: [] as string[],
  });

  const toggleCategory = (cat: string) => {
    setForm((prev) => ({
      ...prev,
      categories: prev.categories.includes(cat)
        ? prev.categories.filter((c) => c !== cat)
        : [...prev.categories, cat],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      router.push("/auth/signin");
      return;
    }
    if (form.categories.length === 0) {
      setError("Please select at least one category");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await registerStore({
        name: form.name.trim(),
        address: form.address.trim(),
        phone: form.phone.trim(),
        categories: form.categories,
        description: form.description.trim() || undefined,
      });
      // Reload user data to get updated role
      await refreshSession();
      router.push("/seller/dashboard");
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to register store");
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-center">
            <Store size={48} className="mx-auto text-slate-300 mb-4" />
            <h2 className="text-2xl font-black uppercase tracking-tight mb-2">Sign in to open your store</h2>
            <p className="text-slate-400 text-sm mb-6">You need an account to become a seller</p>
            <button
              onClick={() => router.push("/auth/signin")}
              className="bg-blue-600 text-white px-8 py-3 rounded-full font-bold text-sm hover:bg-black transition-all"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-20 pb-12 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-purple-500 rounded-full blur-[100px]" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto px-6 pt-12 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md text-white/80 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.4em] mb-6 border border-white/10">
            <Sparkles size={12} /> Become a Seller
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-white uppercase tracking-tighter leading-none mb-4">
            Open Your <span className="text-blue-400">Store</span>
          </h1>
          <p className="text-white/50 text-sm font-medium max-w-md mx-auto">
            Join the HDwear marketplace. Set up your store, organize collections, and let our AI-powered assistant help customers find your products.
          </p>
        </div>
      </section>

      {/* Form */}
      <main className="max-w-2xl mx-auto px-6 -mt-8 pb-24">
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden"
        >
          <div className="p-8 md:p-10 space-y-7">
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm font-bold">
                {error}
              </div>
            )}

            {/* Store Name */}
            <div>
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2 flex items-center gap-2">
                <Store size={12} /> Store Name *
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Urban Sole"
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
              />
            </div>

            {/* Store Address */}
            <div>
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2 flex items-center gap-2">
                <MapPin size={12} /> Store Address *
              </label>
              <input
                type="text"
                required
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="e.g. Shop #12, Liberty Market, Lahore"
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2 flex items-center gap-2">
                <Phone size={12} /> Phone Number *
              </label>
              <input
                type="tel"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="e.g. 0300-1234567"
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2 flex items-center gap-2">
                <FileText size={12} /> Store Description (Optional)
              </label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Tell customers what your store is about..."
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all resize-none"
              />
            </div>

            {/* Categories */}
            <div>
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-3 flex items-center gap-2">
                <Tag size={12} /> Store Categories * <span className="text-blue-500">(select all that apply)</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {STORE_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={`px-4 py-3 rounded-xl text-xs font-bold border transition-all ${
                      form.categories.includes(cat)
                        ? "bg-blue-600 text-white border-blue-600 shadow-lg scale-[1.02]"
                        : "bg-slate-50 text-slate-400 border-slate-200 hover:border-blue-300 hover:text-blue-600"
                    }`}
                  >
                    {form.categories.includes(cat) && <CheckCircle2 size={12} className="inline mr-1.5" />}
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="px-8 md:px-10 pb-8 md:pb-10">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 text-white py-5 rounded-xl font-black uppercase text-[11px] tracking-[0.4em] hover:bg-blue-600 transition-all shadow-2xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Launch Your Store <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
