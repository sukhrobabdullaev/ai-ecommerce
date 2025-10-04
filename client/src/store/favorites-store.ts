import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Product, WishlistItem } from "@/types";

interface FavoritesStore {
  items: WishlistItem[];

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
          if (state.items.find(item => item.product.id === product.id)) {
            return state;
          }

          const wishlistItem: WishlistItem = {
            id: `wishlist_${product.id}_${Date.now()}`,
            product,
            addedAt: new Date(),
          };

          return {
            items: [...state.items, wishlistItem],
          };
        });
      },

      removeFromFavorites: (productId: string) => {
        set(state => ({
          items: state.items.filter(item => item.product.id !== productId),
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
        return get().items.some(item => item.product.id === productId);
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
