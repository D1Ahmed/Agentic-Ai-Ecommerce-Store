"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import Navbar from "@/components/Navbar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchMyStore,
  fetchMyCollections,
  createCollection,
  deleteCollection,
  fetchMyProducts,
  deleteStore,
} from "@/lib/api";
import type { Store, Collection } from "@/types";
import {
  FolderOpen,
  Plus,
  Package,
  Eye,
  ShoppingCart,
  Star,
  Bell,
  Trash2,
  Store as StoreIcon,
  MapPin,
  X,
  Loader2,
} from "lucide-react";

export default function SellerDashboardPage() {
  const { user, isAuthenticated, isAuthLoading, optimisticCollections, setOptimisticCollections } = useStore();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  // Redirect if not authenticated
  useEffect(() => {
    if (isAuthLoading) return;
    if (!isAuthenticated) {
      router.push("/auth/signin");
    }
  }, [isAuthenticated, isAuthLoading, router]);

  // Use a single query to fetch all seller data to avoid waterfall and manage loading state easily
  const { data: sellerData, isLoading: isLoadingData, error } = useQuery({
    queryKey: ["sellerData"],
    queryFn: async () => {
      const [storeData, cols, products] = await Promise.all([
        fetchMyStore().catch(() => null),
        fetchMyCollections().catch(() => []),
        fetchMyProducts().catch(() => []),
      ]);
      
      if (!storeData) throw new Error("No store");
      
      return { store: storeData, collections: cols, products };
    },
    enabled: isAuthenticated && !isAuthLoading,
  });

  // Handle redirect if no store
  useEffect(() => {
    if (error) {
      router.push("/seller/register");
    }
  }, [error, router]);

  // Keep the AI action refresh listener
  useEffect(() => {
    const handleRefresh = () => {
       queryClient.invalidateQueries({ queryKey: ["sellerData"] });
    };
    window.addEventListener("refresh_dashboard", handleRefresh);
    return () => window.removeEventListener("refresh_dashboard", handleRefresh);
  }, [queryClient]);

  // Clear optimistic collections when real data loads
  useEffect(() => {
    if (sellerData) {
      setOptimisticCollections?.([]);
    }
  }, [sellerData, setOptimisticCollections]);

  const createMutation = useMutation({
    mutationFn: (data: { name: string; description?: string }) => createCollection(data),
    onSuccess: () => {
      setNewName("");
      setNewDesc("");
      setShowCreate(false);
      queryClient.invalidateQueries({ queryKey: ["sellerData"] });
      window.dispatchEvent(new Event("refresh_dashboard"));
    },
    onError: (err: any) => {
      alert(err?.response?.data?.detail || "Failed to create collection");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteCollection(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sellerData"] });
      window.dispatchEvent(new Event("refresh_dashboard"));
    },
    onError: (err: any) => {
      alert(err?.response?.data?.detail || "Failed to delete");
    }
  });

  const handleCreateCollection = () => {
    if (!newName.trim()) return;
    createMutation.mutate({ name: newName.trim(), description: newDesc.trim() || undefined });
  };

  const handleDeleteCollection = (id: number) => {
    if (!confirm("Delete this collection? Products inside won't be deleted.")) return;
    deleteMutation.mutate(id);
  };

  const handleDeleteStore = async () => {
    if (!confirm("Are you absolutely sure you want to delete your store and ALL your products? This action cannot be undone.")) return;
    try {
      await deleteStore();
      window.location.href = "/";
    } catch (err: any) {
      alert(err?.response?.data?.detail || "Failed to delete store");
    }
  };

  const loading = isAuthLoading || isLoadingData;
  const store = sellerData?.store;
  const collections = sellerData?.collections || [];
  const products = sellerData?.products || [];
  
  const stats = {
    totalProducts: products.length,
    totalViews: products.reduce((s: number, p: any) => s + (p.view_count || 0), 0),
    totalSales: products.reduce((s: number, p: any) => s + (p.purchase_count || 0), 0),
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        
        {/* Skeleton Dashboard Header */}
        <section className="pt-24 pb-8 bg-gradient-to-br from-slate-900 via-blue-900/90 to-slate-900">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-white/10 rounded-xl animate-pulse"></div>
                <div>
                  <div className="h-8 w-48 bg-white/10 rounded animate-pulse mb-2"></div>
                  <div className="h-3 w-32 bg-white/10 rounded animate-pulse"></div>
                </div>
              </div>
              <div className="h-8 w-32 bg-white/10 rounded-xl animate-pulse"></div>
            </div>

            {/* Skeleton Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10">
                  <div className="h-5 w-5 bg-white/10 rounded animate-pulse mb-2"></div>
                  <div className="h-8 w-16 bg-white/10 rounded animate-pulse mb-1"></div>
                  <div className="h-2 w-20 bg-white/10 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Skeleton Collections Grid */}
        <main className="max-w-6xl mx-auto px-6 py-12">
          <div className="flex justify-between items-center mb-8">
            <div className="border-l-4 border-slate-200 pl-4">
              <div className="h-6 w-48 bg-slate-200 rounded animate-pulse mb-2"></div>
              <div className="h-3 w-32 bg-slate-200 rounded animate-pulse"></div>
            </div>
            <div className="h-10 w-40 bg-slate-200 rounded-xl animate-pulse"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 p-6">
                <div className="w-14 h-14 bg-slate-100 rounded-2xl animate-pulse mb-4"></div>
                <div className="h-5 w-32 bg-slate-100 rounded animate-pulse mb-2"></div>
                <div className="h-3 w-48 bg-slate-100 rounded animate-pulse mt-4"></div>
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!store) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* Dashboard Header */}
      <section className="pt-24 pb-8 bg-gradient-to-br from-slate-900 via-blue-900/90 to-slate-900">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                  <StoreIcon size={24} className="text-white" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">{store.name}</h1>
                  <p className="text-white/40 text-xs font-medium flex items-center gap-1">
                    <MapPin size={10} /> {store.address}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 mt-3 flex-wrap">
                {store.categories?.map((cat) => (
                  <span key={cat} className="bg-white/10 text-white/70 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border border-white/10">
                    {cat}
                  </span>
                ))}
              </div>
            </div>
            
            <button
              onClick={handleDeleteStore}
              className="mt-4 md:mt-0 flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
            >
              <Trash2 size={14} />
              Delete Store
            </button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10">
              <Package size={18} className="text-blue-400 mb-2" />
              <p className="text-3xl font-black text-white">{stats.totalProducts}</p>
              <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest">Products</p>
            </div>
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10">
              <Eye size={18} className="text-green-400 mb-2" />
              <p className="text-3xl font-black text-white">{stats.totalViews}</p>
              <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest">Total Views</p>
            </div>
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10">
              <ShoppingCart size={18} className="text-purple-400 mb-2" />
              <p className="text-3xl font-black text-white">{stats.totalSales}</p>
              <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest">Items Sold</p>
            </div>
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10">
              <Star size={18} className="text-yellow-400 mb-2" />
              <p className="text-3xl font-black text-white">Rs 0</p>
              <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest">Total Revenue</p>
            </div>
          </div>
        </div>
      </section>

      {/* Collections Grid */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex justify-between items-center mb-8">
          <div className="border-l-4 border-blue-600 pl-4">
            <h2 className="text-xl font-black uppercase tracking-tight text-slate-900">Your Collections</h2>
            <p className="text-slate-400 text-xs font-medium">Organize your products into folders</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2 shadow-lg"
          >
            <Plus size={14} /> Create Collection
          </button>
        </div>

        {/* Create Collection Modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
              <h3 className="text-lg font-black uppercase tracking-tight mb-6">New Collection</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-1 block">
                    Collection Name *
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Summer Shoes, Leather Bags"
                    autoFocus
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-1 block">
                    Description (optional)
                  </label>
                  <input
                    type="text"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Brief description of this collection"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCreate(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-500 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateCollection}
                  disabled={!newName.trim() || createMutation.isPending}
                  className="flex-1 py-3 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-black transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {createMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  Create
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Collections */}
        {collections.length === 0 && (optimisticCollections || []).length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl border border-slate-100">
            <FolderOpen size={48} className="mx-auto text-slate-200 mb-4" />
            <h3 className="font-black text-lg uppercase tracking-tight text-slate-300 mb-2">No Collections Yet</h3>
            <p className="text-slate-400 text-sm mb-6">Create your first collection to start uploading products</p>
            <button
              onClick={() => setShowCreate(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-black transition-all"
            >
              <Plus size={14} className="inline mr-2" />
              Create Your First Collection
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...collections, ...(optimisticCollections || [])].map((col) => {
              const isOptimistic = col.id < 0;
              return (
                <div
                  key={col.id}
                  className={`group bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-xl transition-all duration-300 ${isOptimistic ? 'opacity-70 animate-pulse pointer-events-none' : 'hover:-translate-y-1'}`}
                >
                  <Link href={`/seller/collections/${col.id}`} className="block p-6">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform relative">
                      <FolderOpen size={28} className="text-blue-600" />
                      {isOptimistic && (
                        <div className="absolute inset-0 bg-blue-100/50 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                          <Loader2 size={20} className="text-blue-600 animate-spin" />
                        </div>
                      )}
                    </div>
                    <h3 className="font-black text-lg uppercase tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
                      {col.name}
                    </h3>
                    {col.description && (
                      <p className="text-slate-400 text-xs mt-1 line-clamp-1">{col.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-4">
                      <Package size={12} className="text-slate-300" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        {col.product_count} Product{col.product_count !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </Link>
                  <div className="px-6 pb-4 flex justify-end">
                    {!isOptimistic && (
                      <button
                        onClick={() => handleDeleteCollection(col.id)}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete collection"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
