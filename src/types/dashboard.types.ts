/**
 * Dashboard Types
 * Type definitions for supplier dashboard
 */

// ===== Dashboard View Types =====
export type DashboardView =
  | "overview"
  | "datasets"
  | "upload"
  | "analytics"
  | "profile"
  | "account"
  | "support";

// ===== Dataset Types for Dashboard =====
export interface Dataset {
  id: string;
  name: string;
  status: "draft" | "pending" | "published";
  lastUpdated: string;
  category?: string;
}

// ===== Dashboard Props =====
export interface DashboardProps {
  onLogout?: () => void;
  userEmail?: string;
}

export interface BlockedDashboardProps extends DashboardProps {
  onResumeOnboarding?: () => void;
  onViewDashboard?: () => void;
  status: {
    profileComplete: boolean;
    businessComplete: boolean;
    kycSubmitted: boolean;
    kycVerified: boolean;
  };
}

export interface FullDashboardProps extends DashboardProps {
  isVerified?: boolean;
  isRestricted?: boolean;
  onCompleteVerification?: () => void;
  onCompleteOnboarding?: () => void;
  initialView?: string; // Support URL params like ?tab=datasets
}

// ===== Navigation Item Type =====
export interface NavItem {
  id: DashboardView | string;
  label: string;
  icon: any; // LucideIcon type
  disabled?: boolean;
}

// ===== Stat Card Data =====
export interface StatData {
  label: string;
  value: string | number;
}
