"use client";

import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface AuthAlertProps {
  message: string;
  variant?: 'error' | 'success' | 'info';
  isDark?: boolean;
  tokens: {
    textPrimary: string;
  };
}

/**
 * Reusable alert component for auth screens
 */
export function AuthAlert({ message, variant = 'error', isDark = false, tokens }: AuthAlertProps) {
  const isError = variant === 'error';
  const isSuccess = variant === 'success';
  
  const bgColor = isError 
    ? (isDark ? 'rgba(239, 68, 68, 0.1)' : '#fef2f2')
    : isSuccess
    ? (isDark ? 'rgba(34, 197, 94, 0.1)' : '#f0fdf4')
    : (isDark ? 'rgba(59, 130, 246, 0.1)' : '#eff6ff');
    
  const borderColor = isError
    ? 'rgba(239, 68, 68, 0.3)'
    : isSuccess
    ? 'rgba(34, 197, 94, 0.3)'
    : 'rgba(59, 130, 246, 0.3)';
    
  const iconColor = isError ? '#ef4444' : isSuccess ? '#22c55e' : '#3b82f6';

  return (
    <Alert 
      variant={isError ? 'destructive' : 'default'}
      className="transition-all duration-200"
      style={{
        backgroundColor: bgColor,
        borderColor: borderColor,
        backdropFilter: isDark ? 'blur(12px)' : 'none',
      }}
    >
      {isSuccess ? (
        <CheckCircle2 className="h-4 w-4" style={{ color: iconColor }} />
      ) : (
        <AlertCircle className="h-4 w-4" style={{ color: iconColor }} />
      )}
      <AlertDescription style={{ color: tokens.textPrimary }}>
        {message}
      </AlertDescription>
    </Alert>
  );
}
