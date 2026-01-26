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
import { useSupplierTokens } from "@/hooks";
import { useThemeStore } from "@/store";
import type { VerifyPanResponse } from "@/types";

export default function VerifyPanPage() {
  const router = useRouter();
  const tokens = useSupplierTokens();
  const { theme } = useThemeStore();
  const isDark = theme === "dark";
  
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
                  <Shield className="w-6 h-6" style={{ color: tokens.textPrimary }} />
                  <h2 
                    className="text-2xl font-semibold"
                    style={{ color: tokens.textPrimary }}
                  >
                    Verify PAN
                  </h2>
                </div>
                <p style={{ color: tokens.textSecondary }} className="text-sm">
                  Your PAN details will be verified using Zoop API
                </p>
              </div>

              {/* Form Fields */}
              <div className="space-y-6">
                {/* PAN Number */}
                <div className="space-y-2">
                  <Label 
                    htmlFor="panNumber"
                    style={{ 
                      color: tokens.textPrimary,
                      '--label-color': tokens.textPrimary,
                      fontWeight: 500,
                      fontSize: '0.875rem'
                    } as React.CSSProperties & { '--label-color': string }}
                  >
                    PAN Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="panNumber"
                    value={panNumber}
                    onChange={handlePanChange}
                    placeholder="ABCDE1234F"
                    className="h-11 font-mono uppercase transition-all duration-300 autofill-fix"
                    style={{
                      borderColor: tokens.inputBorder,
                      backgroundColor: tokens.inputBg,
                      backdropFilter: "blur(16px)",
                      WebkitBackdropFilter: "blur(16px)",
                      "--placeholder-color": tokens.textMuted,
                      "--input-text-color": tokens.textPrimary,
                    } as React.CSSProperties & { "--placeholder-color": string; "--input-text-color": string }}
                    maxLength={PAN_CONFIG.LENGTH}
                    disabled={loading || result?.attempt.status === "VERIFIED"}
                    autoComplete="off"
                  />
                  <p style={{ color: tokens.textMuted }} className="text-xs">
                    Format: 5 letters + 4 digits + 1 letter (e.g., ABCDE1234F)
                  </p>
                </div>

                {/* Name as per PAN */}
                <div className="space-y-2">
                  <Label 
                    htmlFor="nameAsPerPan"
                    style={{ 
                      color: tokens.textPrimary,
                      '--label-color': tokens.textPrimary,
                      fontWeight: 500,
                      fontSize: '0.875rem'
                    } as React.CSSProperties & { '--label-color': string }}
                  >
                    Name as per PAN <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="nameAsPerPan"
                    value={nameAsPerPan}
                    onChange={(e) => setNameAsPerPan(e.target.value)}
                    placeholder="Full name as mentioned on PAN card"
                    className="h-11 transition-all duration-300 autofill-fix"
                    style={{
                      borderColor: tokens.inputBorder,
                      backgroundColor: tokens.inputBg,
                      backdropFilter: "blur(16px)",
                      WebkitBackdropFilter: "blur(16px)",
                      "--placeholder-color": tokens.textMuted,
                      "--input-text-color": tokens.textPrimary,
                    } as React.CSSProperties & { "--placeholder-color": string; "--input-text-color": string }}
                    disabled={loading || result?.attempt.status === "VERIFIED"}
                    autoComplete="off"
                  />
                  <p style={{ color: tokens.textMuted }} className="text-xs">
                    Enter your name exactly as it appears on your PAN card
                  </p>
                </div>

                {/* Consent */}
                <div 
                  className="flex items-start gap-3 p-5 rounded-lg border transition-all duration-200"
                  style={{ 
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.6)',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(26, 34, 64, 0.1)',
                    borderWidth: '1px'
                  }}
                >
                  <Checkbox
                    id="consent"
                    checked={consent}
                    onCheckedChange={(checked: boolean) => setConsent(checked as boolean)}
                    disabled={loading || result?.attempt.status === "VERIFIED"}
                    className="mt-1"
                    style={{
                      borderColor: consent ? (isDark ? '#ffffff' : '#1a2240') : (isDark ? 'rgba(255, 255, 255, 0.2)' : '#cbd5e1'),
                      backgroundColor: consent 
                        ? (isDark ? '#ffffff' : '#1a2240')
                        : (isDark ? 'rgba(255, 255, 255, 0.08)' : '#ffffff'),
                      color: consent ? (isDark ? '#1a2240' : '#ffffff') : 'transparent',
                      borderWidth: '2px',
                      width: '18px',
                      height: '18px',
                      minWidth: '18px',
                      minHeight: '18px',
                    }}
                  />
                  <Label
                    htmlFor="consent"
                    style={{ 
                      color: tokens.textPrimary,
                      '--label-color': tokens.textPrimary,
                      fontWeight: 500
                    } as React.CSSProperties & { '--label-color': string }}
                    className="text-sm leading-relaxed cursor-pointer flex-1"
                  >
                    {consentText}
                  </Label>
                </div>
              </div>

              {/* Result Display */}
              {result && (
                <div className="mt-6">
                  {result.attempt.status === "VERIFIED" ? (
                    <div 
                      className="flex items-center gap-3 p-4 rounded-lg"
                      style={{
                        backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : '#d1fae5',
                        borderColor: tokens.successBorder,
                        border: `1px solid ${tokens.successBorder}`
                      }}
                    >
                      <CheckCircle2 className="w-5 h-5" style={{ color: tokens.successText }} />
                      <div>
                        <div style={{ color: tokens.successText }} className="font-semibold text-sm">
                          PAN Verified Successfully
                        </div>
                        <div style={{ color: tokens.textMuted }} className="text-xs mt-1">
                          PAN: {result.result.panLast4 && `****${result.result.panLast4}`} • Match Score: {result.result.nameMatchScore}%
                        </div>
                      </div>
                    </div>
                  ) : result.attempt.status === "FAILED" ? (
                    <div 
                      className="flex items-start gap-3 p-4 rounded-lg"
                      style={{
                        backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#fef2f2',
                        borderColor: tokens.errorBorder,
                        border: `1px solid ${tokens.errorBorder}`
                      }}
                    >
                      <XCircle className="w-5 h-5 mt-0.5" style={{ color: tokens.errorText }} />
                      <div>
                        <div style={{ color: tokens.errorText }} className="font-semibold text-sm">
                          Verification Failed
                        </div>
                        <div style={{ color: tokens.textMuted }} className="text-xs mt-1">
                          {error || "Please check your details and try again"}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div 
                      className="flex items-center gap-3 p-4 rounded-lg"
                      style={{
                        backgroundColor: isDark ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.08)',
                        borderColor: tokens.warningBorder,
                        border: `1px solid ${tokens.warningBorder}`
                      }}
                    >
                      <AlertCircle className="w-5 h-5" style={{ color: tokens.warningText }} />
                      <div>
                        <div style={{ color: tokens.warningText }} className="font-semibold text-sm">
                          Verification Pending
                        </div>
                        <div style={{ color: tokens.textMuted }} className="text-xs mt-1">
                          Your PAN is being verified...
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Error Message */}
              {error && !result && (
                <div 
                  className="mt-6 p-4 rounded-lg text-sm"
                  style={{
                    backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#fef2f2',
                    borderColor: tokens.errorBorder,
                    border: `1px solid ${tokens.errorBorder}`,
                    color: tokens.errorText
                  }}
                >
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
              <div 
                className="mt-6 p-4 rounded-lg"
                style={{ backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.5)' }}
              >
                <p style={{ color: tokens.textSecondary }} className="text-xs leading-relaxed font-medium">
                  <strong style={{ color: tokens.textPrimary }}>Note:</strong> Your PAN will be verified using Zoop's PAN Pro API. 
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
