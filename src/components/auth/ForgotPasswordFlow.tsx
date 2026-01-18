"use client";

import { useState } from 'react';
import { useAuthTokens } from '@/hooks/useAuthTokens';
import { validateEmail, validatePasswords } from '@/lib/utils/auth.utils';
import { AuthAlert } from './shared';
import {
  PasswordResetRequest,
  PasswordResetSent,
  PasswordResetInvalid,
  PasswordResetForm,
  PasswordResetSuccess,
} from './password-steps';

export type ForgotPasswordStep = 
  | 'request'
  | 'sent'
  | 'invalid'
  | 'reset'
  | 'success';

interface ForgotPasswordFlowProps {
  isDark?: boolean;
  step?: ForgotPasswordStep;
  resetToken?: string;
  onBackToLogin: () => void;
  onPasswordResetComplete?: () => void;
}

/**
 * Password reset flow with step-based navigation
 * Refactored to use modular step components
 */
export function ForgotPasswordFlow({
  isDark = false,
  step = 'request',
  resetToken,
  onBackToLogin,
  onPasswordResetComplete,
}: ForgotPasswordFlowProps) {
  const [currentStep, setCurrentStep] = useState<ForgotPasswordStep>(step);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [networkError, setNetworkError] = useState('');

  const tokens = useAuthTokens(isDark);

  const handleSendResetInstructions = async () => {
    setEmailError('');
    setNetworkError('');

    const error = validateEmail(email);
    if (error) {
      setEmailError(error);
      return;
    }

    setIsLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      console.log('[FORGOT PASSWORD] Reset email request sent for:', email);
      setCurrentStep('sent');
    } catch (err) {
      setNetworkError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setIsLoading(true);
    setNetworkError('');

    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      console.log('[FORGOT PASSWORD] Reset email resent');
    } catch (err) {
      setNetworkError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    setPasswordError('');
    setNetworkError('');

    const error = validatePasswords(newPassword, confirmPassword);
    if (error) {
      setPasswordError(error);
      return;
    }

    setIsLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      console.log('[FORGOT PASSWORD] Password updated successfully');
      setCurrentStep('success');
      onPasswordResetComplete?.();
    } catch (err) {
      setNetworkError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestNew = () => {
    setCurrentStep('request');
    setEmail('');
    setEmailError('');
  };

  const handleBackToLoginClick = () => {
    console.log('[FORGOT PASSWORD] Navigating back to login');
    onBackToLogin();
  };

  return (
    <div className="space-y-5">
      {networkError && (
        <AuthAlert message={networkError} variant="error" isDark={isDark} tokens={tokens} />
      )}

      {currentStep === 'request' && (
        <PasswordResetRequest
          email={email}
          emailError={emailError}
          isLoading={isLoading}
          onEmailChange={setEmail}
          onSubmit={handleSendResetInstructions}
          onBack={handleBackToLoginClick}
          tokens={tokens}
          isDark={isDark}
        />
      )}

      {currentStep === 'sent' && (
        <PasswordResetSent
          email={email}
          isLoading={isLoading}
          onResend={handleResendEmail}
          onBack={handleBackToLoginClick}
          tokens={tokens}
          isDark={isDark}
        />
      )}

      {currentStep === 'invalid' && (
        <PasswordResetInvalid
          onRequestNew={handleRequestNew}
          onBack={handleBackToLoginClick}
          tokens={tokens}
          isDark={isDark}
        />
      )}

      {currentStep === 'reset' && (
        <PasswordResetForm
          newPassword={newPassword}
          confirmPassword={confirmPassword}
          passwordError={passwordError}
          isLoading={isLoading}
          onNewPasswordChange={setNewPassword}
          onConfirmPasswordChange={setConfirmPassword}
          onSubmit={handleUpdatePassword}
          tokens={tokens}
          isDark={isDark}
        />
      )}

      {currentStep === 'success' && (
        <PasswordResetSuccess
          onBackToLogin={handleBackToLoginClick}
          tokens={tokens}
          isDark={isDark}
        />
      )}
    </div>
  );
}
