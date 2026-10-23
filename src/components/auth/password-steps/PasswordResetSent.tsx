"use client";

import React from "react";
import { DashboardButton } from "@/components/dashboard/ui/dashboard-button";
import { AuthHeader, InfoCard, AuthButton } from "../shared";
import { maskEmail } from "@/lib/utils/auth.utils";
import type { AuthTokens } from "@/hooks/useAuthTokens";

interface PasswordResetSentProps {
  email: string;
  isLoading: boolean;
  onResend: () => void;
  onBack: () => void;
  tokens: AuthTokens;
  isDark: boolean;
}

export function PasswordResetSent({
  email,
  isLoading,
  onResend,
  onBack,
  tokens,
  isDark,
}: PasswordResetSentProps) {
  return (
    <div className="space-y-5">
      <AuthHeader
        title="Check your email"
        subtitle={`If an account exists for ${maskEmail(email)}, you'll receive password reset instructions.`}
        tokens={tokens}
      />

      <InfoCard icon="mail" isDark={isDark} tokens={tokens}>
        <p>
          The email will contain a link to reset your password. The link will
          expire in 30 minutes for security reasons.
        </p>
        <p className="mt-2">
          Didn&apos;t receive the email? Check your spam folder or click below
          to resend.
        </p>
      </InfoCard>

      <div className="pt-2 space-y-3">
        <AuthButton
          onClick={onResend}
          isLoading={isLoading}
          variant="secondary"
          isDark={isDark}
        >
          Resend reset instructions
        </AuthButton>

        <DashboardButton variant="ghost" className="w-full" onClick={onBack}>
          Back to login
        </DashboardButton>
      </div>
    </div>
  );
}
