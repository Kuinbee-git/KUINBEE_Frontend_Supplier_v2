'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getDatasetThemeTokens } from '@/constants/dataset.constants';
import { Save, X, Plus, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import { setSecondaryCategories } from '@/lib/api';

interface SecondaryCategoriesFormProps {
  datasetId: string;
  initialCategories?: string[];
  isDark?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function SecondaryCategoriesForm({
  datasetId,
  initialCategories = [],
  isDark = false,
  onSuccess,
  onCancel,
}: SecondaryCategoriesFormProps) {
  const tokens = getDatasetThemeTokens(isDark);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [categoryIds, setCategoryIds] = useState<string[]>(
    initialCategories.length > 0 ? initialCategories : ['']
  );

  const handleCategoryChange = (index: number, value: string) => {
    const updated = [...categoryIds];
    updated[index] = value;
    setCategoryIds(updated);
    setError(null);
    setSuccess(false);
  };

  const addCategory = () => {
    setCategoryIds([...categoryIds, '']);
  };

  const removeCategory = (index: number) => {
    if (categoryIds.length > 1) {
      setCategoryIds(categoryIds.filter((_, i) => i !== index));
    }
  };

  const isFormValid = () => {
    return categoryIds.every(id => id.trim() !== '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid()) {
      setError('All category IDs must be filled');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const validCategoryIds = categoryIds.filter(id => id.trim() !== '');
      await setSecondaryCategories(datasetId, { categoryIds: validCategoryIds });
      setSuccess(true);
      
      setTimeout(() => {
        onSuccess?.();
      }, 1500);
    } catch (err: any) {
      console.error('Failed to update secondary categories:', err);
      setError(err.message || 'Failed to update secondary categories');
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
            Secondary categories updated successfully!
          </p>
        </div>
      )}

      {/* Category Fields */}
      <div className="flex items-center justify-between">
        <Label style={{ color: tokens.textPrimary }}>
          Secondary Category IDs
        </Label>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={addCategory}
          disabled={submitting}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </Button>
      </div>

      <div className="space-y-3">
        {categoryIds.map((categoryId, index) => (
          <div key={index} className="flex items-start gap-3">
            <div className="flex-1 space-y-2">
              <Input
                value={categoryId}
                onChange={(e) => handleCategoryChange(index, e.target.value)}
                placeholder={`Category ID ${index + 1}`}
                disabled={submitting}
                style={{
                  background: tokens.inputBg,
                  borderColor: tokens.inputBorder,
                  color: tokens.textPrimary,
                }}
              />
            </div>
            {categoryIds.length > 1 && (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => removeCategory(index)}
                disabled={submitting}
                className="mt-0"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}
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
          {submitting ? 'Saving...' : 'Save Categories'}
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
