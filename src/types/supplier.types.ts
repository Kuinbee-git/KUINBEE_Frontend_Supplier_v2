/**
 * Supplier Types
 */

import { BaseEntity } from "./common.types";

// ===== Supplier Onboarding Status =====

export interface OnboardingStatus {
  profileComplete: boolean;
  businessComplete: boolean;
  kycSubmitted: boolean;
  kycVerified: boolean;
}

// ===== Supplier Entity =====

export interface Supplier extends BaseEntity {
  // Identity
  supplierId: string;
  type: 'individual' | 'organization';
  legalName: string;
  tradeName?: string;
  
  // Contact
  primaryContactName: string;
  primaryContactDesignation?: string;
  primaryContactEmail: string;
  emergencyContactPhone?: string;
  
  // Business
  businessRegistrationNumber?: string;
  website?: string;
  description?: string;
  
  // Verification
  verificationStatus: KYCStatus;
  verificationProvider?: string;
  verificationCompletedAt?: string;
  
  // Onboarding
  onboardingStatus: OnboardingStatus;
  
  // Status
  status: 'active' | 'suspended' | 'blocked' | 'pending_verification';
}

// ===== Supplier Profile (Step 1) =====

export interface SupplierIdentityData {
  type: 'individual' | 'organization';
  legalName: string;
  tradeName?: string;
  primaryContactName: string;
  primaryContactDesignation?: string;
  businessRegistrationNumber?: string;
  emergencyContactPhone?: string;
}

// ===== Business Data (Step 2) =====

export interface BusinessDataContext {
  industryClassification: string[];
  dataCategories: string[];
  website?: string;
  description?: string;
  primaryDataSources?: string[];
  dataUpdateFrequency?: 'realtime' | 'daily' | 'weekly' | 'monthly' | 'quarterly';
}

// ===== KYC Verification =====

export type KYCStatus = 
  | 'not_started'
  | 'pending'
  | 'in_progress'
  | 'verified'
  | 'rejected'
  | 'failed';

export interface KYCVerification extends BaseEntity {
  supplierId: string;
  status: KYCStatus;
  provider: string;
  submittedAt?: string;
  completedAt?: string;
  expiresAt?: string;
  
  // Individual checks
  checks: KYCCheck[];
  
  // Failure details
  rejectionReason?: string;
  failureReason?: string;
}

export interface KYCCheck {
  type: 'pan' | 'aadhaar' | 'gstin' | 'bank_account' | 'business_registration';
  status: 'pending' | 'verified' | 'failed';
  verifiedAt?: string;
  failureReason?: string;
}

// ===== Supplier Account =====

export interface SupplierAccount {
  email: string;
  emailVerified: boolean;
  lastLogin?: string;
  passwordChangedAt?: string;
  twoFactorEnabled: boolean;
}
