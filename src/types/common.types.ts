/**
 * Common Types
 * Shared types used across the application
 */

// ===== API Response Types =====

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  message: string;
  code: string;
  details?: Record<string, string[]>;
}

// ===== Status Types =====

export type Status = 
  | 'active'
  | 'inactive'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'verified'
  | 'changes_requested';

// ===== Common Entity Fields =====

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditFields {
  createdBy?: string;
  updatedBy?: string;
  deletedAt?: string | null;
  deletedBy?: string | null;
}

// ===== UI State Types =====

export interface LoadingState {
  isLoading: boolean;
  isError: boolean;
  error?: Error | null;
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

// ===== Theme Types =====

export type ThemeMode = 'light' | 'dark';
