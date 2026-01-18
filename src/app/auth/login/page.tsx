"use client";

import React, { useState, useCallback } from "react";
import { AuthShellWrapper, AuthStates, type AuthStateType } from "@/components/auth";
import { useRouter } from "next/navigation";
import { useThemeStore } from "@/store";

export default function LoginPage() {
  const router = useRouter();
  
  // Use Zustand theme store for persistent dark mode
  const { isDark, toggleTheme } = useThemeStore();
  
  // Auth state management
  const [authState, setAuthState] = useState<AuthStateType>("initial");
  const [email, setEmail] = useState("");

  // Toggle dark mode using store
  const handleToggleDark = useCallback(() => {
    toggleTheme();
  }, [toggleTheme]);

  // Handle auth state changes
  const handleStateChange = useCallback((newState: AuthStateType) => {
    setAuthState(newState);
  }, []);

  // Handle email changes
  const handleEmailChange = useCallback((newEmail: string) => {
    setEmail(newEmail);
  }, []);

  // Handle successful authentication
  const handleSuccess = useCallback(() => {
    console.log("[AUTH] Authentication successful, redirecting...");
    // Check onboarding status - this will be handled by dashboard layout
    // If onboarding incomplete, dashboard layout will redirect appropriately
    router.push("/dashboard");
  }, [router]);

  // Handle forgot password
  const handleForgotPassword = useCallback(() => {
    console.log("[AUTH] Forgot password");
    // Navigate to forgot password page
    router.push("/auth/forgot-password");
  }, [router]);

  // Handle create account
  const handleCreateAccount = useCallback(() => {
    console.log("[AUTH] Navigate to registration");
    router.push("/auth/register");
  }, [router]);

  return (
    <AuthShellWrapper 
      isDark={isDark} 
      onToggleDark={handleToggleDark}
    >
      <AuthStates
        state={authState}
        email={email}
        onStateChange={handleStateChange}
        onEmailChange={handleEmailChange}
        isDark={isDark}
        onSuccess={handleSuccess}
        onForgotPassword={handleForgotPassword}
        onCreateAccount={handleCreateAccount}
      />
    </AuthShellWrapper>
  );
}
