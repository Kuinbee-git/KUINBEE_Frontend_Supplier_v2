'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { StyledSelect } from '@/components/datasets/shared';
import { DollarSign, AlertCircle } from 'lucide-react';
import type { UpsertPricingRequest } from '@/types/dataset-proposal.types';

interface PricingStepProps {
  data: UpsertPricingRequest;
  onChange: (field: keyof UpsertPricingRequest, value: any) => void;
  disabled?: boolean;
  tokens: any;
  isDark?: boolean;
}

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'INR', label: 'INR (₹)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
];

export function PricingStep({ 
  data, 
  onChange, 
  disabled,
  tokens,
  isDark = false,
}: PricingStepProps) {
  return (
    <>
      <div className="space-y-1 mb-6">
        <h3 className="text-base font-semibold" style={{ color: tokens.textPrimary }}>
          Set Your Pricing
        </h3>
        <p className="text-sm" style={{ color: tokens.textMuted }}>
          Decide whether your dataset is free or paid. You can change this later.
        </p>
      </div>

      {/* Info Banner */}
      <div
        className="rounded-lg p-4 flex items-start gap-3 mb-6"
        style={{
          background: tokens.infoBg,
          border: `1px solid ${tokens.infoBorder}`,
        }}
      >
        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: tokens.infoText }} />
        <p className="text-sm" style={{ color: tokens.textPrimary }}>
          Pricing is submitted along with your proposal for admin review. Once approved, it becomes active on the marketplace.
        </p>
      </div>

      {/* Paid Toggle */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Label style={{ color: tokens.textPrimary }} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={data.isPaid}
                onChange={(e) => onChange('isPaid', e.target.checked)}
                disabled={disabled}
                className="w-5 h-5 rounded cursor-pointer"
                style={{
                  background: data.isPaid ? '#3b82f6' : tokens.inputBg,
                  borderColor: data.isPaid ? '#3b82f6' : tokens.inputBorder,
                }}
              />
              <span className="font-medium">This dataset is paid</span>
            </Label>
          </div>
        </div>

        {/* Conditional Paid Fields */}
        {data.isPaid && (
          <div className="space-y-4 pt-4 border-t" style={{ borderColor: tokens.borderDefault }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Price Input */}
              <div className="space-y-2">
                <Label htmlFor="price" style={{ color: tokens.textPrimary }}>
                  Price <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <DollarSign
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                    style={{ color: tokens.textMuted }}
                  />
                  <Input
                    id="price"
                    type="text"
                    value={data.price || ''}
                    onChange={(e) => onChange('price', e.target.value)}
                    placeholder="99.99"
                    disabled={disabled}
                    className="pl-10"
                    style={{
                      background: tokens.inputBg,
                      borderColor: tokens.inputBorder,
                      color: tokens.textPrimary,
                    }}
                  />
                </div>
                <p className="text-xs" style={{ color: tokens.textMuted }}>
                  Enter the price in your selected currency
                </p>
              </div>

              {/* Currency Select */}
              <div className="space-y-2">
                <Label htmlFor="currency" style={{ color: tokens.textPrimary }}>
                  Currency <span className="text-red-500">*</span>
                </Label>
                <StyledSelect
                  value={data.currency || 'USD'}
                  onValueChange={(value) => onChange('currency', value)}
                  options={CURRENCY_OPTIONS}
                  placeholder="Select currency"
                  isDark={isDark}
                  tokens={tokens}
                />
              </div>
            </div>

            {/* Price Preview */}
            {data.price && (
              <div
                className="rounded-lg p-4"
                style={{ background: tokens.successBg, border: `1px solid ${tokens.successBorder}` }}
              >
                <p className="text-sm" style={{ color: tokens.textMuted }}>Price Preview</p>
                <p className="text-2xl font-bold mt-1" style={{ color: tokens.textPrimary }}>
                  {data.currency === 'USD' && '$'}
                  {data.currency === 'EUR' && '€'}
                  {data.currency === 'GBP' && '£'}
                  {data.currency === 'INR' && '₹'}
                  {data.price}
                  <span className="text-lg font-normal ml-1" style={{ color: tokens.textMuted }}>
                    {data.currency}
                  </span>
                </p>
              </div>
            )}
          </div>
        )}

        {!data.isPaid && (
          <div
            className="rounded-lg p-4"
            style={{ background: tokens.successBg, border: `1px solid ${tokens.successBorder}` }}
          >
            <p className="text-sm font-medium" style={{ color: tokens.successText }}>
              ✓ This dataset will be available for free
            </p>
            <p className="text-xs mt-1" style={{ color: tokens.textMuted }}>
              Users can download and use this dataset without any cost
            </p>
          </div>
        )}
      </div>
    </>
  );
}
