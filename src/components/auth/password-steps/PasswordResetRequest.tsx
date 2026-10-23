"use client";

import React from "react";
import { DashboardButton } from "@/components/dashboard/ui/dashboard-button";
import {
  DashboardField,
  DashboardInput,
} from "@/components/dashboard/ui/dashboard-form";
import { ArrowLeft } from "lucide-react";
import { AuthHeader, InfoCard, AuthButton } from "../shared";
import type { AuthTokens } from "@/hooks/useAuthTokens";

interface PasswordResetRequestProps {
  email: string;
  emailError: string;
  isLoading: boolean;
  onEmailChange: (value: string) => void;
  onSubmit: () => void;
  onBack: () => void;
  tokens: AuthTokens;
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
  isDark,
}: PasswordResetRequestProps) {
  return (
    <div className="space-y-5">
      <AuthHeader
        title="Reset your password"
        subtitle="Enter your email address and we'll send you instructions to reset your password."
        tokens={tokens}
      />

      <DashboardField id="reset-email" label="Email address" error={emailError}>
        {(control) => (
          <DashboardInput
            {...control}
            type="email"
            placeholder="your@company.com"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            autoFocus
            autoComplete="email"
          />
        )}
      </DashboardField>

      <InfoCard icon="mail" isDark={isDark} tokens={tokens}>
        <p>
          We&apos;ll send password reset instructions to this email address if
          it exists in our system.
        </p>
      </InfoCard>

      <div className="pt-2 space-y-3">
        <AuthButton onClick={onSubmit} isLoading={isLoading} isDark={isDark}>
          Send reset instructions
        </AuthButton>

        <DashboardButton
          variant="ghost"
          className="w-full"
          onClick={onBack}
          disabled={isLoading}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to login
        </DashboardButton>
      </div>
    </div>
  );
}
