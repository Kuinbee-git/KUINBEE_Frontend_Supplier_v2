"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { verifyPan, getOnboardingStatus } from "@/lib/api";
import { ONBOARDING_STEP_ROUTES, PAN_CONFIG } from "@/constants";
import { LogoHeader, GlassCard, PageBackground, StatusMessage } from "@/components/shared";
import { ProgressStepper } from "@/components/onboarding";
import type { VerifyPanResponse } from "@/types";

export default function VerifyPanPage() {
  const router = useRouter();
  const [panNumber, setPanNumber] = useState("");
  const [nameAsPerPan, setNameAsPerPan] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VerifyPanResponse | null>(null);

  const consentText = "I hereby consent to verify my PAN details for identity verification purposes on the Kuinbee platform.";

  const steps = [
    { id: 1, label: "Type", status: "completed" as const },
    { id: 2, label: "Email", status: "completed" as const },
    { id: 3, label: "PAN", status: "active" as const },
    { id: 4, label: "Profile", status: "upcoming" as const },
  ];

  const validatePan = useCallback((value: string) => {
    return PAN_CONFIG.REGEX.test(value.toUpperCase());
  }, []);

  const handlePanChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().slice(0, PAN_CONFIG.LENGTH);
    setPanNumber(value);
    setError(null);
  }, []);

  const handleSubmit = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);

      // Validation
      if (!panNumber || !nameAsPerPan || !consent) {
        setError("Please fill all required fields");
        return;
      }

      if (!validatePan(panNumber)) {
        setError("Invalid PAN format. Expected format: ABCDE1234F");
        return;
      }

      // Verifying PAN

      // Call API
      const response = await verifyPan({
        panNumber,
        nameAsPerPan,
        consent: "Y",
        consentText,
      });

      // Received verification response
      setResult(response);

      // Check if verified
      if (response.attempt.status === "VERIFIED") {
        // PAN verified successfully
        
        // Navigate to next step
        setTimeout(async () => {
          const status = await getOnboardingStatus();
          const nextRoute = ONBOARDING_STEP_ROUTES[status.onboarding.nextStep];
          // Navigating to next route
          router.push(nextRoute);
        }, 2000);
      } else {
        // Show error
        if (response.result.panType !== PAN_CONFIG.REQUIRED_PAN_TYPE) {
          setError(`PAN type mismatch. Expected: ${PAN_CONFIG.REQUIRED_PAN_TYPE}, Got: ${response.result.panType}`);
        } else if (response.result.nameMatchScore !== PAN_CONFIG.REQUIRED_NAME_MATCH_SCORE) {
          setError(`Name match score: ${response.result.nameMatchScore}%. Required: ${PAN_CONFIG.REQUIRED_NAME_MATCH_SCORE}%`);
        } else {
          setError("PAN verification failed. Please check your details and try again.");
        }
      }
    } catch (err: any) {
      // Verification failed (logged silently)
      setError(err.message || "PAN verification failed");
    } finally {
      setLoading(false);
    }
  }, [panNumber, nameAsPerPan, consent, validatePan, router]);

  const handleLogout = useCallback(() => {
    // Clear all stores
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth-storage');
      localStorage.removeItem('kuinbee-supplier-storage');
      localStorage.removeItem('onboarding-storage');
    }
    // Hard redirect to ensure clean state
    window.location.href = '/auth/login';
  }, []);

  return (
    <PageBackground withGrid>
      <LogoHeader
        title="Supplier Onboarding"
        subtitle="Verify your identity"
        onLogout={handleLogout}
      />

      <div className="relative z-10 flex items-start justify-center px-6 py-16">
        <div className="w-full max-w-[720px]">
          {/* Progress Stepper */}
          <div className="mb-10">
            <ProgressStepper steps={steps} />
          </div>

          {/* Info Message */}
          <StatusMessage
            variant="info"
            title="PAN Verification Required"
            message="As an individual supplier, you need to verify your PAN for identity verification. This is a one-time process."
            className="mb-6"
          />

          <GlassCard>
            <div className="p-8">
              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-3">
                  <Shield className="w-6 h-6 text-primary" />
                  <h2 className="text-2xl font-semibold">
                    Verify PAN
                  </h2>
                </div>
                <p className="text-muted-foreground">
                  Your PAN details will be verified using Zoop API
                </p>
              </div>

              {/* Form Fields */}
              <div className="space-y-6">
                {/* PAN Number */}
                <div className="space-y-2">
                  <Label htmlFor="panNumber">
                    PAN Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="panNumber"
                    value={panNumber}
                    onChange={handlePanChange}
                    placeholder="ABCDE1234F"
                    className="font-mono uppercase"
                    maxLength={PAN_CONFIG.LENGTH}
                    disabled={loading || result?.attempt.status === "VERIFIED"}
                  />
                  <p className="text-xs text-muted-foreground">
                    Format: 5 letters + 4 digits + 1 letter (e.g., ABCDE1234F)
                  </p>
                </div>

                {/* Name as per PAN */}
                <div className="space-y-2">
                  <Label htmlFor="nameAsPerPan">
                    Name as per PAN <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="nameAsPerPan"
                    value={nameAsPerPan}
                    onChange={(e) => setNameAsPerPan(e.target.value)}
                    placeholder="Full name as mentioned on PAN card"
                    disabled={loading || result?.attempt.status === "VERIFIED"}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter your name exactly as it appears on your PAN card
                  </p>
                </div>

                {/* Consent */}
                <div className="flex items-start space-x-3 p-4 bg-muted/50 rounded-lg">
                  <Checkbox
                    id="consent"
                    checked={consent}
                    onCheckedChange={(checked: boolean) => setConsent(checked as boolean)}
                    disabled={loading || result?.attempt.status === "VERIFIED"}
                  />
                  <Label
                    htmlFor="consent"
                    className="text-sm leading-relaxed cursor-pointer"
                  >
                    {consentText}
                  </Label>
                </div>
              </div>

              {/* Result Display */}
              {result && (
                <div className="mt-6">
                  {result.attempt.status === "VERIFIED" ? (
                    <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      <div>
                        <div className="font-semibold text-green-700 dark:text-green-400">
                          PAN Verified Successfully
                        </div>
                        <div className="text-sm text-muted-foreground">
                          PAN: {result.result.panLast4 && `****${result.result.panLast4}`} • Match Score: {result.result.nameMatchScore}%
                        </div>
                      </div>
                    </div>
                  ) : result.attempt.status === "FAILED" ? (
                    <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                      <XCircle className="w-5 h-5 text-destructive mt-0.5" />
                      <div>
                        <div className="font-semibold text-destructive">
                          Verification Failed
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {error || "Please check your details and try again"}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-yellow-500" />
                      <div>
                        <div className="font-semibold text-yellow-700 dark:text-yellow-400">
                          Verification Pending
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Your PAN is being verified...
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Error Message */}
              {error && !result && (
                <div className="mt-6 p-4 bg-destructive/10 border border-destructive rounded-lg text-sm text-destructive">
                  {error}
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-8 flex gap-4">
                <Button
                  onClick={handleSubmit}
                  disabled={!panNumber || !nameAsPerPan || !consent || loading || result?.attempt.status === "VERIFIED"}
                  className="flex-1"
                >
                  {loading ? "Verifying..." : result?.attempt.status === "VERIFIED" ? "Verified ✓" : "Verify PAN"}
                </Button>
              </div>

              {/* Help Text */}
              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <strong>Note:</strong> Your PAN will be verified using Zoop's PAN Pro API. 
                  We require a 100% name match and the PAN type must be "Person" for individual suppliers.
                </p>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </PageBackground>
  );
}
