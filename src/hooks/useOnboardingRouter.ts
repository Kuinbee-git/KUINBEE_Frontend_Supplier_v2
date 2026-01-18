/**
 * useOnboardingRouter Hook
 * Handles automatic routing based on onboarding status
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useOnboardingStatus } from "./useOnboardingStatus";
import { ONBOARDING_STEP_ROUTES } from "@/constants";

interface UseOnboardingRouterOptions {
  /**
   * If true, redirects to onboarding if not complete
   * If false, only provides status without redirecting
   */
  autoRedirect?: boolean;
  
  /**
   * Custom callback when onboarding is incomplete
   */
  onIncomplete?: (nextStep: string) => void;
  
  /**
   * Custom callback when onboarding is complete
   */
  onComplete?: () => void;
}

/**
 * Hook to handle automatic routing based on onboarding status
 * 
 * @example
 * ```tsx
 * // In dashboard layout - redirect to onboarding if not complete
 * useOnboardingRouter({ autoRedirect: true });
 * 
 * // In onboarding page - just get next route
 * const { nextRoute, isComplete } = useOnboardingRouter({ autoRedirect: false });
 * ```
 */
export function useOnboardingRouter(options: UseOnboardingRouterOptions = {}) {
  const { autoRedirect = true, onIncomplete, onComplete } = options;
  const router = useRouter();
  const { data, loading, isComplete, nextStep, error } = useOnboardingStatus();

  // Get the next route based on nextStep
  const nextRoute = nextStep ? ONBOARDING_STEP_ROUTES[nextStep] : null;


  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    // Still loading, don't do anything
    if (loading) return;

    // If there's an error or no data, redirect to login
    if (error || !data) {
      router.replace("/auth/login");
      return;
    }

    if (isComplete) {
      onComplete?.();
    } else if (nextRoute) {
      if (onIncomplete) {
        onIncomplete(nextRoute);
      } else if (autoRedirect) {
        router.replace(nextRoute);
      }
    } else {
      // No next route but not complete - this shouldn't happen
    }
  }, [loading, data, error, isComplete, nextRoute, autoRedirect, router, onComplete, onIncomplete]);

  return {
    data,
    loading,
    isComplete,
    nextStep,
    nextRoute,
    error,
  };
}
