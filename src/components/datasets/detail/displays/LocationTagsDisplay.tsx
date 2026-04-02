'use client';

import { Label } from '@/components/ui/label';
import type { ProposalDetailsResponse } from '@/types/dataset-proposal.types';

interface LocationTagsDisplayProps {
  proposal: ProposalDetailsResponse;
  tokens: any;
}

export function LocationTagsDisplay({ proposal, tokens }: LocationTagsDisplayProps) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label style={{ color: tokens.textSecondary }}>Country</Label>
          <p className="text-sm" style={{ color: tokens.textPrimary }}>
            {proposal.locationInfo?.country || 'N/A'}
          </p>
        </div>
        <div className="space-y-2">
          <Label style={{ color: tokens.textSecondary }}>State</Label>
          <p className="text-sm" style={{ color: tokens.textPrimary }}>
            {proposal.locationInfo?.state || 'N/A'}
          </p>
        </div>
        <div className="space-y-2">
          <Label style={{ color: tokens.textSecondary }}>City</Label>
          <p className="text-sm" style={{ color: tokens.textPrimary }}>
            {proposal.locationInfo?.city || 'N/A'}
          </p>
        </div>
        <div className="space-y-2">
          <Label style={{ color: tokens.textSecondary }}>Region</Label>
          <p className="text-sm" style={{ color: tokens.textPrimary }}>
            {proposal.locationInfo?.region || 'N/A'}
          </p>
        </div>
        <div className="space-y-2">
          <Label style={{ color: tokens.textSecondary }}>Coverage</Label>
          <p className="text-sm" style={{ color: tokens.textPrimary }}>
            {proposal.locationInfo?.coverage || 'N/A'}
          </p>
        </div>
        <div className="space-y-2">
          <Label style={{ color: tokens.textSecondary }}>Coordinates</Label>
          <p className="text-sm" style={{ color: tokens.textPrimary }}>
            {proposal.locationInfo?.coordinates || 'N/A'}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label style={{ color: tokens.textSecondary }}>Tags</Label>
        {proposal.tags && proposal.tags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {proposal.tags.map((tag, index) => (
              <span
                key={`${tag}-${index}`}
                className="px-2.5 py-1 text-xs rounded-full"
                style={{
                  background: 'rgba(59, 130, 246, 0.1)',
                  color: '#3b82f6',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm" style={{ color: tokens.textPrimary }}>No tags</p>
        )}
      </div>
    </div>
  );
}
