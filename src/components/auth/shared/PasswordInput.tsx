"use client";

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PasswordInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  placeholder?: string;
  autoComplete?: string;
  tokens: {
    textPrimary: string;
    textSecondary: string;
    inputBorder: string;
    inputBg: string;
  };
}

/**
 * Reusable password input with show/hide toggle
 */
export function PasswordInput({ 
  id, 
  label, 
  value, 
  onChange, 
  onKeyDown,
  placeholder = 'Enter password',
  autoComplete = 'current-password',
  tokens 
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-2">
      <Label 
        htmlFor={id}
        className="text-sm transition-colors duration-300"
        style={{ color: tokens.textPrimary, fontWeight: 500 }}
      >
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={showPassword ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          className="h-12 transition-all duration-300 pr-16 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500"
          style={{
            borderColor: tokens.inputBorder,
            backgroundColor: tokens.inputBg,
            color: tokens.textPrimary,
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
          }}
          autoComplete={autoComplete}
        />
        <button
          type="button"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-sm transition-colors hover:opacity-80"
          style={{ color: tokens.textSecondary }}
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? 'Hide' : 'Show'}
        </button>
      </div>
    </div>
  );
}
