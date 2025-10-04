"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { User, AuthSession } from "@/types";

interface AuthState {
  user: User | null;
  session: AuthSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

type AuthStore = AuthState & AuthActions;

// Mock API functions - replace with real API calls
const mockAuthAPI = {
  login: async (email: string, password: string): Promise<AuthSession> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (email === "demo@example.com" && password === "password") {
      const user: User = {
        id: "1",
        email,
        name: "Demo User",
        avatarUrl:
          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100",
        emailVerifiedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      return {
        user,
        accessToken: "mock-access-token",
        refreshToken: "mock-refresh-token",
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      };
    }

    throw new Error("Invalid credentials");
  },

  register: async (
    email: string,
    password: string,
    name?: string
  ): Promise<AuthSession> => {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const user: User = {
      id: Math.random().toString(36).substring(7),
      email,
      name: name || "New User",
      emailVerifiedAt: undefined, // Email verification required
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return {
      user,
      accessToken: "mock-access-token",
      refreshToken: "mock-refresh-token",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };
  },

  refreshToken: async (): Promise<AuthSession> => {
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Mock refresh logic
    const user: User = {
      id: "1",
      email: "demo@example.com",
      name: "Demo User",
      avatarUrl:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100",
      emailVerifiedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return {
      user,
      accessToken: "new-mock-access-token",
      refreshToken: "new-mock-refresh-token",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };
  },
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      session: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          const session = await mockAuthAPI.login(email, password);

          set({
            user: session.user,
            session,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Login failed",
            isLoading: false,
          });
          throw error;
        }
      },

      register: async (email: string, password: string, name?: string) => {
        set({ isLoading: true, error: null });

        try {
          const session = await mockAuthAPI.register(email, password, name);

          set({
            user: session.user,
            session,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({
            error:
              error instanceof Error ? error.message : "Registration failed",
            isLoading: false,
          });
          throw error;
        }
      },

      loginWithGoogle: async () => {
        set({ isLoading: true, error: null });

        try {
          // Mock Google OAuth
          await new Promise((resolve) => setTimeout(resolve, 1000));

          const user: User = {
            id: "google-user-id",
            email: "user@gmail.com",
            name: "Google User",
            avatarUrl:
              "https://images.unsplash.com/photo-1494790108755-2616c96bab69?w=100",
            emailVerifiedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          const session: AuthSession = {
            user,
            accessToken: "google-access-token",
            refreshToken: "google-refresh-token",
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          };

          set({
            user,
            session,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: "Google login failed",
            isLoading: false,
          });
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          session: null,
          isAuthenticated: false,
          error: null,
        });
      },

      refreshToken: async () => {
        const { session } = get();
        if (!session?.refreshToken) return;

        try {
          const newSession = await mockAuthAPI.refreshToken();

          set({
            user: newSession.user,
            session: newSession,
          });
        } catch {
          // If refresh fails, logout user
          get().logout();
        }
      },

      updateProfile: async (data: Partial<User>) => {
        const { user } = get();
        if (!user) return;

        set({ isLoading: true });

        try {
          // Mock API call
          await new Promise((resolve) => setTimeout(resolve, 500));

          const updatedUser = {
            ...user,
            ...data,
            updatedAt: new Date(),
          };

          set({
            user: updatedUser,
            session: get().session
              ? {
                  ...get().session!,
                  user: updatedUser,
                }
              : null,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: "Failed to update profile",
            isLoading: false,
          });
          throw error;
        }
      },

      clearError: () => set({ error: null }),
      setLoading: (loading: boolean) => set({ isLoading: loading }),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        session: state.session,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Auto-refresh token when it's about to expire
if (typeof window !== "undefined") {
  setInterval(() => {
    const state = useAuthStore.getState();
    if (state.session && state.session.expiresAt) {
      const timeUntilExpiry =
        new Date(state.session.expiresAt).getTime() - Date.now();
      // Refresh if expiring in less than 5 minutes
      if (timeUntilExpiry < 5 * 60 * 1000 && timeUntilExpiry > 0) {
        state.refreshToken();
      }
    }
  }, 60000); // Check every minute
}
