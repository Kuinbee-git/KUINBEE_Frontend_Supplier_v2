/**
 * Authentication Types
 */

import { BaseEntity } from "./common.types";

// ===== Auth States =====

export type AuthState = 
  | 'initial'           // Login/Register screen
  | 'new_supplier'      // New supplier registration (email capture)
  | 'otp'               // OTP verification
  | 'checking'          // Loading/verification state
  | 'authenticated';    // Successfully authenticated

// ===== User/Supplier Types =====

export interface User extends BaseEntity {
  email: string;
  emailVerified: boolean;
  type: 'supplier' | 'admin';
  status: 'active' | 'suspended' | 'blocked';
}

export interface AuthSession {
  user: User;
  token: string;
  expiresAt: string;
}

// ===== Auth Request/Response Types =====

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterSupplierData {
  email: string;
}

export interface VerifyOTPData {
  email: string;
  otp: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}
