/**
 * Onboarding Types (v1 API)
 * Type definitions for supplier onboarding flow
 */

// ===== Supplier Type =====
export type SupplierType = "INDIVIDUAL" | "COMPANY";

// ===== User Status =====
export type UserStatus = "ACTIVE" | "PENDING_VERIFICATION" | "SUSPENDED" | "DELETED";

// ===== Onboarding Next Step =====
export type OnboardingNextStep = 
  | "SELECT_TYPE"
  | "VERIFY_EMAIL_OTP"
  | "VERIFY_PAN"
  | "COMPLETE_PROFILE"
  | "PARTIAL_COMPLETE"
  | "PENDING_VERIFICATION"
  | "DONE";

// ===== Verification Status =====
export type VerificationStatus = "NOT_STARTED" | "PENDING" | "FAILED" | "VERIFIED";

export interface ManualKycStep {
  status: "PENDING" | "VERIFIED" | "REJECTED";
  pickedByAdminId: string | null;
  pickedAt: string | null;
  rejectionReason: string | null;
}

// ===== Supplier User =====
export interface SupplierUser {
  id: string;
  email: string;
  phone: string | null;
  userType: "SUPPLIER";
  status: UserStatus;
  emailVerified: boolean;
}

// ===== Individual PAN Verification Step =====
export interface IndividualPanStep {
  required: boolean;
  status: VerificationStatus;
  lastAttemptId: string | null;
  lastErrorCode: string | null;
}

// ===== Onboarding Steps =====
export interface OnboardingSteps {
  supplierTypeSelected: boolean;
  emailOtpVerified: boolean;
  individualPan: IndividualPanStep;
  manualKyc?: ManualKycStep;
  profileCompleted: boolean;
}

// ===== Onboarding Info =====
export interface OnboardingInfo {
  supplierType: SupplierType | null;
  steps: OnboardingSteps;
  nextStep: OnboardingNextStep;
}

// ===== Onboarding Status Response =====
export interface OnboardingStatusResponse {
  supplier: SupplierUser;
  onboarding: OnboardingInfo;
}

// ===== Supplier Invite =====
export interface SupplierInvite {
  id: string;
  email: string;
  supplierType: SupplierType;
  createdAt: string;
}

export interface SupplierInviteResponse {
  invite: SupplierInvite;
}

// ===== Registration =====
export interface SupplierRegistrationRequest {
  email: string;
  password: string;
}

export interface SupplierRegistrationResponse {
  user: SupplierUser;
}

// ===== Select Type =====
export interface SelectSupplierTypeRequest {
  supplierType: SupplierType;
}

export interface SelectSupplierTypeResponse {
  supplierType: SupplierType;
}

// ===== Email OTP =====
export interface SendEmailOtpRequest {
  reason: "SUPPLIER_ONBOARDING";
}

export interface SendEmailOtpResponse {
  success: true;
}

export interface VerifyEmailOtpRequest {
  reason: "SUPPLIER_ONBOARDING";
  otp: string;
}

export interface VerifyEmailOtpResponse {
  success: true;
}

// ===== PAN Verification =====
export interface VerifyPanRequest {
  panNumber: string;
  nameAsPerPan: string;
  consent: "Y";
  consentText: string;
}

export interface PanVerificationAttempt {
  id: string;
  status: VerificationStatus;
  createdAt: string;
}

export interface PanVerificationResult {
  panType: string | null;
  nameMatchScore: number | null;
  panLast4: string | null;
}

export interface VerifyPanResponse {
  attempt: PanVerificationAttempt;
  result: PanVerificationResult;
}

export interface PanAttemptListItem {
  id: string;
  status: VerificationStatus;
  provider: "ZOOP";
  createdAt: string;
  updatedAt: string;
  errorCode: string | null;
}

export interface PanAttemptsResponse {
  items: PanAttemptListItem[];
  page: number;
  pageSize: number;
  total: number;
}

// ===== Supplier Profile =====
export interface SupplierProfile {
  supplierType: SupplierType;
  individualName: string | null;
  companyName: string | null;
  websiteUrl: string | null;
  logoUrl: string | null;
  logoContentType: string | null;
  logoSizeBytes: string | null;
  logoWidth: number | null;
  logoHeight: number | null;
  logoUpdatedAt: string | null;
  contactPersonName: string;
  contactEmail: string;
  businessDomains: string[];
  primaryDomain: string | null;
  naturesOfDataProvided: string | null;
  isOfflineContractDone: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierProfileResponse {
  profile: SupplierProfile | null;
}

export interface UpdateProfileIndividualRequest {
  supplierType: "INDIVIDUAL";
  individualName: string;
  contactPersonName?: string;
  businessDomains: string[];
  primaryDomain?: string | null;
  naturesOfDataProvided?: string | null;
}

export interface UpdateProfileCompanyRequest {
  supplierType: "COMPANY";
  companyName: string;
  websiteUrl?: string | null;
  contactPersonName: string;
  businessDomains: string[];
  primaryDomain?: string | null;
  naturesOfDataProvided?: string | null;
}

export type UpdateProfileRequest = UpdateProfileIndividualRequest | UpdateProfileCompanyRequest;

export interface UpdateProfileResponse {
  profile: SupplierProfile;
}

export type SupplierLogoContentType = "image/png" | "image/jpeg" | "image/webp";

export interface SupplierLogoConstraints {
  allowedContentTypes: SupplierLogoContentType[];
  maxSizeBytes: number;
  minWidth: number;
  minHeight: number;
  maxWidth: number;
  maxHeight: number;
  requiredAspectRatio: "1:1";
  recommendedSize: "512x512";
}

export interface PresignSupplierLogoRequest {
  originalFileName?: string | null;
  contentType: SupplierLogoContentType;
}

export interface PresignSupplierLogoResponse {
  s3Key: string;
  putUrl: string;
  expiresAt: string;
  constraints: SupplierLogoConstraints;
}

export interface CompleteSupplierLogoRequest {
  s3Key: string;
  sizeBytes?: string;
}

export interface CompleteSupplierLogoResponse {
  profile: SupplierProfile;
}

// ===== Complete Onboarding =====
export interface CompleteOnboardingResponse {
  success: true;
  onboarding: {
    status: "DONE";
    completedAt: string;
  };
}

export type PartialCompleteOnboardingResponse = OnboardingStatusResponse;

// ===== Business Domains =====
export const BUSINESS_DOMAINS = [
  "HEALTHCARE",
  "FINANCE",
  "EDUCATION",
  "ECOMMERCE",
  "AGRICULTURE",
  "TECHNOLOGY",
  "GOVERNMENT",
  "RESEARCH",
  "MARKETING",
  "SOCIAL_MEDIA",
  "OTHER",
] as const;

export type BusinessDomain = (typeof BUSINESS_DOMAINS)[number];
