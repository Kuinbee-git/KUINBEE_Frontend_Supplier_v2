'use client';

import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface StyledSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: { label: string; value: string }[];
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  isDark?: boolean;
  tokens?: {
    inputBg: string;
    inputBorder: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    surfaceCard: string;
    borderDefault: string;
  };
}

export function StyledSelect({
  value,
  onValueChange,
  options,
  label,
  placeholder = 'Select an option',
  disabled = false,
  isDark = false,
  tokens,
}: StyledSelectProps) {
  const defaultTokens = {
    inputBg: isDark ? 'rgba(255, 255, 255, 0.08)' : '#f8f9fa',
    inputBorder: isDark ? 'rgba(255, 255, 255, 0.12)' : '#e0e0e0',
    textPrimary: isDark ? '#ffffff' : '#000000',
    textSecondary: isDark ? 'rgba(255, 255, 255, 0.7)' : '#6b7280',
    textMuted: isDark ? 'rgba(255, 255, 255, 0.5)' : '#9ca3af',
    surfaceCard: isDark ? 'rgba(26, 34, 64, 0.95)' : '#ffffff',
    borderDefault: isDark ? 'rgba(255, 255, 255, 0.15)' : '#e5e7eb',
  };

  const finalTokens = tokens || defaultTokens;

  return (
    <div className="w-full">
      {label && (
        <label className="text-sm font-medium mb-2 block" style={{ color: finalTokens.textPrimary }}>
          {label}
        </label>
      )}
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger
          className="transition-all duration-200 ease-out"
          style={{
            background: finalTokens.inputBg,
            borderColor: finalTokens.inputBorder,
            color: finalTokens.textPrimary,
            borderWidth: '1px',
          }}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent
          className="transition-all duration-200 ease-out"
          style={{
            background: isDark ? 'rgba(26, 34, 64, 0.95)' : finalTokens.surfaceCard,
            borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : finalTokens.borderDefault,
            backdropFilter: isDark ? 'blur(12px)' : 'none',
            WebkitBackdropFilter: isDark ? 'blur(12px)' : 'none',
            boxShadow: isDark 
              ? '0 8px 32px rgba(0, 0, 0, 0.4), 0 16px 64px rgba(0, 0, 0, 0.3)'
              : '0 4px 12px rgba(0, 0, 0, 0.1), 0 8px 24px rgba(0, 0, 0, 0.08)',
          }}
        >
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className="transition-colors duration-150"
              style={{
                color: finalTokens.textPrimary,
                background: 'transparent',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = isDark 
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'rgba(26, 34, 64, 0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
