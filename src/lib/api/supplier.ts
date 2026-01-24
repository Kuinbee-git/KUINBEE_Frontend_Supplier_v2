/**
 * Supplier API Service
 * Handles all supplier-related API calls
 */

import { SUPPLIER_API, API_BASE_URL } from "@/constants/api.constants";
import type {
  SupplierInviteResponse,
  SupplierRegistrationRequest,
  SupplierRegistrationResponse,
  OnboardingStatusResponse,
  SelectSupplierTypeRequest,
  SelectSupplierTypeResponse,
  SendEmailOtpRequest,
  SendEmailOtpResponse,
  VerifyEmailOtpRequest,
  VerifyEmailOtpResponse,
  VerifyPanRequest,
  VerifyPanResponse,
  PanAttemptsResponse,
  SupplierProfileResponse,
  UpdateProfileRequest,
  UpdateProfileResponse,
  CompleteOnboardingResponse,
} from "@/types/onboarding.types";

// ===== Helper: API Fetch =====
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      credentials: "include", // Include cookies for session
    });

    if (!response.ok) {
      // Try to parse error from response
      const errorData = await response.json().catch(() => null);
      
      const error: any = new Error(
        errorData?.message || `HTTP ${response.status}: ${response.statusText}`
      );
      error.status = response.status;
      error.code = errorData?.code || `HTTP_${response.status}`;
      error.data = errorData;
      
      // CRITICAL: Global 401/403 handler - Force logout and redirect
      if (response.status === 401 || response.status === 403) {
        if (typeof window !== 'undefined') {
          // Clear auth state immediately
          try {
            localStorage.removeItem('auth-storage');
            localStorage.removeItem('kuinbee-supplier-storage');
            localStorage.removeItem('onboarding-storage');
          } catch {
            // Ignore localStorage errors
          }
          
          // Redirect to login if not already there
          if (!window.location.pathname.includes('/auth/login')) {
            console.log('[API Client] Auth failure detected, forcing logout');
            window.location.href = '/auth/login';
          }
        }
      }
      
      console.error(`[API] ${options.method || 'GET'} ${endpoint} failed:`, error);
      throw error;
    }

    return response.json();
  } catch (err: any) {
    // If error already has status, rethrow
    if (err.status) throw err;
    
    // Network error or other fetch error
    console.error(`[API] Network error for ${endpoint}:`, err);
    const error: any = new Error(err.message || "Network error");
    error.code = "NETWORK_ERROR";
    throw error;
  }
}

// ===== Stage 0: Invite Landing (Public) =====

/**
 * Fetch invite details by invite ID
 * Public route - no authentication required
 */
export async function getSupplierInvite(
  inviteId: string
): Promise<SupplierInviteResponse> {
  return apiFetch<SupplierInviteResponse>(SUPPLIER_API.GET_INVITE(inviteId), {
    method: "GET",
  });
}

// ===== Stage 0.5: Registration (Public) =====

/**
 * Register a new supplier account
 * Public route - creates session cookie
 */
