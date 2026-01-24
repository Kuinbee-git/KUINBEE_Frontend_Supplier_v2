"use client";

import { ReactNode, useEffect, useState } from "react";
import { getOnboardingStatus } from "@/lib/api/supplier";

// Onboarding layout - ensures user is authenticated
// Note: Global 401/403 handler in API client will automatically redirect to login
export default function OnboardingLayout({ children }: { children: ReactNode }) {
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Verify authentication by fetching onboarding status
    // If 401/403, global handler redirects to login automatically
    async function checkAuth() {
      try {
        await getOnboardingStatus();
      } catch (error: any) {
        // Auth errors (401/403) are handled by global interceptor
        // For other errors (network, etc), we still allow access
        console.error("[OnboardingLayout] Auth check error:", error);
      } finally {
        setIsChecking(false);
      }
    }

    checkAuth();
  }, []);

  // Show loading while checking authentication
  if (isChecking) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full">
      {children}
    </div>
  );
}
