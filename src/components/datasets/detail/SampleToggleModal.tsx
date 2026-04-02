'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRightLeft } from 'lucide-react';
import type { Currency, SampleDeliveryMechanism } from '@/types/dataset-proposal.types';

interface SampleToggleModalProps {
  pendingSampleValue: boolean | null;
  sampleToggleSubmitting: boolean;
  sampleToggleError: string | null;

  // Form fields
  sampleWhy: string;
  onSampleWhyChange: (value: string) => void;
  sampleSize: string;
  onSampleSizeChange: (value: string) => void;
  sampleCompleteness: string;
  onSampleCompletenessChange: (value: string) => void;
  sampleDelivery: SampleDeliveryMechanism;
  onSampleDeliveryChange: (value: SampleDeliveryMechanism) => void;
  sampleDeliveryNotes: string;
  onSampleDeliveryNotesChange: (value: string) => void;
  sampleActualPrice: string;
  onSampleActualPriceChange: (value: string) => void;
  sampleActualPriceCurrency: Currency;
  onSampleActualPriceCurrencyChange: (value: Currency) => void;
  sampleNegotiable: 'yes' | 'no';
  onSampleNegotiableChange: (value: 'yes' | 'no') => void;

  // Handlers
  onConfirm: () => void;
  onCancel: () => void;

  isDark: boolean;
  tokens: any;
}

export function SampleToggleModal({
  pendingSampleValue,
  sampleToggleSubmitting,
  sampleToggleError,
  sampleWhy,
  onSampleWhyChange,
  sampleSize,
  onSampleSizeChange,
  sampleCompleteness,
  onSampleCompletenessChange,
  sampleDelivery,
  onSampleDeliveryChange,
  sampleDeliveryNotes,
  onSampleDeliveryNotesChange,
  sampleActualPrice,
  onSampleActualPriceChange,
  sampleActualPriceCurrency,
  onSampleActualPriceCurrencyChange,
  sampleNegotiable,
  onSampleNegotiableChange,
  onConfirm,
  onCancel,
  isDark,
  tokens,
}: SampleToggleModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <Card
        className="w-full max-w-xl shadow-xl border rounded-lg"
        style={{
          background: isDark ? 'rgba(26, 34, 64, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          borderColor: tokens.borderDefault,
          backdropFilter: isDark ? 'blur(12px)' : 'none',
          WebkitBackdropFilter: isDark ? 'blur(12px)' : 'none',
        }}
      >
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <ArrowRightLeft className="w-5 h-5" style={{ color: '#3b82f6' }} />
            <h3 className="text-lg font-semibold" style={{ color: tokens.textPrimary }}>
              {pendingSampleValue ? 'Enable Sample Mode' : 'Disable Sample Mode'}
            </h3>
          </div>

          <p className="text-sm" style={{ color: tokens.textSecondary }}>
            {pendingSampleValue
              ? 'Confirm this draft should be marked as sample and provide required sample details.'
              : 'Confirm this draft should be converted from sample to regular. Sample-specific fields will be cleared.'}
          </p>

          {pendingSampleValue && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label style={{ color: tokens.textPrimary }}>Why sample *</Label>
                <Textarea
                  value={sampleWhy}
                  onChange={(e) => onSampleWhyChange(e.target.value)}
                  rows={3}
                  placeholder="Explain why this is a sample dataset"
                  style={{
                    background: tokens.inputBg,
                    borderColor: tokens.inputBorder,
                    color: tokens.textPrimary,
                  }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label style={{ color: tokens.textPrimary }}>Actual dataset size *</Label>
                  <Input
                    value={sampleSize}
                    onChange={(e) => onSampleSizeChange(e.target.value)}
                    placeholder="e.g., 120 GB"
                    style={{
                      background: tokens.inputBg,
                      borderColor: tokens.inputBorder,
                      color: tokens.textPrimary,
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label style={{ color: tokens.textPrimary }}>Completeness (optional)</Label>
                  <Input
                    value={sampleCompleteness}
                    onChange={(e) => onSampleCompletenessChange(e.target.value)}
                    placeholder="e.g., 80% representative"
                    style={{
                      background: tokens.inputBg,
                      borderColor: tokens.inputBorder,
                      color: tokens.textPrimary,
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label style={{ color: tokens.textPrimary }}>Delivery mechanism *</Label>
                  <select
                    value={sampleDelivery}
                    onChange={(e) => onSampleDeliveryChange(e.target.value as SampleDeliveryMechanism)}
                    className="w-full h-10 rounded-md border px-3 text-sm"
                    style={{
                      background: tokens.inputBg,
                      borderColor: tokens.inputBorder,
                      color: tokens.textPrimary,
                    }}
                  >
                    <option value="API">API</option>
                    <option value="FILE">File</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label style={{ color: tokens.textPrimary }}>Is price negotiable? *</Label>
                  <select
                    value={sampleNegotiable}
                    onChange={(e) => onSampleNegotiableChange(e.target.value as 'yes' | 'no')}
                    className="w-full h-10 rounded-md border px-3 text-sm"
                    style={{
                      background: tokens.inputBg,
                      borderColor: tokens.inputBorder,
                      color: tokens.textPrimary,
                    }}
                  >
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>
              </div>

              {sampleDelivery === 'OTHER' && (
                <div className="space-y-2">
                  <Label style={{ color: tokens.textPrimary }}>Delivery mechanism notes *</Label>
                  <Input
                    value={sampleDeliveryNotes}
                    onChange={(e) => onSampleDeliveryNotesChange(e.target.value)}
                    placeholder="Describe delivery mechanism"
                    style={{
                      background: tokens.inputBg,
                      borderColor: tokens.inputBorder,
                      color: tokens.textPrimary,
                    }}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label style={{ color: tokens.textPrimary }}>Actual full price *</Label>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    value={sampleActualPrice}
                    onChange={(e) => onSampleActualPriceChange(e.target.value)}
                    placeholder="e.g., 499"
                    style={{
                      background: tokens.inputBg,
                      borderColor: tokens.inputBorder,
                      color: tokens.textPrimary,
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label style={{ color: tokens.textPrimary }}>Currency *</Label>
                  <select
                    value={sampleActualPriceCurrency}
                    onChange={(e) => onSampleActualPriceCurrencyChange(e.target.value as Currency)}
                    className="w-full h-10 rounded-md border px-3 text-sm"
                    style={{
                      background: tokens.inputBg,
                      borderColor: tokens.inputBorder,
                      color: tokens.textPrimary,
                    }}
                  >
                    <option value="USD">USD ($)</option>
                    <option value="INR">INR (₹)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {sampleToggleError && (
            <p className="text-sm" style={{ color: '#dc2626' }}>{sampleToggleError}</p>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={sampleToggleSubmitting}
              className="flex-1"
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
              disabled={sampleToggleSubmitting}
              className="flex-1"
              style={{
                background: sampleToggleSubmitting
                  ? 'rgba(156, 163, 175, 0.2)'
                  : tokens.glassBg || 'transparent',
                border: `1.5px solid ${sampleToggleSubmitting
                    ? 'rgba(156, 163, 175, 0.3)'
                    : tokens.glassBorder || tokens.borderSubtle
                  }`,
                color: tokens.textPrimary,
              }}
            >
              {sampleToggleSubmitting ? 'Saving...' : 'Confirm'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
