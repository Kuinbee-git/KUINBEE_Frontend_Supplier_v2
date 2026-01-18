"use client";

import { useOnboardingRouter } from "@/hooks";

/**
 * Onboarding Router
 * Checks onboarding status and redirects to the appropriate step
 */
export default function OnboardingPage() {
  const { loading } = useOnboardingRouter({ autoRedirect: true });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking onboarding status...</p>
        </div>
      </div>
    );
  }

  // Will auto-redirect via useOnboardingRouter
  return null;
}
