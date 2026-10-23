"use client";

import React, { useCallback } from "react";
import { useThemeStore } from "@/store";
import { AuthShellWrapper } from "@/components/auth";
import { ForgotPasswordFlow } from "@/components/auth/ForgotPasswordFlow";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { isDark, toggleTheme: handleToggleDark } = useThemeStore();

  const handleBackToLogin = useCallback(() => {
    router.push("/auth/login");
  }, [router]);

  return (
    <AuthShellWrapper isDark={isDark} onToggleDark={handleToggleDark}>
      <ForgotPasswordFlow isDark={isDark} onBackToLogin={handleBackToLogin} />
    </AuthShellWrapper>
  );
}
