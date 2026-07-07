"use client";
import React, { useState, useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import Navbar from "@/components/Navbar";
import {
  trackProductView,
  fetchProductReviews,
  fetchProductQuestions,
  postReview,
  postQuestion,
  checkCanReview
} from "@/lib/api";
import type { Review, ProductQuestion } from "@/types";
import {
  Star,
  ShieldCheck,
  Truck,
  RotateCcw,
  Users,
  Store,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  ThumbsUp,
  AlertCircle
} from "lucide-react";

export default function InspectionWindow() {
  const { id } = useParams();
  const router = useRouter();
  const { products, cart, setCart, isAuthenticated, user } = useStore();
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [currentImageIdx, setCurrentImageIdx] = useState(0);

  // Reviews & QA State
  const [reviews, setReviews] = useState<Review[]>([]);
  const [questions, setQuestions] = useState<ProductQuestion[]>([]);
  const [canReview, setCanReview] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "reviews" | "qa">("details");
  
  // Forms
  const [reviewForm, setReviewForm] = useState({ rating: 0, body: "" });
  const [hoverRating, setHoverRating] = useState(0);
  const [questionText, setQuestionText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const product = useMemo(() => {
    return products.find((p: any) => String(p.id) === String(id));
  }, [id, products]);

  // All images logic
  const allImages = useMemo(() => {
    if (!product) return [];
    let imgs = [];
    if (product.image_url) imgs.push(product.image_url);
    if (product.images && product.images.length > 0) {
      // Add other images, excluding the primary if it's already added
      const others = product.images
        .filter((img: any) => (img.url || img.image_url) !== product.image_url)
        .map((img: any) => img.url || img.image_url);
      imgs = [...imgs, ...others];
    }
    // Fallback
    if (imgs.length === 0) imgs.push("/placeholder.png");
    return imgs;
  }, [product]);

  // Dynamic Sizes logic
  const availableSizes = useMemo(() => {
    if (!product) return [];
    if (product.size_options) {
      try {
        return typeof product.size_options === "string" ? JSON.parse(product.size_options) : product.size_options;
      } catch (e) {
        return [];
      }
    }
    return [];
  }, [product]);

  // Dynamic Colors logic
  const availableColors = useMemo(() => {
    if (!product) return [];
    if (product.color_options) {
      try {
        return typeof product.color_options === "string" ? JSON.parse(product.color_options) : product.color_options;
      } catch (e) {
        return [];
      }
    }
    return [];
  }, [product]);

  useEffect(() => {
    if (availableSizes.length > 0 && !selectedSize) {
      setSelectedSize(availableSizes[0]);
    }
    if (availableColors.length > 0 && !selectedColor) {
      setSelectedColor(availableColors[0]);
    }
  }, [availableSizes, availableColors]);

  useEffect(() => {
    if (product) {
      trackProductView(product.id);
      loadReviewsAndQA();
    }
  }, [product]);

  const loadReviewsAndQA = async () => {
    if (!product) return;
    try {
      const [revs, qas] = await Promise.all([
        fetchProductReviews(product.id),
        fetchProductQuestions(product.id)
      ]);
      setReviews(revs);
      setQuestions(qas);
      if (isAuthenticated) {
        const can = await checkCanReview(product.id);
        setCanReview(can);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePostReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewForm.body.trim() || reviewForm.rating === 0) return;
    setSubmitting(true);
    try {
      const newRev = await postReview(product.id, reviewForm);
      setReviews([newRev, ...reviews]);
      setCanReview(false);
      setReviewForm({ rating: 0, body: "" });
      setHoverRating(0);
    } catch (err: any) {
      alert(err?.response?.data?.detail || "Failed to post review");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePostQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) return;
    setSubmitting(true);
    try {
      const newQ = await postQuestion(product.id, questionText);
      setQuestions([newQ, ...questions]);
      setQuestionText("");
    } catch (err: any) {
      alert(err?.response?.data?.detail || "Failed to post question");
    } finally {
      setSubmitting(false);
    }
  };

  if (!product)
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center text-white font-black uppercase tracking-[0.5em]">
        <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        Syncing Archive...
      </div>
    );

  const nextImage = () => setCurrentImageIdx((i) => (i + 1) % allImages.length);
  const prevImage = () => setCurrentImageIdx((i) => (i - 1 + allImages.length) % allImages.length);

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <Navbar />

      <div className="flex flex-col lg:flex-row pt-20">
        {/* Left Side: Image Gallery Section */}
        <section className="lg:w-3/5 h-[70vh] lg:h-[calc(100vh-80px)] bg-slate-50 relative overflow-hidden group flex flex-col">
          <div className="flex-1 relative w-full h-full overflow-hidden">
            <img
              src={allImages[currentImageIdx]}
              className="w-full h-full object-contain p-4 transition-all duration-500"
              alt={product.name}
            />
            
            {allImages.length > 1 && (
              <>
                <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/80 backdrop-blur-md rounded-full shadow-xl flex items-center justify-center text-slate-900 hover:bg-white hover:scale-110 transition-all opacity-0 group-hover:opacity-100 z-10">
                  <ChevronLeft size={24} />
                </button>
                <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/80 backdrop-blur-md rounded-full shadow-xl flex items-center justify-center text-slate-900 hover:bg-white hover:scale-110 transition-all opacity-0 group-hover:opacity-100 z-10">
                  <ChevronRight size={24} />
                </button>
              </>
            )}

            <div className="absolute top-6 left-6 flex flex-col gap-2 z-20">
              <div className="bg-black/80 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.4em] flex items-center gap-2 shadow-xl w-fit">
                <ShieldCheck size={14} className="text-blue-400" /> Verified
              </div>
              {product.is_on_sale && product.sale_percentage > 0 && (
                <div className="bg-red-600 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.4em] shadow-xl w-fit">
                  {product.sale_percentage}% OFF
                </div>
              )}
            </div>
          </div>
          
          {/* Thumbnails */}
          {allImages.length > 1 && (
            <div className="h-24 bg-white border-t border-slate-200 p-2 flex gap-2 overflow-x-auto no-scrollbar justify-center">
              {allImages.map((url: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImageIdx(idx)}
                  className={`relative h-full aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                    idx === currentImageIdx ? "border-blue-600 scale-95" : "border-transparent hover:border-slate-300 opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={url} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Right Side: Product Details & Interaction */}
        <section className="lg:w-2/5 flex flex-col bg-white lg:h-[calc(100vh-80px)]">
          {/* Tabs Navigation */}
          <div className="flex border-b border-slate-100 bg-slate-50 px-8 pt-4 gap-6 sticky top-0 z-10">
            {["details", "reviews", "qa"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`pb-4 text-xs font-black uppercase tracking-widest border-b-2 transition-colors ${
                  activeTab === tab ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-900"
                }`}
              >
                {tab === "qa" ? "Q&A" : tab}
                {tab === "reviews" && <span className="ml-2 bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded text-[9px]">{reviews.length}</span>}
                {tab === "qa" && <span className="ml-2 bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded text-[9px]">{questions.length}</span>}
              </button>
            ))}
          </div>

          <div className="flex-grow overflow-y-auto no-scrollbar p-8 lg:p-12">
            
            {/* DETAILS TAB */}
            {activeTab === "details" && (
              <div className="animate-in fade-in duration-300">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className="bg-slate-100 text-slate-900 px-3 py-1 rounded text-[9px] font-black uppercase tracking-widest border border-slate-200 inline-block mb-3">
                      {product.category} {product.sub_category ? ` / ${product.sub_category}` : ''}
                    </span>
                    {product.store && (
                      <Link href={`/store/${product.store.id}`} className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors mb-2">
                        <Store size={14} /> <span className="text-xs font-bold uppercase tracking-widest">{product.store.name}</span>
                      </Link>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-blue-600 font-black text-sm bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
                    <Star size={16} fill="currentColor" /> {product.rating || "New"}
                  </div>
                </div>

                <h1 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter mb-4 leading-none text-slate-900">
                  {product.name}
                </h1>

                <div className="flex flex-col mb-6">
                  {product.is_on_sale && product.sale_percentage > 0 ? (
                    <div className="flex items-baseline gap-4">
                      <span className="text-3xl font-black text-red-600 italic">
                        Rs {(product.price * (1 - product.sale_percentage / 100)).toLocaleString()}
                      </span>
                      <span className="text-sm font-bold text-slate-400 line-through">
                        Rs {product.price.toLocaleString()}
                      </span>
                    </div>
                  ) : (
                    <span className="text-3xl font-black text-slate-900 italic">
                      Rs {product.price.toLocaleString()}
                    </span>
                  )}
                  {product.is_negotiable && (
                    <span className="text-blue-600 text-[10px] font-black uppercase tracking-widest mt-2 flex items-center gap-1">
                      <MessageSquare size={12} /> AI Price Negotiation Enabled
                    </span>
                  )}
                </div>

                {/* AI Tags */}
                <div className="flex flex-wrap gap-2 mb-8">
                  {product.color && <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">{product.color}</span>}
                  {product.season && <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">{product.season}</span>}
                  {product.gender && <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">{product.gender}</span>}
                  {product.material && <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">{product.material}</span>}
                  {product.style && <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">{product.style}</span>}
                </div>

                {/* Description Section */}
                <div className="space-y-4 mb-10">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 border-b pb-2">
                    Product Details
                  </h3>
                  <p className="text-slate-800 text-sm font-bold italic">"{product.description}"</p>
                  <p className="text-slate-600 text-sm font-medium leading-relaxed whitespace-pre-line">
                    {product.detailed_description}
                  </p>
                </div>

                {/* Size Selector */}
                {availableSizes.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4 flex justify-between">
                      <span>Select Size</span>
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {availableSizes.map((s: string) => (
                        <button
                          key={s}
                          onClick={() => setSelectedSize(s)}
                          className={`min-w-[3.5rem] px-4 py-3 rounded-xl font-black text-xs border transition-all ${
                            selectedSize === s
                              ? "bg-black text-white shadow-xl scale-105 border-black"
                              : "border-slate-200 text-slate-500 hover:border-slate-900 hover:text-slate-900 bg-slate-50"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Color Selector */}
                {availableColors.length > 0 && (
                  <div className="mb-10">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4 flex justify-between">
                      <span>Select Color</span>
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {availableColors.map((c: string) => (
                        <button
                          key={c}
                          onClick={() => setSelectedColor(c)}
                          className={`min-w-[3.5rem] px-4 py-3 rounded-xl font-black text-xs border transition-all ${
                            selectedColor === c
                              ? "bg-black text-white shadow-xl scale-105 border-black"
                              : "border-slate-200 text-slate-500 hover:border-slate-900 hover:text-slate-900 bg-slate-50"
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-4 mb-10">
                  <button
                    disabled={
                      product.stock <= 0 || 
                      (availableSizes.length > 0 && !selectedSize) || 
                      (availableColors.length > 0 && !selectedColor)
                    }
                    onClick={() =>
                      setCart((prev: any) => {
                        const itemKey = `${product.id}-${selectedSize || ''}-${selectedColor || ''}`;
                        const existingItem = prev.find((item: any) => `${item.id}-${item.selected_size || ''}-${item.selected_color || ''}` === itemKey);
                        if (existingItem) {
                          return prev.map((item: any) =>
                            `${item.id}-${item.selected_size || ''}-${item.selected_color || ''}` === itemKey
                              ? { ...item, quantity: (item.quantity || 1) + 1 }
                              : item,
                          );
                        }
                        return [...prev, { ...product, selected_size: selectedSize || undefined, selected_color: selectedColor || undefined, quantity: 1 }];
                      })
                    }
                    className={`w-full py-6 rounded-2xl font-black uppercase text-[11px] tracking-[0.4em] transition-all shadow-xl flex items-center justify-center gap-3 ${
                      product.stock > 0 && (!availableSizes.length || selectedSize) && (!availableColors.length || selectedColor)
                      ? "bg-blue-600 text-white hover:bg-black active:scale-[0.98]" 
                      : "bg-slate-100 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    <ShoppingCart size={18} /> {product.stock > 0 ? "Add to Cart" : "Out of Stock"}
                  </button>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Users size={16} className="text-slate-400" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                        {product.view_count > 10 ? `${Math.floor(product.view_count / 2)} people viewed recently` : "Trending item"}
                      </span>
                    </div>
                    <span
                      className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded ${product.stock < 5 ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"}`}
                    >
                      {product.stock} Left
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-100">
                  <div className="flex flex-col items-center text-center gap-2">
                    <Truck size={16} className="text-slate-400" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 font-sans">
                      Fast Delivery
                    </span>
                  </div>
                  <div className="flex flex-col items-center text-center gap-2 border-x border-slate-100">
                    <RotateCcw size={16} className="text-slate-400" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">
                      30 Day Return
                    </span>
                  </div>
                  <div className="flex flex-col items-center text-center gap-2">
                    <ShieldCheck size={16} className="text-slate-400" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">
                      Secure Checkout
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* REVIEWS TAB */}
            {activeTab === "reviews" && (
              <div className="animate-in fade-in duration-300">
                {canReview && (
                  <div className="mb-10 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                    <h3 className="font-black text-sm uppercase tracking-tight mb-4">Write a Review</h3>
                    <form onSubmit={handlePostReview} className="space-y-4">
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Rating</label>
                        <div className="flex gap-2">
                          {[1,2,3,4,5].map(star => (
                            <button 
                              key={star} 
                              type="button" 
                              onClick={() => setReviewForm(prev => ({...prev, rating: star}))}
                              onMouseEnter={() => setHoverRating(star)}
                              onMouseLeave={() => setHoverRating(0)}
                              className="focus:outline-none transition-transform hover:scale-110"
                            >
                              <Star 
                                size={24} 
                                className={(hoverRating || reviewForm.rating) >= star ? "text-yellow-400 fill-yellow-400" : "text-slate-200"} 
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <textarea 
                          required
                          value={reviewForm.body}
                          onChange={e => setReviewForm(prev => ({...prev, body: e.target.value}))}
                          placeholder="What did you like or dislike? How did it fit?"
                          className="w-full bg-white border border-slate-200 rounded-xl p-4 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                          rows={3}
                        />
                      </div>
                      <button 
                        type="submit" 
                        disabled={submitting || reviewForm.rating === 0}
                        className="bg-slate-900 text-white px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-blue-600 transition-colors disabled:opacity-50"
                      >
                        {submitting ? "Posting..." : "Submit Review"}
                      </button>
                    </form>
                  </div>
                )}

                <div className="space-y-6">
                  {reviews.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                      <Star size={32} className="mx-auto mb-3 opacity-20" />
                      <p className="text-xs font-bold uppercase tracking-widest">No reviews yet</p>
                    </div>
                  ) : (
                    reviews.map(review => (
                      <div key={review.id} className="border-b border-slate-100 pb-6 last:border-0">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-black text-sm text-slate-900">{review.user_name}</p>
                            <p className="text-[10px] font-bold text-slate-400">{new Date(review.created_at).toLocaleDateString()}</p>
                          </div>
                          <div className="flex gap-0.5 text-yellow-400">
                            {[1,2,3,4,5].map(s => (
                              <Star key={s} size={12} fill={s <= review.rating ? "currentColor" : "transparent"} className={s <= review.rating ? "" : "text-slate-200"} />
                            ))}
                          </div>
                        </div>
                        <div className="text-sm text-slate-600 mt-2">
                          {review.is_deleted ? (
                            <span className="italic text-slate-400">This comment was hidden by the seller.</span>
                          ) : (
                            review.body
                          )}
                        </div>
                        {review.reply && (
                          <div className="mt-3 bg-blue-50 border-l-2 border-blue-600 p-3 rounded-r-xl">
                            <p className="text-[10px] font-black uppercase tracking-widest text-blue-800 mb-1">Seller Response</p>
                            <p className="text-xs text-slate-700 italic">"{review.reply}"</p>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Q&A TAB */}
            {activeTab === "qa" && (
              <div className="animate-in fade-in duration-300">
                <div className="mb-10 bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
                  <h3 className="font-black text-sm uppercase tracking-tight mb-2 text-blue-900">Ask the Seller</h3>
                  <p className="text-xs text-blue-700/70 mb-4">Have a question about material, fit, or details? Ask here!</p>
                  <form onSubmit={handlePostQuestion}>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        required
                        value={questionText}
                        onChange={e => setQuestionText(e.target.value)}
                        placeholder="e.g., Is this true to size?"
                        className="flex-1 bg-white border border-blue-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        disabled={!isAuthenticated}
                      />
                      <button 
                        type="submit" 
                        disabled={submitting || !isAuthenticated}
                        className="bg-blue-600 text-white px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-blue-700 transition-colors disabled:opacity-50 whitespace-nowrap"
                      >
                        {submitting ? "Sending" : "Ask"}
                      </button>
                    </div>
                    {!isAuthenticated && (
                      <p className="text-[10px] text-red-500 font-bold mt-2">You must sign in to ask questions.</p>
                    )}
                  </form>
                </div>

                <div className="space-y-6">
                  {questions.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                      <MessageSquare size={32} className="mx-auto mb-3 opacity-20" />
                      <p className="text-xs font-bold uppercase tracking-widest">No questions yet</p>
                    </div>
                  ) : (
                    questions.map(q => (
                      <div key={q.id} className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                        <div className="flex gap-3 mb-3">
                          <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-black text-slate-500 shrink-0">Q</div>
                          <div>
                            <p className="font-medium text-sm text-slate-900">{q.question}</p>
                            <p className="text-[10px] font-bold text-slate-400 mt-1">{q.user_name} • {new Date(q.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        {q.answer ? (
                          <div className="flex gap-3 ml-4 pl-4 border-l-2 border-blue-100">
                            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-black text-blue-600 shrink-0">A</div>
                            <div>
                              <p className="font-medium text-sm text-slate-800">{q.answer}</p>
                              {product.store && <p className="text-[10px] font-bold text-blue-600 mt-1">{product.store.name} Seller</p>}
                            </div>
                          </div>
                        ) : (
                          <div className="ml-4 pl-4 border-l-2 border-slate-100">
                            <p className="text-xs text-slate-400 italic">Seller hasn't answered yet.</p>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
            
          </div>
        </section>
      </div>
    </main>
  );
}

// Inline ShoppingCart icon since it was missed from imports above
const ShoppingCart = ({ size, className }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/>
    <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
  </svg>
);
