'use client';

import { Clock, Send, Eye, CheckCircle, XCircle } from 'lucide-react';
import type { VerificationStatus } from '@/types/dataset-proposal.types';
import type { DatasetStatus } from '@/types/dataset.types';

interface UpdateStatusBannerProps {
  datasetStatus: DatasetStatus;
  verificationStatus: VerificationStatus | string;
  rejectionReason?: string | null;
  isDark?: boolean;
  tokens: any;
}

const STATUS_CONFIGS: Record<string, {
  icon: typeof Clock;
  title: string;
  description: string;
  colorClass: string;
  bgLight: string;
  bgDark: string;
  borderLight: string;
  borderDark: string;
  iconColorLight: string;
  iconColorDark: string;
}> = {
  'SUBMITTED:SUBMITTED': {
    icon: Send,
    title: 'Update Submitted',
    description: 'Your update has been submitted and is waiting for an admin to pick it up for review.',
    colorClass: 'blue',
    bgLight: 'rgba(59, 130, 246, 0.08)',
    bgDark: 'rgba(59, 130, 246, 0.12)',
    borderLight: 'rgba(59, 130, 246, 0.25)',
    borderDark: 'rgba(59, 130, 246, 0.35)',
    iconColorLight: '#2563eb',
    iconColorDark: '#60a5fa',
  },
  'SUBMITTED:RESUBMITTED': {
    icon: Send,
    title: 'Changes Resubmitted',
    description: 'Your updated changes have been resubmitted and are waiting for admin review.',
    colorClass: 'blue',
    bgLight: 'rgba(59, 130, 246, 0.08)',
    bgDark: 'rgba(59, 130, 246, 0.12)',
    borderLight: 'rgba(59, 130, 246, 0.25)',
    borderDark: 'rgba(59, 130, 246, 0.35)',
    iconColorLight: '#2563eb',
    iconColorDark: '#60a5fa',
  },
  'UNDER_REVIEW:UNDER_REVIEW': {
    icon: Eye,
    title: 'Under Admin Review',
    description: 'Your update is currently being reviewed by an admin. You will be notified when the review is complete.',
    colorClass: 'purple',
    bgLight: 'rgba(147, 51, 234, 0.08)',
    bgDark: 'rgba(147, 51, 234, 0.12)',
    borderLight: 'rgba(147, 51, 234, 0.25)',
    borderDark: 'rgba(147, 51, 234, 0.35)',
    iconColorLight: '#7c3aed',
    iconColorDark: '#a78bfa',
  },
  'DELISTED:PENDING': {
    icon: Clock,
    title: 'Update Draft In Progress',
    description: 'Your dataset changes are in draft. Submit for review, and publish only after admin approval.',
    colorClass: 'blue',
    bgLight: 'rgba(59, 130, 246, 0.08)',
    bgDark: 'rgba(59, 130, 246, 0.12)',
    borderLight: 'rgba(59, 130, 246, 0.25)',
    borderDark: 'rgba(59, 130, 246, 0.35)',
    iconColorLight: '#2563eb',
    iconColorDark: '#60a5fa',
  },
  'DELISTED:VERIFIED': {
    icon: CheckCircle,
    title: 'Updates Approved!',
    description: 'Your updates have been approved by the admin. You can now republish your dataset to make it live again.',
    colorClass: 'green',
    bgLight: 'rgba(34, 197, 94, 0.08)',
    bgDark: 'rgba(34, 197, 94, 0.12)',
    borderLight: 'rgba(34, 197, 94, 0.25)',
    borderDark: 'rgba(34, 197, 94, 0.35)',
    iconColorLight: '#15803d',
    iconColorDark: '#22c55e',
  },
  'DELISTED:REJECTED': {
    icon: XCircle,
    title: 'Update Rejected',
    description: 'Your update request was rejected by the admin. You can start a new update cycle if needed.',
    colorClass: 'red',
    bgLight: 'rgba(239, 68, 68, 0.08)',
    bgDark: 'rgba(239, 68, 68, 0.12)',
    borderLight: 'rgba(239, 68, 68, 0.25)',
    borderDark: 'rgba(239, 68, 68, 0.35)',
    iconColorLight: '#dc2626',
    iconColorDark: '#f87171',
  },
};

export function UpdateStatusBanner({
  datasetStatus,
  verificationStatus,
  rejectionReason,
  isDark = false,
  tokens,
}: UpdateStatusBannerProps) {
  const key = `${datasetStatus}:${verificationStatus}`;
  const config = STATUS_CONFIGS[key];

  if (!config) return null;

  const Icon = config.icon;

  return (
    <div
      className="mb-6 rounded-xl border px-6 py-5 flex items-start gap-4 transition-all duration-200"
      style={{
        background: isDark ? config.bgDark : config.bgLight,
        borderColor: isDark ? config.borderDark : config.borderLight,
      }}
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{
          background: isDark
            ? `${config.bgDark.replace('0.12', '0.2')}`
            : `${config.bgLight.replace('0.08', '0.15')}`,
        }}
      >
        <Icon
          className="w-5 h-5"
          style={{ color: isDark ? config.iconColorDark : config.iconColorLight }}
        />
      </div>
      <div className="flex-1">
        <p
          className="text-sm font-semibold mb-1"
          style={{ color: isDark ? config.iconColorDark : config.iconColorLight }}
        >
          {config.title}
        </p>
        <p className="text-sm leading-relaxed" style={{ color: tokens.textSecondary }}>
          {config.description}
        </p>
        {rejectionReason && verificationStatus === 'REJECTED' && (
          <div
            className="mt-3 p-3 rounded-lg border"
            style={{
              background: isDark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.5)',
              borderColor: isDark ? config.borderDark : config.borderLight,
            }}
          >
            <p className="text-xs font-medium mb-1 uppercase tracking-wider" style={{ color: tokens.textSecondary }}>
              Rejection Reason
            </p>
            <p className="text-sm leading-relaxed" style={{ color: tokens.textPrimary }}>
              {rejectionReason}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
