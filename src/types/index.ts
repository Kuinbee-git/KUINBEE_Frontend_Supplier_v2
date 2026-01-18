/**
 * Global Type Exports
 * Barrel file for all type definitions
 */

// Auth types
export * from "./auth.types";

// Supplier types (includes KYCStatus)
export * from "./supplier.types";

// Dataset types
export * from "./dataset.types";

// Onboarding types (v1 API)
export type {
  SupplierType,
  UserStatus,
  OnboardingNextStep,
  VerificationStatus,
  SupplierUser,
  IndividualPanStep,
  OnboardingSteps,
  OnboardingInfo,
  OnboardingStatusResponse,
  SupplierInvite,
  SupplierInviteResponse,
  SupplierRegistrationRequest,
  SupplierRegistrationResponse,
  SelectSupplierTypeRequest,
  SelectSupplierTypeResponse,
  SendEmailOtpRequest,
  SendEmailOtpResponse,
  VerifyEmailOtpRequest,
  VerifyEmailOtpResponse,
  VerifyPanRequest,
  PanVerificationAttempt,
  PanVerificationResult,
  VerifyPanResponse,
  PanAttemptListItem,
  PanAttemptsResponse,
  SupplierProfile,
  SupplierProfileResponse,
  UpdateProfileIndividualRequest,
  UpdateProfileCompanyRequest,
  UpdateProfileRequest,
  UpdateProfileResponse,
  CompleteOnboardingResponse,
  BusinessDomain,
} from "./onboarding.types";
export { BUSINESS_DOMAINS } from "./onboarding.types";

// Dashboard types
export type {
  DashboardView,
  Dataset,
  DashboardProps,
  BlockedDashboardProps,
  FullDashboardProps,
  NavItem,
  StatData,
} from "./dashboard.types";

// Extended dataset types
export * from "./dataset-extended.types";

// API response types (explicit exports to avoid conflicts)
export type {
  ApiResponse,
  PaginatedResponse,
  ApiRequestConfig,
  ApiErrorCode,
  ValidationError,
  ApiValidationError,
} from "./api-response.types";

// Notification types
export * from "./notification.types";

// Support types
export * from "./support.types";

// Common types
export * from "./common.types";
