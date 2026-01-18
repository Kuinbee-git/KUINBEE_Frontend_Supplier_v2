import type { VerificationStatus } from '@/types/dataset-proposal.types';

interface StatusConfig {
  label: string;
  bg: string;
  border: string;
  text: string;
}

function getVerificationStatusConfig(status: VerificationStatus | null, isDark: boolean): StatusConfig {
  if (!status) {
    return {
      label: 'Unknown',
      bg: isDark ? 'rgba(128, 128, 128, 0.1)' : 'rgba(128, 128, 128, 0.05)',
      border: isDark ? 'rgba(128, 128, 128, 0.2)' : 'rgba(128, 128, 128, 0.15)',
      text: isDark ? '#9CA3AF' : '#6B7280',
    };
  }

  const configs: Record<VerificationStatus, StatusConfig> = {
    PENDING: {
      label: 'Pending',
      bg: isDark ? 'rgba(234, 179, 8, 0.1)' : 'rgba(234, 179, 8, 0.05)',
      border: isDark ? 'rgba(234, 179, 8, 0.2)' : 'rgba(234, 179, 8, 0.15)',
      text: isDark ? '#FDE047' : '#CA8A04',
    },
    SUBMITTED: {
      label: 'Submitted',
      bg: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
      border: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.15)',
      text: isDark ? '#93C5FD' : '#2563EB',
    },
    CHANGES_REQUESTED: {
      label: 'Changes Requested',
      bg: isDark ? 'rgba(249, 115, 22, 0.1)' : 'rgba(249, 115, 22, 0.05)',
      border: isDark ? 'rgba(249, 115, 22, 0.2)' : 'rgba(249, 115, 22, 0.15)',
      text: isDark ? '#FED7AA' : '#EA580C',
    },
    RESUBMITTED: {
      label: 'Resubmitted',
      bg: isDark ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.05)',
      border: isDark ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.15)',
      text: isDark ? '#C4B5FD' : '#7C3AED',
    },
    UNDER_REVIEW: {
      label: 'Under Review',
      bg: isDark ? 'rgba(168, 85, 247, 0.1)' : 'rgba(168, 85, 247, 0.05)',
      border: isDark ? 'rgba(168, 85, 247, 0.2)' : 'rgba(168, 85, 247, 0.15)',
      text: isDark ? '#D8B4FE' : '#9333EA',
    },
    VERIFIED: {
      label: 'Verified',
      bg: isDark ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.05)',
      border: isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.15)',
      text: isDark ? '#86EFAC' : '#16A34A',
    },
    REJECTED: {
      label: 'Rejected',
      bg: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
      border: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.15)',
      text: isDark ? '#FCA5A5' : '#DC2626',
    },
  };

  return configs[status];
}

interface DatasetStatusBadgeProps {
  status: VerificationStatus | null;
  isDark?: boolean;
  className?: string;
}

export function DatasetStatusBadge({ status, isDark = false, className = '' }: DatasetStatusBadgeProps) {
  const config = getVerificationStatusConfig(status, isDark);

  return (
    <span
      className={`px-3 py-1 text-xs font-medium rounded-full border inline-flex items-center ${className}`}
      style={{
        background: config.bg,
        borderColor: config.border,
        color: config.text,
      }}
    >
      {config.label}
    </span>
  );
}
