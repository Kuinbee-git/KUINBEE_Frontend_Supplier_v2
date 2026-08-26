"use client";

import React, { memo, useCallback, useState } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { NewSupplierForm } from "./NewSupplierForm";
import { LoadingState } from "./LoadingState";
import { OTPVerification } from "./OTPVerification";
import { login } from "@/lib/api/auth";

export type AuthStateType =
  | "initial"
  | "checking"
  | "password"
  | "otp"
  | "new_supplier";

interface AuthStatesProps {
  state: AuthStateType;
  email: string;
  onStateChange: (state: AuthStateType) => void;
  onEmailChange: (email: string) => void;
  isDark?: boolean;
  onSuccess?: () => void;
  onForgotPassword?: () => void;
  onCreateAccount?: () => void;
}

function AuthStatesComponent({
  state,
  email,
  onStateChange,
  onEmailChange,
  isDark = false,
  onSuccess,
  onForgotPassword,
  onCreateAccount,
}: AuthStatesProps) {
  const [loginError, setLoginError] = useState<string>("");

  // Handle login submission
  const handleLogin = useCallback(
    async (submittedEmail: string, password: string) => {
      setLoginError("");

      // Show loading state
      onStateChange("checking");

      try {
        // Call actual login API
        const response = await login({
          email: submittedEmail,
          password: password,
        });

        const user = response.data.user;

        // Verify this is a supplier account
        if (user?.userType && user.userType !== "SUPPLIER") {
          setLoginError("Access denied. This portal is for suppliers only.");
          onStateChange("initial");
          return;
        }

        // On success, trigger parent success handler which will:
        // 1. Navigate to dashboard
        // 2. Dashboard layout will check onboarding status
        // 3. If incomplete, redirect to appropriate onboarding step
        onSuccess?.();
      } catch (error: unknown) {
        console.error("[AUTH] Login failed:", error);

        // Show error and return to login form
        setLoginError(
          error instanceof Error
            ? error.message
            : "Login failed. Please check your credentials."
        );
        onStateChange("initial");
      }
    },
    [onStateChange, onSuccess]
  );

  // Handle create account navigation
  const handleCreateAccount = useCallback(() => {
    if (onCreateAccount) {
      onCreateAccount();
    } else {
      // Fallback: navigate to new_supplier state
      onStateChange("new_supplier");
    }
  }, [onStateChange, onCreateAccount]);

  // Handle forgot password
  const handleForgotPassword = useCallback(() => {
    onForgotPassword?.();
  }, [onForgotPassword]);

  // Handle new supplier form submission (sends OTP)
  const handleNewSupplierSubmit = useCallback(
    (submittedEmail: string) => {
      void submittedEmail;

      // Show loading state briefly
      onStateChange("checking");

      // Simulate OTP send
      setTimeout(() => {
        onStateChange("otp");
      }, 800);
    },
    [onStateChange]
  );

  // Handle OTP verification
  const handleOTPVerify = useCallback(
    (code: string) => {
      void code;
      onSuccess?.();
    },
    [onSuccess]
  );

  // Handle back to initial state
  const handleBackToLogin = useCallback(() => {
    onStateChange("initial");
  }, [onStateChange]);

  // Render based on current state
  switch (state) {
    case "initial":
      return (
        <LoginForm
          email={email}
          onEmailChange={onEmailChange}
          onSubmit={handleLogin}
          onCreateAccount={handleCreateAccount}
          onForgotPassword={handleForgotPassword}
          isDark={isDark}
          error={loginError}
        />
      );

    case "checking":
      return (
        <LoadingState email={email} isDark={isDark} message="Signing in..." />
      );

    case "new_supplier":
      return (
        <NewSupplierForm
          email={email}
          onEmailChange={onEmailChange}
          onSubmit={handleNewSupplierSubmit}
          onBack={handleBackToLogin}
          isDark={isDark}
        />
      );

    case "otp":
      return (
        <OTPVerification
          email={email}
          onVerify={handleOTPVerify}
          onChangeEmail={handleBackToLogin}
          isDark={isDark}
        />
      );

    case "password":
      // This state is for existing suppliers - handled in LoginForm
      return (
        <LoginForm
          email={email}
          onEmailChange={onEmailChange}
          onSubmit={handleLogin}
          onCreateAccount={handleCreateAccount}
          onForgotPassword={handleForgotPassword}
          isDark={isDark}
        />
      );

    default:
      return null;
  }
}

export const AuthStates = memo(AuthStatesComponent);
export default AuthStates;
