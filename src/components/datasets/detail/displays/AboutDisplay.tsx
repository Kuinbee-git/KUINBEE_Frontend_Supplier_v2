'use client';

import { Label } from '@/components/ui/label';
import type { AboutDatasetInfo } from '@/types/dataset-proposal.types';

interface AboutDisplayProps {
  about: AboutDatasetInfo;
  tokens: any;
  formatDate: (date: string) => string;
}

export function AboutDisplay({ about, tokens, formatDate }: AboutDisplayProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label style={{ color: tokens.textSecondary }}>Overview</Label>
        <p className="text-sm leading-relaxed mt-1" style={{ color: tokens.textPrimary }}>
          {about.overview}
        </p>
      </div>
      <div>
        <Label style={{ color: tokens.textSecondary }}>Description</Label>
        <p className="text-sm leading-relaxed mt-1" style={{ color: tokens.textPrimary }}>
          {about.description}
        </p>
      </div>
      <div>
        <Label style={{ color: tokens.textSecondary }}>Data Quality</Label>
        <p className="text-sm leading-relaxed mt-1" style={{ color: tokens.textPrimary }}>
          {about.dataQuality}
        </p>
      </div>
      {about.useCases && (
        <div>
          <Label style={{ color: tokens.textSecondary }}>Use Cases</Label>
          <p className="text-sm leading-relaxed mt-1" style={{ color: tokens.textPrimary }}>
            {about.useCases}
          </p>
        </div>
      )}
      {about.limitations && (
        <div>
          <Label style={{ color: tokens.textSecondary }}>Limitations</Label>
          <p className="text-sm leading-relaxed mt-1" style={{ color: tokens.textPrimary }}>
            {about.limitations}
          </p>
        </div>
      )}
      {about.methodology && (
        <div>
          <Label style={{ color: tokens.textSecondary }}>Methodology</Label>
          <p className="text-sm leading-relaxed mt-1" style={{ color: tokens.textPrimary }}>
            {about.methodology}
          </p>
        </div>
      )}
      {about.updatedAt && (
        <div className="pt-3 border-t" style={{ borderColor: tokens.borderSubtle }}>
          <p className="text-xs" style={{ color: tokens.textMuted }}>
            Last updated: {formatDate(about.updatedAt)}
          </p>
        </div>
      )}
    </div>
  );
}
