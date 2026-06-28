import axios from "axios";
import type {
  Product,
  OrderRequest,
  ChatResponse,
  User,
  AuthResponse,
  CartItem,
} from "@/types";

const API_BASE_URL = "http://localhost:8000";
const TOKEN_KEY = "hdwear_token";
const GUEST_CART_KEY = "hdwear_guest_cart";
const STORED_USER_KEY = "hdwear_user";
const STORED_CART_KEY = "hdwear_server_cart";

const api = axios.create({ baseURL: API_BASE_URL });

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
): Promise<ChatResponse> {
  const res = await api.post<ChatResponse>("/ai/chat", {
    user_message: message,
    history,
    user_name: userName || null,
  });
  return res.data;
}
