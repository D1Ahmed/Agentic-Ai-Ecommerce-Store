"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import Navbar from "@/components/Navbar";
import { subscribeToStore, unsubscribeFromStore, checkStoreSubscription, api } from "@/lib/api";
import { Bell, MapPin, Store as StoreIcon, Package, AlertCircle } from "lucide-react";

export default function StoreProfilePage() {
  const { id } = useParams();
  const storeId = Number(id);
  const router = useRouter();
  const { isAuthenticated, isAuthLoading, setCart } = useStore();

  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subLoading, setSubLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStore = async () => {
      try {
        const res = await api.get(`/store/${storeId}`);
        setStore(res.data);
      } catch (err: any) {
        setError("Store not found");
      } finally {
        setLoading(false);
      }
    };
    fetchStore();
  }, [storeId]);

  useEffect(() => {
    if (isAuthenticated && !isAuthLoading && store) {
      checkStoreSubscription(storeId)
        .then(res => setIsSubscribed(res.is_subscribed))
        .catch(console.error);
    }
  }, [isAuthenticated, isAuthLoading, storeId, store]);

  const handleSubscribeToggle = async () => {
    if (!isAuthenticated) {
      router.push("/auth/signin");
      return;
    }
    setSubLoading(true);
    try {
      if (isSubscribed) {
        await unsubscribeFromStore(storeId);
        setIsSubscribed(false);
      } else {
        await subscribeToStore(storeId);
        setIsSubscribed(true);
      }
    } catch (err) {
      console.error("Failed to toggle subscription");
    } finally {
      setSubLoading(false);
    }
  };

  const addToCart = (product: any) => {
    setCart((prev: any) => {
      const existingItem = prev.find((item: any) => item.id === product.id);
      if (existingItem) {
        return prev.map((item: any) =>
          item.id === product.id
            ? { ...item, quantity: (item.quantity || 1) + 1 }
            : item,
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  if (loading || isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="pt-32 flex justify-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="pt-32 flex flex-col items-center text-slate-500">
          <AlertCircle size={48} className="mb-4 text-slate-300" />
          <h2 className="text-xl font-black uppercase">Store Not Found</h2>
          <p className="mt-2 text-sm">The store you are looking for does not exist.</p>
        </div>
      </div>
    );
  }

  // Flatten products from collections
  const storeProducts = store.collections?.flatMap((c: any) => c.products || []) || [];

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <Navbar />

      <div className="pt-24 px-6 md:px-10 max-w-7xl mx-auto">
        {/* Store Header Banner */}
        <div className="bg-slate-900 rounded-3xl p-8 md:p-12 text-white shadow-xl mb-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-blue-600/20 mix-blend-overlay"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
                {store.logo_url ? (
                  <img src={store.logo_url} alt={store.name} className="w-full h-full object-cover rounded-2xl" />
                ) : (
                  <StoreIcon size={40} className="text-white/80" />
                )}
              </div>
              <div>
                <h1 className="text-4xl font-black uppercase tracking-tight">{store.name}</h1>
                <p className="text-white/60 text-sm font-medium mt-2 flex items-center gap-2">
                  <MapPin size={14} /> {store.address}
                </p>
                <div className="flex gap-2 mt-3">
                  {store.categories?.map((cat: string) => (
                    <span key={cat} className="bg-white/10 text-white/80 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/20">
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={handleSubscribeToggle}
              disabled={subLoading}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg border ${
                isSubscribed 
                ? "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                : "bg-blue-600 text-white border-blue-500 hover:bg-blue-500 hover:scale-105 active:scale-95"
              }`}
            >
              <Bell size={16} className={isSubscribed ? "" : "text-white"} />
              {isSubscribed ? "Subscribed" : "Subscribe to Updates"}
            </button>
          </div>
        </div>

        {/* Store Products */}
        <div className="mb-8 border-b border-slate-200 pb-4 flex items-center gap-3">
          <Package size={24} className="text-slate-900" />
          <h2 className="text-2xl font-black uppercase tracking-widest text-slate-900">
            All Products
          </h2>
        </div>

        {storeProducts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm">
            <StoreIcon size={48} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-500 font-medium">This store hasn't uploaded any products yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
            {storeProducts.map((product: any) => (
              <div key={product.id} className="group">
                <Link href={`/collections/${product.id}`}>
                  <div className="relative aspect-[3/4] bg-white rounded-[2.5rem] overflow-hidden mb-6 shadow-sm group-hover:shadow-2xl transition-all duration-700 border border-slate-200">
                    <img
                      src={product.image_url || "/placeholder.png"}
                      alt={product.name}
                      className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-[2000ms]"
                    />
                    {product.is_on_sale && product.sale_percentage > 0 && (
                      <div className="absolute top-4 left-4 z-20">
                        <span className="bg-red-600 backdrop-blur-md text-white px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-xl">
                          {product.sale_percentage}% OFF
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
                <div className="flex justify-between items-end mb-1 px-2">
                  <h3 className="font-black text-slate-900 text-sm uppercase tracking-tighter line-clamp-1 flex-1 pr-2">
                    {product.name}
                  </h3>
                  <div className="text-right shrink-0">
                    {product.is_on_sale && product.sale_percentage > 0 ? (
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 line-through font-bold">
                          Rs {product.price.toLocaleString()}
                        </span>
                        <span className="font-black text-red-600 italic">
                          Rs {(product.price * (1 - product.sale_percentage / 100)).toLocaleString()}
                        </span>
                      </div>
                    ) : (
                      <span className="font-black text-slate-900 italic">
                        Rs {product.price.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => addToCart(product)}
                  className="w-full mt-4 bg-slate-100 py-4 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all shadow-sm active:scale-95"
                >
                  Add to Cart
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
