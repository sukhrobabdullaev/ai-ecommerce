import { create } from "zustand";
import { persist } from "zustand/middleware";

interface RatingsState {
  userRatings: Record<string, number>;
  setRating: (productId: string, rating: number) => void;
  getRating: (productId: string) => number;
  clearRatings: () => void;
}

export const useRatingsStore = create<RatingsState>()(
  persist(
    (set, get) => ({
      userRatings: {},
      setRating: (productId: string, rating: number) => {
        const clamped = Math.max(1, Math.min(5, Math.round(rating)));
        set(state => ({ userRatings: { ...state.userRatings, [productId]: clamped } }));
      },
      getRating: (productId: string) => {
        return get().userRatings[productId] || 0;
      },
      clearRatings: () => set({ userRatings: {} }),
    }),
    {
      name: "ratings-storage",
      partialize: state => ({ userRatings: state.userRatings }),
    },
  ),
);
