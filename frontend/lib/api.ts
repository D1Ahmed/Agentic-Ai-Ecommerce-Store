import axios from "axios";
import type {
  Product,
  OrderRequest,
  ChatResponse,
  User,
  AuthResponse,
  CartItem,
  Store,
  Collection,
  Review,
  ProductQuestion,
  SellerProduct,
  SellerNotification,
} from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const TOKEN_KEY = "hdwear_token";
const GUEST_CART_KEY = "hdwear_guest_cart";
const STORED_USER_KEY = "hdwear_user";
const STORED_CART_KEY = "hdwear_server_cart";

export const api = axios.create({ baseURL: API_BASE_URL });

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function getGuestCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function setGuestCart(items: CartItem[]) {
  if (typeof window === "undefined") return;
  if (items.length === 0) localStorage.removeItem(GUEST_CART_KEY);
  else localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
}

// ── Optimistic cached user (avoids auth flash on load) ────────────────────────

export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORED_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: User | null) {
  if (typeof window === "undefined") return;
  if (user) localStorage.setItem(STORED_USER_KEY, JSON.stringify(user));
  else localStorage.removeItem(STORED_USER_KEY);
}

// ── Optimistic cached server cart (avoids cart flash on load) ─────────────────

export function getStoredCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORED_CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function setStoredCart(items: CartItem[]) {
  if (typeof window === "undefined") return;
  if (items.length === 0) localStorage.removeItem(STORED_CART_KEY);
  else localStorage.setItem(STORED_CART_KEY, JSON.stringify(items));
}

// ── Products ──────────────────────────────────────────────────────────────────

export async function fetchProducts(): Promise<Product[]> {
  const res = await api.get<Product[]>("/products");
  return res.data;
}

export async function searchProducts(query: string): Promise<Product[]> {
  if (!query.trim()) return [];
  const res = await api.get<Product[]>("/products/search", {
    params: { q: query },
  });
  return res.data;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function registerUser(data: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>("/auth/register", data);
  return res.data;
}

export async function loginUser(data: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>("/auth/login", data);
  return res.data;
}

export async function logoutUser(): Promise<void> {
  try {
    await api.post("/auth/logout");
  } catch {
    // Token may already be invalid — still clear locally.
  }
}

export async function fetchMe(): Promise<User> {
  const res = await api.get<User>("/auth/me");
  return res.data;
}

export async function googleLoginUser(credential: string): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>("/auth/google", { credential });
  return res.data;
}

export async function updateUserProfile(data: {
  address?: string;
  phone_number?: string;
}): Promise<User> {
  const res = await api.put<User>("/auth/profile", data);
  return res.data;
}

// ── Cart ──────────────────────────────────────────────────────────────────────

export async function fetchCart(): Promise<CartItem[]> {
  const res = await api.get<CartItem[]>("/cart");
  return res.data;
}

export async function syncCart(items: CartItem[]): Promise<CartItem[]> {
  const res = await api.put<CartItem[]>("/cart/sync", {
    items: items.map((item) => ({
      product_id: item.id,
      quantity: item.quantity,
    })),
  });
  return res.data;
}

// ── Orders ────────────────────────────────────────────────────────────────────

export async function placeOrder(order: OrderRequest, partial = false): Promise<void> {
  await api.post(`/orders/place-order${partial ? "?partial=true" : ""}`, order);
}

export async function clearCart(): Promise<void> {
  await api.delete("/cart");
}

// ── AI Chat ───────────────────────────────────────────────────────────────────

export interface ChatHistoryMessage {
  role: "user" | "assistant";
  content: string;
}

