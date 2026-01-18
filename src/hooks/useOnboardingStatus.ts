/**
 * useOnboardingStatus Hook
 * Fetches and caches the supplier onboarding status
 */

import { useState, useEffect, useCallback } from "react";
import { getOnboardingStatus } from "@/lib/api/supplier";
import type { OnboardingStatusResponse, OnboardingNextStep } from "@/types";

interface UseOnboardingStatusReturn {
  data: OnboardingStatusResponse | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  isComplete: boolean;
  nextStep: OnboardingNextStep | null;
}

/**
 * Hook to fetch and manage onboarding status
 * Provides easy access to current onboarding state
 * 
 * @example
 * ```tsx
 * const { data, loading, isComplete, nextStep, refetch } = useOnboardingStatus();
 * 
 * if (loading) return <Loading />;
 * if (!isComplete) return <Redirect to={ONBOARDING_STEP_ROUTES[nextStep]} />;
 * ```
 */
export function useOnboardingStatus(): UseOnboardingStatusReturn {
  const [data, setData] = useState<OnboardingStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getOnboardingStatus();
      setData(response);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    // Only fetch on client side
    if (typeof window === 'undefined') return;
    
    fetchStatus();
  }, [fetchStatus]);

  // Compute derived values
  const isComplete = data?.onboarding?.nextStep === "DONE";
  
  // Determine next step - fallback if backend returns null
  let nextStep = data?.onboarding?.nextStep || null;
  
  // If nextStep is null but we have onboarding data, determine it from steps
  if (!nextStep && data?.onboarding) {
    const steps = data.onboarding.steps;
    const supplierType = data.onboarding.supplierType;
    
    if (!steps.supplierTypeSelected) {
      nextStep = "SELECT_TYPE";
    } else if (!steps.emailOtpVerified) {
      nextStep = "VERIFY_EMAIL_OTP";
    } else if (supplierType === "INDIVIDUAL" && steps.individualPan.status !== "VERIFIED") {
      nextStep = "VERIFY_PAN";
    } else if (!steps.profileCompleted) {
      nextStep = "COMPLETE_PROFILE";
    } else {
      nextStep = "DONE";
    }
    
  }


  return {
    data,
    loading,
    error,
    refetch: fetchStatus,
    isComplete,
    nextStep,
  };
}
