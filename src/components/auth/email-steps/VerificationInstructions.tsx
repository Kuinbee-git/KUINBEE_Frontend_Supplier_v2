"use client";

import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { AuthHeader, InfoCard, AuthButton } from '../shared';

interface VerificationInstructionsProps {
  email: string;
  isLoading: boolean;
  onSend: () => void;
  onBack: () => void;
  tokens: any;
  isDark: boolean;
}

export function VerificationInstructions({
  email,
  isLoading,
  onSend,
  onBack,
  tokens,
  isDark
}: VerificationInstructionsProps) {
  return (
    <div className="space-y-5">
      <AuthHeader
        title="Verify your email address"
        subtitle="We need to confirm that you own this email address before you can continue."
        tokens={tokens}
      />

      <InfoCard icon="mail" isDark={isDark} tokens={tokens}>
        <p>
          We&apos;ll send a verification link to <strong>{email}</strong>
        </p>
        <p className="mt-2">
          Click the link in the email to verify your account. This helps us keep your account secure.
        </p>
      </InfoCard>

      <div className="pt-2 space-y-3">
        <AuthButton
          onClick={onSend}
          isLoading={isLoading}
          isDark={isDark}
        >
          Send verification email
        </AuthButton>

        <button
          onClick={onBack}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 text-sm transition-colors hover:opacity-80"
          style={{ color: tokens.textSecondary }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>
    </div>
  );
}
