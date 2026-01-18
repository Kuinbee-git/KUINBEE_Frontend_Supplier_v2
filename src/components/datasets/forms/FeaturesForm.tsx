'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { getDatasetThemeTokens } from '@/constants/dataset.constants';
import { Save, X, Plus, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import { replaceFeatures } from '@/lib/api';
import type { Feature } from '@/types/dataset-proposal.types';

interface FeaturesFormProps {
  datasetId: string;
  initialData?: Feature[];
  isDark?: boolean;
  onSuccess?: (count: number) => void;
  onCancel?: () => void;
}

export function FeaturesForm({
  datasetId,
  initialData,
  isDark = false,
  onSuccess,
  onCancel,
}: FeaturesFormProps) {
  const tokens = getDatasetThemeTokens(isDark);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [features, setFeatures] = useState<Feature[]>(
    initialData && initialData.length > 0
      ? initialData
      : [{ name: '', dataType: '', description: null, isNullable: false }]
  );

  const handleAddFeature = () => {
    setFeatures([...features, { name: '', dataType: '', description: null, isNullable: false }]);
    setError(null);
    setSuccess(false);
  };

  const handleRemoveFeature = (index: number) => {
    if (features.length > 1) {
      setFeatures(features.filter((_, i) => i !== index));
      setError(null);
      setSuccess(false);
    }
  };

  const handleFeatureChange = (index: number, field: keyof Feature, value: any) => {
    const newFeatures = [...features];
    newFeatures[index] = { ...newFeatures[index], [field]: value };
    setFeatures(newFeatures);
    setError(null);
    setSuccess(false);
  };

  const isFormValid = () => {
    return features.every(
      (feature) => feature.name.trim() !== '' && feature.dataType.trim() !== ''
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid()) {
      setError('Please fill in name and data type for all features');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      // Clean up features data (convert empty strings to null for optional fields)
      const cleanedFeatures = features.map((feature) => ({
        name: feature.name.trim(),
        dataType: feature.dataType.trim(),
        description: feature.description?.trim() || null,
        isNullable: feature.isNullable || false,
      }));

      const response = await replaceFeatures(datasetId, { features: cleanedFeatures });
      setSuccess(true);
      
      if (onSuccess) {
        onSuccess(response.count);
      }

      // Auto-hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Failed to save features:', err);
      setError(err.message || 'Failed to save features');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      // Reset to initial data
      setFeatures(
        initialData && initialData.length > 0
          ? initialData
          : [{ name: '', dataType: '', description: null, isNullable: false }]
      );
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
            Features / Columns
          </h2>
          <p className="text-sm" style={{ color: tokens.textMuted }}>
            Define the features (columns) in your dataset
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
              Features saved successfully!
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {features.map((feature, index) => (
            <div
              key={index}
              className="p-4 rounded-lg border space-y-4"
              style={{
                background: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(26, 34, 64, 0.02)',
                borderColor: tokens.borderSubtle,
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium" style={{ color: tokens.textPrimary }}>
                  Feature {index + 1}
                </h3>
                {features.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveFeature(index)}
                    disabled={submitting}
                    className="h-8 px-2 text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Feature Name */}
                <div className="space-y-2">
                  <Label style={{ color: tokens.textPrimary }}>
                    Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={feature.name}
                    onChange={(e) => handleFeatureChange(index, 'name', e.target.value)}
                    placeholder="e.g., customer_id, price, category"
                    disabled={submitting}
                    required
                    style={{
                      background: tokens.inputBg,
                      borderColor: tokens.inputBorder,
                      color: tokens.textPrimary,
                    }}
                  />
                </div>

                {/* Data Type */}
                <div className="space-y-2">
                  <Label style={{ color: tokens.textPrimary }}>
                    Data Type <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={feature.dataType}
                    onChange={(e) => handleFeatureChange(index, 'dataType', e.target.value)}
                    placeholder="e.g., string, integer, float, date"
                    disabled={submitting}
                    required
                    style={{
                      background: tokens.inputBg,
                      borderColor: tokens.inputBorder,
                      color: tokens.textPrimary,
                    }}
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label style={{ color: tokens.textPrimary }}>Description</Label>
                <Textarea
                  value={feature.description || ''}
                  onChange={(e) => handleFeatureChange(index, 'description', e.target.value || null)}
                  placeholder="Describe what this feature represents"
                  rows={2}
                  disabled={submitting}
                  style={{
                    background: tokens.inputBg,
                    borderColor: tokens.inputBorder,
                    color: tokens.textPrimary,
                  }}
                />
              </div>

              {/* Is Nullable */}
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`nullable-${index}`}
                  checked={feature.isNullable || false}
                  onCheckedChange={(checked) => handleFeatureChange(index, 'isNullable', checked)}
                  disabled={submitting}
                />
                <Label
                  htmlFor={`nullable-${index}`}
                  className="text-sm cursor-pointer"
                  style={{ color: tokens.textPrimary }}
                >
                  Allow null/missing values
                </Label>
              </div>
            </div>
          ))}

          {/* Add Feature Button */}
          <Button
            type="button"
            variant="outline"
            onClick={handleAddFeature}
            disabled={submitting}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Feature
          </Button>

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
              {submitting ? 'Saving...' : `Save ${features.length} Feature${features.length !== 1 ? 's' : ''}`}
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
