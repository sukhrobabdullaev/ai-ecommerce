import { create } from "zustand";
import { Product } from "@/types";
import { productAPI } from "@/services/product-api";

interface ProductStore {
  // State
  products: Product[];
  currentProduct: Product | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  filters: {
    category_id?: string;
    search?: string;
    min_price?: number;
    max_price?: number;
    brand?: string;
    in_stock_only?: boolean;
  };

  // Actions
  fetchProducts: (params?: {
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
  }) => Promise<void>;

  fetchProduct: (productId: string) => Promise<void>;

  searchProducts: (
    searchTerm: string,
    params?: {
      page?: number;
      page_size?: number;
    },
  ) => Promise<void>;

  fetchProductsByCategory: (
    categoryId: string,
    params?: {
      page?: number;
      page_size?: number;
    },
  ) => Promise<void>;

  setFilters: (filters: Partial<ProductStore["filters"]>) => void;
  clearFilters: () => void;

  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useProductStore = create<ProductStore>((set, get) => ({
  // Initial state
  products: [],
  currentProduct: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  },
  filters: {},

  // Actions
  fetchProducts: async (params = {}) => {
    set({ isLoading: true, error: null });

    try {
      const response = await productAPI.getProducts(params);

      set({
        products: response.products,
        pagination: {
          page: response.page,
          pageSize: response.page_size,
          total: response.total,
          totalPages: response.total_pages,
        },
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to fetch products",
        isLoading: false,
      });
    }
  },

  fetchProduct: async (productId: string) => {
    set({ isLoading: true, error: null });

    try {
      const product = await productAPI.getProduct(productId);

      set({
        currentProduct: product,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to fetch product",
        isLoading: false,
      });
    }
  },

  searchProducts: async (searchTerm: string, params = {}) => {
    set({ isLoading: true, error: null });

    try {
      const response = await productAPI.searchProducts(searchTerm, params);

      set({
        products: response.products,
        pagination: {
          page: response.page,
          pageSize: response.page_size,
          total: response.total,
          totalPages: response.total_pages,
        },
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to search products",
        isLoading: false,
      });
    }
  },

  fetchProductsByCategory: async (categoryId: string, params = {}) => {
    set({ isLoading: true, error: null });

    try {
      const response = await productAPI.getProductsByCategory(categoryId, params);

      set({
        products: response.products,
        pagination: {
          page: response.page,
          pageSize: response.page_size,
          total: response.total,
          totalPages: response.total_pages,
        },
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to fetch products by category",
        isLoading: false,
      });
    }
  },

  setFilters: newFilters => {
    set(state => ({
      filters: { ...state.filters, ...newFilters },
    }));
  },

  clearFilters: () => {
    set({ filters: {} });
  },

  setLoading: loading => set({ isLoading: loading }),
  setError: error => set({ error }),
}));
