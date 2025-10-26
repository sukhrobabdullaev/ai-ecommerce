import { Product, Category } from "../types";

const API_BASE = process.env.API_URL || "http://localhost:8000";

// API Response Types
interface ProductListResponse {
  products: Product[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

interface CategoryListResponse {
  categories: Category[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

interface ApiError {
  detail: string;
}

class ServerAPI {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE}${endpoint}`;

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const error: ApiError = await response.json();
        throw new Error(error.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Network error occurred");
    }
  }

  // Product methods
  async getProducts(
    params: {
      page?: number;
      page_size?: number;
      limit?: number;
      skip?: number;
      category_id?: string;
      search?: string;
      min_price?: number;
      max_price?: number;
      brand?: string;
      in_stock_only?: boolean;
    } = {},
  ): Promise<ProductListResponse> {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/products/?${queryString}` : "/products/";

    return this.request<ProductListResponse>(endpoint);
  }

  async getProduct(productId: string): Promise<Product> {
    return this.request<Product>(`/products/${productId}`);
  }

  async searchProducts(
    searchTerm: string,
    params: {
      page?: number;
      page_size?: number;
    } = {},
  ): Promise<ProductListResponse> {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/products/search/${searchTerm}?${queryString}` : `/products/search/${searchTerm}`;

    return this.request<ProductListResponse>(endpoint);
  }

  // Category methods
  async getCategories(
    params: {
      page?: number;
      page_size?: number;
      parent_id?: string;
      search?: string;
      active_only?: boolean;
    } = {},
  ): Promise<CategoryListResponse> {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/categories/?${queryString}` : "/categories/";

    return this.request<CategoryListResponse>(endpoint);
  }
}

export const serverAPI = new ServerAPI();
