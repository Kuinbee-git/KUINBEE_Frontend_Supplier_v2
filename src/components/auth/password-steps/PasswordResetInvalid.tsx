"use client";

import React from 'react';
import { AuthHeader, InfoCard, AuthButton } from '../shared';

interface PasswordResetInvalidProps {
  onRequestNew: () => void;
  onBack: () => void;
  tokens: any;
  isDark: boolean;
}

export function PasswordResetInvalid({
  onRequestNew,
  onBack,
  tokens,
  isDark
}: PasswordResetInvalidProps) {
  return (
    <div className="space-y-5">
      <AuthHeader
        title="Invalid or expired link"
        subtitle="This password reset link is no longer valid."
        tokens={tokens}
      />

      <InfoCard icon="alert" iconColor="#f59e0b" isDark={isDark} tokens={tokens}>
        <p>
          The reset link may have expired or already been used. Password reset links are valid for 1 hour.
        </p>
        <p className="mt-2">
          You&apos;ll need to request a new reset link to continue.
        </p>
      </InfoCard>

      <div className="pt-2 space-y-3">
        <AuthButton onClick={onRequestNew} isDark={isDark}>
          Request new reset link
        </AuthButton>

        <button
          onClick={onBack}
          className="w-full text-sm transition-colors hover:underline underline-offset-4"
          style={{ color: tokens.textSecondary }}
        >
          Back to login
        </button>
      </div>
    </div>
  );
}
