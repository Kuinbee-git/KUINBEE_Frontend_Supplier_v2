'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { getDatasetThemeTokens } from '@/constants/dataset.constants';
import { StyledSelect } from '@/components/datasets/shared';
import { Save, X, AlertCircle, CheckCircle } from 'lucide-react';
import { updateProposalMetadata } from '@/lib/api';
import { CategoriesSelect, SourcesSelect } from '@/components/catalog';
import type {
  Currency,
  SampleDeliveryMechanism,
  SampleNotes,
  UpdateProposalRequest,
} from '@/types/dataset-proposal.types';

interface MetadataFormData {
  title: string;
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
}

interface MetadataEditFormProps {
  datasetId: string;
  initialData: {
    title: string;
    primaryCategoryId: string;
    sourceId: string;
    license: string;
    isSample?: boolean;
    sampleNotes?: SampleNotes | null;
    actualPrice?: number | null;
    actualPriceCurrency?: Currency;
    isNegotiable?: boolean | null;
  };
  isDark?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const DEFAULT_SAMPLE_NOTES: MetadataFormData['sampleNotes'] = {
  whySample: '',
  actualDataSize: '',
  completeness: '',
  deliveryMechanism: '',
  deliveryMechanismNotes: '',
};

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'INR', label: 'INR (₹)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
] as const;

const DELIVERY_OPTIONS = [
  { value: 'API', label: 'API' },
  { value: 'FILE', label: 'File' },
  { value: 'OTHER', label: 'Other' },
] as const;

const NEGOTIABLE_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
] as const;

