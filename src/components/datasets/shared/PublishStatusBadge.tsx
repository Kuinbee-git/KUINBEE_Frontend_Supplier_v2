'use client';

import type { DatasetStatus } from '@/types/dataset-proposal.types';
import { CheckCircle, Eye, Archive, XCircle } from 'lucide-react';

interface PublishStatusBadgeProps {
  status: DatasetStatus | null;
  isDark?: boolean;
  className?: string;
}

const STATUS_CONFIG: Record<DatasetStatus, {
  label: string;
  bg: string;
  text: string;
  border: string;
  icon: any;
}> = {
  SUBMITTED: {
    label: 'Submitted',
    bg: 'rgba(59, 130, 246, 0.1)',
    text: '#3b82f6',
    border: 'rgba(59, 130, 246, 0.3)',
    icon: Eye,
  },
  UNDER_REVIEW: {
    label: 'Under Review',
    bg: 'rgba(168, 85, 247, 0.1)',
    text: '#a855f7',
    border: 'rgba(168, 85, 247, 0.3)',
    icon: Eye,
  },
  VERIFIED: {
    label: 'Verified',
    bg: 'rgba(34, 197, 94, 0.1)',
    text: '#22c55e',
    border: 'rgba(34, 197, 94, 0.3)',
    icon: CheckCircle,
  },
  PUBLISHED: {
    label: 'Published',
    bg: 'rgba(16, 185, 129, 0.1)',
    text: '#10b981',
    border: 'rgba(16, 185, 129, 0.3)',
    icon: CheckCircle,
  },
  REJECTED: {
    label: 'Rejected',
    bg: 'rgba(239, 68, 68, 0.1)',
    text: '#ef4444',
    border: 'rgba(239, 68, 68, 0.3)',
    icon: XCircle,
  },
  ARCHIVED: {
    label: 'Archived',
    bg: 'rgba(148, 163, 176, 0.1)',
    text: '#94a3b0',
    border: 'rgba(148, 163, 176, 0.3)',
    icon: Archive,
  },
};

export function PublishStatusBadge({ status, isDark = false, className = '' }: PublishStatusBadgeProps) {
  if (!status) return null;
  
  const config = STATUS_CONFIG[status];
  if (!config) return null;

  const Icon = config.icon;

  return (
    <span
      className={`px-3 py-1 text-xs font-medium rounded-full border inline-flex items-center gap-1.5 ${className}`}
      style={{
        background: config.bg,
        borderColor: config.border,
        color: config.text,
      }}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}
