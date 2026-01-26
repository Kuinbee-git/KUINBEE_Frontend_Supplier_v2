"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuthTokens } from '@/hooks/useAuthTokens';

export type OTPStateType = 'default' | 'invalid' | 'expired' | 'verifying' | 'success';

interface OTPVerificationProps {
  email: string;
  onVerify?: (code: string) => void;
  onResend?: () => Promise<void>;
  onChangeEmail?: () => void;
  onNeedHelp?: () => void;
  isDark?: boolean;
  error?: string | null;
  resendError?: string | null;
}

export function OTPVerification({ 
  email, 
  onVerify,
  onResend,
  onChangeEmail, 
  onNeedHelp, 
  isDark = false,
  error: externalError = null,
  resendError = null,
}: OTPVerificationProps) {
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpState, setOtpState] = useState<OTPStateType>('default');
  const [resendCountdown, setResendCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const tokens = useAuthTokens(isDark);

  // Countdown timer
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => {
        setResendCountdown(resendCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendCountdown]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleDigitChange = (index: number, value: string) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return;

    const newDigits = [...otpDigits];
    newDigits[index] = value;
    setOtpDigits(newDigits);

    // Auto-advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Reset error state when user types
    if (otpState === 'invalid' || otpState === 'expired') {
      setOtpState('default');
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('');
      setOtpDigits(digits);
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otpDigits.join('');
    if (code.length !== 6) return;

    setOtpState('verifying');

    try {
      // Call the parent's onVerify handler
      if (onVerify) {
        await onVerify(code);
        setOtpState('success');
      }
    } catch (err) {
      console.error('[OTP] Verification failed:', err);
      setOtpState('invalid');
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    
    setOtpDigits(['', '', '', '', '', '']);
    setOtpState('default');
    setResendCountdown(30);
    setCanResend(false);
    inputRefs.current[0]?.focus();
    
    console.log('[OTP] Resending code to:', email);
    
    // Call the parent's onResend handler if provided
    if (onResend) {
      try {
        await onResend();
        console.log('[OTP] Resend successful');
      } catch (err) {
        console.error('[OTP] Resend failed:', err);
        // Reset countdown so they can try again
        setResendCountdown(0);
        setCanResend(true);
      }
    }
  };

  const isComplete = otpDigits.every(digit => digit !== '');
  const isDisabled = otpState === 'verifying' || otpState === 'success';

  return (
    <div className="space-y-8">
      {/* External Error Message */}
      {externalError && (
        <Alert 
          className="p-4 transition-all duration-200 rounded-lg border"
          style={{
            backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#fee2e2',
            borderColor: '#ef4444',
          }}
        >
          <AlertCircle className="h-4 w-4" style={{ color: '#ef4444' }} />
          <AlertDescription style={{ color: '#ef4444' }} className="ml-2 text-sm font-medium">
            {externalError}
          </AlertDescription>
        </Alert>
      )}

      {/* OTP Input Fields */}
      <div className="space-y-4">
        <Label 
          className="text-sm font-semibold transition-colors duration-500 block"
          style={{ 
            color: tokens.textPrimary,
            '--label-color': tokens.textPrimary,
            fontSize: '0.875rem' 
          } as React.CSSProperties & { '--label-color': string }}
        >
          Verification Code
        </Label>
        
        <div className="flex justify-center gap-3 px-4" onPaste={handlePaste}>
          {otpDigits.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { if (el) inputRefs.current[index] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigitChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              disabled={isDisabled}
              className="w-14 h-16 text-center text-2xl font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:scale-110 active:scale-95"
              style={{
                backgroundColor: tokens.inputBg,
                borderWidth: '2px',
                borderStyle: 'solid',
                borderColor: 
                  otpState === 'invalid' ? tokens.borderError :
                  otpState === 'success' ? tokens.borderSuccess :
                  digit ? tokens.borderFocus : tokens.borderDefault,
                color: tokens.textPrimary,
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                opacity: isDisabled ? 0.6 : 1,
                cursor: isDisabled ? 'not-allowed' : 'text',
                transition: 'all 0.2s ease',
              }}
            />
          ))}
        </div>
      </div>

      {/* Error States */}
      {otpState === 'invalid' && (
        <Alert 
          className="p-4 transition-all duration-200 rounded-lg border"
          style={{
            backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#fee2e2',
            borderColor: tokens.borderError,
          }}
        >
          <AlertCircle className="h-4 w-4" style={{ color: tokens.borderError }} />
          <AlertDescription style={{ color: tokens.borderError }} className="ml-2 text-sm font-medium">
            Invalid code. Please check and try again.
          </AlertDescription>
        </Alert>
      )}

      {otpState === 'expired' && (
        <Alert 
          className="p-4 transition-all duration-200 rounded-lg border"
          style={{
            backgroundColor: isDark ? 'rgba(245, 158, 11, 0.1)' : '#fef3c7',
            borderColor: 'rgba(245, 158, 11, 0.5)',
          }}
        >
          <AlertCircle className="h-4 w-4" style={{ color: '#f59e0b' }} />
          <AlertDescription style={{ color: '#f59e0b' }} className="ml-2 text-sm font-medium">
            This code has expired. Please request a new one.
          </AlertDescription>
        </Alert>
      )}

      {/* Success State */}
      {otpState === 'success' && (
        <Alert 
          className="p-4 transition-all duration-200 rounded-lg border"
          style={{
            backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : '#d1fae5',
            borderColor: tokens.borderSuccess,
          }}
        >
          <CheckCircle2 className="h-4 w-4" style={{ color: tokens.borderSuccess }} />
          <AlertDescription style={{ color: tokens.borderSuccess }} className="ml-2 text-sm font-medium">
            Verification successful
          </AlertDescription>
        </Alert>
      )}

      {/* Verify Button */}
      <Button 
        onClick={handleVerify}
        disabled={!isComplete || isDisabled}
        className="w-full h-12 text-base font-semibold transition-all duration-200 relative transform hover:scale-105 active:scale-95 disabled:scale-100 disabled:opacity-60"
        style={{
          background: (!isComplete || isDisabled) 
            ? (isDark ? 'rgba(255, 255, 255, 0.08)' : '#e5e7eb')
            : tokens.buttonBg,
          color: tokens.textPrimary,
          cursor: (!isComplete || isDisabled) ? 'not-allowed' : 'pointer',
        }}
      >
        {otpState === 'verifying' ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Verifying...
          </>
        ) : otpState === 'success' ? (
          <>
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Verified
          </>
        ) : (
          'Verify'
        )}
      </Button>

      {/* Resend Code */}
      <div className="space-y-3">
        <p 
          className="text-sm transition-colors duration-500 text-center font-medium"
          style={{ color: tokens.textMuted, lineHeight: '1.5' }}
        >
          {!canResend ? (
            <>Didn&apos;t receive the code? Resend in {resendCountdown}s</>
          ) : (
            <>
              Didn&apos;t receive the code?{' '}
              <button
                onClick={handleResend}
                className="transition-all font-bold hover:underline underline-offset-4 hover:opacity-80"
                style={{ 
                  color: tokens.textPrimary,
                }}
              >
                Resend
              </button>
            </>
          )}
        </p>

        {/* Resend Error */}
        {resendError && (
          <Alert 
            className="p-3 transition-all duration-200 rounded-lg border"
            style={{
              backgroundColor: isDark ? 'rgba(245, 158, 11, 0.1)' : '#fef3c7',
              borderColor: 'rgba(245, 158, 11, 0.5)',
            }}
          >
            <AlertCircle className="h-4 w-4 inline-block" style={{ color: '#f59e0b' }} />
            <AlertDescription style={{ color: '#f59e0b' }} className="inline-block ml-2 text-xs">
              {resendError}
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Secondary Actions */}
      <div className="flex items-center justify-center gap-6 pt-6 border-t" style={{ borderColor: tokens.borderDefault }}>
        {onChangeEmail && (
          <button 
            onClick={onChangeEmail}
            className="text-sm font-semibold transition-all hover:opacity-80 hover:underline underline-offset-4"
            style={{ color: tokens.textPrimary }}
          >
            Change email
          </button>
        )}
        {onNeedHelp && (
          <button 
            onClick={onNeedHelp}
            className="text-sm font-semibold transition-all hover:opacity-80 hover:underline underline-offset-4"
            style={{ color: tokens.textPrimary }}
          >
            Need help?
          </button>
        )}
      </div>
    </div>
  );
}
