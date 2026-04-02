'use client';

import { Card } from '@/components/ui/card';
import { DatasetStatusBadge } from '../shared';
import { FileText } from 'lucide-react';
import type { VerificationStatus } from '@/types/dataset-proposal.types';

interface ProposalTitleCardProps {
  title: string;
  datasetUniqueId: string;
  verificationStatus: VerificationStatus;
  isDark: boolean;
  tokens: any;
}

export function ProposalTitleCard({ title, datasetUniqueId, verificationStatus, isDark, tokens }: ProposalTitleCardProps) {
  return (
    <Card
      className="border overflow-hidden mb-6"
      style={{
        background: tokens.surfaceCard,
        borderColor: tokens.borderDefault,
        boxShadow: isDark
          ? '0 8px 24px rgba(0, 0, 0, 0.2)'
          : '0 8px 24px rgba(26, 34, 64, 0.06)',
      }}
    >
      <div className="p-6">
        <div className="flex items-center justify-between gap-6 mb-4">
          <div className="flex items-center gap-4 flex-1">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{
                background: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(26, 34, 64, 0.08)',
              }}
            >
              <FileText className="w-6 h-6" style={{ color: tokens.textSecondary }} />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-semibold mb-1" style={{ color: tokens.textPrimary }}>
                {title}
              </h1>
              <div className="flex items-center gap-3">
                <DatasetStatusBadge status={verificationStatus} isDark={isDark} />
                <span className="text-sm" style={{ color: tokens.textMuted }}>
                  ID: {datasetUniqueId}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
