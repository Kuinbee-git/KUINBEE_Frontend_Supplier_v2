"use client";

import React, { ReactNode } from 'react';
import { Mail, AlertCircle, CheckCircle2 } from 'lucide-react';

interface InfoCardProps {
  icon?: 'mail' | 'alert' | 'success';
  iconColor?: string;
  children: ReactNode;
  isDark?: boolean;
  tokens: {
    textPrimary: string;
    textSecondary: string;
  };
}

/**
 * Reusable info card with icon for displaying instructions/messages
 */
export function InfoCard({ 
  icon = 'mail', 
  iconColor = '#3b82f6',
  children, 
  isDark = false,
  tokens 
}: InfoCardProps) {
  const IconComponent = icon === 'mail' ? Mail : icon === 'alert' ? AlertCircle : CheckCircle2;

  return (
    <div
      className="rounded-xl p-5 transition-all duration-300"
      style={{
        background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(59, 130, 246, 0.08)',
        border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(59, 130, 246, 0.2)'}`,
      }}
    >
      <div className="flex items-start gap-3">
        <IconComponent className="w-5 h-5 shrink-0 mt-0.5" style={{ color: iconColor }} />
        <div className="flex-1 space-y-2 text-sm" style={{ color: tokens.textSecondary, lineHeight: '1.5' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
