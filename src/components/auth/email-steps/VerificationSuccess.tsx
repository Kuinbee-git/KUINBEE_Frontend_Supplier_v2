"use client";

import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { AuthHeader, InfoCard, AuthButton } from '../shared';

interface VerificationSuccessProps {
  onContinue: () => void;
  tokens: any;
  isDark: boolean;
}

export function VerificationSuccess({
  onContinue,
  tokens,
  isDark
}: VerificationSuccessProps) {
  return (
    <div className="space-y-5">
      <div className="flex justify-center mb-4">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            boxShadow: '0 8px 24px rgba(16, 185, 129, 0.3)',
          }}
        >
          <CheckCircle2 className="w-8 h-8 text-white" />
        </div>
      </div>

      <AuthHeader
        title="Email verified!"
        subtitle="Your email address has been successfully verified."
        tokens={tokens}
      />

      <InfoCard icon="success" iconColor="#22c55e" isDark={isDark} tokens={tokens}>
        <p>
          You can now access all features of your Kuinbee supplier account.
        </p>
      </InfoCard>

      <div className="pt-2">
        <AuthButton onClick={onContinue} isDark={isDark}>
          Continue to dashboard
        </AuthButton>
      </div>
    </div>
  );
}
