"use client";

import React, { useState, useCallback, useEffect, Suspense } from "react";
import { AuthShellWrapper } from "@/components/auth";
import { ForgotPasswordFlow } from "@/components/auth/ForgotPasswordFlow";
import { useRouter, useSearchParams } from "next/navigation";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isDark, setIsDark] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);

  // Get token from URL
  useEffect(() => {
    const token = searchParams.get('token');
    setResetToken(token);
  }, [searchParams]);

  const handleToggleDark = useCallback(() => {
    setIsDark(prev => !prev);
  }, []);

  const handleBackToLogin = useCallback(() => {
    router.push("/auth/login");
  }, [router]);

  const handlePasswordResetComplete = useCallback(() => {
    router.push("/auth/login");
  }, [router]);

  return (
    <AuthShellWrapper 
      isDark={isDark} 
      onToggleDark={handleToggleDark}
    >
      <ForgotPasswordFlow
        isDark={isDark}
        step={resetToken ? "reset" : "invalid"}
        resetToken={resetToken || undefined}
        onBackToLogin={handleBackToLogin}
        onPasswordResetComplete={handlePasswordResetComplete}
      />
    </AuthShellWrapper>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
