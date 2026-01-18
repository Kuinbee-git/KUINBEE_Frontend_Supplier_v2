"use client";

import React, { useState, useCallback, memo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useAuthTokens } from "@/hooks/useAuthTokens";
import { AuthHeader, AuthButton, AuthAlert } from "./shared";

interface NewSupplierFormProps {
  email?: string;
  onEmailChange?: (email: string) => void;
  onSubmit: (email: string, password?: string) => void;
  onBackToLogin?: () => void;
  onBack?: () => void;
  isDark?: boolean;
  loading?: boolean;
  error?: string | null;
  // If true, shows email + password fields for registration
  // If false, shows only email field (legacy behavior)
  registrationMode?: boolean;
}

function NewSupplierFormComponent({
  email = "",
  onEmailChange,
  onSubmit,
  onBack,
  onBackToLogin,
  isDark = false,
  loading = false,
  error: externalError = null,
  registrationMode = true,
}: NewSupplierFormProps) {
  const [localEmail, setLocalEmail] = useState(email);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [localError, setLocalError] = useState("");

  const tokens = useAuthTokens(isDark);
  const displayError = externalError || localError;

  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalEmail(value);
    onEmailChange?.(value);
    setLocalError("");
  }, [onEmailChange]);

  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setLocalError("");
  }, []);

  const handleConfirmPasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
    setLocalError("");
  }, []);

  const handleSubmit = useCallback(() => {
    setLocalError("");
    
    if (!localEmail) {
      setLocalError("Please enter your email address");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(localEmail)) {
      setLocalError("Please enter a valid email address");
      return;
    }

    // Validate password in registration mode
    if (registrationMode) {
      if (!password) {
        setLocalError("Please enter a password");
        return;
      }

      if (password.length < 8) {
        setLocalError("Password must be at least 8 characters");
        return;
      }

      if (password.length > 128) {
        setLocalError("Password must be less than 128 characters");
        return;
      }

      if (password !== confirmPassword) {
        setLocalError("Passwords do not match");
        return;
      }

      onSubmit(localEmail, password);
    } else {
      onSubmit(localEmail);
    }
  }, [localEmail, password, confirmPassword, registrationMode, onSubmit]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  }, [handleSubmit]);

  return (
    <div className="space-y-5">
      <AuthHeader
        title="Create supplier account"
        subtitle={registrationMode ? "Enter your details to get started" : "Enter your business email to get started"}
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
          className="h-12 transition-all duration-300"
          style={{
            borderColor: tokens.inputBorder,
            backgroundColor: tokens.inputBg,
            color: tokens.textPrimary,
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
          }}
          autoFocus
          autoComplete="email"
          disabled={loading}
        />
      </div>

      {/* Password fields (registration mode only) */}
      {registrationMode && (
        <>
          <div className="space-y-2">
            <Label 
              htmlFor="password"
              className="text-sm transition-colors duration-300"
              style={{ color: tokens.textPrimary, fontWeight: 500 }}
            >
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={handlePasswordChange}
                onKeyDown={handleKeyDown}
                className="h-12 pr-10 transition-all duration-300"
                style={{
                  borderColor: tokens.inputBorder,
                  backgroundColor: tokens.inputBg,
                  color: tokens.textPrimary,
                  backdropFilter: "blur(16px)",
                  WebkitBackdropFilter: "blur(16px)",
                }}
                autoComplete="new-password"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-70"
                style={{ color: tokens.textMuted }}
                disabled={loading}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-xs" style={{ color: tokens.textMuted }}>
              Must be 8-128 characters
            </p>
          </div>

          <div className="space-y-2">
            <Label 
              htmlFor="confirmPassword"
              className="text-sm transition-colors duration-300"
              style={{ color: tokens.textPrimary, fontWeight: 500 }}
            >
              Confirm Password
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                onKeyDown={handleKeyDown}
                className="h-12 pr-10 transition-all duration-300"
                style={{
                  borderColor: tokens.inputBorder,
                  backgroundColor: tokens.inputBg,
                  color: tokens.textPrimary,
                  backdropFilter: "blur(16px)",
                  WebkitBackdropFilter: "blur(16px)",
                }}
                autoComplete="new-password"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-70"
                style={{ color: tokens.textMuted }}
                disabled={loading}
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Error message */}
      {displayError && (
        <AuthAlert message={displayError} variant="error" isDark={isDark} tokens={tokens} />
      )}

      {/* Submit button */}
      <AuthButton onClick={handleSubmit} isDark={isDark} disabled={loading}>
        {loading ? "Creating account..." : "Create account"}
      </AuthButton>

      {/* Back link */}
      <div className="text-center pt-4">
        <button 
          type="button"
          className="flex items-center justify-center gap-2 w-full text-sm transition-colors hover:opacity-80 disabled:opacity-50"
          style={{ color: tokens.textSecondary }}
          onClick={onBackToLogin || onBack}
          disabled={loading}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to sign in
        </button>
      </div>

      {/* Info notice */}
      {!registrationMode && (
        <div 
          className="mt-8 pt-6 transition-colors duration-300"
          style={{ borderTop: `1px solid ${tokens.divider}` }}
        >
          <p 
            className="text-xs text-center leading-relaxed"
            style={{ color: tokens.textMuted }}
          >
            We&apos;ll send a verification code to your email
          </p>
        </div>
      )}
    </div>
  );
}

export const NewSupplierForm = memo(NewSupplierFormComponent);
export default NewSupplierForm;
