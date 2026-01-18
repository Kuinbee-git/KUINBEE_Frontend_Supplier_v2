"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getOnboardingStatus } from "@/lib/api/supplier";

// Onboarding layout - ensures user is authenticated
export default function OnboardingLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Verify authentication by attempting to fetch onboarding status
    // If this fails (401/403), user is not authenticated
    async function checkAuth() {
      try {
        await getOnboardingStatus();
        setIsAuthenticated(true);
      } catch (error: any) {
        // If unauthorized or forbidden, redirect to login
        if (error.status === 401 || error.status === 403 || error.code === "UNAUTHORIZED") {
          router.replace("/auth/login");
          return;
        }
        // For other errors, still allow access (could be network issue)
        setIsAuthenticated(true);
      } finally {
        setIsChecking(false);
      }
    }

    checkAuth();
  }, [router]);

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

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen w-full">
      {children}
    </div>
  );
}