export function MetadataEditForm({
  datasetId,
  initialData,
  isDark = false,
  onSuccess,
  onCancel,
}: MetadataEditFormProps) {
  const tokens = getDatasetThemeTokens(isDark);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const initialSampleNotes = {
    ...DEFAULT_SAMPLE_NOTES,
    ...(initialData.sampleNotes ?? {}),
  };
  const initialActualPrice =
    initialData.actualPrice != null ? String(initialData.actualPrice) : '';
  const initialActualPriceCurrency = initialData.actualPriceCurrency ?? 'USD';
  const initialIsSample = initialData.isSample === true;
  const initialIsNegotiable =
    initialData.isNegotiable === true
      ? true
      : initialData.isNegotiable === false
        ? false
        : null;

  const [formData, setFormData] = useState<MetadataFormData>({
    title: initialData.title,
    primaryCategoryId: initialData.primaryCategoryId,
    sourceId: initialData.sourceId,
    license: initialData.license,
    isSample: initialData.isSample === true,
    sampleNotes: initialSampleNotes,
    actualPrice: initialActualPrice,
    actualPriceCurrency: initialActualPriceCurrency,
    isNegotiable: initialIsNegotiable,
  });

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev) => {
      if (field.startsWith('sampleNotes.')) {
        const nestedKey = field.replace('sampleNotes.', '') as keyof MetadataFormData['sampleNotes'];
        return {
          ...prev,
          sampleNotes: {
            ...prev.sampleNotes,
            [nestedKey]: value,
          },
        };
      }

      return {
        ...prev,
        [field]: value,
      };
    });

    setError(null);
    setSuccess(false);
  };

  const isValidIntegerPrice = (value: string) => {
    if (!value.trim()) return false;
    const parsed = Number.parseInt(value, 10);
    return Number.isInteger(parsed) && parsed >= 0;
  };

  const isFormValid = () => {
    if (!formData.title?.trim() || !formData.license?.trim() || !formData.primaryCategoryId || !formData.sourceId) {
      return false;
    }

    if (!formData.isSample) {
      return true;
    }

    if (!formData.sampleNotes.whySample.trim()) return false;
    if (!formData.sampleNotes.actualDataSize.trim()) return false;
    if (!formData.sampleNotes.deliveryMechanism) return false;
    if (!isValidIntegerPrice(formData.actualPrice)) return false;
    if (!formData.actualPriceCurrency) return false;
    if (formData.isNegotiable === null) return false;
    if (formData.sampleNotes.deliveryMechanism === 'OTHER' && !formData.sampleNotes.deliveryMechanismNotes.trim()) return false;

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid()) {
      setError('Please fill in all required fields correctly');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      // Build payload with only changed fields
      const payload: UpdateProposalRequest = {};
      
      if (formData.title.trim() !== initialData.title.trim()) {
        payload.title = formData.title.trim();
      }
      if (formData.primaryCategoryId !== initialData.primaryCategoryId) {
        payload.primaryCategoryId = formData.primaryCategoryId;
      }
      if (formData.sourceId !== initialData.sourceId) {
        payload.sourceId = formData.sourceId;
      }
      if (formData.license.trim() !== initialData.license.trim()) {
        payload.license = formData.license.trim();
      }

      const initialNormalizedSampleNotes = {
        whySample: (initialSampleNotes.whySample ?? '').trim(),
        actualDataSize: (initialSampleNotes.actualDataSize ?? '').trim(),
        completeness: (initialSampleNotes.completeness ?? '').trim(),
        deliveryMechanism: (initialSampleNotes.deliveryMechanism ?? '') as SampleDeliveryMechanism | '',
        deliveryMechanismNotes: (initialSampleNotes.deliveryMechanismNotes ?? '').trim(),
      };
      const normalizedSampleNotes = {
        whySample: formData.sampleNotes.whySample.trim(),
        actualDataSize: formData.sampleNotes.actualDataSize.trim(),
        completeness: formData.sampleNotes.completeness.trim(),
        deliveryMechanism: formData.sampleNotes.deliveryMechanism,
        deliveryMechanismNotes: formData.sampleNotes.deliveryMechanismNotes.trim(),
      };

      if (formData.isSample) {
        const sampleNotesChanged =
          normalizedSampleNotes.whySample !== initialNormalizedSampleNotes.whySample ||
          normalizedSampleNotes.actualDataSize !== initialNormalizedSampleNotes.actualDataSize ||
          normalizedSampleNotes.completeness !== initialNormalizedSampleNotes.completeness ||
          normalizedSampleNotes.deliveryMechanism !== initialNormalizedSampleNotes.deliveryMechanism ||
          normalizedSampleNotes.deliveryMechanismNotes !== initialNormalizedSampleNotes.deliveryMechanismNotes;

        if (sampleNotesChanged) {
          payload.isSample = true;
          payload.sampleNotes = {
            whySample: normalizedSampleNotes.whySample,
            actualDataSize: normalizedSampleNotes.actualDataSize,
            ...(normalizedSampleNotes.completeness ? { completeness: normalizedSampleNotes.completeness } : {}),
            deliveryMechanism: normalizedSampleNotes.deliveryMechanism as SampleDeliveryMechanism,
            ...(normalizedSampleNotes.deliveryMechanism === 'OTHER' && normalizedSampleNotes.deliveryMechanismNotes
              ? { deliveryMechanismNotes: normalizedSampleNotes.deliveryMechanismNotes }
              : {}),
          };
        }

        if (formData.actualPrice !== initialActualPrice) {
          payload.actualPrice = Number.parseInt(formData.actualPrice, 10);
        }
        if (formData.actualPriceCurrency !== initialActualPriceCurrency) {
          payload.actualPriceCurrency = formData.actualPriceCurrency;
        }
        if (formData.isNegotiable !== initialIsNegotiable && formData.isNegotiable !== null) {
          payload.isNegotiable = formData.isNegotiable;
        }
      }

      if (Object.keys(payload).length === 0) {
        setError('No changes detected');
        setSubmitting(false);
        return;
      }

      await updateProposalMetadata(datasetId, payload);
      setSuccess(true);
      
      setTimeout(() => {
        onSuccess?.();
      }, 1500);
    } catch (err: any) {
      console.error('Failed to update metadata:', err);
      setError(err.message || 'Failed to update metadata');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Status Messages */}
      {(error || success) && (
        <div className="space-y-3">
          {/* Error Message */}
          {error && (
            <div
              className="rounded-xl border px-4 py-3 flex items-center gap-3 animate-in fade-in slide-in-from-top-1 duration-200"
              style={{
                background: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
                borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)',
              }}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(239, 68, 68, 0.15)' }}>
                <AlertCircle className="w-4 h-4" style={{ color: '#DC2626' }} />
              </div>
              <p className="text-sm font-medium" style={{ color: '#DC2626' }}>
                {error}
              </p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div
              className="rounded-xl border px-4 py-3 flex items-center gap-3 animate-in fade-in slide-in-from-top-1 duration-200"
              style={{
                background: isDark ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.05)',
                borderColor: isDark ? 'rgba(34, 197, 94, 0.3)' : 'rgba(34, 197, 94, 0.2)',
              }}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(34, 197, 94, 0.15)' }}>
                <CheckCircle className="w-4 h-4" style={{ color: '#22c55e' }} />
              </div>
              <p className="text-sm font-medium" style={{ color: '#22c55e' }}>
                Metadata updated successfully!
              </p>
            </div>
          )}
        </div>
      )}

      <div className="space-y-5">
        <div
          className="rounded-xl border p-5 space-y-5"
          style={{
            background: tokens.surfaceCard,
            borderColor: tokens.borderSubtle || tokens.inputBorder,
          }}
        >
          <div>
            <h4 className="text-sm font-semibold" style={{ color: tokens.textPrimary }}>
              Basic Metadata
            </h4>
            <p className="text-xs mt-1" style={{ color: tokens.textMuted }}>
              Edit core proposal information.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium" style={{ color: tokens.textPrimary }}>
              Dataset Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={formData.title || ''}
              onChange={(e) => handleFieldChange('title', e.target.value)}
              placeholder="Enter dataset title"
              disabled={submitting}
              className="h-11 transition-colors focus-visible:ring-2"
              style={{
                background: tokens.inputBg,
                borderColor: tokens.inputBorder,
                color: tokens.textPrimary,
              }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <CategoriesSelect
                value={formData.primaryCategoryId}
                onValueChange={(value) => handleFieldChange('primaryCategoryId', value)}
                disabled={submitting}
                isDark={isDark}
                tokens={tokens}
              />
            </div>

            <div className="space-y-2">
              <SourcesSelect
                value={formData.sourceId}
                onValueChange={(value) => handleFieldChange('sourceId', value)}
                disabled={submitting}
                isDark={isDark}
                allowCreate={true}
                tokens={tokens}
                onSourceCreated={(source) => {
                  handleFieldChange('sourceId', source.id);
                }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="license" className="text-sm font-medium" style={{ color: tokens.textPrimary }}>
              License <span className="text-red-500">*</span>
            </Label>
            <Input
              id="license"
              value={formData.license || ''}
              onChange={(e) => handleFieldChange('license', e.target.value)}
              placeholder="e.g., MIT, Apache-2.0, Proprietary"
              disabled={submitting}
              className="h-11 transition-colors focus-visible:ring-2"
              style={{
                background: tokens.inputBg,
                borderColor: tokens.inputBorder,
                color: tokens.textPrimary,
              }}
            />
          </div>
        </div>

        <div
          className="rounded-xl border p-5"
          style={{
            background: formData.isSample
              ? (isDark ? 'rgba(59, 130, 246, 0.08)' : 'rgba(59, 130, 246, 0.06)')
              : tokens.surfaceCard,
            borderColor: formData.isSample ? '#3b82f6' : (tokens.borderSubtle || tokens.inputBorder),
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h4 className="text-sm font-semibold" style={{ color: tokens.textPrimary }}>
                Sample Proposal Settings
              </h4>
              <p className="text-xs mt-1" style={{ color: tokens.textMuted }}>
                Sample toggle is managed from the draft details page. Edit sample-specific fields here when sample mode is enabled.
              </p>
            </div>
            <span
              className="px-3 py-1 rounded-full text-xs font-semibold"
              style={{
                background: formData.isSample ? 'rgba(59, 130, 246, 0.14)' : 'rgba(107, 114, 128, 0.14)',
                color: formData.isSample ? '#2563eb' : tokens.textSecondary,
                border: `1px solid ${formData.isSample ? 'rgba(59, 130, 246, 0.35)' : 'rgba(107, 114, 128, 0.35)'}`,
              }}
            >
              {formData.isSample ? 'SAMPLE ON' : 'SAMPLE OFF'}
            </span>
          </div>

          {formData.isSample ? (
            <div className="space-y-4 mt-4 pt-4 border-t" style={{ borderColor: 'rgba(59, 130, 246, 0.3)' }}>
            <div className="space-y-2">
              <Label htmlFor="whySample" style={{ color: tokens.textPrimary }}>
                Why is this a sample dataset? <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="whySample"
                value={formData.sampleNotes.whySample}
                onChange={(e) => handleFieldChange('sampleNotes.whySample', e.target.value)}
                placeholder="Describe why this proposal is a sample"
                disabled={submitting}
                rows={3}
                style={{
                  background: tokens.inputBg,
                  borderColor: tokens.inputBorder,
                  color: tokens.textPrimary,
                }}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="actualDataSize" style={{ color: tokens.textPrimary }}>
                  Actual dataset size <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="actualDataSize"
                  value={formData.sampleNotes.actualDataSize}
                  onChange={(e) => handleFieldChange('sampleNotes.actualDataSize', e.target.value)}
                  placeholder="e.g., 120 GB"
                  disabled={submitting}
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
                  value={formData.sampleNotes.completeness}
                  onChange={(e) => handleFieldChange('sampleNotes.completeness', e.target.value)}
                  placeholder="e.g., 80% representative"
                  disabled={submitting}
                  style={{
                    background: tokens.inputBg,
                    borderColor: tokens.inputBorder,
                    color: tokens.textPrimary,
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label style={{ color: tokens.textPrimary }}>
                  Delivery mechanism <span className="text-red-500">*</span>
                </Label>
                <StyledSelect
                  value={formData.sampleNotes.deliveryMechanism}
                  onValueChange={(value) => handleFieldChange('sampleNotes.deliveryMechanism', value)}
                  options={[...DELIVERY_OPTIONS]}
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
                  value={formData.isNegotiable === null ? '' : formData.isNegotiable ? 'yes' : 'no'}
                  onValueChange={(value) => handleFieldChange('isNegotiable', value === 'yes')}
                  options={[...NEGOTIABLE_OPTIONS]}
                  placeholder="Select one"
                  isDark={isDark}
                  tokens={tokens}
                />
              </div>
            </div>

            {formData.sampleNotes.deliveryMechanism === 'OTHER' ? (
              <div className="space-y-2">
                <Label htmlFor="deliveryMechanismNotes" style={{ color: tokens.textPrimary }}>
                  Delivery mechanism notes <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="deliveryMechanismNotes"
                  value={formData.sampleNotes.deliveryMechanismNotes}
                  onChange={(e) => handleFieldChange('sampleNotes.deliveryMechanismNotes', e.target.value)}
                  placeholder="Describe delivery mechanism"
                  disabled={submitting}
                  style={{
                    background: tokens.inputBg,
                    borderColor: tokens.inputBorder,
                    color: tokens.textPrimary,
                  }}
                />
              </div>
            ) : null}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="actualPrice" style={{ color: tokens.textPrimary }}>
                  Actual full price (integer) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="actualPrice"
                  type="number"
                  min={0}
                  step={1}
                  value={formData.actualPrice}
                  onChange={(e) => handleFieldChange('actualPrice', e.target.value)}
                  placeholder="e.g., 499"
                  disabled={submitting}
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
                  value={formData.actualPriceCurrency}
                  onValueChange={(value) => handleFieldChange('actualPriceCurrency', value)}
                  options={[...CURRENCY_OPTIONS]}
                  placeholder="Select currency"
                  isDark={isDark}
                  tokens={tokens}
                />
              </div>
            </div>
            </div>
          ) : (
            <p className="text-sm mt-4" style={{ color: tokens.textMuted }}>
              Sample mode is currently off. Use the sample toggle on the draft details page to enable sample settings.
            </p>
          )}
        </div>

      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 pt-4 border-t" style={{ borderColor: tokens.borderSubtle || tokens.inputBorder }}>
        <Button
          type="submit"
          disabled={!isFormValid() || submitting}
          className="h-11 px-6 font-medium transition-all duration-200 hover:shadow-lg hover:scale-[1.01] active:scale-[0.99]"
          style={{
            background: isFormValid() && !submitting
              ? '#2a3558'
              : 'rgba(156, 163, 175, 0.3)',
            color: '#fff',
          }}
        >
          <Save className="w-4 h-4 mr-2" />
          {submitting ? 'Saving...' : 'Save Changes'}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={submitting}
          className="h-11 px-5 font-medium transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
          style={{
            background: tokens.glassBg || 'transparent',
            border: `1px solid ${tokens.glassBorder || tokens.inputBorder}`,
            color: tokens.textPrimary,
          }}
        >
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
      </div>
    </form>
  );
}
