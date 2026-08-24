"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/layout";
import { useOnboardingRouter } from "@/hooks";
import {
  DashboardButton,
  DashboardErrorState,
  DashboardLoadingState,
} from "@/components/dashboard";
import "./dashboard.css";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  // Check onboarding status and redirect if not complete
  const { loading, isComplete, nextRoute, error } = useOnboardingRouter({
    autoRedirect: true,
  });
  const errorMessage =
    error instanceof Error
      ? error.message
      : "An error occurred while checking your account status.";

  if (loading) {
    return (
      <div
        className="supplier-dashboard dashboard-canvas flex h-dvh items-center justify-center p-6"
        data-ui-scope="supplier-dashboard"
      >
        <DashboardLoadingState
          className="w-full max-w-md"
          label="Checking account status"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="supplier-dashboard dashboard-canvas flex h-dvh items-center justify-center p-6"
        data-ui-scope="supplier-dashboard"
      >
        <div className="w-full max-w-md space-y-3">
          <DashboardErrorState
            title="Account status could not be loaded"
            message={errorMessage}
            onRetry={() => window.location.reload()}
          />
          <div className="flex justify-center">
            <DashboardButton
              variant="outline"
              onClick={() => router.push("/auth/login")}
            >
              Back to login
            </DashboardButton>
          </div>
        </div>
      </div>
    );
  }

  if (!isComplete) {
    return (
      <div
        className="supplier-dashboard dashboard-canvas flex h-dvh items-center justify-center p-6"
        data-ui-scope="supplier-dashboard"
      >
        <DashboardLoadingState
          className="w-full max-w-md"
          label={
            nextRoute ? "Redirecting to onboarding" : "Preparing onboarding"
          }
        />
      </div>
    );
  }

  // Onboarding complete - render dashboard
  return <DashboardShell>{children}</DashboardShell>;
}
