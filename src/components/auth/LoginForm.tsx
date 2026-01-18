"use client";

import React, { useState, useCallback, memo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthTokens } from "@/hooks/useAuthTokens";
import { AuthHeader, AuthButton, AuthAlert, PasswordInput } from "./shared";

interface LoginFormProps {
  email: string;
  onEmailChange: (email: string) => void;
  onSubmit: (email: string, password: string) => void;
  onCreateAccount: () => void;
  onForgotPassword: () => void;
  isDark?: boolean;
  error?: string;
}

function LoginFormComponent({
  email,
  onEmailChange,
  onSubmit,
  onCreateAccount,
  onForgotPassword,
  isDark = false,
  error: externalError,
}: LoginFormProps) {
  const [localEmail, setLocalEmail] = useState(email);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const tokens = useAuthTokens(isDark);

  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalEmail(value);
    onEmailChange(value);
  }, [onEmailChange]);

  const handleSubmit = useCallback(() => {
    setError("");
    
    if (!localEmail) {
      setError("Please enter your email address");
      return;
    }
    
    if (!password) {
      setError("Please enter your password");
      return;
    }

    onSubmit(localEmail, password);
  }, [localEmail, password, onSubmit]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  }, [handleSubmit]);

  return (
    <div className="space-y-5">
      <AuthHeader 
        title="Sign in to your account"
        subtitle="Enter your credentials to access the supplier portal"
        tokens={tokens}
      />

      {/* Email field */}
      <div className="space-y-2">
        <Label 
          htmlFor="email"
          className="text-sm transition-colors duration-300"
          style={{ color: tokens.textPrimary, fontWeight: 500 }}
        >
          Email
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="your@company.com"
          value={localEmail}
          onChange={handleEmailChange}
          onKeyDown={handleKeyDown}
          className="h-12 transition-all duration-300 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500"
          style={{
            borderColor: tokens.inputBorder,
            backgroundColor: tokens.inputBg,
            color: tokens.textPrimary,
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
          }}
          autoFocus
          autoComplete="email"
        />
      </div>

      {/* Password field */}
      <PasswordInput
        id="password"
        label="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={handleKeyDown}
        tokens={tokens}
      />

      {/* Error message */}
      {(error || externalError) && (
        <AuthAlert message={error || externalError || ""} variant="error" isDark={isDark} tokens={tokens} />
      )}

      {/* Forgot password link */}
      <div className="text-center pt-2">
        <button
          type="button"
          onClick={() => window.location.href = '/auth/forgot-password'}
          className="text-sm transition-all duration-300 hover:underline"
          style={{ 
            color: isDark ? "rgba(255,255,255,0.6)" : "#525d6f"
          }}
        >
          Forgot password?
        </button>
      </div>

      {/* Submit button */}
      <AuthButton onClick={handleSubmit} isDark={isDark}>
        Sign in
      </AuthButton>

      {/* Secondary actions */}
      <div className="space-y-2.5 text-center pt-4">
        <button 
          type="button"
          className="text-sm transition-colors block w-full hover:underline underline-offset-4"
          style={{ color: tokens.textSecondary }}
          onClick={onCreateAccount}
        >
          New supplier? Create account
        </button>
      </div>

      {/* Security notice */}
      <div 
        className="mt-8 pt-6 transition-colors duration-300"
        style={{ borderTop: `1px solid ${tokens.divider}` }}
      >
        <p 
          className="text-xs text-center leading-relaxed"
          style={{ color: tokens.textMuted }}
        >
          Access monitored · Additional verification may be required
        </p>
      </div>
    </div>
  );
}

export const LoginForm = memo(LoginFormComponent);
export default LoginForm;
