"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import Navbar from "@/components/Navbar";
import {
  fetchMyCollections,
  updateProduct,
  deleteProductImage,
  addProductImages,
} from "@/lib/api";
import type { Collection, SellerProduct } from "@/types";
import {
  ArrowLeft,
  Upload,
  Image as ImageIcon,
  X,
  AlertCircle,
  Save,
  Loader2,
  DollarSign,
  Trash2,
} from "lucide-react";

const CATEGORIES = ["Clothing", "Shoes", "Perfumes", "Watches", "Bags", "Accessories", "Jewelry", "Sportswear"];
const SUB_CATEGORIES = {
  Clothing: ["Shirts", "T-Shirts", "Pants", "Shorts", "Dresses", "Jackets", "Hoodies", "Suits"],
  Shoes: ["Sneakers", "Boots", "Sandals", "Heels", "Formal", "Running"],
  Perfumes: ["Men", "Women", "Unisex", "Oud", "Floral", "Woody"],
  Watches: ["Analog", "Digital", "Smartwatch", "Luxury", "Sports"],
  Bags: ["Backpacks", "Handbags", "Totes", "Wallets", "Duffles"],
  Accessories: ["Hats", "Belts", "Sunglasses", "Scarves", "Gloves"],
  Jewelry: ["Necklaces", "Bracelets", "Rings", "Earrings", "Watches"],
  Sportswear: ["Activewear", "Gym Bags", "Sports Shoes", "Tracksuits"],
};

