'use client';

import { ReactNode } from 'react';
import { Lock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useSupplierTokens } from '@/hooks/useSupplierTokens';

interface FormFieldProps {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'email' | 'password' | 'url' | 'textarea';
  disabled?: boolean;
  locked?: boolean;
  lockReason?: string;
  error?: string;
  hint?: string;
  rows?: number;
  className?: string;
}

/**
 * Reusable form field with label and optional lock state
 */
export function FormField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  disabled = false,
  locked = false,
  lockReason,
  error,
  hint,
  rows = 4,
  className = '',
}: FormFieldProps) {
  const tokens = useSupplierTokens();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (onChange && !locked && !disabled) {
      onChange(e.target.value);
    }
  };

  const inputStyle = {
    background: tokens.inputBg,
    borderColor: error ? '#ef4444' : tokens.inputBorder,
    color: tokens.textPrimary,
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium" style={{ color: tokens.textPrimary }}>
          {label}
        </label>
        {locked && (
          <div className="flex items-center gap-1 text-xs" style={{ color: tokens.textMuted }}>
            <Lock className="w-3 h-3" />
            <span>{lockReason || 'Locked'}</span>
          </div>
        )}
      </div>
      
      {type === 'textarea' ? (
        <Textarea
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled || locked}
          rows={rows}
          className="resize-none"
          style={inputStyle}
        />
      ) : (
        <Input
          type={type}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled || locked}
          style={inputStyle}
        />
      )}

      {error && (
        <p className="text-xs mt-1" style={{ color: '#ef4444' }}>
          {error}
        </p>
      )}

      {hint && !error && (
        <p className="text-xs mt-1" style={{ color: tokens.textMuted }}>
          {hint}
        </p>
      )}
    </div>
  );
}
