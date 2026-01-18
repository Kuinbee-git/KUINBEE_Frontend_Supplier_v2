"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { NewSupplierForm } from "@/components/auth";
import { registerSupplier } from "@/lib/api";
import { AuthShellWrapper } from "@/components/auth";
import { useThemeStore } from "@/store";

export default function RegisterPage() {
  const router = useRouter();
  const { isDark, toggleTheme } = useThemeStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = useCallback(async (email: string, password?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      if (!password) {
        setError("Password is required");
        return;
      }
      
      console.log("[REGISTER] Registering supplier:", email);
      
      // Call registration API
      await registerSupplier({ email, password });
      
      console.log("[REGISTER] Registration successful, redirecting to dashboard...");
      
      // Navigate to dashboard (will auto-redirect to onboarding)
      router.push("/dashboard");
    } catch (err: any) {
      console.error("[REGISTER] Registration failed:", err);
      setError(err.message || "Registration failed. Please try again.");
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
      <NewSupplierForm
        onSubmit={handleRegister}
        onBackToLogin={handleBackToLogin}
        loading={loading}
        error={error}
      />
    </AuthShellWrapper>
  );
}
