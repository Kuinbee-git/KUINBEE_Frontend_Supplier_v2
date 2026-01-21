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
  isDark = false,
  tokens,
}: StyledSelectProps) {
  const defaultTokens = {
    inputBg: isDark ? '#1a1a2e' : '#f8f9fa',
    inputBorder: isDark ? '#2d2d4d' : '#e0e0e0',
    textPrimary: isDark ? '#ffffff' : '#000000',
    textSecondary: isDark ? '#b0b0c0' : '#6b7280',
    textMuted: isDark ? '#808092' : '#9ca3af',
    surfaceCard: isDark ? '#0f0f1e' : '#ffffff',
    borderDefault: isDark ? '#2d2d4d' : '#e5e7eb',
  };

  const finalTokens = tokens || defaultTokens;

  return (
    <div className="w-full">
      {label && (
        <label className="text-sm font-medium mb-2 block" style={{ color: finalTokens.textPrimary }}>
          {label}
        </label>
      )}
      <Select value={value} onValueChange={onValueChange}>
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
            background: finalTokens.surfaceCard,
            borderColor: finalTokens.borderDefault,
          }}
        >
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className="transition-colors duration-150"
              style={{
                color: finalTokens.textPrimary,
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
