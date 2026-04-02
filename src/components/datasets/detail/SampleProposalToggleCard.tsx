'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRightLeft } from 'lucide-react';

interface SampleProposalToggleCardProps {
  isSampleProposal: boolean;
  isEditable: boolean;
  sampleToggleSubmitting: boolean;
  onToggle: (nextValue: boolean) => void;
  isDark: boolean;
  tokens: any;
}

export function SampleProposalToggleCard({
  isSampleProposal,
  isEditable,
  sampleToggleSubmitting,
  onToggle,
  isDark,
  tokens,
}: SampleProposalToggleCardProps) {
  return (
    <Card
      className="border overflow-hidden mb-6"
      style={{
        background: tokens.surfaceCard,
        borderColor: isSampleProposal ? '#3b82f6' : tokens.borderDefault,
      }}
    >
      <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: isSampleProposal
                ? (isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.12)')
                : (isDark ? 'rgba(107, 114, 128, 0.2)' : 'rgba(107, 114, 128, 0.12)'),
            }}
          >
            <ArrowRightLeft className="w-4 h-4" style={{ color: isSampleProposal ? '#2563eb' : tokens.textSecondary }} />
          </div>
          <div>
            <h3 className="text-sm font-semibold" style={{ color: tokens.textPrimary }}>
              Sample Proposal Toggle
            </h3>
            <p className="text-xs mt-1" style={{ color: tokens.textMuted }}>
              Current mode: {isSampleProposal ? 'Sample' : 'Regular'}
            </p>
          </div>
        </div>

        <Button
          onClick={() => onToggle(!isSampleProposal)}
          disabled={!isEditable || sampleToggleSubmitting}
          className="h-10 px-5 font-semibold"
          variant="outline"
          style={{
            background: tokens.glassBg || 'transparent',
            border: `1px solid ${tokens.glassBorder || tokens.borderSubtle}`,
            color: tokens.textPrimary,
          }}
        >
          {sampleToggleSubmitting
            ? 'Updating...'
            : isSampleProposal
              ? 'Switch to Regular'
              : 'Switch to Sample'}
        </Button>
      </div>
    </Card>
  );
}
