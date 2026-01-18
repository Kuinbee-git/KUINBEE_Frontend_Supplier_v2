"use client";

import React, { useMemo } from 'react';
import { getPasswordStrength } from '@/lib/utils/auth.utils';

interface PasswordStrengthIndicatorProps {
  password: string;
  tokens: {
    textSecondary: string;
  };
}

/**
 * Visual indicator for password strength
 */
export function PasswordStrengthIndicator({ password, tokens }: PasswordStrengthIndicatorProps) {
  const strengthData = useMemo(() => getPasswordStrength(password), [password]);

  if (!password || !strengthData) return null;

  return (
    <div className="space-y-2 mt-2">
      <div className="h-1 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
        <div
          className="h-full transition-all duration-300"
          style={{
            width: `${strengthData.text === 'Strong' ? 100 : strengthData.text === 'Fair' ? 66 : 33}%`,
            backgroundColor: strengthData.color,
          }}
        />
      </div>
      <p className="text-xs" style={{ color: tokens.textSecondary }}>
        Password strength: <span style={{ color: strengthData.color, fontWeight: 500 }}>{strengthData.text}</span>
      </p>
    </div>
  );
}
