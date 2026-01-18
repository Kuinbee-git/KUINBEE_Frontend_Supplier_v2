"use client";

import React, { useState, useCallback } from "react";
import { AuthShellWrapper } from "@/components/auth";
import { ForgotPasswordFlow } from "@/components/auth/ForgotPasswordFlow";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [isDark, setIsDark] = useState(false);

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
        onBackToLogin={handleBackToLogin}
        onPasswordResetComplete={handlePasswordResetComplete}
      />
    </AuthShellWrapper>
  );
}
