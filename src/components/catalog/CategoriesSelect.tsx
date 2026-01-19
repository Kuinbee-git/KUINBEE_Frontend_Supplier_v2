/**
 * CategoriesSelect Component
 * Dropdown for selecting a category (read-only, admin managed)
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

      <Select
        value={value}
        onValueChange={onValueChange}
        disabled={disabled || loading || !!fetchError}
      >
        <SelectTrigger
          className="h-10 w-full rounded-lg transition-all duration-300"
          style={{
            background: tokens?.inputBg || (isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.9)'),
            borderColor: displayError ? '#ef4444' : tokens?.inputBorder || (isDark ? 'rgba(255, 255, 255, 0.12)' : '#dde3f0'),
            color: tokens?.textPrimary || (isDark ? '#ffffff' : '#1a2240'),
            border: displayError ? '1px solid #ef4444' : `1px solid ${tokens?.inputBorder || (isDark ? 'rgba(255, 255, 255, 0.12)' : '#dde3f0')}`,
          }}
        >
          <SelectValue placeholder={loading ? 'Loading categories...' : 'Select a category'} />
        </SelectTrigger>
        <SelectContent
          className="rounded-lg shadow-lg overflow-hidden"
          style={{
            background: tokens?.surfaceCard || (isDark ? 'rgba(26, 34, 64, 0.98)' : 'rgba(255, 255, 255, 0.98)'),
            border: `1px solid ${tokens?.borderDefault || (isDark ? 'rgba(255, 255, 255, 0.12)' : '#dde3f0')}`,
            backdropFilter: 'blur(16px)',
          }}
        >
          <div className="py-1">
            {categories.length === 0 && !loading && !fetchError && (
              <div className="px-4 py-2.5 text-sm" style={{ color: tokens?.textMuted }}>
                No categories available
              </div>
            )}
            {categories.length > 0 && categories.map((category) => (
              <SelectItem
                key={category.id}
                value={category.id}
                className="cursor-pointer px-4 py-2.5 transition-colors duration-200"
                style={{
                  color: tokens?.textPrimary || (isDark ? '#ffffff' : '#1a2240'),
                  background: 'transparent',
                  borderRadius: '0.5rem',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = tokens?.navItemHover || (isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(26, 34, 64, 0.06)');
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                {category.name}
              </SelectItem>
            ))}
            {loading && (
              <div className="px-4 py-2.5 text-sm" style={{ color: tokens?.textMuted }}>
                Loading...
              </div>
            )}
          </div>
        </SelectContent>
      </Select>

      {displayError && (
        <div className="flex items-center gap-2 text-sm text-red-500">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{displayError}</span>
        </div>
      )}
    </div>
  );
}
