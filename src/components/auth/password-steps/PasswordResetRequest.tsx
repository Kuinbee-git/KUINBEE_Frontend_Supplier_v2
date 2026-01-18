"use client";

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';
import { AuthHeader, InfoCard, AuthButton } from '../shared';

interface PasswordResetRequestProps {
  email: string;
  emailError: string;
  isLoading: boolean;
  onEmailChange: (value: string) => void;
  onSubmit: () => void;
  onBack: () => void;
  tokens: any;
  isDark: boolean;
}

export function PasswordResetRequest({
  email,
  emailError,
  isLoading,
  onEmailChange,
  onSubmit,
  onBack,
  tokens,
  isDark
}: PasswordResetRequestProps) {
  return (
    <div className="space-y-5">
      <AuthHeader
        title="Reset your password"
        subtitle="Enter your email address and we'll send you instructions to reset your password."
        tokens={tokens}
      />

      <div className="space-y-2">
        <Label 
          htmlFor="reset-email"
          className="text-sm transition-colors duration-300"
          style={{ color: tokens.textPrimary, fontWeight: 500 }}
        >
          Email address
        </Label>
        <Input
          id="reset-email"
          type="email"
          placeholder="your@company.com"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          className="h-12 transition-all duration-300"
          style={{
            borderColor: emailError ? '#ef4444' : tokens.inputBorder,
            backgroundColor: tokens.inputBg,
            color: tokens.textPrimary,
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
          }}
          autoFocus
          autoComplete="email"
        />
        {emailError && (
          <p className="text-xs text-red-500">{emailError}</p>
        )}
      </div>

      <InfoCard icon="mail" isDark={isDark} tokens={tokens}>
        <p>
          We&apos;ll send password reset instructions to this email address if it exists in our system.
        </p>
      </InfoCard>

      <div className="pt-2 space-y-3">
        <AuthButton
          onClick={onSubmit}
          isLoading={isLoading}
          isDark={isDark}
        >
          Send reset instructions
        </AuthButton>

        <button
          onClick={onBack}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 text-sm transition-colors hover:opacity-80"
          style={{ color: tokens.textSecondary }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to login
        </button>
      </div>
    </div>
  );
}
