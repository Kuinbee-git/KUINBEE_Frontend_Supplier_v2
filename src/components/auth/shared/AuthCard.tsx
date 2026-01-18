"use client";

import React, { ReactNode } from 'react';

interface AuthCardProps {
  children: ReactNode;
  tokens: {
    cardBg: string;
    borderDefault: string;
  };
  className?: string;
}

/**
 * Reusable glassmorphism card container for auth screens
 */
export function AuthCard({ children, tokens, className = '' }: AuthCardProps) {
  return (
    <div
      className={`rounded-2xl p-8 transition-all duration-500 ${className}`}
      style={{
        backgroundColor: tokens.cardBg,
        borderColor: tokens.borderDefault,
        border: '1px solid',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
      }}
    >
      {children}
    </div>
  );
}
