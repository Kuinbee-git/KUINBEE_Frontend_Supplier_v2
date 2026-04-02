'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import type { ProposalDetailsResponse, DatasetPricingVersion, VerificationStatus } from '@/types/dataset-proposal.types';

interface SubmitConfirmModalProps {
  proposal: ProposalDetailsResponse;
  pricingData: DatasetPricingVersion | null;
  submitting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isDark: boolean;
  tokens: any;
}

export function SubmitConfirmModal({
  proposal,
  pricingData,
  submitting,
  onConfirm,
  onCancel,
  isDark,
  tokens,
}: SubmitConfirmModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <Card
        className="w-full max-w-md shadow-xl border rounded-lg"
        style={{
          background: isDark ? 'rgba(26, 34, 64, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          borderColor: tokens.borderDefault,
          backdropFilter: isDark ? 'blur(12px)' : 'none',
          WebkitBackdropFilter: isDark ? 'blur(12px)' : 'none',
        }}
      >
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-5 h-5" style={{ color: '#f59e0b' }} />
            <h3 className="text-lg font-semibold" style={{ color: tokens.textPrimary }}>
              {proposal.verification.status === 'PENDING' ? 'Submit Proposal for Review?' : 'Resubmit Proposal?'}
            </h3>
          </div>

          <div className="space-y-3 mb-6">
            <p style={{ color: tokens.textSecondary }}>
              {proposal.verification.status === 'PENDING'
                ? 'Once submitted, your proposal will be sent to the admin review queue. You can make edits if the admin requests changes.'
                : 'You are resubmitting your proposal after addressing the admin\'s feedback.'}
            </p>

            <div
              className="rounded-lg p-3 space-y-2"
              style={{
                background: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
                borderLeft: '3px solid #3b82f6',
              }}
            >
              <p className="text-sm font-medium" style={{ color: tokens.textSecondary }}>
                Your submission includes:
              </p>
              <ul className="text-xs space-y-1" style={{ color: tokens.textMuted }}>
                <li>• Dataset Title: <span style={{ color: tokens.textPrimary }} className="font-medium">{proposal.dataset.title}</span></li>
                <li>• File: <span style={{ color: tokens.textPrimary }} className="font-medium">{proposal.currentUpload?.originalFileName || 'Uploaded'}</span></li>
                <li>• Format: <span style={{ color: tokens.textPrimary }} className="font-medium">{proposal.dataFormatInfo?.fileFormat || 'Defined'}</span></li>
                <li>• Features: <span style={{ color: tokens.textPrimary }} className="font-medium">{proposal.features?.length || 0} column{proposal.features?.length !== 1 ? 's' : ''}</span></li>
                {pricingData && pricingData.status === 'DRAFT' && (
                  <li>• Pricing: <span style={{ color: tokens.textPrimary }} className="font-medium">{pricingData.isPaid ? `${pricingData.price} ${pricingData.currency}` : 'Free'}</span></li>
                )}
              </ul>
            </div>

            {pricingData && pricingData.status === 'DRAFT' && (
              <div
                className="rounded-lg p-3 border-l-4"
                style={{
                  background: isDark ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.08)',
                  borderColor: '#22c55e',
                }}
              >
                <p className="text-xs font-semibold mb-1" style={{ color: '#22c55e' }}>
                  ✓ Pricing will also be submitted
                </p>
                <p className="text-xs leading-relaxed" style={{ color: tokens.textMuted }}>
                  Your pricing is in draft status. It will be submitted together with your proposal for admin review.
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={submitting}
              className="flex-1 h-10 font-semibold transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
              style={{
                background: tokens.glassBg || 'transparent',
                border: `1.5px solid ${tokens.inputBorder}`,
                color: tokens.textPrimary,
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              disabled={submitting}
              className="flex-1 h-10 font-semibold transition-all duration-200 hover:shadow-md hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
              style={{
                background: submitting
                  ? 'rgba(156, 163, 175, 0.2)'
                  : tokens.glassBg || 'transparent',
                border: `1.5px solid ${submitting
                    ? 'rgba(156, 163, 175, 0.3)'
                    : tokens.glassBorder || tokens.borderSubtle
                  }`,
                color: tokens.textPrimary,
              }}
            >
              {submitting ? 'Submitting...' : 'Confirm & Submit'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