export async function registerSupplier(
  data: SupplierRegistrationRequest
): Promise<SupplierRegistrationResponse> {
  return apiFetch<SupplierRegistrationResponse>(SUPPLIER_API.REGISTER, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Login supplier (uses common auth route)
 * Public route - creates session cookie
 */
export async function loginSupplier(credentials: {
  email: string;
  password: string;
}): Promise<{ user: any }> {
  return apiFetch<{ user: any }>(SUPPLIER_API.LOGIN, {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

// ===== Stage 1: Onboarding Status (Authenticated) =====

/**
 * Get current onboarding status
 * Returns what step is next and progress
 */
export async function getOnboardingStatus(): Promise<OnboardingStatusResponse> {
  const response = await apiFetch<{ success: boolean; data: OnboardingStatusResponse }>(
    SUPPLIER_API.ONBOARDING_STATUS, 
    { method: "GET" }
  );
  return response.data;
}

// ===== Select Supplier Type =====

/**
 * Set the supplier type (INDIVIDUAL or COMPANY)
 */
export async function selectSupplierType(
  data: SelectSupplierTypeRequest
): Promise<SelectSupplierTypeResponse> {
  const response = await apiFetch<{ success: boolean; data: SelectSupplierTypeResponse }>(
    SUPPLIER_API.SELECT_TYPE,
    {
      method: "PUT",
      body: JSON.stringify(data),
    }
  );
  return response.data;
}

// ===== Email OTP Verification =====

/**
 * Send OTP to supplier's email
 */
export async function sendEmailOtp(
  data: SendEmailOtpRequest = { reason: "SUPPLIER_ONBOARDING" }
): Promise<SendEmailOtpResponse> {
  const response = await apiFetch<{ success: boolean; data: SendEmailOtpResponse }>(
    SUPPLIER_API.SEND_EMAIL_OTP,
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
  return response.data;
}

/**
 * Verify email OTP
 */
export async function verifyEmailOtp(
  data: VerifyEmailOtpRequest
): Promise<VerifyEmailOtpResponse> {
  const response = await apiFetch<{ success: boolean; data: VerifyEmailOtpResponse }>(
    SUPPLIER_API.VERIFY_EMAIL_OTP,
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
  return response.data;
}

// ===== PAN Verification (Individual Only) =====

/**
 * Verify PAN using Zoop API
 * Only for INDIVIDUAL suppliers
 */
export async function verifyPan(
  data: VerifyPanRequest
): Promise<VerifyPanResponse> {
  const response = await apiFetch<{ success: boolean; data: VerifyPanResponse }>(
    SUPPLIER_API.VERIFY_PAN,
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
  return response.data;
}

/**
 * Get PAN verification attempts history
 */
export async function getPanAttempts(params?: {
  page?: number;
  pageSize?: number;
}): Promise<PanAttemptsResponse> {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.set("page", params.page.toString());
  if (params?.pageSize) queryParams.set("pageSize", params.pageSize.toString());
  
  const url = `${SUPPLIER_API.PAN_ATTEMPTS}?${queryParams.toString()}`;
  
  const response = await apiFetch<{ success: boolean; data: PanAttemptsResponse }>(url, {
    method: "GET",
  });
  return response.data;
}

// ===== Supplier Profile =====

/**
 * Get supplier profile
 */
export async function getSupplierProfile(): Promise<SupplierProfileResponse> {
  const response = await apiFetch<{ success: boolean; data: SupplierProfileResponse }>(
    SUPPLIER_API.GET_PROFILE,
    {
      method: "GET",
    }
  );
  return response.data;
}

/**
 * Update supplier profile
 */
export async function updateSupplierProfile(
  data: UpdateProfileRequest
): Promise<UpdateProfileResponse> {
  const response = await apiFetch<{ success: boolean; data: UpdateProfileResponse }>(
    SUPPLIER_API.UPDATE_PROFILE,
    {
      method: "PUT",
      body: JSON.stringify(data),
    }
  );
  return response.data;
}

// ===== Complete Onboarding =====

/**
 * Complete onboarding and unlock supplier portal
 * Validates all required steps are done
 */
export async function completeOnboarding(): Promise<CompleteOnboardingResponse> {
  return apiFetch<CompleteOnboardingResponse>(SUPPLIER_API.COMPLETE_ONBOARDING, {
    method: "POST",
  });
}

// ===== Utility: Check Onboarding Status =====

/**
 * Check if onboarding is complete
 * Convenience method for quick checks
 */
export async function isOnboardingComplete(): Promise<boolean> {
  try {
    const status = await getOnboardingStatus();
    return status.onboarding.nextStep === "DONE";
  } catch (error) {
    console.error("Failed to check onboarding status:", error);
    return false;
  }
}

// ===== Legacy Support =====

/**
 * @deprecated Use getOnboardingStatus() instead
 */
export async function getSupplierStatus() {
  const status = await getOnboardingStatus();
  return {
    onboardingComplete: status.onboarding.nextStep === "DONE",
    kycVerified: status.onboarding.steps.individualPan.status === "VERIFIED",
  };
}

