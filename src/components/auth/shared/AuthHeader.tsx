"use client";

import React from 'react';

interface AuthHeaderProps {
  title: string;
  subtitle?: string;
  tokens: {
    textPrimary: string;
    textSecondary: string;
  };
}

/**
 * Reusable header component for auth screens
 */
export function AuthHeader({ title, subtitle, tokens }: AuthHeaderProps) {
  return (
    <div className="space-y-2 mb-6">
      <h2 
        className="text-2xl transition-colors duration-500"
        style={{ 
          color: tokens.textPrimary,
          fontWeight: '600',
          lineHeight: '1.2'
        }}
      >
        {title}
      </h2>
      {subtitle && (
        <p 
          className="text-sm transition-colors duration-500"
          style={{ 
            color: tokens.textSecondary,
            lineHeight: '1.5'
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
