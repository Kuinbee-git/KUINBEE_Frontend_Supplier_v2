"use client";

import React from 'react';
import { AuthHeader, InfoCard, AuthButton } from '../shared';

interface VerificationInvalidProps {
  onRequestNew: () => void;
  onBack: () => void;
  tokens: any;
  isDark: boolean;
}

export function VerificationInvalid({
  onRequestNew,
  onBack,
  tokens,
  isDark
}: VerificationInvalidProps) {
  return (
    <div className="space-y-5">
      <AuthHeader
        title="Invalid or expired link"
        subtitle="This verification link is no longer valid."
        tokens={tokens}
      />

      <InfoCard icon="alert" iconColor="#f59e0b" isDark={isDark} tokens={tokens}>
        <p>
          The verification link may have expired or already been used. Verification links are valid for 24 hours.
        </p>
        <p className="mt-2">
          You&apos;ll need to request a new verification email to continue.
        </p>
      </InfoCard>

      <div className="pt-2 space-y-3">
        <AuthButton onClick={onRequestNew} isDark={isDark}>
          Request new verification link
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
