export interface Product {
  id: number;
  name: string;
  price: number;
  min_price: number;
  description: string | null;
  detailed_description: string | null;
  category: string | null;
  sub_category: string | null;
  color: string | null;
  gender: string | null;
  season: string | null;
  image_url: string | null;
  stock: number;
  rating: number;
  reviews_count: number;
  // Seller / Store fields
  store_id?: number | null;
  collection_id?: number | null;
  is_on_sale?: boolean;
  sale_percentage?: number;
  is_negotiable?: boolean;
  view_count?: number;
  purchase_count?: number;
  material?: string | null;
  style?: string | null;
  occasion?: string | null;
  size_options?: string | null;
  images?: ProductImage[];
  store?: { id: number; name: string } | null;
}

export interface ProductImage {
  id: number;
  image_url: string;
  is_primary: boolean;
  sort_order: number;
}

export interface CartItem extends Product {
  quantity: number;
  out_of_stock?: boolean;
  insufficient_stock?: boolean;
}

export interface User {
  id: number;
  name: string;
  email: string;
  address?: string;
  phone_number?: string;
  role?: string;
  has_store?: boolean;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface OrderItem {
  id: number;
  quantity: number;
}

export interface OrderRequest {
  items: OrderItem[];
  city?: string;
  province?: string;
}

export interface ChatResponse {
  text: string;
  action: string;
  debug_model: string;
}

// ── Store & Seller ──────────────────────────────────────────────────────────

export interface Store {
  id: number;
  owner_id: number;
  name: string;
  address: string;
  phone: string;
  description?: string | null;
  logo_url?: string | null;
  categories: string[];
  is_active: boolean;
  collections?: Collection[];
}

export interface Collection {
  id: number;
  store_id: number;
  name: string;
  description?: string | null;
  icon?: string;
  product_count: number;
}

export interface Review {
  id: number;
  product_id: number;
  user_id: number;
  user_name: string;
  rating: number;
  title?: string | null;
  body: string;
  reply?: string | null;
  is_deleted?: boolean;
  created_at: string;
}

export interface ProductQuestion {
  id: number;
  product_id: number;
  user_id: number;
  user_name: string;
  question: string;
  answer?: string | null;
  answered_at?: string | null;
  created_at: string;
}

export interface SellerProduct {
  id: number;
  name: string;
  price: number;
  min_price: number;
  image_url: string | null;
  stock: number;
  is_on_sale: boolean;
  sale_percentage: number;
  is_negotiable: boolean;
  category: string | null;
  collection_id: number | null;
  collection_name: string | null;
  images: { id: number; url: string; is_primary: boolean }[];
  view_count: number;
  purchase_count: number;
  rating: number;
  reviews_count: number;
}

export interface SellerNotification {
  id: number;
  product_id: number;
  product_name: string;
  user_name: string;
  question: string;
  created_at: string;
}
