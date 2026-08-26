/**
 * API Constants
 * API endpoints and configuration
 */

// ===== Base URLs =====
const isLocalBrowser =
  typeof window !== "undefined" &&
  ["localhost", "127.0.0.1"].includes(window.location.hostname);

export const API_BASE_URL = isLocalBrowser
  ? ""
  : process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";
export const API_VERSION = "v1";
export const API_BASE_PATH = `/api/${API_VERSION}`;

// ===== Supplier API Endpoints =====
export const SUPPLIER_API = {
  // Registration & Authentication (Public)
  REGISTER: `${API_BASE_PATH}/supplier/register`,
  LOGIN: `${API_BASE_PATH}/auth/login`,
  PASSWORD_RESET_REQUEST: `${API_BASE_PATH}/supplier/auth/password/reset/request`,
  PASSWORD_RESET_CONFIRM: `${API_BASE_PATH}/supplier/auth/password/reset/confirm`,
  PASSWORD_CHANGE: `${API_BASE_PATH}/supplier/auth/password/change`,

  // Invites (Public)
  GET_INVITE: (inviteId: string) =>
    `${API_BASE_PATH}/supplier/invites/${inviteId}`,

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
  PRESIGN_PROFILE_LOGO: `${API_BASE_PATH}/supplier/onboarding/profile/logo/presign`,
  COMPLETE_PROFILE_LOGO: `${API_BASE_PATH}/supplier/onboarding/profile/logo/complete`,

  // Complete Onboarding
  COMPLETE_ONBOARDING: `${API_BASE_PATH}/supplier/onboarding/complete`,
  PARTIAL_COMPLETE_ONBOARDING: `${API_BASE_PATH}/supplier/onboarding/partial-complete`,

  // Stats
  STATS: (range: string) => `${API_BASE_PATH}/supplier/stats?range=${range}`,
  DATASET_STATS: (datasetId: string, range: string) =>
    `${API_BASE_PATH}/supplier/stats/datasets/${encodeURIComponent(datasetId)}?range=${range}`,
} as const;

// ===== Dataset Proposal API Endpoints =====
export const DATASET_PROPOSAL_API = {
  // Create & List
  CREATE: `${API_BASE_PATH}/supplier/dataset-proposals`,
  LIST: `${API_BASE_PATH}/supplier/dataset-proposals`,

  // Single Proposal Operations
  GET_DETAILS: (datasetId: string) =>
    `${API_BASE_PATH}/supplier/dataset-proposals/${datasetId}`,
  UPDATE_METADATA: (datasetId: string) =>
    `${API_BASE_PATH}/supplier/dataset-proposals/${datasetId}`,
  DISCARD_DRAFT: (datasetId: string) =>
    `${API_BASE_PATH}/supplier/dataset-proposals/${datasetId}`,

  // About & Format
  UPSERT_ABOUT: (datasetId: string) =>
    `${API_BASE_PATH}/supplier/dataset-proposals/${datasetId}/about`,
  UPSERT_LOCATION: (datasetId: string) =>
    `${API_BASE_PATH}/supplier/dataset-proposals/${datasetId}/location`,
  SET_TAGS: (datasetId: string) =>
    `${API_BASE_PATH}/supplier/dataset-proposals/${datasetId}/tags`,
  UPSERT_DATA_FORMAT: (datasetId: string) =>
    `${API_BASE_PATH}/supplier/dataset-proposals/${datasetId}/data-format`,

  // Features & Categories
  REPLACE_FEATURES: (datasetId: string) =>
    `${API_BASE_PATH}/supplier/dataset-proposals/${datasetId}/features`,
  SET_CATEGORIES: (datasetId: string) =>
    `${API_BASE_PATH}/supplier/dataset-proposals/${datasetId}/categories`,

  // Upload
  PRESIGN_UPLOAD: (datasetId: string) =>
    `${API_BASE_PATH}/supplier/dataset-proposals/${datasetId}/current-upload/presign`,
  COMPLETE_UPLOAD: (datasetId: string) =>
    `${API_BASE_PATH}/supplier/dataset-proposals/${datasetId}/current-upload/complete`,
  PRESIGN_SAMPLE_UPLOAD: (datasetId: string) =>
    `${API_BASE_PATH}/supplier/dataset-proposals/${datasetId}/sample-upload/presign`,
  COMPLETE_SAMPLE_UPLOAD: (datasetId: string) =>
    `${API_BASE_PATH}/supplier/dataset-proposals/${datasetId}/sample-upload/complete`,

  // Submit
  SUBMIT: (datasetId: string) =>
    `${API_BASE_PATH}/supplier/dataset-proposals/${datasetId}/submit`,
} as const;

