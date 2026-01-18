'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { getDatasetThemeTokens } from '@/constants/dataset.constants';
import { Save, X, AlertCircle, CheckCircle } from 'lucide-react';
import { updateProposalMetadata } from '@/lib/api';

interface MetadataFormData {
  title: string;
  license: string;
  isPaid: boolean;
  price: string;
  currency: string;
}

interface MetadataEditFormProps {
  datasetId: string;
  initialData: {
    title: string;
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
    if (!formData.title?.trim() || !formData.license?.trim()) {
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
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Error Message */}
      {error && (
        <div
          className="rounded-lg border px-4 py-3 flex items-start gap-3"
          style={{
            background: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
            borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)',
          }}
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#DC2626' }} />
          <p className="text-xs" style={{ color: '#DC2626' }}>
            {error}
          </p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div
          className="rounded-lg border px-4 py-3 flex items-start gap-3"
          style={{
            background: isDark ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.05)',
            borderColor: isDark ? 'rgba(34, 197, 94, 0.3)' : 'rgba(34, 197, 94, 0.2)',
          }}
        >
          <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#22c55e' }} />
          <p className="text-xs" style={{ color: '#22c55e' }}>
            Metadata updated successfully!
          </p>
        </div>
      )}

      {/* Form Fields */}
      <div className="space-y-2">
        <Label htmlFor="title" style={{ color: tokens.textPrimary }}>
          Dataset Title <span className="text-red-500">*</span>
        </Label>
        <Input
          id="title"
          value={formData.title || ''}
          onChange={(e) => handleFieldChange('title', e.target.value)}
          placeholder="Enter dataset title"
          disabled={submitting}
          style={{
            background: tokens.inputBg,
            borderColor: tokens.inputBorder,
            color: tokens.textPrimary,
          }}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="license" style={{ color: tokens.textPrimary }}>
          License <span className="text-red-500">*</span>
        </Label>
        <Input
          id="license"
          value={formData.license || ''}
          onChange={(e) => handleFieldChange('license', e.target.value)}
          placeholder="e.g., MIT, Apache-2.0, Proprietary"
          disabled={submitting}
          style={{
            background: tokens.inputBg,
            borderColor: tokens.inputBorder,
            color: tokens.textPrimary,
          }}
        />
      </div>

      {/* Pricing Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Checkbox
            id="isPaid"
            checked={formData.isPaid}
            onCheckedChange={(checked) => handleFieldChange('isPaid', checked === true)}
            disabled={submitting}
          />
          <Label htmlFor="isPaid" style={{ color: tokens.textPrimary }}>
            This is a paid dataset
          </Label>
        </div>

        {formData.isPaid && (
          <div className="grid grid-cols-2 gap-3 pl-6">
            <div className="space-y-2">
              <Label htmlFor="price" style={{ color: tokens.textPrimary }}>
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
                style={{
                  background: tokens.inputBg,
                  borderColor: tokens.inputBorder,
                  color: tokens.textPrimary,
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency" style={{ color: tokens.textPrimary }}>
                Currency
              </Label>
              <select
                id="currency"
                value={formData.currency}
                onChange={(e) => handleFieldChange('currency', e.target.value)}
                disabled={submitting}
                className="w-full h-10 px-3 rounded-md border text-sm"
                style={{
                  background: tokens.inputBg,
                  borderColor: tokens.inputBorder,
                  color: tokens.textPrimary,
                }}
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="INR">INR</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 pt-2">
        <Button
          type="submit"
          disabled={!isFormValid() || submitting}
          className="flex-1 gap-2"
          style={{
            background: isFormValid() && !submitting
              ? 'linear-gradient(135deg, #1a2240 0%, #2a3558 100%)'
              : 'rgba(156, 163, 175, 0.3)',
            color: '#fff',
          }}
        >
          <Save className="w-4 h-4" />
          {submitting ? 'Saving...' : 'Save Changes'}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={submitting}
          className="gap-2"
        >
          <X className="w-4 h-4" />
          Cancel
        </Button>
      </div>
    </form>
  );
}
