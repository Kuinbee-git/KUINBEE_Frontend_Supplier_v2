"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock3 } from "lucide-react";
import { getOnboardingStatus } from "@/lib/api";
import { LogoHeader, GlassCard, PageBackground, StatusMessage } from "@/components/shared";

export default function PendingVerificationPage() {
  const router = useRouter();
  const [pickedByAdminId, setPickedByAdminId] = useState<string | null>(null);
  const [pickedAt, setPickedAt] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const fetchStatus = async () => {
      try {
        const status = await getOnboardingStatus();
        if (!active) return;

        if (status.onboarding.nextStep === "DONE") {
          router.replace("/dashboard");
          return;
        }

        setPickedByAdminId(status.onboarding.steps.manualKyc?.pickedByAdminId ?? null);
        setPickedAt(status.onboarding.steps.manualKyc?.pickedAt ?? null);
      } catch {
      }
    };

    fetchStatus();

    return () => {
      active = false;
    };
  }, []);

  const handleRefreshStatus = async () => {
    try {
      setChecking(true);
      setError(null);
      const status = await getOnboardingStatus();
      setPickedByAdminId(status.onboarding.steps.manualKyc?.pickedByAdminId ?? null);
      setPickedAt(status.onboarding.steps.manualKyc?.pickedAt ?? null);

      if (status.onboarding.nextStep === "DONE") {
        router.push("/dashboard");
        return;
      }
    } catch (err: any) {
      setError(err.message || "Failed to refresh onboarding status");
    } finally {
      setChecking(false);
    }
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth-storage");
      localStorage.removeItem("kuinbee-supplier-storage");
      localStorage.removeItem("onboarding-storage");
    }
    window.location.href = "/auth/login";
  };

  return (
    <PageBackground withGrid>
      <LogoHeader
        title="Supplier Onboarding"
        subtitle="Verification Pending"
        onLogout={handleLogout}
      />

      <div className="relative z-10 flex items-start justify-center px-6 py-16">
        <div className="w-full max-w-[640px]">
          <StatusMessage
            variant="info"
            title="Submission received"
            message="Your profile is submitted for manual verification by the Kuinbee admin team."
            className="mb-6"
          />

          <GlassCard>
            <div className="p-8 space-y-6">
              <div className="flex items-start gap-3">
                <Clock3 className="w-5 h-5 mt-0.5 text-amber-500" />
                <div>
                  <h2 className="text-lg font-semibold">Manual review in progress</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    You will gain dashboard access once your KYC is verified. You can check status anytime.
                  </p>
                </div>
              </div>

              <div className="rounded-lg border p-4 bg-background/50">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4" />
                  Supplier profile submitted
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                  <Clock3 className="w-4 h-4" />
                  Waiting for admin verification
                </div>
                {pickedByAdminId ? (
                  <div className="mt-3 border-t pt-3 text-sm text-muted-foreground">
                    <p>Picked by admin: {pickedByAdminId}</p>
                    {pickedAt ? <p className="mt-1">Picked at: {new Date(pickedAt).toLocaleString()}</p> : null}
                  </div>
                ) : null}
              </div>

              {error ? (
                <p className="text-sm text-destructive">{error}</p>
              ) : null}

              <Button className="w-full" onClick={handleRefreshStatus} disabled={checking}>
                {checking ? "Checking..." : "Refresh Status"}
              </Button>
            </div>
          </GlassCard>
        </div>
      </div>
    </PageBackground>
  );
}
