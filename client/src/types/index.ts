export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image?: string;
  images: string[];
  category: string;
  brand: string;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  stockCount: number;
  tags: string[];
  features: string[];
  specifications: Record<string, string>;
  aiRecommendation?: {
    reason: string;
    confidence: number;
  };
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedVariant?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  preferences: {
    categories: string[];
    priceRange: [number, number];
    brands: string[];
  };
}

export interface SearchFilters {
  query: string;
  category?: string;
  priceRange: [number, number];
  brand?: string;
  rating?: number;
  inStock?: boolean;
  sortBy: "relevance" | "price-low" | "price-high" | "rating" | "newest";
}

export interface VoiceSearchState {
  isListening: boolean;
  transcript: string;
  isProcessing: boolean;
}

export interface AIRecommendation {
  productId: string;
  reason: string;
  confidence: number;
  context: string;
}
