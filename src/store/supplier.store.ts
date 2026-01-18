import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { KYCStatus } from "@/types";

/**
 * Supplier Store
 * Manages supplier profile, verification status, and account state
 */

export interface SupplierProfile {
  id: string;
  email: string;
  supplierType: "individual" | "company";
  name: string;
  phone: string;
  country: string;
  businessDomains: string[];
  primaryDomain: string;
  kycStatus: KYCStatus;
  isVerified: boolean;
  createdAt: string;
  lastUpdated: string;
}

interface SupplierState {
  profile: SupplierProfile | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setProfile: (profile: SupplierProfile) => void;
  updateProfile: (updates: Partial<SupplierProfile>) => void;
  clearProfile: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateKYCStatus: (status: KYCStatus) => void;
}

export const useSupplierStore = create<SupplierState>()(
  persist(
    (set) => ({
      profile: null,
      isLoading: false,
      error: null,

      setProfile: (profile) => set({ profile, error: null }),
      
      updateProfile: (updates) =>
        set((state) => ({
          profile: state.profile ? { ...state.profile, ...updates } : null,
        })),
      
      clearProfile: () => set({ profile: null, error: null }),
      
      setLoading: (loading) => set({ isLoading: loading }),
      
      setError: (error) => set({ error }),
      
      updateKYCStatus: (status) =>
        set((state) => ({
          profile: state.profile
            ? {
                ...state.profile,
                kycStatus: status,
                isVerified: status === "verified",
              }
            : null,
        })),
    }),
    {
      name: "kuinbee-supplier-storage",
      partialize: (state) => ({
        profile: state.profile,
      }),
    }
  )
);
