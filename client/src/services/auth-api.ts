import { User, LoginRequest, RegisterRequest, AuthTokens, TokenRefresh, UserUpdate, ApiError } from "../types/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

class AuthAPI {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    const token = this.getAccessToken();

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
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

  private getAccessToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("access_token");
  }

  private setTokens(tokens: AuthTokens): void {
    if (typeof window === "undefined") return;
    localStorage.setItem("access_token", tokens.access_token);
    localStorage.setItem("refresh_token", tokens.refresh_token);
  }

  private clearTokens(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  }

  async register(data: RegisterRequest): Promise<User> {
    return this.request<User>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async login(data: LoginRequest): Promise<AuthTokens> {
    const tokens = await this.request<AuthTokens>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });

    this.setTokens(tokens);
    return tokens;
  }

  async logout(): Promise<void> {
    try {
      await this.request("/auth/logout", { method: "POST" });
    } catch (error) {
      // Continue with logout even if API call fails
      console.warn("Logout API call failed:", error);
    } finally {
      this.clearTokens();
    }
  }

  async refreshToken(): Promise<AuthTokens> {
    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    const tokens = await this.request<AuthTokens>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    this.setTokens(tokens);
    return tokens;
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>("/auth/me");
  }

  async updateUser(data: UserUpdate): Promise<User> {
    return this.request<User>("/auth/me", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteUser(): Promise<void> {
    await this.request("/auth/me", { method: "DELETE" });
    this.clearTokens();
  }

  // Helper method to check if user is authenticated
  isAuthenticated(): boolean {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem("access_token");
  }

  // Helper method to get stored tokens
  getStoredTokens(): AuthTokens | null {
    if (typeof window === "undefined") return null;

    const accessToken = localStorage.getItem("access_token");
    const refreshToken = localStorage.getItem("refresh_token");

    if (!accessToken || !refreshToken) return null;

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: "bearer",
    };
  }
}

export const authAPI = new AuthAPI();
