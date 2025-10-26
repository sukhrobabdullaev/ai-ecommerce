// ====== AUTH TYPES ======
export interface User {
  id: string;
  email: string;
  emailVerifiedAt?: Date;
  name?: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthSession {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

// ====== PRODUCT TYPES (Updated to match backend) ======
export interface Category {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price?: number;
  category_id?: string;
  category?: Category;
  brand?: string;
  images?: string[]; // Array of image URLs
  tags?: string[];
  stock?: number;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

// ====== UI STATE TYPES ======
export interface SearchFilters {
  query: string;
  category_id?: string;
  brand?: string;
  priceRange: [number, number];
  tags?: string[];
  in_stock_only?: boolean;
  rating?: number;
  sortBy: "relevance" | "price-low" | "price-high" | "newest" | "rating";
}

export interface ProductFilters {
  categories: string[];
  brands: string[];
  priceRange: [number, number];
  tags: string[];
  inStock?: boolean;
  dateRange?: [Date, Date];
}

export interface VoiceSearchState {
  isListening: boolean;
  transcript: string;
  isProcessing: boolean;
}

// ====== WISHLIST TYPES ======
export interface WishlistItem {
  id: string;
  product: Product;
  addedAt: Date;
}

// ====== ORDER TYPES ======
export interface Order {
  id: string;
  userId: string;
  orderNumber: string;
  status: OrderStatus;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  shippingAddress: Address;
  billingAddress: Address;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  createdAt: Date;
  updatedAt: Date;
  items: OrderItem[];
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: number; // Price at time of purchase
  createdAt: Date;
  product: Product;
}

export interface Address {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state?: string;
  zipCode: string;
  country: string;
}

export interface CheckoutFormData {
  shippingAddress: Address;
  billingAddress: Address;
  paymentMethod: PaymentMethod;
  useSameAddress: boolean;
}

export interface PaymentMethod {
  type: "card" | "paypal" | "apple_pay" | "google_pay";
  cardNumber?: string;
  expiryDate?: string;
  cvv?: string;
  cardholderName?: string;
}

export interface OrderCalculation {
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
}

export enum OrderStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  PROCESSING = "PROCESSING",
  SHIPPED = "SHIPPED",
  DELIVERED = "DELIVERED",
  CANCELLED = "CANCELLED",
  REFUNDED = "REFUNDED",
}

export enum PaymentStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  REFUNDED = "REFUNDED",
}
