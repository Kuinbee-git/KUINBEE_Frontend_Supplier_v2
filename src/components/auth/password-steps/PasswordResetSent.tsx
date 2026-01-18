"use client";

import React from 'react';
import { Mail } from 'lucide-react';
import { AuthHeader, InfoCard, AuthButton } from '../shared';
import { maskEmail } from '@/lib/utils/auth.utils';

interface PasswordResetSentProps {
  email: string;
  isLoading: boolean;
  onResend: () => void;
  onBack: () => void;
  tokens: any;
  isDark: boolean;
}

export function PasswordResetSent({
  email,
  isLoading,
  onResend,
  onBack,
  tokens,
  isDark
}: PasswordResetSentProps) {
  return (
    <div className="space-y-5">
      <div className="flex justify-center mb-4">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)',
          }}
        >
          <Mail className="w-8 h-8 text-white" />
        </div>
      </div>

      <AuthHeader
        title="Check your email"
        subtitle={`If an account exists for ${maskEmail(email)}, you'll receive password reset instructions.`}
        tokens={tokens}
      />

      <InfoCard icon="mail" isDark={isDark} tokens={tokens}>
        <p>
          The email will contain a link to reset your password. The link will expire in 1 hour for security reasons.
        </p>
        <p className="mt-2">
          Didn&apos;t receive the email? Check your spam folder or click below to resend.
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
