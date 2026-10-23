"use client";

import React from "react";
import { AuthHeader, InfoCard, AuthButton } from "../shared";
import type { AuthTokens } from "@/hooks/useAuthTokens";

interface PasswordResetSuccessProps {
  onBackToLogin: () => void;
  tokens: AuthTokens;
  isDark: boolean;
}

export function PasswordResetSuccess({
  onBackToLogin,
  tokens,
  isDark,
}: PasswordResetSuccessProps) {
  return (
    <div className="space-y-5">
      <AuthHeader
        title="Password updated!"
        subtitle="Your password has been successfully reset."
        tokens={tokens}
      />

      <InfoCard icon="success" isDark={isDark} tokens={tokens}>
        <p>You can now sign in with your new password.</p>
      </InfoCard>

      <div className="pt-2">
        <AuthButton onClick={onBackToLogin} isDark={isDark}>
          Back to login
        </AuthButton>
      </div>
    </div>
  );
}
