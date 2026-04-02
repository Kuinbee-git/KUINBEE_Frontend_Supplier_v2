'use client';

import { AlertCircle } from 'lucide-react';

interface ChangesRequestedBannerProps {
  notes: string;
  isDark: boolean;
  tokens: any;
}

export function ChangesRequestedBanner({ notes, isDark, tokens }: ChangesRequestedBannerProps) {
  return (
    <div
      className="mb-6 rounded-lg border px-6 py-4 flex items-start gap-4"
      style={{
        background: isDark ? 'rgba(234, 179, 8, 0.1)' : 'rgba(234, 179, 8, 0.15)',
        borderColor: isDark ? 'rgba(234, 179, 8, 0.3)' : 'rgba(234, 179, 8, 0.4)',
      }}
    >
      <div className="flex-shrink-0 mt-0.5">
        <AlertCircle className="w-6 h-6" style={{ color: isDark ? '#fbbf24' : '#d97706' }} />
      </div>
      <div className="flex-1">
        <p className="text-base font-semibold mb-4" style={{ color: isDark ? '#eab308' : '#b45309' }}>
          Changes Requested by the Admin
        </p>

        <div className="space-y-4">
          <div>
            <p className="text-xs font-medium mb-2 uppercase tracking-wider" style={{ color: tokens.textSecondary }}>
              Feedback Notes
            </p>
            <div
              className="p-3 rounded-lg border"
              style={{
                background: isDark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.5)',
                borderColor: isDark ? 'rgba(234, 179, 8, 0.2)' : 'rgba(234, 179, 8, 0.3)',
              }}
            >
              <p className="text-sm leading-relaxed" style={{ color: tokens.textPrimary }}>
                {notes}
              </p>
            </div>
          </div>

          <p className="text-xs pt-2" style={{ color: tokens.textSecondary }}>
            Please review the feedback above and make the necessary updates before resubmitting your proposal.
          </p>
        </div>
      </div>
    </div>
  );
}
