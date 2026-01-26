"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { OTPVerification } from "@/components/auth";
import { sendEmailOtp, verifyEmailOtp, getOnboardingStatus } from "@/lib/api";
import { ONBOARDING_STEP_ROUTES } from "@/constants";
import { AuthShellWrapper } from "@/components/auth";
import { useThemeStore } from "@/store";

export default function VerifyEmailPage() {
  const router = useRouter();
  const { isDark, toggleTheme } = useThemeStore();
  const [email] = useState(""); // Will be fetched from session
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);
  const hasAttemptedSendRef = useRef(false);
  const resendAttemptCountRef = useRef(0);

  const handleSendOtp = useCallback(async () => {
    try {
      setError(null);
      setResendError(null);
      await sendEmailOtp({ reason: "SUPPLIER_ONBOARDING" });
      resendAttemptCountRef.current = 0;
      console.log('[OTP] OTP sent successfully');
      // OTP sent successfully
    } catch (err: any) {
      const errorMsg = err.message || "Failed to send OTP";
      console.error('[OTP] Failed to send OTP:', errorMsg, err.status);
      
      // Detect rate limiting
      if (err.status === 429) {
        const rateLimitMsg = "Too many requests. Please wait before trying again.";
        setResendError(rateLimitMsg);
        if (!hasAttemptedSendRef.current) {
          setError(rateLimitMsg);
        }
      } else {
        setResendError(errorMsg);
        if (!hasAttemptedSendRef.current) {
          setError(errorMsg);
        }
      }
      
      throw err;
    }
  }, []);

  // Send OTP automatically when page mounts (only once)
  useEffect(() => {
    const sendOtpOnMount = async () => {
      if (hasAttemptedSendRef.current) {
        console.log('[OTP] Already attempted to send OTP');
        return;
      }
      
      hasAttemptedSendRef.current = true;
      console.log('[OTP] Sending OTP on page mount');
      
      try {
        await handleSendOtp();
      } catch (err) {
        console.error('[OTP] Error sending OTP on mount:', err);
        // Error is already set in handleSendOtp
      }
    };

    // Call immediately without delay to ensure it sends on mount
    sendOtpOnMount();
  }, [handleSendOtp]);

  const handleVerifyOtp = useCallback(async (otp: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Verify OTP
      await verifyEmailOtp({ 
        otp, 
        reason: "SUPPLIER_ONBOARDING" 
      });
      
      // OTP verified successfully
      
      // Fetch updated status and navigate to next step
      const status = await getOnboardingStatus();
      const nextRoute = ONBOARDING_STEP_ROUTES[status.onboarding.nextStep];
      
      // Navigating to next route
      router.push(nextRoute);
    } catch (err: any) {
      // Verification failed
      const errorMsg = err.message || "Invalid or expired OTP";
      
      if (err.status === 429) {
        setError("Too many verification attempts. Please try again in a few minutes.");
      } else {
        setError(errorMsg);
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleResendClick = useCallback(async () => {
    resendAttemptCountRef.current += 1;
    await handleSendOtp();
  }, [handleSendOtp]);

  const handleBackToLogin = useCallback(() => {
    router.push("/auth/login");
  }, [router]);

  return (
    <AuthShellWrapper 
      isDark={isDark} 
      onToggleDark={toggleTheme}
    >
      <OTPVerification
        email={email || "your email"}
        onVerify={handleVerifyOtp}
        onResend={handleResendClick}
        onChangeEmail={handleBackToLogin}
        isDark={isDark}
        error={error}
        resendError={resendError}
      />
    </AuthShellWrapper>
  );
}
