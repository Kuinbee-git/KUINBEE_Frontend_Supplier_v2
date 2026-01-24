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
    <form onSubmit={handleSubmit} className="space-y-5">
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
                Secondary categories updated successfully!
              </p>
            </div>
          )}
        </div>
      )}

      {/* Category Fields Section */}
      <div
        className="rounded-xl border p-4 space-y-4"
        style={{
          background: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(26, 34, 64, 0.02)',
          borderColor: tokens.borderSubtle || tokens.inputBorder,
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-medium" style={{ color: tokens.textPrimary }}>
              Secondary Category IDs
            </Label>
            <p className="text-xs mt-0.5" style={{ color: tokens.textMuted }}>
              Add additional categories to improve discoverability
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={addCategory}
            disabled={submitting}
            className="h-9 gap-2 font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: 'transparent',
              borderColor: tokens.borderSubtle || tokens.inputBorder,
              color: tokens.textPrimary,
            }}
          >
            <Plus className="w-4 h-4" />
            Add
          </Button>
        </div>

        <div className="space-y-3">
          {categoryIds.map((categoryId, index) => (
            <div key={index} className="flex items-center gap-3">
              <span
                className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-medium flex-shrink-0"
                style={{
                  background: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)',
                  color: '#3b82f6',
                }}
              >
                {index + 1}
              </span>
              <Input
                value={categoryId}
                onChange={(e) => handleCategoryChange(index, e.target.value)}
                placeholder={`Enter category ID ${index + 1}`}
                disabled={submitting}
                className="h-10 transition-colors focus-visible:ring-2 font-mono text-sm"
                style={{
                  background: tokens.inputBg,
                  borderColor: tokens.inputBorder,
                  color: tokens.textPrimary,
                }}
              />
              {categoryIds.length > 1 && (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => removeCategory(index)}
                  disabled={submitting}
                  className="h-10 w-10 flex-shrink-0 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              )}
            </div>
          ))}
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
          {submitting ? 'Saving...' : 'Save Categories'}
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
