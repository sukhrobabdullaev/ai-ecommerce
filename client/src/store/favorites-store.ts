import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Product } from "@/types";

interface FavoritesStore {
  items: Product[];

  // Actions
  addToFavorites: (product: Product) => void;
  removeFromFavorites: (productId: string) => void;
  toggleFavorite: (product: Product) => void;
  clearFavorites: () => void;

  // Computed
  isFavorite: (productId: string) => boolean;
  getFavoriteCount: () => number;
}

export const useFavoritesStore = create<FavoritesStore>()(
  persist(
    (set, get) => ({
      items: [],

      addToFavorites: (product: Product) => {
        set(state => {
          if (state.items.find(item => item.id === product.id)) {
            return state;
          }
          return {
            items: [...state.items, product],
          };
        });
      },

      removeFromFavorites: (productId: string) => {
        set(state => ({
          items: state.items.filter(item => item.id !== productId),
        }));
      },

      toggleFavorite: (product: Product) => {
        const isCurrentlyFavorite = get().isFavorite(product.id);
        if (isCurrentlyFavorite) {
          get().removeFromFavorites(product.id);
        } else {
          get().addToFavorites(product);
        }
      },

      clearFavorites: () => {
        set({ items: [] });
      },

      isFavorite: (productId: string) => {
        return get().items.some(item => item.id === productId);
      },

      getFavoriteCount: () => {
        return get().items.length;
      },
    }),
    {
      name: "favorites-storage",
      partialize: state => ({ items: state.items }),
    },
  ),
);
