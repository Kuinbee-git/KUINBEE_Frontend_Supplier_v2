'use client';

import { LucideIcon, CheckCircle2, XCircle, Clock, AlertCircle, FileText } from 'lucide-react';
import { useSupplierTokens } from '@/hooks/useSupplierTokens';

type StatusType = 
  | 'not_started' 
  | 'pending' 
  | 'submitted' 
  | 'in_progress' 
  | 'verified' 
  | 'rejected' 
  | 'failed';

interface StatusBadgeProps {
  status: StatusType;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

/**
 * Reusable status badge for KYC and verification statuses
 */
export function StatusBadge({
  status,
  size = 'md',
  showLabel = true,
  className = '',
}: StatusBadgeProps) {
  const tokens = useSupplierTokens();
  const isDark = tokens.textPrimary === '#ffffff';

  const statusConfig: Record<StatusType, {
    label: string;
    icon: LucideIcon;
    color: string;
    bg: string;
    border: string;
  }> = {
    not_started: {
      label: 'Not started',
      icon: AlertCircle,
      color: '#9ca3af',
      bg: isDark ? 'rgba(156, 163, 175, 0.1)' : 'rgba(156, 163, 175, 0.08)',
      border: 'rgba(156, 163, 175, 0.3)',
    },
    pending: {
      label: 'Pending',
      icon: Clock,
      color: '#9ca3af',
      bg: isDark ? 'rgba(156, 163, 175, 0.1)' : 'rgba(156, 163, 175, 0.08)',
      border: 'rgba(156, 163, 175, 0.3)',
    },
    submitted: {
      label: 'Submitted',
      icon: FileText,
      color: '#3b82f6',
      bg: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.08)',
      border: 'rgba(59, 130, 246, 0.3)',
    },
    in_progress: {
      label: 'In progress',
      icon: Clock,
      color: '#f59e0b',
      bg: isDark ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.08)',
      border: 'rgba(245, 158, 11, 0.3)',
    },
    verified: {
      label: 'Verified',
      icon: CheckCircle2,
      color: '#10b981',
      bg: isDark ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.08)',
      border: 'rgba(16, 185, 129, 0.3)',
    },
    rejected: {
      label: 'Rejected',
      icon: XCircle,
      color: '#ef4444',
      bg: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.08)',
      border: 'rgba(239, 68, 68, 0.3)',
    },
    failed: {
      label: 'Failed',
      icon: AlertCircle,
      color: '#ef4444',
      bg: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.08)',
      border: 'rgba(239, 68, 68, 0.3)',
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  const sizeClasses = {
    sm: { padding: 'px-2 py-1', text: 'text-xs', icon: 'w-3 h-3' },
    md: { padding: 'px-3 py-1.5', text: 'text-sm', icon: 'w-4 h-4' },
    lg: { padding: 'px-4 py-2', text: 'text-sm', icon: 'w-5 h-5' },
  };

  const sizes = sizeClasses[size];

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full ${sizes.padding} ${className}`}
      style={{
        background: config.bg,
        border: `1px solid ${config.border}`,
      }}
    >
      <Icon className={sizes.icon} style={{ color: config.color }} />
      {showLabel && (
        <span className={`${sizes.text} font-medium`} style={{ color: config.color }}>
          {config.label}
        </span>
      )}
    </div>
  );
}

export type { StatusType };
