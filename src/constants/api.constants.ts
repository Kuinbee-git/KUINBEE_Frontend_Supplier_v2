/**
 * API Constants
 * API endpoints and configuration
 */

// ===== Base URLs =====
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";
export const API_VERSION = "v1";
export const API_BASE_PATH = `/api/${API_VERSION}`;

// ===== Supplier API Endpoints =====
export const SUPPLIER_API = {
  // Registration & Authentication (Public)
  REGISTER: `${API_BASE_PATH}/supplier/register`,
  LOGIN: `${API_BASE_PATH}/auth/login`,
  
  // Invites (Public)
  GET_INVITE: (inviteId: string) => `${API_BASE_PATH}/supplier/invites/${inviteId}`,
  
  // Onboarding (Authenticated)
  ONBOARDING_STATUS: `${API_BASE_PATH}/supplier/onboarding/status`,
  SELECT_TYPE: `${API_BASE_PATH}/supplier/onboarding/type`,
  
  // Email OTP
  SEND_EMAIL_OTP: `${API_BASE_PATH}/supplier/onboarding/email-otp/send`,
  VERIFY_EMAIL_OTP: `${API_BASE_PATH}/supplier/onboarding/email-otp/verify`,
  
  // PAN Verification
  VERIFY_PAN: `${API_BASE_PATH}/supplier/onboarding/identity/pan/verify`,
  PAN_ATTEMPTS: `${API_BASE_PATH}/supplier/onboarding/identity/pan/attempts`,
  
  // Profile
  GET_PROFILE: `${API_BASE_PATH}/supplier/onboarding/profile`,
  UPDATE_PROFILE: `${API_BASE_PATH}/supplier/onboarding/profile`,
  
  // Complete Onboarding
  COMPLETE_ONBOARDING: `${API_BASE_PATH}/supplier/onboarding/complete`,
} as const;

// ===== Dataset Proposal API Endpoints =====
export const DATASET_PROPOSAL_API = {
  // Create & List
  CREATE: `${API_BASE_PATH}/supplier/dataset-proposals`,
  LIST: `${API_BASE_PATH}/supplier/dataset-proposals`,
  
  // Single Proposal Operations
  GET_DETAILS: (datasetId: string) => `${API_BASE_PATH}/supplier/dataset-proposals/${datasetId}`,
  UPDATE_METADATA: (datasetId: string) => `${API_BASE_PATH}/supplier/dataset-proposals/${datasetId}`,
  
  // About & Format
  UPSERT_ABOUT: (datasetId: string) => `${API_BASE_PATH}/supplier/dataset-proposals/${datasetId}/about`,
  UPSERT_DATA_FORMAT: (datasetId: string) => `${API_BASE_PATH}/supplier/dataset-proposals/${datasetId}/data-format`,
  
  // Features & Categories
  REPLACE_FEATURES: (datasetId: string) => `${API_BASE_PATH}/supplier/dataset-proposals/${datasetId}/features`,
  SET_CATEGORIES: (datasetId: string) => `${API_BASE_PATH}/supplier/dataset-proposals/${datasetId}/categories`,
  
  // Upload
  PRESIGN_UPLOAD: (datasetId: string) => `${API_BASE_PATH}/supplier/dataset-proposals/${datasetId}/current-upload/presign`,
  COMPLETE_UPLOAD: (datasetId: string) => `${API_BASE_PATH}/supplier/dataset-proposals/${datasetId}/current-upload/complete`,
  
  // Submit
  SUBMIT: (datasetId: string) => `${API_BASE_PATH}/supplier/dataset-proposals/${datasetId}/submit`,
} as const;

// ===== Catalog (Sources & Categories) API Endpoints =====
export const CATALOG_API = {
  // Sources
  LIST_SOURCES: `${API_BASE_PATH}/supplier/sources`,
  CREATE_SOURCE: `${API_BASE_PATH}/supplier/sources`,
  UPDATE_SOURCE: (sourceId: string) => `${API_BASE_PATH}/supplier/sources/${sourceId}`,
  DELETE_SOURCE: (sourceId: string) => `${API_BASE_PATH}/supplier/sources/${sourceId}`,
  
  // Categories
  LIST_CATEGORIES: `${API_BASE_PATH}/supplier/categories`,
} as const;

// ===== HTTP Methods =====
export const HTTP_METHODS = {
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
  PATCH: "PATCH",
  DELETE: "DELETE",
} as const;

// ===== Request Headers =====
export const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
} as const;

// ===== Error Codes =====
export const API_ERROR_CODES = {
  // Authentication
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  
  // Validation
  VALIDATION_ERROR: "VALIDATION_ERROR",
  BAD_REQUEST: "BAD_REQUEST",
  
  // Conflicts
  EMAIL_ALREADY_IN_USE: "EMAIL_ALREADY_IN_USE",
  SUPPLIER_PROFILE_MISSING: "SUPPLIER_PROFILE_MISSING",
  ONBOARDING_ALREADY_COMPLETED: "ONBOARDING_ALREADY_COMPLETED",
  
  // OTP
  OTP_INVALID: "OTP_INVALID",
  OTP_EXPIRED: "OTP_EXPIRED",
  OTP_MAX_ATTEMPTS: "OTP_MAX_ATTEMPTS",
  
  // PAN Verification
  PAN_NOT_REQUIRED: "PAN_NOT_REQUIRED",
  EMAIL_OTP_REQUIRED: "EMAIL_OTP_REQUIRED",
  PAN_NOT_VERIFIED: "PAN_NOT_VERIFIED",
  
  // Profile
  PROFILE_INCOMPLETE: "PROFILE_INCOMPLETE",
  
  // Rate Limiting
  RATE_LIMITED: "RATE_LIMITED",
  
  // External Services
  VERIFICATION_PROVIDER_UNAVAILABLE: "VERIFICATION_PROVIDER_UNAVAILABLE",
} as const;
