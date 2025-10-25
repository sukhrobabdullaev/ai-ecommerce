"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { User, AuthSession } from "@/types";
import { authAPI } from "../services/auth-api";
import { LoginRequest, RegisterRequest, UserUpdate } from "../types/auth";

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
  initializeAuth: () => Promise<void>;
}

type AuthStore = AuthState & AuthActions;

// Helper function to convert API user to store user
const convertApiUserToStoreUser = (apiUser: any): User => ({
  id: apiUser.id,
  email: apiUser.email,
  name: apiUser.name,
  avatarUrl: undefined, // Not provided by backend
  emailVerifiedAt: new Date(), // Assume verified for now
  createdAt: new Date(apiUser.created_at),
  updatedAt: new Date(apiUser.created_at), // Backend doesn't provide updated_at
});

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
          const tokens = await authAPI.login({ email, password });
          const apiUser = await authAPI.getCurrentUser();
          const user = convertApiUserToStoreUser(apiUser);

          const session: AuthSession = {
            user,
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
          };

          set({
            user,
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
          // Register user
          await authAPI.register({ email, password, name });

          // Auto-login after registration
          const tokens = await authAPI.login({ email, password });
          const apiUser = await authAPI.getCurrentUser();
          const user = convertApiUserToStoreUser(apiUser);

          const session: AuthSession = {
            user,
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
          };

          set({
            user,
            session,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Registration failed",
            isLoading: false,
          });
          throw error;
        }
      },

      loginWithGoogle: async () => {
        set({ isLoading: true, error: null });

        try {
          // TODO: Implement Google OAuth
          throw new Error("Google OAuth not implemented yet");
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Google login failed",
            isLoading: false,
          });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });

        try {
          await authAPI.logout();
        } catch (error) {
          console.warn("Logout API call failed:", error);
        } finally {
          set({
            user: null,
            session: null,
            isAuthenticated: false,
            error: null,
            isLoading: false,
          });
        }
      },

      refreshToken: async () => {
        const { session } = get();
        if (!session?.refreshToken) return;

        try {
          const tokens = await authAPI.refreshToken();
          const apiUser = await authAPI.getCurrentUser();
          const user = convertApiUserToStoreUser(apiUser);

          const newSession: AuthSession = {
            user,
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
          };

          set({
            user,
            session: newSession,
          });
        } catch (error) {
          console.error("Token refresh failed:", error);
          // If refresh fails, logout user
          get().logout();
        }
      },

      updateProfile: async (data: Partial<User>) => {
        const { user } = get();
        if (!user) return;

        set({ isLoading: true, error: null });

        try {
          const updateData: UserUpdate = {};
          if (data.name !== undefined) updateData.name = data.name;
          if (data.email !== undefined) updateData.email = data.email;

          const apiUser = await authAPI.updateUser(updateData);
          const updatedUser = convertApiUserToStoreUser(apiUser);

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
            error: error instanceof Error ? error.message : "Failed to update profile",
            isLoading: false,
          });
          throw error;
        }
      },

      initializeAuth: async () => {
        if (!authAPI.isAuthenticated()) {
          set({ isLoading: false });
          return;
        }

        set({ isLoading: true });

        try {
          const apiUser = await authAPI.getCurrentUser();
          const user = convertApiUserToStoreUser(apiUser);
          const tokens = authAPI.getStoredTokens();

          if (tokens) {
            const session: AuthSession = {
              user,
              accessToken: tokens.access_token,
              refreshToken: tokens.refresh_token,
              expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
            };

            set({
              user,
              session,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            set({
              user: null,
              session: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        } catch (error) {
          console.error("Auth initialization failed:", error);
          // Try to refresh token
          try {
            await get().refreshToken();
          } catch {
            set({
              user: null,
              session: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        }
      },

      clearError: () => set({ error: null }),
      setLoading: (loading: boolean) => set({ isLoading: loading }),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: state => ({
        user: state.user,
        session: state.session,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);

// Auto-refresh token when it's about to expire
if (typeof window !== "undefined") {
  setInterval(() => {
    const state = useAuthStore.getState();
    if (state.session && state.session.expiresAt) {
      const timeUntilExpiry = new Date(state.session.expiresAt).getTime() - Date.now();
      // Refresh if expiring in less than 5 minutes
      if (timeUntilExpiry < 5 * 60 * 1000 && timeUntilExpiry > 0) {
        state.refreshToken();
      }
    }
  }, 60000); // Check every minute
}
