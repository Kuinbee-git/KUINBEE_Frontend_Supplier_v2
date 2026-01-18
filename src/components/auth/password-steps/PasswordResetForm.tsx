"use client";

import React from 'react';
import { AuthHeader, PasswordInput, PasswordStrengthIndicator, AuthButton } from '../shared';

interface PasswordResetFormProps {
  newPassword: string;
  confirmPassword: string;
  passwordError: string;
  isLoading: boolean;
  onNewPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onSubmit: () => void;
  tokens: any;
  isDark: boolean;
}

export function PasswordResetForm({
  newPassword,
  confirmPassword,
  passwordError,
  isLoading,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onSubmit,
  tokens,
  isDark
}: PasswordResetFormProps) {
  return (
    <div className="space-y-5">
      <AuthHeader
        title="Create new password"
        subtitle="Choose a strong password for your account."
        tokens={tokens}
      />

      <div className="space-y-4">
        <div>
          <PasswordInput
            id="new-password"
            label="New password"
            value={newPassword}
            onChange={(e) => onNewPasswordChange(e.target.value)}
            placeholder="Enter new password"
            autoComplete="new-password"
            tokens={tokens}
          />
          <PasswordStrengthIndicator password={newPassword} tokens={tokens} />
        </div>

        <PasswordInput
          id="confirm-password"
          label="Confirm password"
          value={confirmPassword}
          onChange={(e) => onConfirmPasswordChange(e.target.value)}
          placeholder="Confirm new password"
          autoComplete="new-password"
          tokens={tokens}
        />

        {passwordError && (
          <p className="text-xs text-red-500">{passwordError}</p>
        )}
      </div>

      <div className="pt-2">
        <AuthButton
          onClick={onSubmit}
          isLoading={isLoading}
          isDark={isDark}
        >
          Update password
        </AuthButton>
      </div>
    </div>
  );
}
