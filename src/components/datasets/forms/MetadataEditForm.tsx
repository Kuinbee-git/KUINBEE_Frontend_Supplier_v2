'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { getDatasetThemeTokens } from '@/constants/dataset.constants';
import { Save, X, AlertCircle, CheckCircle } from 'lucide-react';
import { updateProposalMetadata } from '@/lib/api';
import { CategoriesSelect, SourcesSelect } from '@/components/catalog';
import { StyledSelect } from '@/components/datasets/shared';

interface MetadataFormData {
  title: string;
  primaryCategoryId: string;
  sourceId: string;
  license: string;
  isPaid: boolean;
  price: string;
  currency: string;
}

interface MetadataEditFormProps {
  datasetId: string;
  initialData: {
    title: string;
    primaryCategoryId: string;
    sourceId: string;
    license: string;
    isPaid?: boolean;
    price?: string;
    currency?: string;
  };
  isDark?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
}

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

  const [formData, setFormData] = useState<MetadataFormData>({
    title: initialData.title,
    primaryCategoryId: initialData.primaryCategoryId,
    sourceId: initialData.sourceId,
    license: initialData.license,
    isPaid: initialData.isPaid || false,
    price: initialData.price || '',
    currency: initialData.currency || 'USD',
  });

  const handleFieldChange = (field: keyof MetadataFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(false);
  };

  const isFormValid = () => {
    if (!formData.title?.trim() || !formData.license?.trim() || !formData.primaryCategoryId || !formData.sourceId) {
      return false;
    }
    // If paid, price must be provided and valid
    if (formData.isPaid && (!formData.price || parseFloat(formData.price) <= 0)) {
      return false;
    }
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
      const payload: any = {};
      
      if (formData.title !== initialData.title) {
        payload.title = formData.title;
      }
      if (formData.primaryCategoryId !== initialData.primaryCategoryId) {
        payload.primaryCategoryId = formData.primaryCategoryId;
      }
      if (formData.sourceId !== initialData.sourceId) {
        payload.sourceId = formData.sourceId;
      }
      if (formData.license !== initialData.license) {
        payload.license = formData.license;
      }
      if (formData.isPaid !== initialData.isPaid) {
        payload.isPaid = formData.isPaid;
      }
      if (formData.isPaid && formData.price !== initialData.price) {
        payload.price = formData.price;
      }
      if (formData.isPaid && formData.currency !== initialData.currency) {
        payload.currency = formData.currency;
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

      {/* Form Fields Grid */}
      <div className="grid gap-5">
        {/* Dataset Title - Full Width */}
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

        {/* Category and Source - Two Columns on Desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Primary Category Select */}
          <div className="space-y-2">
            <CategoriesSelect
              value={formData.primaryCategoryId}
              onValueChange={(value) => handleFieldChange('primaryCategoryId', value)}
              disabled={submitting}
              isDark={isDark}
              tokens={tokens}
            />
          </div>

          {/* Source Select */}
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

        {/* License Field */}
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

        {/* Pricing Section */}
        <div
          className="rounded-xl border p-4 space-y-4 transition-colors"
          style={{
            background: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(26, 34, 64, 0.02)',
            borderColor: tokens.borderSubtle || tokens.inputBorder,
          }}
        >
          <div className="flex items-center gap-3">
            <Checkbox
              id="isPaid"
              checked={formData.isPaid}
              onCheckedChange={(checked) => handleFieldChange('isPaid', checked === true)}
              disabled={submitting}
              className="h-5 w-5"
            />
            <div>
              <Label htmlFor="isPaid" className="text-sm font-medium cursor-pointer" style={{ color: tokens.textPrimary }}>
                This is a paid dataset
              </Label>
              <p className="text-xs mt-0.5" style={{ color: tokens.textMuted }}>
                Enable to set a price for this dataset
              </p>
            </div>
          </div>

          {formData.isPaid && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t" style={{ borderColor: tokens.borderSubtle || tokens.inputBorder }}>
              <div className="space-y-2">
                <Label htmlFor="price" className="text-sm font-medium" style={{ color: tokens.textPrimary }}>
                  Price <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => handleFieldChange('price', e.target.value)}
                  placeholder="0.00"
                  disabled={submitting}
                  className="h-11 transition-colors focus-visible:ring-2"
                  style={{
                    background: tokens.inputBg,
                    borderColor: tokens.inputBorder,
                    color: tokens.textPrimary,
                  }}
                />
              </div>

              <div className="space-y-2">
                <StyledSelect
                  label="Currency"
                  value={formData.currency}
                  onValueChange={(value) => handleFieldChange('currency', value)}
                  options={[
                    { label: 'USD ($)', value: 'USD' },
                    { label: 'EUR (€)', value: 'EUR' },
                    { label: 'GBP (£)', value: 'GBP' },
                    { label: 'INR (₹)', value: 'INR' },
                  ]}
                  disabled={submitting}
                  isDark={isDark}
                  tokens={tokens}
                />
              </div>
            </div>
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
