'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { DollarSign, AlertCircle } from 'lucide-react';
import { PRICING_STATUS_CONFIG } from '@/constants/dataset.constants';
import type { DatasetPricingVersion } from '@/types/dataset-proposal.types';

interface PricingSectionProps {
  pricingData: DatasetPricingVersion;
  isSampleProposal: boolean;
  onEditPricing: () => void;
  isDark: boolean;
  tokens: any;
}

export function PricingSection({
  pricingData,
  isSampleProposal,
  onEditPricing,
  isDark,
  tokens,
}: PricingSectionProps) {
  return (
    <Card
      className="border overflow-hidden transition-shadow duration-200 hover:shadow-md"
      style={{
        background: isDark
          ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.04) 0%, rgba(16, 185, 129, 0.04) 100%)'
          : 'linear-gradient(135deg, rgba(34, 197, 94, 0.02) 0%, rgba(16, 185, 129, 0.02) 100%)',
        borderColor: tokens.borderDefault,
      }}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center transition-transform duration-200"
              style={{
                background: isDark
                  ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(16, 185, 129, 0.15) 100%)'
                  : 'linear-gradient(135deg, rgba(34, 197, 94, 0.12) 0%, rgba(16, 185, 129, 0.12) 100%)',
                border: `2px solid rgba(34, 197, 94, 0.2)`,
              }}
            >
              <DollarSign className="w-6 h-6" style={{ color: '#22c55e' }} />
            </div>
            <div>
              <h3 className="text-base font-semibold" style={{ color: tokens.textPrimary }}>
                Pricing Management
              </h3>
              <p className="text-xs mt-1" style={{ color: tokens.textMuted }}>
                {pricingData.isPaid ? `${pricingData.price} ${pricingData.currency}` : 'Free Dataset'}
              </p>
            </div>
          </div>
          <span
            className="px-4 py-2 rounded-full text-xs font-semibold transition-transform duration-200 hover:scale-105"
            style={{
              background: PRICING_STATUS_CONFIG[pricingData.status]?.bgColor || '#f3f4f6',
              color: PRICING_STATUS_CONFIG[pricingData.status]?.color || '#6b7280',
              border: `1.5px solid ${PRICING_STATUS_CONFIG[pricingData.status]?.color
                  ? PRICING_STATUS_CONFIG[pricingData.status]?.color + '4d'
                  : 'rgba(107, 114, 128, 0.3)'
                }`,
            }}
          >
            <span className="mr-1.5">{PRICING_STATUS_CONFIG[pricingData.status]?.icon}</span>
            {PRICING_STATUS_CONFIG[pricingData.status]?.label || pricingData.status}
          </span>
        </div>

        {/* Content */}
        <div className="space-y-4 sm:space-y-5">
          {/* Price Information */}
          <div
            className="p-4 sm:p-5 rounded-xl border transition-all duration-200"
            style={{
              background: isDark
                ? 'rgba(255, 255, 255, 0.03)'
                : 'rgba(26, 34, 64, 0.02)',
              borderColor: tokens.borderSubtle,
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <Label style={{ color: tokens.textSecondary }} className="text-xs">
                  Price Type
                </Label>
                <p className="text-sm font-medium mt-2" style={{ color: tokens.textPrimary }}>
                  {pricingData.isPaid ? 'Paid Dataset' : 'Free Dataset'}
                </p>
              </div>
              {pricingData.isPaid && (
                <div className="text-right">
                  <Label style={{ color: tokens.textSecondary }} className="text-xs">
                    Amount
                  </Label>
                  <p
                    className="text-2xl font-bold mt-2 tracking-tight"
                    style={{ color: '#22c55e' }}
                  >
                    {pricingData.currency === 'USD' && '$'}
                    {pricingData.currency === 'INR' && '₹'}
                    {pricingData.currency === 'EUR' && '€'}
                    {pricingData.currency === 'GBP' && '£'}
                    {pricingData.price}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Admin Feedback */}
          {pricingData.status === 'CHANGES_REQUESTED' && (
            <div
              className="p-4 sm:p-5 rounded-xl border-l-4 transition-all duration-200"
              style={{
                background: isDark
                  ? 'rgba(234, 179, 8, 0.1)'
                  : 'rgba(234, 179, 8, 0.15)',
                borderLeftColor: isDark ? '#fbbf24' : '#d97706',
              }}
            >
              <div className="flex items-start gap-3">
                <AlertCircle
                  className="w-5 h-5 flex-shrink-0 mt-0.5"
                  style={{ color: isDark ? '#fbbf24' : '#d97706' }}
                />
                <div className="flex-1">
                  <p className="text-sm font-semibold mb-3" style={{ color: isDark ? '#eab308' : '#b45309' }}>
                    Pricing Changes Requested
                  </p>

                  <div className="space-y-3">
                    {pricingData.notes && (
                      <div>
                        <p className="text-xs font-medium mb-2 uppercase tracking-wider" style={{ color: tokens.textSecondary }}>
                          Feedback Notes
                        </p>
                        <div
                          className="p-3 rounded-lg border text-sm leading-relaxed"
                          style={{
                            background: isDark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.5)',
                            borderColor: isDark ? 'rgba(234, 179, 8, 0.2)' : 'rgba(234, 179, 8, 0.3)',
                            color: tokens.textPrimary,
                          }}
                        >
                          {pricingData.notes}
                        </div>
                      </div>
                    )}

                    <p className="text-xs pt-2" style={{ color: tokens.textSecondary }}>
                      Please review the feedback above and update your pricing before resubmitting.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Status Message */}
          <div
            className="p-3 sm:p-4 rounded-lg border-l-4 transition-all duration-200"
            style={{
              background: isDark
                ? 'rgba(59, 130, 246, 0.08)'
                : 'rgba(59, 130, 246, 0.12)',
              borderColor: '#3b82f6',
            }}
          >
            <p className="text-xs sm:text-sm leading-relaxed" style={{ color: tokens.textSecondary }}>
              {isSampleProposal && '🧪 Sample proposal pricing is locked to free and cannot be edited here.'}
              {isSampleProposal && ' '}
              {pricingData.status === 'DRAFT' && '💾 Your pricing is saved as draft. Review and submit it when ready.'}
              {pricingData.status === 'SUBMITTED' && '📤 Your pricing is submitted and under admin review.'}
              {pricingData.status === 'CHANGES_REQUESTED' && '✏️ Admin has requested changes. Make edits and resubmit.'}
              {pricingData.status === 'RESUBMITTED' && '📤 Your updated pricing is under review.'}
              {pricingData.status === 'UNDER_REVIEW' && '👀 Your pricing is being reviewed by admin.'}
              {pricingData.status === 'ACTIVE' && '✅ Your pricing is active and live.'}
              {pricingData.status === 'REJECTED' && '❌ Your pricing was rejected. Edit and resubmit.'}
              {pricingData.status === 'INACTIVE' && '🔒 Your pricing is currently inactive.'}
            </p>
          </div>

          {/* Action Button */}
          {!isSampleProposal && (pricingData.status === 'DRAFT' || pricingData.status === 'CHANGES_REQUESTED' || pricingData.status === 'REJECTED') && (
            <div className="pt-2">
              <Button
                onClick={onEditPricing}
                className="w-full font-semibold transition-all duration-200 hover:shadow-md hover:scale-[1.01] active:scale-[0.99]"
                style={{
                  background: tokens.glassBg || 'transparent',
                  border: `1.5px solid ${pricingData.status === 'CHANGES_REQUESTED'
                      ? 'rgba(239, 68, 68, 0.5)'
                      : tokens.glassBorder || tokens.borderSubtle
                    }`,
                  color: tokens.textPrimary,
                }}
              >
                <DollarSign className="w-4 h-4 mr-2" />
                {pricingData.status === 'CHANGES_REQUESTED' ? 'Update & Resubmit Pricing' : 'Edit Pricing'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
