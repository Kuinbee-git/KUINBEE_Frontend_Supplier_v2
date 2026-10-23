"use client";

import React, { useCallback, Suspense } from "react";
import { useThemeStore } from "@/store";
import { AuthShellWrapper } from "@/components/auth";
import { ForgotPasswordFlow } from "@/components/auth/ForgotPasswordFlow";
import { useRouter, useSearchParams } from "next/navigation";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isDark, toggleTheme: handleToggleDark } = useThemeStore();
  const resetToken = searchParams.get("token");
  const resetEmail = searchParams.get("email");

  const handleBackToLogin = useCallback(() => {
    router.push("/auth/login");
  }, [router]);

  return (
    <AuthShellWrapper isDark={isDark} onToggleDark={handleToggleDark}>
      <ForgotPasswordFlow
        isDark={isDark}
        step={resetToken && resetEmail ? "reset" : "invalid"}
        resetToken={resetToken || undefined}
        resetEmail={resetEmail || undefined}
        onBackToLogin={handleBackToLogin}
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
