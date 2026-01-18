'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { getDatasetThemeTokens } from '@/constants/dataset.constants';
import { Save, X, AlertCircle, CheckCircle } from 'lucide-react';
import { upsertAboutInfo } from '@/lib/api';
import type { AboutDatasetInfo, UpsertAboutInfoRequest } from '@/types/dataset-proposal.types';

interface AboutDatasetFormProps {
  datasetId: string;
  initialData?: AboutDatasetInfo;
  isDark?: boolean;
  onSuccess?: (data: AboutDatasetInfo) => void;
  onCancel?: () => void;
}

export function AboutDatasetForm({
  datasetId,
  initialData,
  isDark = false,
  onSuccess,
  onCancel,
}: AboutDatasetFormProps) {
  const tokens = getDatasetThemeTokens(isDark);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState<UpsertAboutInfoRequest>({
    overview: initialData?.overview || '',
    description: initialData?.description || '',
    dataQuality: initialData?.dataQuality || '',
    useCases: initialData?.useCases || null,
    limitations: initialData?.limitations || null,
    methodology: initialData?.methodology || null,
  });

  const handleFieldChange = (field: keyof UpsertAboutInfoRequest, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value || null }));
    setError(null);
    setSuccess(false);
  };

  const isFormValid = () => {
    return (
      formData.overview.trim() !== '' &&
      formData.description.trim() !== '' &&
      formData.dataQuality.trim() !== ''
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid()) {
      setError('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await upsertAboutInfo(datasetId, formData);
      setSuccess(true);
      
      if (onSuccess) {
        onSuccess(response.about);
      }

      // Auto-hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Failed to save about info:', err);
      setError(err.message || 'Failed to save information');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      // Reset to initial data
      setFormData({
        overview: initialData?.overview || '',
        description: initialData?.description || '',
        dataQuality: initialData?.dataQuality || '',
        useCases: initialData?.useCases || null,
        limitations: initialData?.limitations || null,
        methodology: initialData?.methodology || null,
      });
      setError(null);
      setSuccess(false);
    }
  };

  return (
    <Card
      className="border overflow-hidden"
      style={{
        background: tokens.surfaceCard,
        borderColor: tokens.borderDefault,
      }}
    >
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-1" style={{ color: tokens.textPrimary }}>
            About Dataset
          </h2>
          <p className="text-sm" style={{ color: tokens.textMuted }}>
            Provide comprehensive information about your dataset
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div
            className="mb-4 rounded-lg border px-4 py-3 flex items-center gap-3"
            style={{
              background: isDark ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.05)',
              borderColor: isDark ? 'rgba(34, 197, 94, 0.3)' : 'rgba(34, 197, 94, 0.2)',
            }}
          >
            <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#22c55e' }} />
            <p className="text-sm" style={{ color: '#22c55e' }}>
              Information saved successfully!
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div
            className="mb-4 rounded-lg border px-4 py-3 flex items-center gap-3"
            style={{
              background: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
              borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)',
            }}
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#ef4444' }} />
            <p className="text-sm" style={{ color: '#ef4444' }}>
              {error}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Overview */}
          <div className="space-y-2">
            <Label htmlFor="overview" style={{ color: tokens.textPrimary }}>
              Overview <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="overview"
              value={formData.overview}
              onChange={(e) => handleFieldChange('overview', e.target.value)}
              placeholder="Provide a concise overview of the dataset (2-3 sentences)"
              rows={3}
              disabled={submitting}
              required
              style={{
                background: tokens.inputBg,
                borderColor: tokens.inputBorder,
                color: tokens.textPrimary,
              }}
            />
            <p className="text-xs" style={{ color: tokens.textMuted }}>
              A brief summary of what this dataset contains
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" style={{ color: tokens.textPrimary }}>
              Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              placeholder="Provide a detailed description of the dataset, its contents, and structure"
              rows={5}
              disabled={submitting}
              required
              style={{
                background: tokens.inputBg,
                borderColor: tokens.inputBorder,
                color: tokens.textPrimary,
              }}
            />
            <p className="text-xs" style={{ color: tokens.textMuted }}>
              Detailed information about the dataset's content and structure
            </p>
          </div>

          {/* Data Quality */}
          <div className="space-y-2">
            <Label htmlFor="dataQuality" style={{ color: tokens.textPrimary }}>
              Data Quality <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="dataQuality"
              value={formData.dataQuality}
              onChange={(e) => handleFieldChange('dataQuality', e.target.value)}
              placeholder="Describe the quality of the data, including completeness, accuracy, and any quality assurance processes"
              rows={4}
              disabled={submitting}
              required
              style={{
                background: tokens.inputBg,
                borderColor: tokens.inputBorder,
                color: tokens.textPrimary,
              }}
            />
            <p className="text-xs" style={{ color: tokens.textMuted }}>
              Information about data quality, completeness, and validation
            </p>
          </div>

          {/* Use Cases */}
          <div className="space-y-2">
            <Label htmlFor="useCases" style={{ color: tokens.textPrimary }}>
              Use Cases
            </Label>
            <Textarea
              id="useCases"
              value={formData.useCases || ''}
              onChange={(e) => handleFieldChange('useCases', e.target.value)}
              placeholder="Describe potential use cases and applications for this dataset"
              rows={4}
              disabled={submitting}
              style={{
                background: tokens.inputBg,
                borderColor: tokens.inputBorder,
                color: tokens.textPrimary,
              }}
            />
            <p className="text-xs" style={{ color: tokens.textMuted }}>
              Examples of how this dataset can be used
            </p>
          </div>

          {/* Limitations */}
          <div className="space-y-2">
            <Label htmlFor="limitations" style={{ color: tokens.textPrimary }}>
              Limitations
            </Label>
            <Textarea
              id="limitations"
              value={formData.limitations || ''}
              onChange={(e) => handleFieldChange('limitations', e.target.value)}
              placeholder="Describe any known limitations, biases, or constraints of this dataset"
              rows={4}
              disabled={submitting}
              style={{
                background: tokens.inputBg,
                borderColor: tokens.inputBorder,
                color: tokens.textPrimary,
              }}
            />
            <p className="text-xs" style={{ color: tokens.textMuted }}>
              Known limitations, biases, or constraints
            </p>
          </div>

          {/* Methodology */}
          <div className="space-y-2">
            <Label htmlFor="methodology" style={{ color: tokens.textPrimary }}>
              Methodology
            </Label>
            <Textarea
              id="methodology"
              value={formData.methodology || ''}
              onChange={(e) => handleFieldChange('methodology', e.target.value)}
              placeholder="Describe the methodology used to collect or generate this data"
              rows={4}
              disabled={submitting}
              style={{
                background: tokens.inputBg,
                borderColor: tokens.inputBorder,
                color: tokens.textPrimary,
              }}
            />
            <p className="text-xs" style={{ color: tokens.textMuted }}>
              Data collection or generation methodology
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4">
            <Button
              type="submit"
              disabled={!isFormValid() || submitting}
              className="text-white"
              style={{
                background: isFormValid() && !submitting
                  ? 'linear-gradient(135deg, #1a2240 0%, #2a3558 50%, #4e5a7e 100%)'
                  : 'rgba(156, 163, 175, 0.3)',
              }}
            >
              <Save className="w-4 h-4 mr-2" />
              {submitting ? 'Saving...' : 'Save Information'}
            </Button>

            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={submitting}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            )}
          </div>
        </form>
      </div>
    </Card>
  );
}
