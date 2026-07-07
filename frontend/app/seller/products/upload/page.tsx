"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import Navbar from "@/components/Navbar";
import { fetchMyCollections, uploadProduct } from "@/lib/api";
import type { Collection } from "@/types";
import {
  ArrowLeft,
  Upload,
  Image as ImageIcon,
  X,
  AlertCircle,
  PackageCheck,
  Loader2,
  DollarSign,
  Plus
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

function UploadContent() {
  const { isAuthenticated, isAuthLoading } = useStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultCollectionId = searchParams.get("collection_id");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [collections, setCollections] = useState<Collection[]>([]);

  // Images state
  const [images, setImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  // Form state
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
    collection_id: defaultCollectionId || "",
    is_negotiable: true,
    material: "",
    style: "",
    occasion: "",
    stock: "10",
    size_options: [] as string[],
    color_options: [] as string[],
  });

  const [sizeInput, setSizeInput] = useState("");
  const [colorInput, setColorInput] = useState("");

  useEffect(() => {
    if (isAuthLoading) return;
    if (!isAuthenticated) {
      router.push("/auth/signin");
      return;
    }
    loadData();
  }, [isAuthenticated, isAuthLoading]);

  const loadData = async () => {
    try {
      const cols = await fetchMyCollections();
      setCollections(cols);
      if (!defaultCollectionId && cols.length > 0) {
        setForm(prev => ({ ...prev, collection_id: String(cols[0].id) }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 5) {
      setError("Maximum 5 images allowed");
      return;
    }
    
    // Validate types
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"];
    const invalidFile = files.find(f => !validTypes.includes(f.type));
    if (invalidFile) {
      setError("Only JPG, PNG, WEBP, and AVIF images are allowed");
      return;
    }

    const newImages = [...images, ...files];
    setImages(newImages);
    
    // Create preview URLs
    const newPreviews = files.map(f => URL.createObjectURL(f));
    setPreviewUrls(prev => [...prev, ...newPreviews]);
    setError("");
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
    
    const newPreviews = [...previewUrls];
    URL.revokeObjectURL(newPreviews[index]);
    newPreviews.splice(index, 1);
    setPreviewUrls(newPreviews);
  };

  const addSize = () => {
    if (sizeInput.trim()) {
      if (!form.size_options.includes(sizeInput.trim().toUpperCase())) {
        setForm(prev => ({ ...prev, size_options: [...prev.size_options, sizeInput.trim().toUpperCase()] }));
      }
      setSizeInput("");
    }
  };

  const handleAddSize = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSize();
    }
  };

  const removeSize = (size: string) => {
    setForm(prev => ({ ...prev, size_options: prev.size_options.filter(s => s !== size) }));
  };

  const addColor = () => {
    if (colorInput.trim()) {
      const newColor = colorInput.trim().replace(/\b\w/g, l => l.toUpperCase());
      if (!form.color_options.includes(newColor)) {
        setForm(prev => ({ ...prev, color_options: [...prev.color_options, newColor] }));
      }
      setColorInput("");
    }
  };

  const handleAddColor = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addColor();
    }
  };

  const removeColor = (color: string) => {
    setForm(prev => ({ ...prev, color_options: prev.color_options.filter(c => c !== color) }));
  };

  const wordCount = form.detailed_description.trim().split(/\s+/).filter(w => w.length > 0).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validations
    if (images.length === 0) return setError("Please upload at least 1 image");
    if (!form.collection_id) return setError("Please select a collection");
    if (!form.category) return setError("Please select a category");
    if (!form.sub_category) return setError("Please select a sub-category");

    setSubmitting(true);

    try {
      const formData = new FormData();
      images.forEach(img => formData.append("images", img));
      
      formData.append("name", form.name);
      formData.append("description", form.description);
      formData.append("detailed_description", form.detailed_description);
      formData.append("price", form.price);
      formData.append("min_price", form.min_price);
      formData.append("category", form.category);
      formData.append("sub_category", form.sub_category);
      formData.append("color", form.color);
      formData.append("gender", form.gender);
      formData.append("season", form.season);
      formData.append("collection_id", form.collection_id);
      formData.append("is_negotiable", String(form.is_negotiable));
      formData.append("stock", form.stock);
      
      if (form.material) formData.append("material", form.material);
      if (form.style) formData.append("style", form.style);
      if (form.occasion) formData.append("occasion", form.occasion);
      
      const isClothingOrShoes = ["Clothing", "Shoes", "Sportswear"].includes(form.category);
      if (isClothingOrShoes && form.size_options.length > 0) {
        formData.append("size_options", JSON.stringify(form.size_options));
      }
      if (isClothingOrShoes && form.color_options.length > 0) {
        formData.append("color_options", JSON.stringify(form.color_options));
      }

      await uploadProduct(formData);
      router.push(`/seller/collections/${form.collection_id}`);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to upload product. Check your Supabase configuration.");
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

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <section className="pt-24 pb-8 bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-6">
          <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors mb-6">
            <ArrowLeft size={12} /> Back
          </button>
          
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 uppercase tracking-tighter">Upload Product</h1>
          <p className="text-slate-500 text-sm font-medium mt-2">Add a new item to your inventory</p>
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
            <h2 className="text-sm font-black uppercase tracking-widest mb-6 border-b border-slate-100 pb-4">Product Images</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {previewUrls.map((url, idx) => (
                <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200 group">
                  <img src={url} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
                  >
                    <X size={12} />
                  </button>
                  {idx === 0 && (
                    <div className="absolute bottom-0 inset-x-0 bg-black/50 backdrop-blur-sm text-white text-[9px] font-black uppercase tracking-widest text-center py-1">
                      Primary
                    </div>
                  )}
                </div>
              ))}
              
              {images.length < 5 && (
                <label className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-colors flex flex-col items-center justify-center cursor-pointer text-slate-400 hover:text-blue-600 group">
                  <ImageIcon size={24} className="mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-center px-2">Add Image<br/>(Max 5)</span>
                  <input type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif" onChange={handleImageSelect} className="hidden" />
                </label>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-4 font-medium">Tip: The first image will be used as the primary display image.</p>
          </div>

          {/* Basic Info */}
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
            <h2 className="text-sm font-black uppercase tracking-widest border-b border-slate-100 pb-4">Basic Information</h2>
            
            <div>
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2 block">Product Name *</label>
              <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Vintage Leather Jacket" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-blue-600 transition-all" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2 block">Collection *</label>
                <select required value={form.collection_id} onChange={e => setForm({...form, collection_id: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-blue-600 transition-all appearance-none cursor-pointer">
                  <option value="" disabled>Select Collection</option>
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
              <input type="text" required value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Brief catchphrase (e.g. Premium leather jacket for winter)" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-blue-600 transition-all" />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2 flex justify-between">
                <span>Detailed Description *</span>
                <span className={wordCount < 50 ? "text-orange-500" : "text-green-500"}>{wordCount} words (min 50 recommended for AI)</span>
              </label>
              <textarea required rows={5} value={form.detailed_description} onChange={e => setForm({...form, detailed_description: e.target.value})} placeholder="Detailed specifications, features, care instructions..." className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-blue-600 transition-all resize-none" />
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
                  <input type="number" min="0" required value={form.price} onChange={e => setForm({...form, price: e.target.value})} placeholder="0.00" className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black outline-none focus:ring-2 focus:ring-blue-600 transition-all" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2 block">Minimum Acceptable Price (Rs) *</label>
                <div className="relative">
                  <DollarSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="number" min="0" required value={form.min_price} onChange={e => setForm({...form, min_price: e.target.value})} placeholder="0.00" className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black outline-none focus:ring-2 focus:ring-blue-600 transition-all" />
                </div>
                <p className="text-xs text-slate-400 mt-2">The AI agent will not negotiate below this price.</p>
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
                <input type="text" value={form.color} onChange={e => setForm({...form, color: e.target.value})} placeholder="e.g. Black, Navy Blue" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-blue-600 transition-all" />
              </div>
            </div>
          </div>

          {/* AI Search Tags */}
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
            <h2 className="text-sm font-black uppercase tracking-widest border-b border-slate-100 pb-4 flex items-center gap-2">
              <Sparkles size={16} className="text-blue-500" /> AI Discoverability
            </h2>
            <p className="text-xs text-slate-500 font-medium">Add these details to help the RAG agent match your product to customer searches.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2 block">Material</label>
                <input type="text" value={form.material} onChange={e => setForm({...form, material: e.target.value})} placeholder="e.g. Leather, Cotton" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-blue-600 transition-all" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2 block">Style</label>
                <input type="text" value={form.style} onChange={e => setForm({...form, style: e.target.value})} placeholder="e.g. Casual, Formal, Sporty" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-blue-600 transition-all" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2 block">Occasion</label>
                <input type="text" value={form.occasion} onChange={e => setForm({...form, occasion: e.target.value})} placeholder="e.g. Wedding, Daily, Gym" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-blue-600 transition-all" />
              </div>
            </div>

            {["Clothing", "Shoes", "Sportswear"].includes(form.category) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-100 pt-6 mt-6">
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
                  <div className="relative">
                    <input 
                      type="text" 
                      value={sizeInput} 
                      onChange={e => setSizeInput(e.target.value)} 
                      onKeyDown={handleAddSize}
                      placeholder="Type size (e.g. XL, 42)" 
                      className="w-full pl-5 pr-14 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-blue-600 transition-all" 
                    />
                    <button 
                      type="button" 
                      onClick={addSize}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 text-white p-2 rounded-lg hover:bg-slate-900 transition-colors"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2 block">Available Colors</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {form.color_options.map(color => (
                      <span key={color} className="bg-blue-100 text-blue-900 border border-blue-200 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2">
                        {color}
                        <button type="button" onClick={() => removeColor(color)} className="hover:text-red-400"><X size={12} /></button>
                      </span>
                    ))}
                  </div>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={colorInput} 
                      onChange={e => setColorInput(e.target.value)} 
                      onKeyDown={handleAddColor}
                      placeholder="Type color (e.g. Red)" 
                      className="w-full pl-5 pr-14 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-blue-600 transition-all" 
                    />
                    <button 
                      type="button" 
                      onClick={addColor}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 text-white p-2 rounded-lg hover:bg-slate-900 transition-colors"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 pb-12">
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase text-[11px] tracking-[0.4em] hover:bg-black transition-all shadow-2xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {submitting ? (
                <><Loader2 size={18} className="animate-spin" /> Uploading & Processing...</>
              ) : (
                <><PackageCheck size={18} /> Publish Product</>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

const Sparkles = ({ size, className }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
    <path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>
  </svg>
);

export default function ProductUploadPage() {
  return (
    <React.Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-blue-600" />
      </div>
    }>
      <UploadContent />
    </React.Suspense>
  );
}
