'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { StyledSelect } from '@/components/datasets/shared';
import { CategoriesSelect, SourcesSelect } from '@/components/catalog';
import { DATASET_TYPES } from '@/constants/dataset.constants';
import type { Currency, DatasetSuperType, SampleDeliveryMechanism } from '@/types/dataset-proposal.types';
import type { Source } from '@/types/catalog.types';

interface BasicInfoStepProps {
  data: {
    title: string;
    superType: DatasetSuperType | '';
    primaryCategoryId: string;
    sourceId: string;
    license: string;
    isSample: boolean;
    sampleNotes: {
      whySample: string;
      actualDataSize: string;
      completeness: string;
      deliveryMechanism: SampleDeliveryMechanism | '';
      deliveryMechanismNotes: string;
    };
    actualPrice: string;
    actualPriceCurrency: Currency;
    isNegotiable: boolean | null;
  };
  onChange: (field: string, value: any) => void;
  onSourceCreated?: (source: Source) => void;
  disabled?: boolean;
  tokens: any;
  isDark?: boolean;
}

export function BasicInfoStep({ 
  data, 
  onChange, 
  onSourceCreated,
  disabled, 
  tokens,
  isDark = false,
}: BasicInfoStepProps) {
  const CURRENCY_OPTIONS = [
    { value: 'USD', label: 'USD ($)' },
    { value: 'INR', label: 'INR (₹)' },
    { value: 'EUR', label: 'EUR (€)' },
    { value: 'GBP', label: 'GBP (£)' },
  ];

  const DELIVERY_OPTIONS = [
    { value: 'API', label: 'API' },
    { value: 'FILE', label: 'File' },
    { value: 'OTHER', label: 'Other' },
  ];

  const NEGOTIABLE_OPTIONS = [
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' },
  ];

  const sampleNotes = data.sampleNotes ?? {
    whySample: '',
    actualDataSize: '',
    completeness: '',
    deliveryMechanism: '',
    deliveryMechanismNotes: '',
  };

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="title" style={{ color: tokens.textPrimary }}>
          Dataset Title <span className="text-red-500">*</span>
        </Label>
        <Input
          id="title"
          value={data.title}
          onChange={(e) => onChange('title', e.target.value)}
          placeholder="e.g., Financial Q4 2023 Report"
          disabled={disabled}
          style={{
            background: tokens.inputBg,
            borderColor: tokens.inputBorder,
            color: tokens.textPrimary,
          }}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="superType" style={{ color: tokens.textPrimary }}>
          Dataset Type <span className="text-red-500">*</span>
        </Label>
        <StyledSelect
          value={data.superType}
          onValueChange={(value) => onChange('superType', value)}
          options={[...DATASET_TYPES]}
          placeholder="Select dataset type"
          isDark={isDark}
          tokens={tokens}
        />
      </div>

      {/* Primary Category - Dynamic Dropdown */}
      <CategoriesSelect
        value={data.primaryCategoryId}
        onValueChange={(value) => onChange('primaryCategoryId', value)}
        disabled={disabled}
        tokens={tokens}
        isDark={isDark}
      />

      {/* Source - Dynamic Dropdown with Create New */}
      <SourcesSelect
        value={data.sourceId}
        onValueChange={(value) => onChange('sourceId', value)}
        onSourceCreated={onSourceCreated}
        disabled={disabled}
        tokens={tokens}
        isDark={isDark}
        allowCreate={true}
      />

      <div className="space-y-2">
        <Label htmlFor="license" style={{ color: tokens.textPrimary }}>
          License <span className="text-red-500">*</span>
        </Label>
        <Input
          id="license"
          value={data.license}
          onChange={(e) => onChange('license', e.target.value)}
          placeholder="e.g., MIT, Apache-2.0, Proprietary"
          disabled={disabled}
          style={{
            background: tokens.inputBg,
            borderColor: tokens.inputBorder,
            color: tokens.textPrimary,
          }}
        />
      </div>

      <div className="space-y-2 pt-2 border-t" style={{ borderColor: tokens.borderDefault }}>
        <Label style={{ color: tokens.textPrimary }} className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={!!data.isSample}
            onChange={(e) => onChange('isSample', e.target.checked)}
            disabled={disabled}
            className="w-5 h-5 rounded cursor-pointer"
            style={{
              background: data.isSample ? '#3b82f6' : tokens.inputBg,
              borderColor: data.isSample ? '#3b82f6' : tokens.inputBorder,
            }}
          />
          <span className="font-medium">This is a sample dataset proposal</span>
        </Label>
      </div>

      {data.isSample ? (
        <div className="space-y-4 rounded-lg border p-4" style={{ borderColor: tokens.borderDefault }}>
          <div className="space-y-2">
            <Label htmlFor="whySample" style={{ color: tokens.textPrimary }}>
              Why is this a sample dataset? <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="whySample"
              value={sampleNotes.whySample ?? ''}
              onChange={(e) => onChange('sampleNotes.whySample', e.target.value)}
              placeholder="Describe why this proposal is a sample"
              disabled={disabled}
              rows={3}
              style={{
                background: tokens.inputBg,
                borderColor: tokens.inputBorder,
                color: tokens.textPrimary,
              }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="actualDataSize" style={{ color: tokens.textPrimary }}>
                Actual dataset size <span className="text-red-500">*</span>
              </Label>
              <Input
                id="actualDataSize"
                value={sampleNotes.actualDataSize ?? ''}
                onChange={(e) => onChange('sampleNotes.actualDataSize', e.target.value)}
                placeholder="e.g., 120 GB"
                disabled={disabled}
                style={{
                  background: tokens.inputBg,
                  borderColor: tokens.inputBorder,
                  color: tokens.textPrimary,
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="completeness" style={{ color: tokens.textPrimary }}>
                Completeness (optional)
              </Label>
              <Input
                id="completeness"
                value={sampleNotes.completeness ?? ''}
                onChange={(e) => onChange('sampleNotes.completeness', e.target.value)}
                placeholder="e.g., 80% representative"
                disabled={disabled}
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
              <Label style={{ color: tokens.textPrimary }}>
                Delivery mechanism <span className="text-red-500">*</span>
              </Label>
              <StyledSelect
                value={sampleNotes.deliveryMechanism ?? ''}
                onValueChange={(value) => onChange('sampleNotes.deliveryMechanism', value)}
                options={DELIVERY_OPTIONS}
                placeholder="Select delivery mechanism"
                isDark={isDark}
                tokens={tokens}
              />
            </div>

            <div className="space-y-2">
              <Label style={{ color: tokens.textPrimary }}>
                Is price negotiable? <span className="text-red-500">*</span>
              </Label>
              <StyledSelect
                value={data.isNegotiable === null ? '' : data.isNegotiable ? 'yes' : 'no'}
                onValueChange={(value) => onChange('isNegotiable', value === 'yes')}
                options={NEGOTIABLE_OPTIONS}
                placeholder="Select one"
                isDark={isDark}
                tokens={tokens}
              />
            </div>
          </div>

          {sampleNotes.deliveryMechanism === 'OTHER' ? (
            <div className="space-y-2">
              <Label htmlFor="deliveryMechanismNotes" style={{ color: tokens.textPrimary }}>
                Delivery mechanism notes <span className="text-red-500">*</span>
              </Label>
              <Input
                id="deliveryMechanismNotes"
                value={sampleNotes.deliveryMechanismNotes ?? ''}
                onChange={(e) => onChange('sampleNotes.deliveryMechanismNotes', e.target.value)}
                placeholder="Describe delivery mechanism"
                disabled={disabled}
                style={{
                  background: tokens.inputBg,
                  borderColor: tokens.inputBorder,
                  color: tokens.textPrimary,
                }}
              />
            </div>
          ) : null}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="actualPrice" style={{ color: tokens.textPrimary }}>
                Actual full price (integer) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="actualPrice"
                type="number"
                min={0}
                step={1}
                value={data.actualPrice ?? ''}
                onChange={(e) => onChange('actualPrice', e.target.value)}
                placeholder="e.g., 499"
                disabled={disabled}
                style={{
                  background: tokens.inputBg,
                  borderColor: tokens.inputBorder,
                  color: tokens.textPrimary,
                }}
              />
            </div>

            <div className="space-y-2">
              <Label style={{ color: tokens.textPrimary }}>
                Actual price currency <span className="text-red-500">*</span>
              </Label>
              <StyledSelect
                value={data.actualPriceCurrency || 'USD'}
                onValueChange={(value) => onChange('actualPriceCurrency', value)}
                options={CURRENCY_OPTIONS}
                placeholder="Select currency"
                isDark={isDark}
                tokens={tokens}
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
