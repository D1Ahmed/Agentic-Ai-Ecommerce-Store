"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import Navbar from "@/components/Navbar";
import { fetchMyProducts, fetchMyCollections, deleteProduct, toggleProductSale } from "@/lib/api";
import type { SellerProduct, Collection } from "@/types";
import {
  ArrowLeft,
  Plus,
  Package,
  Edit,
  Trash2,
  Tag,
  Eye,
  ShoppingCart,
  Star,
  MoreVertical,
  Loader2,
  MessageCircle,
  Image as ImageIcon
} from "lucide-react";

export default function SellerCollectionPage() {
  const { id } = useParams();
  const { isAuthenticated, isAuthLoading, notifications } = useStore();
  const router = useRouter();

  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState<number | null>(null);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!isAuthenticated) {
      router.push("/auth/signin");
      return;
    }
    loadData();
  }, [isAuthenticated, isAuthLoading, id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cols, prods] = await Promise.all([
        fetchMyCollections().catch(() => []),
        fetchMyProducts(Number(id)).catch(() => []),
      ]);
      const current = cols.find((c: Collection) => c.id === Number(id));
      if (!current) {
        router.push("/seller/dashboard");
        return;
      }
      setCollection(current);
      setProducts(prods);
    } catch {
      router.push("/seller/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    if (!confirm("Are you sure you want to delete this product? This action cannot be undone.")) return;
    try {
      await deleteProduct(productId);
      setProducts(products.filter(p => p.id !== productId));
    } catch (err: any) {
      alert(err?.response?.data?.detail || "Failed to delete product");
    }
    setActiveMenu(null);
  };

  const handleToggleSale = async (productId: number, currentState: boolean, currentPct: number) => {
    const newState = !currentState;
    let pct = 0;
    if (newState) {
      const input = prompt("Enter sale percentage (1-90):", "20");
      if (!input) return;
      pct = parseInt(input, 10);
      if (isNaN(pct) || pct < 1 || pct > 90) {
        alert("Invalid percentage");
        return;
      }
    }
    try {
      const updated = await toggleProductSale(productId, newState, pct);
      setProducts(products.map(p => p.id === productId ? { ...p, is_on_sale: updated.is_on_sale, sale_percentage: updated.sale_percentage } : p));
    } catch (err: any) {
      alert(err?.response?.data?.detail || "Failed to update sale status");
    }
    setActiveMenu(null);
  };


  if (loading || isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />

        <section className="pt-24 pb-12 bg-white border-b border-slate-100">
          <div className="max-w-6xl mx-auto px-6">
            <div className="h-3 w-24 bg-slate-200 rounded animate-pulse mb-6"></div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              <div>
                <div className="h-10 w-64 bg-slate-200 rounded animate-pulse mb-2"></div>
                <div className="h-4 w-96 bg-slate-200 rounded animate-pulse"></div>
              </div>
              <div className="h-12 w-40 bg-slate-200 rounded-xl animate-pulse"></div>
            </div>
          </div>
        </section>

        <main className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                <div className="aspect-[4/5] bg-slate-100 animate-pulse"></div>
                <div className="p-5">
                  <div className="h-4 w-3/4 bg-slate-200 rounded animate-pulse mb-2"></div>
                  <div className="h-4 w-1/4 bg-slate-200 rounded animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!collection) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <section className="pt-24 pb-12 bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6">
          <Link href="/seller/dashboard" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors mb-6">
            <ArrowLeft size={12} /> Back to Dashboard
          </Link>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl md:text-5xl font-black text-slate-900 uppercase tracking-tighter">{collection.name}</h1>
              </div>
              {collection.description && (
                <p className="text-slate-500 text-sm font-medium">{collection.description}</p>
              )}
            </div>
            <Link
              href={`/seller/products/upload?collection_id=${collection.id}`}
              className="bg-blue-600 text-white px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2 shadow-xl hover:-translate-y-1"
            >
              <Plus size={16} /> Upload Product
            </Link>
          </div>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-6 py-12">
        {products.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl border border-slate-100">
            <Package size={48} className="mx-auto text-slate-200 mb-4" />
            <h3 className="font-black text-lg uppercase tracking-tight text-slate-300 mb-2">Empty Collection</h3>
            <p className="text-slate-400 text-sm mb-6">Start uploading products to this collection</p>
            <Link
              href={`/seller/products/upload?collection_id=${collection.id}`}
              className="inline-flex bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-black transition-all"
            >
              <Plus size={14} className="inline mr-2" />
              Upload First Product
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => {
              const hasUnread = notifications?.some((n: any) => !n.is_read && n.link === `/seller/products/manage/${product.id}`);
              return (
              <div key={product.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden group shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div 
                  className="relative aspect-[4/5] bg-slate-50 overflow-hidden cursor-pointer"
                  onClick={() => router.push(`/seller/products/manage/${product.id}`)}
                >
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-100">
                      <ImageIcon size={32} className="text-slate-300" />
                    </div>
                  )}
                  
                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex flex-col gap-2">
                    {product.is_on_sale && (
                      <span className="bg-red-500 text-white px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest shadow-lg">
                        {product.sale_percentage}% OFF
                      </span>
                    )}
                    {product.stock <= 5 && (
                      <span className="bg-orange-500 text-white px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest shadow-lg">
                        Low Stock ({product.stock})
                      </span>
                    )}
                  </div>

                  {/* Menu */}
                  <div className="absolute top-3 right-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenu(activeMenu === product.id ? null : product.id);
                      }}
                      className="relative w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-slate-600 hover:text-blue-600 shadow-sm"
                    >
                      <MoreVertical size={16} />
                      {hasUnread && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse" />
                      )}
                    </button>
                    
                    {activeMenu === product.id && (
                      <div className="absolute top-10 right-0 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-20 animate-in fade-in zoom-in duration-200">
                        <Link href={`/collections/${product.id}`} className="w-full px-4 py-2 text-left text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                          <Eye size={14} /> View in Store
                        </Link>
                        <Link href={`/seller/products/edit/${product.id}`} className="w-full px-4 py-2 text-left text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                          <Edit size={14} /> Edit Details
                        </Link>
                        <Link href={`/seller/products/manage/${product.id}`} className="w-full px-4 py-2 text-left text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                          <MessageCircle size={14} /> Manage Interactions
                          {hasUnread && <span className="ml-auto w-2 h-2 bg-red-500 rounded-full"></span>}
                        </Link>
                        <button 
                          onClick={() => handleToggleSale(product.id, product.is_on_sale, product.sale_percentage)}
                          className="w-full px-4 py-2 text-left text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        >
                          <Tag size={14} className={product.is_on_sale ? "text-red-500" : ""} /> 
                          {product.is_on_sale ? "Remove Sale" : "Put on Sale"}
                        </button>
                        <hr className="my-1 border-slate-100" />
                        <button 
                          onClick={() => handleDeleteProduct(product.id)}
                          className="w-full px-4 py-2 text-left text-sm font-bold text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                          <Trash2 size={14} /> Delete Product
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div 
                  className="p-5 cursor-pointer"
                  onClick={() => router.push(`/seller/products/manage/${product.id}`)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-black text-sm uppercase tracking-tight text-slate-900 line-clamp-1 flex-1 pr-2">
                      {product.name}
                    </h3>
                    <div className="text-right">
                      {product.is_on_sale ? (
                        <>
                          <div className="text-[9px] text-slate-400 line-through font-bold">Rs {product.price.toLocaleString()}</div>
                          <div className="text-red-600 font-black italic">Rs {(product.price * (1 - product.sale_percentage / 100)).toLocaleString()}</div>
                        </>
                      ) : (
                        <div className="text-slate-900 font-black italic">Rs {product.price.toLocaleString()}</div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 text-slate-400" title="Views">
                      <Eye size={14} /> <span className="text-[10px] font-bold">{product.view_count || 0}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400" title="Purchases">
                      <ShoppingCart size={14} /> <span className="text-[10px] font-bold">{product.purchase_count || 0}</span>
                    </div>
                    {product.rating > 0 && (
                      <div className="flex items-center gap-1.5 text-slate-400" title="Rating">
                        <Star size={14} className="text-yellow-400" fill="yellow" /> <span className="text-[10px] font-bold">{product.rating}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )})}
          </div>
        )}
      </main>
      
      {/* Click outside menu closer */}
      {activeMenu && (
        <div className="fixed inset-0 z-10" onClick={() => setActiveMenu(null)} />
      )}
    </div>
  );
}
