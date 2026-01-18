'use client';

import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { useSupplierTokens } from '@/hooks/useSupplierTokens';

interface ProfileSectionProps {
  icon?: LucideIcon;
  title: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}

/**
 * Reusable section wrapper for profile pages
 * Provides consistent card styling with header
 */
export function ProfileSection({
  icon: Icon,
  title,
  subtitle,
  children,
  actions,
  className = '',
}: ProfileSectionProps) {
  const tokens = useSupplierTokens();

  return (
    <div
      className={`rounded-xl border overflow-hidden ${className}`}
      style={{
        background: tokens.glassBg,
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderColor: tokens.glassBorder,
      }}
    >
      {/* Header */}
      <div
        className="px-6 py-4 border-b flex items-center justify-between"
        style={{ borderColor: tokens.borderDefault }}
      >
        <div className="flex items-center gap-3">
          {Icon && <Icon className="w-5 h-5" style={{ color: tokens.textSecondary }} />}
          <div>
            <h3
              className="text-base"
              style={{ color: tokens.textPrimary, fontWeight: '600' }}
            >
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs mt-0.5" style={{ color: tokens.textMuted }}>
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {actions && <div>{actions}</div>}
      </div>

      {/* Content */}
      <div className="p-6">{children}</div>
    </div>
  );
}
