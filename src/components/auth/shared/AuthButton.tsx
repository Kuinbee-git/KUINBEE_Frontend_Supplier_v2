"use client";

import React, { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface AuthButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  children: ReactNode;
  variant?: 'primary' | 'secondary';
  type?: 'button' | 'submit';
  className?: string;
  isDark?: boolean;
}

/**
 * Reusable styled button for auth screens
 */
export function AuthButton({ 
  onClick, 
  disabled, 
  isLoading, 
  children, 
  variant = 'primary',
  type = 'button',
  className = '',
  isDark = false
}: AuthButtonProps) {
  const isPrimary = variant === 'primary';

  return (
    <Button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`w-full h-12 text-white transition-all duration-300 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] ${className}`}
      style={{
        background: isPrimary 
          ? 'linear-gradient(135deg, #1a2240 0%, #2a3558 50%, #4e5a7e 100%)'
          : isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(26, 34, 64, 0.05)',
        color: isPrimary ? '#ffffff' : isDark ? 'rgba(255, 255, 255, 0.9)' : '#1a2240',
        boxShadow: isPrimary ? '0 8px 24px rgba(26, 34, 64, 0.4)' : 'none',
        border: isPrimary ? 'none' : isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(26, 34, 64, 0.1)',
      }}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading...
        </>
      ) : children}
    </Button>
  );
}
