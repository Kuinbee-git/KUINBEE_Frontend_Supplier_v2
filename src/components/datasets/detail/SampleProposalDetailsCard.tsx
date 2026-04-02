'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface SampleProposalDetailsCardProps {
  actualPrice: number | null | undefined;
  actualPriceCurrency: string | undefined;
  isNegotiable: boolean | null | undefined;
  sampleNotes: {
    whySample: string;
    actualDataSize: string;
    completeness?: string;
    deliveryMechanism: string;
    deliveryMechanismNotes?: string;
  } | null | undefined;
  isEditable: boolean;
  onEditClick: () => void;
  isDark: boolean;
  tokens: any;
}

export function SampleProposalDetailsCard({
  actualPrice,
  actualPriceCurrency,
  isNegotiable,
  sampleNotes,
  isEditable,
  onEditClick,
  isDark,
  tokens,
}: SampleProposalDetailsCardProps) {
  return (
    <Card
      className="border overflow-hidden"
      style={{
        background: isDark
          ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.14) 0%, rgba(30, 64, 175, 0.10) 100%)'
          : 'linear-gradient(135deg, rgba(59, 130, 246, 0.10) 0%, rgba(30, 64, 175, 0.06) 100%)',
        borderColor: '#3b82f6',
      }}
    >
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold" style={{ color: tokens.textPrimary }}>
            Sample Proposal Details
          </h3>
          <div className="flex items-center gap-2">
            <span
              className="px-3 py-1 rounded-full text-xs font-semibold"
              style={{
                background: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.14)',
                color: '#2563eb',
                border: '1px solid rgba(59, 130, 246, 0.4)',
              }}
            >
              SAMPLE
            </span>
            {isEditable && (
              <Button
                size="sm"
                variant="outline"
                onClick={onEditClick}
                className="font-semibold"
                style={{
                  background: isDark ? 'rgba(59, 130, 246, 0.12)' : 'rgba(59, 130, 246, 0.08)',
                  border: '1px solid rgba(59, 130, 246, 0.4)',
                  color: '#1d4ed8',
                }}
              >
                Edit
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label style={{ color: tokens.textSecondary }}>Actual Price</Label>
            <p className="text-sm font-medium" style={{ color: tokens.textPrimary }}>
              {actualPrice ?? 0} {actualPriceCurrency ?? ''}
            </p>
          </div>
          <div className="space-y-2">
            <Label style={{ color: tokens.textSecondary }}>Negotiable</Label>
            <p className="text-sm" style={{ color: tokens.textPrimary }}>
              {isNegotiable === true ? 'Yes' : isNegotiable === false ? 'No' : 'N/A'}
            </p>
          </div>
        </div>

        {sampleNotes && (
          <div className="space-y-2 rounded-lg border p-4" style={{ borderColor: 'rgba(59, 130, 246, 0.35)' }}>
            <Label style={{ color: tokens.textSecondary }}>Sample Notes</Label>
            <p className="text-sm" style={{ color: tokens.textPrimary }}>
              <span className="font-medium">Why sample:</span> {sampleNotes.whySample}
            </p>
            <p className="text-sm" style={{ color: tokens.textPrimary }}>
              <span className="font-medium">Actual data size:</span> {sampleNotes.actualDataSize}
            </p>
            {sampleNotes.completeness && (
              <p className="text-sm" style={{ color: tokens.textPrimary }}>
                <span className="font-medium">Completeness:</span> {sampleNotes.completeness}
              </p>
            )}
            <p className="text-sm" style={{ color: tokens.textPrimary }}>
              <span className="font-medium">Delivery mechanism:</span> {sampleNotes.deliveryMechanism}
            </p>
            {sampleNotes.deliveryMechanismNotes && (
              <p className="text-sm" style={{ color: tokens.textPrimary }}>
                <span className="font-medium">Delivery notes:</span> {sampleNotes.deliveryMechanismNotes}
              </p>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
