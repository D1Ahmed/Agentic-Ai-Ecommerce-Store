"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import Navbar from "@/components/Navbar";
import {
  fetchProductReviews,
  fetchProductQuestions,
  replyReview,
  deleteReviewComment,
  answerQuestion,
  deleteQuestion,
  toggleProductSale,
} from "@/lib/api";
import { ArrowLeft, Trash2, CornerDownRight, MessageSquare, Star, Package, Edit, Tag } from "lucide-react";
import type { Review, ProductQuestion } from "@/types";

export default function ProductManagePage() {
  const { isAuthenticated, isAuthLoading, products, fetchProducts } = useStore();
  const router = useRouter();
  const { id } = useParams();
  const productId = Number(id);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [questions, setQuestions] = useState<ProductQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  // States for answering/replying
  const [replyText, setReplyText] = useState<{ [key: number]: string }>({});
  const [answerText, setAnswerText] = useState<{ [key: number]: string }>({});
  const [submittingReviewId, setSubmittingReviewId] = useState<number | null>(null);
  const [submittingQuestionId, setSubmittingQuestionId] = useState<number | null>(null);

  const product = products.find((p: any) => String(p.id) === String(productId));

  const loadData = async () => {
    if (isNaN(productId)) return;
    setLoading(true);
    try {
      const [revs, qas] = await Promise.all([
        fetchProductReviews(productId),
        fetchProductQuestions(productId),
      ]);
      setReviews(revs);
      setQuestions(qas);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSale = async () => {
    if (!product) return;
    try {
      if (product.is_on_sale) {
        await toggleProductSale(product.id, false, 0);
        await fetchProducts();
      } else {
        const pct = prompt("Enter sale percentage (e.g. 20):");
        if (!pct) return;
        const num = Number(pct);
        if (isNaN(num) || num <= 0 || num > 100) return alert("Invalid percentage");
        await toggleProductSale(product.id, true, num);
        await fetchProducts();
      }
    } catch (err) {
      alert("Failed to toggle sale");
    }
  };

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push("/auth/signin");
      return;
    }

    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, isAuthLoading, router, productId]);

  const handleReplyReview = async (reviewId: number) => {
    const text = replyText[reviewId];
    if (!text?.trim()) return;
    setSubmittingReviewId(reviewId);
    try {
      await replyReview(reviewId, text);
      setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, reply: text } : r));
      setReplyText(prev => ({ ...prev, [reviewId]: "" }));
    } catch (err: any) {
      alert(err?.response?.data?.detail || "Failed to reply");
    } finally {
      setSubmittingReviewId(null);
    }
  };

  const handleDeleteReview = async (reviewId: number) => {
    if (!confirm("Are you sure you want to hide this comment? The rating will remain.")) return;
    try {
      await deleteReviewComment(reviewId);
      setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, is_deleted: true, body: "", reply: null } : r));
    } catch (err: any) {
      alert("Failed to delete review comment");
    }
  };

  const handleAnswerQuestion = async (questionId: number) => {
    const text = answerText[questionId];
    if (!text?.trim()) return;
    setSubmittingQuestionId(questionId);
    try {
      await answerQuestion(questionId, text);
      setQuestions(prev => prev.map(q => q.id === questionId ? { ...q, answer: text } : q));
      setAnswerText(prev => ({ ...prev, [questionId]: "" }));
    } catch (err: any) {
      alert(err?.response?.data?.detail || "Failed to answer");
    } finally {
      setSubmittingQuestionId(null);
    }
  };

  const handleDeleteQuestion = async (questionId: number) => {
    if (!confirm("Are you sure you want to delete this question?")) return;
    try {
      await deleteQuestion(questionId);
      setQuestions(prev => prev.filter(q => q.id !== questionId));
    } catch (err: any) {
      alert("Failed to delete question");
    }
  };

  if (isAuthLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="pt-32 px-6 flex justify-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <Navbar />

      <div className="pt-32 px-6 md:px-10 max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/seller/dashboard"
            className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900">
              Manage Interactions
            </h1>
            <p className="text-sm font-bold text-slate-500 mt-1">
              {product?.name || "Product"}
            </p>
          </div>
        </div>

        {product && (
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm mb-8 flex flex-col md:flex-row gap-6 md:gap-8 items-start">
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} className="w-32 h-32 md:w-48 md:h-48 object-cover rounded-2xl bg-slate-100" />
            ) : (
              <div className="w-32 h-32 md:w-48 md:h-48 rounded-2xl bg-slate-100 flex items-center justify-center">
                <Package size={48} className="text-slate-300" />
              </div>
            )}
            <div className="flex-1">
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-200">
                  {product.category}
                </span>
                {product.is_on_sale && (
                  <span className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-red-100">
                    {product.sale_percentage}% OFF
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 mb-2">{product.name}</h2>
              <p className="text-sm text-slate-500 mb-6 max-w-2xl line-clamp-3">{product.description}</p>
              
              <div className="flex flex-wrap gap-6 text-sm mb-6">
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Price</span>
                  <span className="font-black text-slate-900">Rs {product.price.toLocaleString()}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Stock Available</span>
                  <span className={`font-black ${product.stock <= 5 ? "text-orange-500" : "text-slate-900"}`}>
                    {product.stock} Units
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/seller/products/edit/${product.id}`}
                  className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors"
                >
                  <Edit size={14} /> Edit Details
                </Link>
                <button
                  onClick={handleToggleSale}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors ${
                    product.is_on_sale 
                      ? "bg-red-100 hover:bg-red-200 text-red-700" 
                      : "bg-blue-100 hover:bg-blue-200 text-blue-700"
                  }`}
                >
                  <Tag size={14} /> {product.is_on_sale ? "Remove Sale" : "Put on Sale"}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Reviews Section */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
              <Star className="text-yellow-400" size={24} />
              <h2 className="text-xl font-black uppercase tracking-widest text-slate-900">
                Customer Reviews
              </h2>
            </div>
            
            <div className="space-y-6">
              {reviews.length === 0 ? (
                <p className="text-sm text-slate-400 italic">No reviews yet.</p>
              ) : (
                reviews.map(review => (
                  <div key={review.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-black text-sm text-slate-900">{review.user_name}</p>
                        <p className="text-[10px] font-bold text-slate-400">Rating: {review.rating}/5</p>
                      </div>
                      {!review.is_deleted && (
                        <button
                          onClick={() => handleDeleteReview(review.id)}
                          className="text-slate-400 hover:text-red-500 transition-colors"
                          title="Hide this comment"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                    
                    <div className="text-sm text-slate-600 mt-2 mb-4">
                      {review.is_deleted ? (
                        <span className="italic text-slate-400">Comment hidden by you.</span>
                      ) : (
                        review.body
                      )}
                    </div>

                    {!review.is_deleted && !review.reply && (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={replyText[review.id] || ""}
                          onChange={(e) => setReplyText(prev => ({ ...prev, [review.id]: e.target.value }))}
                          placeholder="Reply to this review..."
                          className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-blue-500"
                        />
                        <button
                          onClick={() => handleReplyReview(review.id)}
                          disabled={!replyText[review.id]?.trim() || submittingReviewId === review.id}
                          className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-900 transition-colors disabled:opacity-50"
                        >
                          {submittingReviewId === review.id ? "Replying..." : "Reply"}
                        </button>
                      </div>
                    )}
                    
                    {review.reply && (
                      <div className="mt-3 flex gap-2 text-sm text-slate-700 bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                        <CornerDownRight size={16} className="text-blue-400 shrink-0" />
                        <div>
                          <span className="font-bold text-blue-900 text-xs block mb-1">Your Reply</span>
                          {review.reply}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Q&A Section */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
              <MessageSquare className="text-blue-500" size={24} />
              <h2 className="text-xl font-black uppercase tracking-widest text-slate-900">
                Customer Q&A
              </h2>
            </div>

            <div className="space-y-6">
              {questions.length === 0 ? (
                <p className="text-sm text-slate-400 italic">No questions yet.</p>
              ) : (
                questions.map(question => (
                  <div key={question.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-black text-sm text-slate-900">{question.user_name}</p>
                        <p className="text-[10px] font-bold text-slate-400">Asked on {new Date(question.created_at).toLocaleDateString()}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteQuestion(question.id)}
                        className="text-slate-400 hover:text-red-500 transition-colors"
                        title="Delete question"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="text-sm text-slate-600 mt-2 font-medium mb-4">
                      Q: {question.question}
                    </div>

                    {!question.answer && (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={answerText[question.id] || ""}
                          onChange={(e) => setAnswerText(prev => ({ ...prev, [question.id]: e.target.value }))}
                          placeholder="Answer this question..."
                          className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-blue-500"
                        />
                        <button
                          onClick={() => handleAnswerQuestion(question.id)}
                          disabled={!answerText[question.id]?.trim() || submittingQuestionId === question.id}
                          className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-900 transition-colors disabled:opacity-50"
                        >
                          {submittingQuestionId === question.id ? "Answering..." : "Answer"}
                        </button>
                      </div>
                    )}

                    {question.answer && (
                      <div className="mt-3 flex gap-2 text-sm text-slate-700 bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                        <CornerDownRight size={16} className="text-blue-400 shrink-0" />
                        <div>
                          <span className="font-bold text-blue-900 text-xs block mb-1">Your Answer</span>
                          {question.answer}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
