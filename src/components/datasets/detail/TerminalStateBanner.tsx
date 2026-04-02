'use client';

import { CheckCircle, XCircle } from 'lucide-react';
import type { VerificationStatus } from '@/types/dataset-proposal.types';

interface TerminalStateBannerProps {
  verificationStatus: VerificationStatus;
  rejectionReason: string | null;
  tokens: any;
}

export function TerminalStateBanner({ verificationStatus, rejectionReason, tokens }: TerminalStateBannerProps) {
  const isVerified = verificationStatus === 'VERIFIED';

  return (
    <div
      className="mb-6 rounded-lg border px-6 py-4 flex items-center justify-between"
      style={{
        background: isVerified ? tokens.bannerBg : tokens.warningBg,
        borderColor: isVerified ? tokens.bannerBorder : tokens.warningBorder,
      }}
    >
      <div className="flex items-center gap-3">
        {isVerified ? (
          <CheckCircle className="w-5 h-5" style={{ color: tokens.bannerText }} />
        ) : (
          <XCircle className="w-5 h-5" style={{ color: tokens.warningText }} />
        )}
        <div>
          <p
            className="text-sm font-semibold"
            style={{ color: isVerified ? tokens.bannerText : tokens.warningText }}
          >
            {isVerified ? 'Proposal Verified' : 'Proposal Rejected'}
          </p>
          <p className="text-xs" style={{ color: tokens.textMuted }}>
            {isVerified
              ? 'This proposal has been verified and is ready for publication'
              : rejectionReason || 'This proposal has been rejected and cannot be edited'}
          </p>
        </div>
      </div>
    </div>
  );
}
