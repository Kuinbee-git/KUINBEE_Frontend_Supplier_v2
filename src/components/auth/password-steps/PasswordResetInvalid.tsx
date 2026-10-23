"use client";

import React from "react";
import { DashboardButton } from "@/components/dashboard/ui/dashboard-button";
import { AuthHeader, InfoCard, AuthButton } from "../shared";
import type { AuthTokens } from "@/hooks/useAuthTokens";

interface PasswordResetInvalidProps {
  onRequestNew: () => void;
  onBack: () => void;
  tokens: AuthTokens;
  isDark: boolean;
}

export function PasswordResetInvalid({
  onRequestNew,
  onBack,
  tokens,
  isDark,
}: PasswordResetInvalidProps) {
  return (
    <div className="space-y-5">
      <AuthHeader
        title="Invalid or expired link"
        subtitle="This password reset link is no longer valid."
        tokens={tokens}
      />

      <InfoCard icon="alert" isDark={isDark} tokens={tokens}>
        <p>
          The reset link may have expired or already been used. Password reset
          links are valid for 30 minutes.
        </p>
        <p className="mt-2">
          You&apos;ll need to request a new reset link to continue.
        </p>
      </InfoCard>

      <div className="pt-2 space-y-3">
        <AuthButton onClick={onRequestNew} isDark={isDark}>
          Request new reset link
        </AuthButton>

        <DashboardButton variant="ghost" className="w-full" onClick={onBack}>
          Back to login
        </DashboardButton>
      </div>
    </div>
  );
}
