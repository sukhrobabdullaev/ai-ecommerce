import { create } from "zustand";
import { SearchFilters, VoiceSearchState, AIRecommendation } from "@/types";

interface SearchStore {
  filters: SearchFilters;
  voiceState: VoiceSearchState;
  aiRecommendations: AIRecommendation[];
  isSearching: boolean;
  searchHistory: string[];

  // Actions
  updateFilters: (filters: Partial<SearchFilters>) => void;
  setQuery: (query: string) => void;
  clearFilters: () => void;
  addToHistory: (query: string) => void;
  clearHistory: () => void;

  // Voice actions
  startListening: () => void;
  stopListening: () => void;
  setTranscript: (transcript: string) => void;
  setProcessing: (processing: boolean) => void;

  // AI actions
  setAIRecommendations: (recommendations: AIRecommendation[]) => void;
  clearAIRecommendations: () => void;
}

const defaultFilters: SearchFilters = {
  query: "",
  priceRange: [0, 10000],
  sortBy: "relevance",
};

export const useSearchStore = create<SearchStore>((set, get) => ({
  filters: defaultFilters,
  voiceState: {
    isListening: false,
    transcript: "",
    isProcessing: false,
  },
  aiRecommendations: [],
  isSearching: false,
  searchHistory: [],

  updateFilters: newFilters => {
    set(state => ({
      filters: { ...state.filters, ...newFilters },
    }));
  },

  setQuery: query => {
    set(state => ({
      filters: { ...state.filters, query },
    }));
  },

  clearFilters: () => {
    set({ filters: defaultFilters });
  },

  addToHistory: query => {
    if (!query.trim()) return;

    set(state => {
      const newHistory = [query, ...state.searchHistory.filter(item => item !== query)].slice(0, 10);
      return { searchHistory: newHistory };
    });
  },

  clearHistory: () => {
    set({ searchHistory: [] });
  },

  startListening: () => {
    set(state => ({
      voiceState: { ...state.voiceState, isListening: true, transcript: "" },
    }));
  },

  stopListening: () => {
    set(state => ({
      voiceState: { ...state.voiceState, isListening: false },
    }));
  },

  setTranscript: transcript => {
    set(state => ({
      voiceState: { ...state.voiceState, transcript },
    }));
  },

  setProcessing: processing => {
    set(state => ({
      voiceState: { ...state.voiceState, isProcessing: processing },
    }));
  },

  setAIRecommendations: recommendations => {
    set({ aiRecommendations: recommendations });
  },

  clearAIRecommendations: () => {
    set({ aiRecommendations: [] });
  },
}));
