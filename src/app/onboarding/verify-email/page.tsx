"use client";

import React, { useState, useCallback, useEffect } from "react";
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

  const handleSendOtp = useCallback(async () => {
    try {
      setError(null);
      await sendEmailOtp({ reason: "SUPPLIER_ONBOARDING" });
      // OTP sent successfully
    } catch (err: any) {
      // Failed to send OTP (logged silently)
      setError(err.message || "Failed to send OTP");
      throw err;
    }
  }, []);

  // Send OTP automatically when page mounts
  useEffect(() => {
    // call and ignore errors here (handled by handler)
    handleSendOtp().catch(() => {});
  }, [handleSendOtp]);

  const handleVerifyOtp = useCallback(async (otp: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Verifying OTP
      
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
      // Verification failed (logged silently)
      setError(err.message || "Invalid or expired OTP");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [router]);

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
        onResend={handleSendOtp}
        onChangeEmail={handleBackToLogin}
        isDark={isDark}
      />
    </AuthShellWrapper>
  );
}