// ===== Dataset API Endpoints (Published/Verified Datasets) =====
export const DATASET_API = {
  // List & Details
  LIST: `${API_BASE_PATH}/supplier/datasets`,
  GET_DETAILS: (datasetId: string) =>
    `${API_BASE_PATH}/supplier/datasets/${datasetId}`,

  // Actions
  PUBLISH: (datasetId: string) =>
    `${API_BASE_PATH}/supplier/datasets/${datasetId}/publish`,
  CHANGE_VISIBILITY: (datasetId: string) =>
    `${API_BASE_PATH}/supplier/datasets/${datasetId}/visibility`,
  REQUEST_PRICING_CHANGE: (datasetId: string) =>
    `${API_BASE_PATH}/supplier/datasets/${datasetId}/pricing-change-request`,
  ARCHIVE: (datasetId: string) =>
    `${API_BASE_PATH}/supplier/datasets/${datasetId}/archive`,
  DELIST: (datasetId: string) =>
    `${API_BASE_PATH}/supplier/datasets/${datasetId}/delist`,
  SUBMIT_UPDATE: (datasetId: string) =>
    `${API_BASE_PATH}/supplier/datasets/${datasetId}/submit-update`,
  UPSERT_ABOUT: (datasetId: string) =>
    `${API_BASE_PATH}/supplier/datasets/${datasetId}/about`,
  UPSERT_LOCATION: (datasetId: string) =>
    `${API_BASE_PATH}/supplier/datasets/${datasetId}/location`,
  UPSERT_DATA_FORMAT: (datasetId: string) =>
    `${API_BASE_PATH}/supplier/datasets/${datasetId}/data-format`,
  REPLACE_FEATURES: (datasetId: string) =>
    `${API_BASE_PATH}/supplier/datasets/${datasetId}/features`,
  SET_CATEGORIES: (datasetId: string) =>
    `${API_BASE_PATH}/supplier/datasets/${datasetId}/categories`,
  SET_TAGS: (datasetId: string) =>
    `${API_BASE_PATH}/supplier/datasets/${datasetId}/tags`,
  DOWNLOAD_PUBLISHED: (datasetId: string) =>
    `${API_BASE_PATH}/supplier/datasets/${datasetId}/published-upload/download-url`,
  DISCOUNT_PROPOSALS: (datasetId: string) =>
    `${API_BASE_PATH}/supplier/datasets/${datasetId}/discount-proposals`,
  CANCEL_DISCOUNT_PROPOSAL: (datasetId: string, discountProposalId: string) =>
    `${API_BASE_PATH}/supplier/datasets/${datasetId}/discount-proposals/${discountProposalId}/cancel`,
  QUESTIONS: (datasetId: string) =>
    `${API_BASE_PATH}/marketplace/datasets/${datasetId}/questions`,
  REVIEWS: (datasetId: string) =>
    `${API_BASE_PATH}/marketplace/datasets/${datasetId}/reviews`,
  ANSWER_QUESTION: (questionId: string) =>
    `${API_BASE_PATH}/marketplace/questions/${questionId}/answers`,
  // KDTS Score (public route)
  KDTS_SCORE: (datasetId: string) =>
    `${API_BASE_PATH}/datasets/${datasetId}/kdts`,
} as const;

// ===== Catalog (Sources & Categories) API Endpoints =====
export const CATALOG_API = {
  // Sources
  LIST_SOURCES: `${API_BASE_PATH}/supplier/sources`,
  CREATE_SOURCE: `${API_BASE_PATH}/supplier/sources`,
  UPDATE_SOURCE: (sourceId: string) =>
    `${API_BASE_PATH}/supplier/sources/${sourceId}`,
  DELETE_SOURCE: (sourceId: string) =>
    `${API_BASE_PATH}/supplier/sources/${sourceId}`,

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
