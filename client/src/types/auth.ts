export interface User {
  id: string;
  email: string;
  name?: string;
  created_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface TokenRefresh {
  refresh_token: string;
}

export interface UserUpdate {
  name?: string;
  email?: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export interface ApiError {
  detail: string;
}
