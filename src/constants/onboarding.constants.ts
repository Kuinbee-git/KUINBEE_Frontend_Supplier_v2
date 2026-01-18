/**
 * Onboarding Constants
 * Route mappings and constants for supplier onboarding flow
 */

import type { OnboardingNextStep } from "@/types/onboarding.types";

// ===== Frontend Route Mappings =====
/**
 * Maps backend `nextStep` values to frontend routes
 */
export const ONBOARDING_STEP_ROUTES: Record<OnboardingNextStep, string> = {
  SELECT_TYPE: "/onboarding/select-type",
  VERIFY_EMAIL_OTP: "/onboarding/verify-email",
  VERIFY_PAN: "/onboarding/verify-pan",
  COMPLETE_PROFILE: "/onboarding/complete-profile",
  DONE: "/dashboard",
};

// ===== Step Labels =====
export const ONBOARDING_STEP_LABELS: Record<OnboardingNextStep, string> = {
  SELECT_TYPE: "Select Supplier Type",
  VERIFY_EMAIL_OTP: "Verify Email",
  VERIFY_PAN: "Verify PAN",
  COMPLETE_PROFILE: "Complete Profile",
  DONE: "Onboarding Complete",
};

// ===== Step Descriptions =====
export const ONBOARDING_STEP_DESCRIPTIONS: Record<OnboardingNextStep, string> = {
  SELECT_TYPE: "Choose your supplier type (Individual or Company)",
  VERIFY_EMAIL_OTP: "Verify your email address with OTP",
  VERIFY_PAN: "Verify your PAN card for identity verification",
  COMPLETE_PROFILE: "Complete your supplier profile",
  DONE: "Your onboarding is complete!",
};

// ===== Verification Status Labels =====
export const VERIFICATION_STATUS_LABELS = {
  NOT_STARTED: "Not Started",
  PENDING: "Pending",
  FAILED: "Failed",
  VERIFIED: "Verified",
} as const;

// ===== Supplier Type Labels =====
export const SUPPLIER_TYPE_LABELS = {
  INDIVIDUAL: "Individual Supplier",
  COMPANY: "Company",
} as const;

// ===== User Status Labels =====
export const USER_STATUS_LABELS = {
  ACTIVE: "Active",
  PENDING_VERIFICATION: "Pending Verification",
  SUSPENDED: "Suspended",
  DELETED: "Deleted",
} as const;

// ===== OTP Configuration =====
export const OTP_CONFIG = {
  LENGTH: 6,
  RESEND_COOLDOWN_SECONDS: 60,
  MAX_ATTEMPTS: 3,
} as const;

// ===== PAN Verification Configuration =====
export const PAN_CONFIG = {
  LENGTH: 10,
  REGEX: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
  REQUIRED_PAN_TYPE: "Person",
  REQUIRED_NAME_MATCH_SCORE: 100,
} as const;
