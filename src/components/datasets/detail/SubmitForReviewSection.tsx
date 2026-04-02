'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Upload,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import type { VerificationStatus, DatasetPricingVersion } from '@/types/dataset-proposal.types';

interface SubmitForReviewSectionProps {
  verificationStatus: VerificationStatus;
  missingPrerequisites: string[];
  submitting: boolean;
  onSubmit: () => void;
  isDark: boolean;
  tokens: any;
}

export function SubmitForReviewSection({
  verificationStatus,
  missingPrerequisites,
  submitting,
  onSubmit,
  isDark,
  tokens,
}: SubmitForReviewSectionProps) {
  return (
    <Card
      className="border overflow-hidden mb-6 transition-shadow duration-200 hover:shadow-md"
      style={{
        background: isDark
          ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(16, 185, 129, 0.05) 100%)'
          : 'linear-gradient(135deg, rgba(59, 130, 246, 0.03) 0%, rgba(16, 185, 129, 0.03) 100%)',
        borderColor: tokens.borderDefault,
      }}
    >
      <div className="p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6">
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2" style={{ color: tokens.textPrimary }}>
              {verificationStatus === 'PENDING' ? 'Ready to Submit?' : 'Resubmit for Review'}
            </h3>
            <p className="text-sm mb-4 leading-relaxed" style={{ color: tokens.textSecondary }}>
              {verificationStatus === 'PENDING'
                ? 'Once submitted, your proposal will be reviewed by an admin. Make sure all required sections are complete.'
                : 'Admin has requested changes. Review the feedback and resubmit when ready.'}
            </p>

            {missingPrerequisites.length > 0 ? (
              <div
                className="p-4 rounded-xl border mb-4"
                style={{
                  background: isDark ? 'rgba(234, 179, 8, 0.1)' : 'rgba(234, 179, 8, 0.15)',
                  borderColor: isDark ? 'rgba(234, 179, 8, 0.3)' : 'rgba(234, 179, 8, 0.4)',
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: isDark ? 'rgba(234, 179, 8, 0.15)' : 'rgba(234, 179, 8, 0.25)' }}>
                    <AlertCircle className="w-4 h-4" style={{ color: '#d97706' }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold mb-2" style={{ color: isDark ? '#eab308' : '#b45309' }}>
                      Missing Required Information
                    </p>
                    <ul className="text-xs space-y-1" style={{ color: isDark ? tokens.textSecondary : tokens.textPrimary }}>
                      {missingPrerequisites.map((item, i) => (
                        <li key={i}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div
                className="p-4 rounded-xl border mb-4"
                style={{
                  background: isDark ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.15)',
                  borderColor: isDark ? 'rgba(34, 197, 94, 0.3)' : 'rgba(34, 197, 94, 0.4)',
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: isDark ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.25)' }}>
                    <CheckCircle className="w-4 h-4" style={{ color: isDark ? '#22c55e' : '#15803d' }} />
                  </div>
                  <p className="text-sm font-semibold" style={{ color: isDark ? '#22c55e' : '#15803d' }}>
                    All requirements met. Ready to submit!
                  </p>
                </div>
              </div>
            )}

            <Button
              onClick={onSubmit}
              disabled={submitting || missingPrerequisites.length > 0}
              className="h-11 px-7 font-semibold transition-all duration-200 hover:shadow-md hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed group"
              style={{
                background: submitting || missingPrerequisites.length > 0
                  ? 'rgba(156, 163, 175, 0.2)'
                  : tokens.glassBg || 'transparent',
                border: `1.5px solid ${submitting || missingPrerequisites.length > 0
                    ? 'rgba(156, 163, 175, 0.3)'
                    : tokens.glassBorder || tokens.borderSubtle
                  }`,
                color: tokens.textPrimary,
              }}
            >
              <Upload className="w-4 h-4 mr-2 transition-transform duration-200 group-hover:translate-y-[-2px] group-active:translate-y-0" />
              {submitting
                ? 'Submitting...'
                : verificationStatus === 'PENDING'
                  ? 'Submit for Review'
                  : 'Resubmit for Review'}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
