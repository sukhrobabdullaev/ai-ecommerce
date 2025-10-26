import { create } from "zustand";
import { Category } from "@/types";
import { productAPI } from "@/services/product-api";

interface CategoryStore {
  // State
  categories: Category[];
  currentCategory: Category | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };

  // Actions
  fetchCategories: (params?: {
    page?: number;
    page_size?: number;
    parent_id?: string;
    search?: string;
    active_only?: boolean;
  }) => Promise<void>;

  fetchCategory: (categoryId: string) => Promise<void>;

  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useCategoryStore = create<CategoryStore>((set, get) => ({
  // Initial state
  categories: [],
  currentCategory: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  },

  // Actions
  fetchCategories: async (params = {}) => {
    set({ isLoading: true, error: null });

    try {
      const response = await productAPI.getCategories(params);

      set({
        categories: response.categories,
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
        error: error instanceof Error ? error.message : "Failed to fetch categories",
        isLoading: false,
      });
    }
  },

  fetchCategory: async (categoryId: string) => {
    set({ isLoading: true, error: null });

    try {
      const category = await productAPI.getCategory(categoryId);

      set({
        currentCategory: category,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to fetch category",
        isLoading: false,
      });
    }
  },

  setLoading: loading => set({ isLoading: loading }),
  setError: error => set({ error }),
}));
