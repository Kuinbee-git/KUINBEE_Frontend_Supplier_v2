"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/layout";
import { useOnboardingRouter } from "@/hooks";
import { Button } from "@/components/ui/button";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  // Check onboarding status and redirect if not complete
  const { loading, isComplete, nextRoute, data, error } = useOnboardingRouter({ autoRedirect: true });

  // Show loading while checking onboarding status
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking account status...</p>
        </div>
      </div>
    );
  }

  // Show error if API call failed
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-background p-6">
        <div className="text-center max-w-md">
          <div className="mb-4 text-destructive">
            <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">Failed to Load Account Status</h2>
          <p className="text-muted-foreground mb-6">
            {(error as any)?.message || "An error occurred while checking your account status."}
          </p>
          <div className="space-y-2">
            <Button onClick={() => window.location.reload()} className="w-full">
              Try Again
            </Button>
            <Button 
              variant="outline" 
              onClick={() => router.push("/auth/login")} 
              className="w-full"
            >
              Back to Login
            </Button>
          </div>
          {process.env.NODE_ENV === 'development' && (
            <pre className="mt-4 text-xs text-left bg-muted p-4 rounded overflow-auto">
              {JSON.stringify(error, null, 2)}
            </pre>
          )}
        </div>
      </div>
    );
  }

  // If not complete, show redirecting message
  if (!isComplete) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            {nextRoute 
              ? `Redirecting to onboarding...` 
              : "Preparing onboarding..."}
          </p>
          {/* Debug info in development */}
          {process.env.NODE_ENV === 'development' && (
            <pre className="mt-4 text-xs text-left max-w-md mx-auto overflow-auto bg-muted p-4 rounded">
              {JSON.stringify({ 
                loading, 
                isComplete, 
                nextRoute, 
                hasData: !!data,
                nextStep: data?.onboarding?.nextStep 
              }, null, 2)}
            </pre>
          )}
        </div>
      </div>
    );
  }

  // Onboarding complete - render dashboard
  return (
    <DashboardShell>
      {children}
    </DashboardShell>
  );
}
