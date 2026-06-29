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
