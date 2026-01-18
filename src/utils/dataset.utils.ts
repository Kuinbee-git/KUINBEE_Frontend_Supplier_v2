import type { DatasetStatus } from '@/types/dataset.types';

/**
 * Format file size from bytes to human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/**
 * Format date string to localized format
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Get status configuration for dataset status badges
 */
export function getStatusConfig(status: DatasetStatus, isDark: boolean = false) {
  const configs = {
    draft: {
      label: 'Draft',
      color: '#9ca3af',
      bg: isDark ? 'rgba(156, 163, 175, 0.1)' : 'rgba(156, 163, 175, 0.08)',
      border: 'rgba(156, 163, 175, 0.3)',
      text: isDark ? '#9ca3af' : '#6b7280',
    },
    submitted: {
      label: 'Submitted',
      color: '#3b82f6',
      bg: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.08)',
      border: 'rgba(59, 130, 246, 0.3)',
      text: '#3b82f6',
    },
    under_review: {
      label: 'Under Review',
      color: '#f59e0b',
      bg: isDark ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.08)',
      border: 'rgba(245, 158, 11, 0.3)',
      text: '#f59e0b',
    },
    changes_requested: {
      label: 'Changes Requested',
      color: '#ef4444',
      bg: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.08)',
      border: 'rgba(239, 68, 68, 0.3)',
      text: '#ef4444',
    },
    verified: {
      label: 'Verified',
      color: '#22c55e',
      bg: isDark ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.08)',
      border: 'rgba(34, 197, 94, 0.3)',
      text: isDark ? '#22c55e' : '#10b981',
    },
    rejected: {
      label: 'Rejected',
      color: '#ef4444',
      bg: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.08)',
      border: 'rgba(239, 68, 68, 0.3)',
      text: '#ef4444',
    },
  };
  return configs[status];
}

/**
 * Validate file for dataset upload
 */
export function validateDatasetFile(file: File): { valid: boolean; error?: string } {
  const MAX_SIZE = 500 * 1024 * 1024; // 500MB
  const ALLOWED_EXTENSIONS = ['.csv', '.json', '.parquet', '.xlsx'];

  if (file.size > MAX_SIZE) {
    return {
      valid: false,
      error: `File size exceeds 500MB limit. Your file is ${formatFileSize(file.size)}.`,
    };
  }

  const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`,
    };
  }

  return { valid: true };
}