export async function sendChatMessage(
  message: string,
  history: ChatHistoryMessage[] = [],
  userName?: string | null,
  currentPath?: string | null,
  hasStore?: boolean,
  isAuthenticated?: boolean
): Promise<ChatResponse> {
  const res = await api.post<ChatResponse>("/ai/chat", {
    user_message: message,
    history,
    user_name: userName || null,
    current_path: currentPath || null,
    has_store: hasStore || false,
    is_authenticated: isAuthenticated || false,
  });
  return res.data;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export async function registerStore(data: {
  name: string;
  address: string;
  phone: string;
  categories: string[];
  description?: string;
}): Promise<Store> {
  const res = await api.post<Store>("/store/register", data);
  return res.data;
}

export async function fetchMyStore(): Promise<Store> {
  const res = await api.get<Store>("/store/me");
  return res.data;
}

export async function fetchPublicStore(storeId: number): Promise<Store> {
  const res = await api.get<Store>(`/store/${storeId}`);
  return res.data;
}

export async function updateMyStore(data: {
  name?: string;
  address?: string;
  phone?: string;
  categories?: string[];
  description?: string;
}): Promise<Store> {
  const res = await api.put<Store>("/store/me", data);
  return res.data;
}

export async function deleteStore(): Promise<void> {
  await api.delete("/store/me");
}

// ── Seller Collections ───────────────────────────────────────────────────────

export async function createCollection(data: {
  name: string;
  description?: string;
}): Promise<Collection> {
  const res = await api.post<Collection>("/seller/collections", data);
  return res.data;
}

export async function fetchMyCollections(): Promise<Collection[]> {
  const res = await api.get<Collection[]>("/seller/collections");
  return res.data;
}

export async function deleteCollection(id: number): Promise<void> {
  await api.delete(`/seller/collections/${id}`);
}

// ── Seller Products ──────────────────────────────────────────────────────────

export async function uploadProduct(formData: FormData): Promise<any> {
  const res = await api.post("/seller/products", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function updateProduct(id: number, data: Record<string, any>): Promise<any> {
  const res = await api.put(`/seller/products/${id}`, data);
  return res.data;
}

export async function deleteProduct(id: number): Promise<void> {
  await api.delete(`/seller/products/${id}`);
}

export async function deleteProductImage(productId: number, imageId: number): Promise<void> {
  await api.delete(`/seller/products/${productId}/images/${imageId}`);
}

export async function addProductImages(productId: number, formData: FormData): Promise<any> {
  const res = await api.post(`/seller/products/${productId}/images`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function toggleProductSale(
  id: number,
  is_on_sale: boolean,
  sale_percentage: number
): Promise<any> {
  const res = await api.put(`/seller/products/${id}/sale`, { is_on_sale, sale_percentage });
  return res.data;
}

export async function fetchMyProducts(collectionId?: number): Promise<SellerProduct[]> {
  const params = collectionId ? { collection_id: collectionId } : {};
  const res = await api.get<SellerProduct[]>("/seller/products", { params });
  return res.data;
}

// ── Reviews & Q&A ────────────────────────────────────────────────────────────

export async function fetchProductReviews(productId: number): Promise<Review[]> {
  const res = await api.get<Review[]>(`/products/${productId}/reviews`);
  return res.data;
}

export async function postReview(
  productId: number,
  data: { rating: number; title?: string; body: string }
): Promise<Review> {
  const res = await api.post<Review>(`/products/${productId}/reviews`, data);
  return res.data;
}

export async function checkCanReview(productId: number): Promise<boolean> {
  try {
    const res = await api.get<{ can_review: boolean }>(`/products/${productId}/can-review`);
    return res.data.can_review;
  } catch {
    return false;
  }
}

export async function fetchProductQuestions(productId: number): Promise<ProductQuestion[]> {
  const res = await api.get<ProductQuestion[]>(`/products/${productId}/questions`);
  return res.data;
}

export async function postQuestion(productId: number, question: string): Promise<ProductQuestion> {
  const res = await api.post<ProductQuestion>(`/products/${productId}/questions`, { question });
  return res.data;
}

export async function answerQuestion(questionId: number, answer: string): Promise<any> {
  const res = await api.put(`/seller/questions/${questionId}/answer`, { answer });
  return res.data;
}

export async function deleteQuestion(questionId: number): Promise<any> {
  const res = await api.delete(`/seller/questions/${questionId}`);
  return res.data;
}

export async function replyReview(reviewId: number, reply: string): Promise<any> {
  const res = await api.post(`/seller/reviews/${reviewId}/reply`, { reply });
  return res.data;
}

export async function deleteReviewComment(reviewId: number): Promise<any> {
  const res = await api.delete(`/seller/reviews/${reviewId}/comment`);
  return res.data;
}

// ── Notifications ────────────────────────────────────────────────────────────

export async function fetchNotifications(): Promise<any[]> {
  const res = await api.get("/notifications");
  return res.data;
}

export async function markNotificationRead(id: number): Promise<any> {
  const res = await api.patch(`/notifications/${id}/read`);
  return res.data;
}

// ── View Tracking ────────────────────────────────────────────────────────────

export async function trackProductView(productId: number): Promise<void> {
  try {
    await api.post(`/products/${productId}/view`);
  } catch {
    // Non-critical
  }
}

// ── Store Subscriptions ───────────────────────────────────────────────────────

export async function subscribeToStore(storeId: number): Promise<any> {
  const res = await api.post(`/store/${storeId}/subscribe`);
  return res.data;
}

export async function unsubscribeFromStore(storeId: number): Promise<any> {
  const res = await api.delete(`/store/${storeId}/unsubscribe`);
  return res.data;
}

export async function checkStoreSubscription(storeId: number): Promise<{ is_subscribed: boolean }> {
  const res = await api.get(`/store/${storeId}/is-subscribed`);
  return res.data;
}