export default function ProductEditPage() {
  const { isAuthenticated, isAuthLoading } = useStore();
  const router = useRouter();
  const { id } = useParams();
  const productId = Number(id);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [collections, setCollections] = useState<Collection[]>([]);

  // Existing images from DB
  const [existingImages, setExistingImages] = useState<{id: number, url: string, is_primary: boolean}[]>([]);
  // New images to upload
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newPreviewUrls, setNewPreviewUrls] = useState<string[]>([]);

  const [form, setForm] = useState({
    name: "",
    description: "",
    detailed_description: "",
    price: "",
    min_price: "",
    category: "",
    sub_category: "",
    color: "",
    gender: "Unisex",
    season: "All Season",
    collection_id: "",
    is_negotiable: true,
    material: "",
    style: "",
    occasion: "",
    stock: "10",
    size_options: [] as string[],
  });

  const [sizeInput, setSizeInput] = useState("");

  useEffect(() => {
    if (isAuthLoading) return;
    if (!isAuthenticated) {
      router.push("/auth/signin");
      return;
    }
    loadData();
  }, [isAuthenticated, isAuthLoading, productId]);

  const loadData = async () => {
    try {
      const cols = await fetchMyCollections();
      setCollections(cols);

      // Fetch the specific product directly from the public API or seller API
      // We'll use the public API for simplicity as we just need the data to populate the form
      // but ideally we should have a GET /seller/products/{id} endpoint
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/products`);
      const allProducts = await res.json();
      const product = allProducts.find((p: any) => p.id === productId);

      if (!product) {
        setError("Product not found");
        setLoading(false);
        return;
      }

      setForm({
        name: product.name || "",
        description: product.description || "",
        detailed_description: product.detailed_description || "",
        price: product.price?.toString() || "",
        min_price: product.min_price?.toString() || "",
        category: product.category || "",
        sub_category: product.sub_category || "",
        color: product.color || "",
        gender: product.gender || "Unisex",
        season: product.season || "All Season",
        collection_id: product.collection_id?.toString() || "",
        is_negotiable: product.is_negotiable ?? true,
        material: product.material || "",
        style: product.style || "",
        occasion: product.occasion || "",
        stock: product.stock?.toString() || "10",
        size_options: product.size_options ? JSON.parse(product.size_options) : [],
      });

      setExistingImages((product.images || []).map((img: any) => ({
        ...img,
        url: img.url || img.image_url
      })));
    } catch (err) {
      console.error(err);
      setError("Failed to load product data");
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalImages = existingImages.length + newImages.length + files.length;
    
    if (totalImages > 5) {
      setError("Maximum 5 images allowed total");
      return;
    }
    
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"];
    const invalidFile = files.find(f => !validTypes.includes(f.type));
    if (invalidFile) {
      setError("Only JPG, PNG, WEBP, and AVIF images are allowed");
      return;
    }

    const newImgs = [...newImages, ...files];
    setNewImages(newImgs);
    
    const newPreviews = files.map(f => URL.createObjectURL(f));
    setNewPreviewUrls(prev => [...prev, ...newPreviews]);
    setError("");
  };

  const removeNewImage = (index: number) => {
    const imgs = [...newImages];
    imgs.splice(index, 1);
    setNewImages(imgs);
    
    const previews = [...newPreviewUrls];
    URL.revokeObjectURL(previews[index]);
    previews.splice(index, 1);
    setNewPreviewUrls(previews);
  };

  const handleDeleteExistingImage = async (imageId: number) => {
    if (existingImages.length + newImages.length <= 1) {
      setError("You must have at least one image");
      return;
    }
    if (!confirm("Delete this image? This happens immediately.")) return;
    
    try {
      await deleteProductImage(productId, imageId);
      setExistingImages(existingImages.filter(img => img.id !== imageId));
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to delete image");
    }
  };

  const handleAddSize = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && sizeInput.trim()) {
      e.preventDefault();
      if (!form.size_options.includes(sizeInput.trim().toUpperCase())) {
        setForm(prev => ({ ...prev, size_options: [...prev.size_options, sizeInput.trim().toUpperCase()] }));
      }
      setSizeInput("");
    }
  };

  const removeSize = (size: string) => {
    setForm(prev => ({ ...prev, size_options: prev.size_options.filter(s => s !== size) }));
  };

  const wordCount = form.detailed_description.trim().split(/\s+/).filter(w => w.length > 0).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (existingImages.length + newImages.length === 0) {
      return setError("Please have at least 1 image");
    }

    setSubmitting(true);

    try {
      // 1. Upload new images if any
      if (newImages.length > 0) {
        const formData = new FormData();
        newImages.forEach(img => formData.append("images", img));
        await addProductImages(productId, formData);
      }

      // 2. Update product data
      const updateData = {
        name: form.name,
        description: form.description,
        detailed_description: form.detailed_description,
        price: parseFloat(form.price),
        min_price: parseFloat(form.min_price),
        category: form.category,
        sub_category: form.sub_category,
        color: form.color,
        gender: form.gender,
        season: form.season,
        collection_id: parseInt(form.collection_id),
        is_negotiable: form.is_negotiable,
        stock: parseInt(form.stock),
        material: form.material || null,
        style: form.style || null,
        occasion: form.occasion || null,
        size_options: form.size_options.length > 0 ? JSON.stringify(form.size_options) : null,
      };

      await updateProduct(productId, updateData);
      router.push(`/seller/collections/${form.collection_id}`);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to update product");
      setSubmitting(false);
    }
  };

  if (loading || isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-blue-600" />
      </div>
    );
  }

  const subCatOptions = (form.category && SUB_CATEGORIES[form.category as keyof typeof SUB_CATEGORIES]) || [];
  const totalImages = existingImages.length + newImages.length;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <section className="pt-24 pb-8 bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-6">
          <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors mb-6">
            <ArrowLeft size={12} /> Back
          </button>
          
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 uppercase tracking-tighter">Edit Product</h1>
          <p className="text-slate-500 text-sm font-medium mt-2">Update your product details</p>
        </div>
      </section>

      <main className="max-w-4xl mx-auto px-6 py-12">
        {error && (
          <div className="mb-8 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Images Section */}
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
              <h2 className="text-sm font-black uppercase tracking-widest">Product Images</h2>
              <span className="text-xs font-bold text-slate-400">{totalImages}/5 Images</span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {/* Existing Images */}
              {existingImages.map((img) => (
                <div key={img.id} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200 group">
                  <img src={img.url} alt={`Existing`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleDeleteExistingImage(img.id)}
                    className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
                    title="Delete image permanently"
                  >
                    <Trash2 size={12} />
                  </button>
                  {img.is_primary && (
                    <div className="absolute bottom-0 inset-x-0 bg-black/50 backdrop-blur-sm text-white text-[9px] font-black uppercase tracking-widest text-center py-1">
                      Primary
                    </div>
                  )}
                </div>
              ))}

              {/* New Images Preview */}
              {newPreviewUrls.map((url, idx) => (
                <div key={`new-${idx}`} className="relative aspect-square rounded-2xl overflow-hidden border border-green-500 border-2 group">
                  <img src={url} alt={`New ${idx}`} className="w-full h-full object-cover" />
                  <div className="absolute top-0 left-0 bg-green-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-br-lg">New</div>
                  <button
                    type="button"
                    onClick={() => removeNewImage(idx)}
                    className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              
              {/* Upload Button */}
              {totalImages < 5 && (
                <label className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-colors flex flex-col items-center justify-center cursor-pointer text-slate-400 hover:text-blue-600 group">
                  <ImageIcon size={24} className="mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-center px-2">Add Image</span>
                  <input type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif" onChange={handleImageSelect} className="hidden" />
                </label>
              )}
            </div>
          </div>

          {/* Basic Info */}
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
            <h2 className="text-sm font-black uppercase tracking-widest border-b border-slate-100 pb-4">Basic Information</h2>
            
            <div>
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2 block">Product Name *</label>
              <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-blue-600 transition-all" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2 block">Collection *</label>
                <select required value={form.collection_id} onChange={e => setForm({...form, collection_id: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-blue-600 transition-all appearance-none cursor-pointer">
                  {collections.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2 block">Stock Quantity *</label>
                <input type="number" min="0" required value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-blue-600 transition-all" />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2 block">Short Description *</label>
              <input type="text" required value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-blue-600 transition-all" />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2 flex justify-between">
                <span>Detailed Description *</span>
                <span className={wordCount < 50 ? "text-orange-500" : "text-green-500"}>{wordCount} words</span>
              </label>
              <textarea required rows={5} value={form.detailed_description} onChange={e => setForm({...form, detailed_description: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-blue-600 transition-all resize-none" />
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
            <h2 className="text-sm font-black uppercase tracking-widest border-b border-slate-100 pb-4">Pricing & Negotiation</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2 block">Listing Price (Rs) *</label>
                <div className="relative">
                  <DollarSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="number" min="0" required value={form.price} onChange={e => setForm({...form, price: e.target.value})} className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black outline-none focus:ring-2 focus:ring-blue-600 transition-all" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2 block">Minimum Acceptable Price (Rs) *</label>
                <div className="relative">
                  <DollarSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="number" min="0" required value={form.min_price} onChange={e => setForm({...form, min_price: e.target.value})} className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black outline-none focus:ring-2 focus:ring-blue-600 transition-all" />
                </div>
              </div>
            </div>

            <label className="flex items-center gap-3 p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
              <input type="checkbox" checked={form.is_negotiable} onChange={e => setForm({...form, is_negotiable: e.target.checked})} className="w-5 h-5 rounded text-blue-600 focus:ring-blue-600 border-slate-300" />
              <div>
                <p className="font-bold text-sm text-slate-900">Allow AI Negotiation</p>
                <p className="text-xs text-slate-500">If unchecked, the item will be sold at fixed listing price.</p>
              </div>
            </label>
          </div>

          {/* Categorization */}
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
            <h2 className="text-sm font-black uppercase tracking-widest border-b border-slate-100 pb-4">Categorization</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2 block">Category *</label>
                <select required value={form.category} onChange={e => setForm({...form, category: e.target.value, sub_category: ""})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-blue-600 transition-all appearance-none cursor-pointer">
                  <option value="" disabled>Select</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2 block">Sub Category *</label>
                <select required disabled={!form.category} value={form.sub_category} onChange={e => setForm({...form, sub_category: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-blue-600 transition-all appearance-none cursor-pointer disabled:opacity-50">
                  <option value="" disabled>Select</option>
                  {subCatOptions.map((c: string) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2 block">Target Gender *</label>
                <select required value={form.gender} onChange={e => setForm({...form, gender: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-blue-600 transition-all appearance-none cursor-pointer">
                  <option value="Men">Men</option>
                  <option value="Women">Women</option>
                  <option value="Unisex">Unisex</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2 block">Season *</label>
                <select required value={form.season} onChange={e => setForm({...form, season: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-blue-600 transition-all appearance-none cursor-pointer">
                  <option value="Summer">Summer</option>
                  <option value="Winter">Winter</option>
                  <option value="All Season">All Season</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2 block">Color</label>
                <input type="text" value={form.color} onChange={e => setForm({...form, color: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-blue-600 transition-all" />
              </div>
            </div>
          </div>

          {/* AI Search Tags */}
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
            <h2 className="text-sm font-black uppercase tracking-widest border-b border-slate-100 pb-4">AI Discoverability</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2 block">Material</label>
                <input type="text" value={form.material} onChange={e => setForm({...form, material: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-blue-600 transition-all" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2 block">Style</label>
                <input type="text" value={form.style} onChange={e => setForm({...form, style: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-blue-600 transition-all" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2 block">Occasion</label>
                <input type="text" value={form.occasion} onChange={e => setForm({...form, occasion: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-blue-600 transition-all" />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2 block">Available Sizes</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {form.size_options.map(size => (
                  <span key={size} className="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2">
                    {size}
                    <button type="button" onClick={() => removeSize(size)} className="hover:text-red-400"><X size={12} /></button>
                  </span>
                ))}
              </div>
              <input 
                type="text" 
                value={sizeInput} 
                onChange={e => setSizeInput(e.target.value)} 
                onKeyDown={handleAddSize}
                placeholder="Type size (e.g. XL, 42) and press Enter" 
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-blue-600 transition-all" 
              />
            </div>
          </div>

          <div className="pt-4 pb-12">
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase text-[11px] tracking-[0.4em] hover:bg-black transition-all shadow-2xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {submitting ? (
                <><Loader2 size={18} className="animate-spin" /> Saving Changes...</>
              ) : (
                <><Save size={18} /> Save Changes</>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
