"use client";

import { useEffect, useState } from "react";
import { useAuthTokens } from "@/hooks/useAuthTokens";
import {
  confirmSupplierPasswordReset,
  requestSupplierPasswordReset,
} from "@/lib/api/auth";
import { validateEmail, validatePasswords } from "@/lib/utils/auth.utils";
import { AuthAlert } from "./shared";
import {
  PasswordResetRequest,
  PasswordResetSent,
  PasswordResetInvalid,
  PasswordResetForm,
  PasswordResetSuccess,
} from "./password-steps";

export type ForgotPasswordStep =
  | "request"
  | "sent"
  | "invalid"
  | "reset"
  | "success";

interface ForgotPasswordFlowProps {
  isDark?: boolean;
  step?: ForgotPasswordStep;
  resetToken?: string;
  resetEmail?: string;
  onBackToLogin: () => void;
}

/**
 * Password reset flow with step-based navigation
 * Refactored to use modular step components
 */
export function ForgotPasswordFlow({
  isDark = false,
  step = "request",
  resetToken,
  resetEmail,
  onBackToLogin,
}: ForgotPasswordFlowProps) {
  const [currentStep, setCurrentStep] = useState<ForgotPasswordStep>(step);
  const [email, setEmail] = useState(resetEmail ?? "");
  const [emailError, setEmailError] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [networkError, setNetworkError] = useState("");

  const tokens = useAuthTokens(isDark);

  useEffect(() => {
    setCurrentStep(step);
    if (resetEmail) setEmail(resetEmail);
  }, [resetEmail, step]);

  const handleSendResetInstructions = async () => {
    setEmailError("");
    setNetworkError("");

    const error = validateEmail(email);
    if (error) {
      setEmailError(error);
      return;
    }

    setIsLoading(true);

    try {
      await requestSupplierPasswordReset(email);
      setCurrentStep("sent");
    } catch (err: unknown) {
      setNetworkError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setIsLoading(true);
    setNetworkError("");

    try {
      await requestSupplierPasswordReset(email);
    } catch (err: unknown) {
      setNetworkError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    setPasswordError("");
    setNetworkError("");

    const error = validatePasswords(newPassword, confirmPassword);
    if (error) {
      setPasswordError(error);
      return;
    }

    setIsLoading(true);

    try {
      if (!resetToken || !email) {
        setCurrentStep("invalid");
        return;
      }

      await confirmSupplierPasswordReset({
        email,
        token: resetToken,
        newPassword,
      });
      setCurrentStep("success");
    } catch (err: unknown) {
      const code =
        err instanceof Error && "code" in err
          ? (err as Error & { code?: string }).code
          : undefined;

      if (code === "TOKEN_EXPIRED" || code === "TOKEN_INVALID") {
        setCurrentStep("invalid");
      } else {
        setNetworkError(
          err instanceof Error
            ? err.message
            : "Something went wrong. Please try again."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestNew = () => {
    setCurrentStep("request");
    setEmail("");
    setEmailError("");
  };

  const handleBackToLoginClick = () => {
    onBackToLogin();
  };

  return (
    <div className="space-y-5">
      {networkError && (
        <AuthAlert
          message={networkError}
          variant="error"
          isDark={isDark}
          tokens={tokens}
        />
      )}

      {currentStep === "request" && (
        <PasswordResetRequest
          email={email}
          emailError={emailError}
          isLoading={isLoading}
          onEmailChange={setEmail}
          onSubmit={handleSendResetInstructions}
          onBack={handleBackToLoginClick}
          tokens={tokens}
          isDark={isDark}
        />
      )}

      {currentStep === "sent" && (
        <PasswordResetSent
          email={email}
          isLoading={isLoading}
          onResend={handleResendEmail}
          onBack={handleBackToLoginClick}
          tokens={tokens}
          isDark={isDark}
        />
      )}

      {currentStep === "invalid" && (
        <PasswordResetInvalid
          onRequestNew={handleRequestNew}
          onBack={handleBackToLoginClick}
          tokens={tokens}
          isDark={isDark}
        />
      )}

      {currentStep === "reset" && (
        <PasswordResetForm
          newPassword={newPassword}
          confirmPassword={confirmPassword}
          passwordError={passwordError}
          isLoading={isLoading}
          onNewPasswordChange={setNewPassword}
          onConfirmPasswordChange={setConfirmPassword}
          onSubmit={handleUpdatePassword}
          tokens={tokens}
          isDark={isDark}
        />
      )}

      {currentStep === "success" && (
        <PasswordResetSuccess
          onBackToLogin={handleBackToLoginClick}
          tokens={tokens}
          isDark={isDark}
        />
      )}
    </div>
  );
}
