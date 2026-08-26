/**
 * Auth API Service
 * Handles authentication-related API calls
 */

import { SUPPLIER_API, API_BASE_URL } from "@/constants/api.constants";

interface AuthApiError extends Error {
  code?: string;
  status?: number;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;
}

// ===== Helper: API Fetch =====
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL}${endpoint}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      credentials: "include", // Include cookies for session
    });
  } catch (err) {
    console.error(`[AUTH API] Network error for ${endpoint}:`, err);
    const error = new Error(
      "Unable to reach the authentication server. Please refresh and try again."
    ) as AuthApiError;
    error.code = "NETWORK_ERROR";
    throw error;
  }

  if (!response.ok) {
    let errorMessage = response.statusText;
    let errorCode = `HTTP_${response.status}`;

    try {
      const errorData: unknown = await response.json();
      const errorRecord = asRecord(errorData);
      const nestedError = asRecord(errorRecord?.error);
      // Handle nested error structure: { error: { code, message } }
      if (nestedError) {
        if (typeof nestedError.message === "string") {
          errorMessage = nestedError.message;
        }
        if (typeof nestedError.code === "string") {
          errorCode = nestedError.code;
        }
      } else {
        // Handle flat error structure: { message, code }
        if (typeof errorRecord?.message === "string") {
          errorMessage = errorRecord.message;
        } else if (typeof errorRecord?.error === "string") {
          errorMessage = errorRecord.error;
        }
        if (typeof errorRecord?.code === "string") {
          errorCode = errorRecord.code;
        }
      }
    } catch {
      // If response is not JSON, use status text
    }

    // CRITICAL: Global 401/403 handler - Force logout and redirect
    const sessionIsInvalid =
      errorCode === "UNAUTHORIZED" || errorCode === "FORBIDDEN";
    if (
      (response.status === 401 || response.status === 403) &&
      sessionIsInvalid
    ) {
      if (typeof window !== "undefined") {
        // Clear auth state immediately
        try {
          localStorage.removeItem("auth-storage");
          localStorage.removeItem("kuinbee-supplier-storage");
          localStorage.removeItem("onboarding-storage");
        } catch {
          // Ignore localStorage errors
        }

        // Redirect to login if not already there
        if (!window.location.pathname.includes("/auth/login")) {
          window.location.href = "/auth/login";
        }
      }
    }

    // Create a proper error with message property
    const error = new Error(errorMessage) as AuthApiError;
    error.status = response.status;
    error.code = errorCode;
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
  success: true;
  data: {
    user: {
      id: string;
      email: string;
      phone: string | null;
      userType: "SUPPLIER";
      status: string;
      emailVerified: boolean;
    };
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
 * Request a password-reset email without revealing whether an account exists.
 */
export async function requestSupplierPasswordReset(
  email: string
): Promise<void> {
  await apiFetch<{ success: true; data: { success: true } }>(
    SUPPLIER_API.PASSWORD_RESET_REQUEST,
    {
      method: "POST",
      body: JSON.stringify({ email }),
    }
  );
}

/**
 * Replace a forgotten supplier password using the emailed one-time token.
 */
export async function confirmSupplierPasswordReset(data: {
  email: string;
  token: string;
  newPassword: string;
}): Promise<void> {
  await apiFetch<{ success: true; data: { success: true } }>(
    SUPPLIER_API.PASSWORD_RESET_CONFIRM,
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
}

/**
 * Change the password for the currently authenticated supplier.
 */
export async function changeSupplierPassword(data: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  await apiFetch<{ success: true; data: { success: true } }>(
    SUPPLIER_API.PASSWORD_CHANGE,
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
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
  } catch {
    return null;
  }
}
