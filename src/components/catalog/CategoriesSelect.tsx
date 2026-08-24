/**
 * CategoriesSelect Component
 * Dropdown for selecting a category (read-only, admin managed)
 */

"use client";

import { useState, useEffect, useCallback, useId } from "react";
import { DashboardInlineAlert } from "@/components/dashboard";
import { DatasetSelect } from "@/components/datasets/shared/DatasetSelect";
import { listCategories } from "@/lib/api/catalog";
import type { Category } from "@/types/catalog.types";
import { Loader2 } from "lucide-react";

interface CategoriesSelectProps {
  value: string;
  onValueChange: (categoryId: string) => void;
  disabled?: boolean;
  error?: string | null;
  triggerId?: string;
  isDark?: boolean;
  tokens?: unknown;
}

export function CategoriesSelect({
  value,
  onValueChange,
  disabled = false,
  error = null,
  triggerId,
}: CategoriesSelectProps) {
  const generatedTriggerId = useId();
  const resolvedTriggerId = triggerId ?? generatedTriggerId;
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const response = await listCategories({ pageSize: 100 });
      setCategories(response.items || []);
    } catch (err: unknown) {
      console.error("Failed to fetch categories:", err);
      setFetchError(
        err instanceof Error && err.message
          ? err.message
          : "Failed to load categories"
      );
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
        <label
          htmlFor={resolvedTriggerId}
          className="text-sm font-medium text-foreground"
        >
          Primary category
          <span
            className="ml-1 text-[var(--dashboard-danger-foreground)]"
            aria-hidden="true"
          >
            *
          </span>
          <span className="sr-only"> (required)</span>
        </label>
        {loading && (
          <span role="status" className="inline-flex items-center">
            <Loader2
              className="size-4 animate-spin text-muted-foreground motion-reduce:animate-none"
              aria-hidden="true"
            />
            <span className="sr-only">Loading categories</span>
          </span>
        )}
      </div>

      <DatasetSelect
        value={value}
        onValueChange={onValueChange}
        triggerId={resolvedTriggerId}
        options={categories.map((cat) => ({ label: cat.name, value: cat.id }))}
        placeholder={loading ? "Loading categories..." : "Select a category"}
        ariaLabel="Primary category"
        disabled={disabled || loading}
      />

      {displayError && (
        <DashboardInlineAlert
          tone="danger"
          title="Categories unavailable"
          message={displayError}
          className="py-2.5"
        />
      )}
    </div>
  );
}
