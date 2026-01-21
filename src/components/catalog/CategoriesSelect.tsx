/**
 * CategoriesSelect Component
 * Dropdown for selecting a category (read-only, admin managed)
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { StyledSelect } from '@/components/datasets/shared';
import { listCategories } from '@/lib/api/catalog';
import type { Category } from '@/types/catalog.types';
import { AlertCircle, Loader2 } from 'lucide-react';

interface CategoriesSelectProps {
  value: string;
  onValueChange: (categoryId: string) => void;
  disabled?: boolean;
  error?: string | null;
  isDark?: boolean;
  tokens?: any;
}

export function CategoriesSelect({
  value,
  onValueChange,
  disabled = false,
  error = null,
  isDark = false,
  tokens,
}: CategoriesSelectProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const response = await listCategories({ pageSize: 100 });
      console.log('Categories fetched:', response.items);
      setCategories(response.items || []);
    } catch (err: any) {
      console.error('Failed to fetch categories:', err);
      setFetchError(err.message || 'Failed to load categories');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const displayError = error || fetchError;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium" style={{ color: tokens?.textPrimary }}>
          Primary Category <span className="text-red-500">*</span>
        </label>
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      </div>

      <StyledSelect
        value={value}
        onValueChange={onValueChange}
        options={categories.map(cat => ({ label: cat.name, value: cat.id }))}
        placeholder={loading ? 'Loading categories...' : 'Select a category'}
        isDark={isDark}
        tokens={tokens}
      />

      {displayError && (
        <div className="flex items-center gap-2 text-sm text-red-500">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{displayError}</span>
        </div>
      )}
    </div>
  );
}
