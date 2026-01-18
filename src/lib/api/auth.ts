/**
 * Auth API Service
 * Handles authentication-related API calls
 */

import { SUPPLIER_API, API_BASE_URL } from "@/constants/api.constants";

// ===== Helper: API Fetch =====
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    credentials: "include", // Include cookies for session
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      code: "UNKNOWN_ERROR",
      message: response.statusText,
    }));
    throw error;
  }

  return response.json();
}

// ===== Auth Types =====
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    phone: string | null;
    userType: "SUPPLIER";
    status: string;
    emailVerified: boolean;
  };
}

// ===== Auth API =====

/**
 * Login supplier
 */
export async function login(
  credentials: LoginCredentials
): Promise<LoginResponse> {
  return apiFetch<LoginResponse>(SUPPLIER_API.LOGIN, {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

/**
 * Logout supplier
 */
export async function logout(): Promise<void> {
  // Implement logout endpoint when available
  // For now, just clear session by redirecting
}

/**
 * Get current session user
 */
export async function getCurrentUser(): Promise<LoginResponse | null> {
  try {
    // This would be a /api/v1/auth/me endpoint
    // For now, we'll check via onboarding status
    return null;
  } catch (error) {
    return null;
  }
}
