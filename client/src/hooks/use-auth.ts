"use client";

import { useState, useEffect, createContext, useContext, useCallback } from "react";
import { User, LoginRequest, RegisterRequest, UserUpdate, AuthTokens } from "../types/auth";
import { authAPI } from "../services/auth-api";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: UserUpdate) => Promise<void>;
  deleteUser: () => Promise<void>;
  clearError: () => void;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const refreshAuth = useCallback(async () => {
    if (!authAPI.isAuthenticated()) {
      setLoading(false);
      return;
    }

    try {
      const userData = await authAPI.getCurrentUser();
      setUser(userData);
    } catch (err) {
      console.error("Failed to refresh auth:", err);
      // Try to refresh token
      try {
        await authAPI.refreshToken();
        const userData = await authAPI.getCurrentUser();
        setUser(userData);
      } catch (refreshErr) {
        console.error("Failed to refresh token:", refreshErr);
        authAPI.logout();
        setUser(null);
      }
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      await refreshAuth();
      setLoading(false);
    };

    initAuth();
  }, [refreshAuth]);

  const login = useCallback(async (data: LoginRequest) => {
    setLoading(true);
    setError(null);

    try {
      await authAPI.login(data);
      const userData = await authAPI.getCurrentUser();
      setUser(userData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Login failed";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (data: RegisterRequest) => {
    setLoading(true);
    setError(null);

    try {
      await authAPI.register(data);
      // Auto-login after successful registration
      await authAPI.login({ email: data.email, password: data.password });
      const userData = await authAPI.getCurrentUser();
      setUser(userData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Registration failed";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await authAPI.logout();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setUser(null);
      setLoading(false);
    }
  }, []);

  const updateUser = useCallback(async (data: UserUpdate) => {
    setLoading(true);
    setError(null);

    try {
      const updatedUser = await authAPI.updateUser(data);
      setUser(updatedUser);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Update failed";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteUser = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await authAPI.deleteUser();
      setUser(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Delete failed";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const contextValue: AuthContextType = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateUser,
    deleteUser,
    clearError,
    refreshAuth,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};
