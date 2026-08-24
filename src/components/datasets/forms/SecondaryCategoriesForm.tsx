"use client";

import { useState } from "react";
import { DashboardButton } from "@/components/dashboard";
import { Label } from "@/components/ui/label";
import { getDatasetThemeTokens } from "@/constants/dataset.constants";
import { Save, X, Plus, Trash2, AlertCircle, CheckCircle } from "lucide-react";
import { setSecondaryCategories } from "@/lib/api";
import { CategoriesSelect } from "@/components/catalog";
import type {
  SetCategoriesRequest,
  SetCategoriesResponse,
} from "@/types/dataset-proposal.types";
import { toDatasetUiError } from "../shared/datasetUiError";
interface SecondaryCategoriesFormProps {
  datasetId: string;
  initialCategories?: string[];
  isDark?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
  onSubmitData?: (
    datasetId: string,
    data: SetCategoriesRequest
  ) => Promise<SetCategoriesResponse>;
}

export function SecondaryCategoriesForm({
  datasetId,
  initialCategories = [],
  isDark = false,
  onSuccess,
  onCancel,
  onSubmitData,
}: SecondaryCategoriesFormProps) {
  const tokens = getDatasetThemeTokens(isDark);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [categoryIds, setCategoryIds] = useState<string[]>(
    initialCategories.length > 0 ? initialCategories : [""]
  );

  const handleCategoryChange = (index: number, value: string) => {
    const updated = [...categoryIds];
    updated[index] = value;
    setCategoryIds(updated);
    setError(null);
    setSuccess(false);
  };

  const addCategory = () => {
    setCategoryIds([...categoryIds, ""]);
  };

  const removeCategory = (index: number) => {
    if (categoryIds.length > 1) {
      setCategoryIds(categoryIds.filter((_, i) => i !== index));
    }
  };

  const isFormValid = () => {
    return categoryIds.every((id) => id.trim() !== "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid()) {
      setError("All category IDs must be filled");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const validCategoryIds = categoryIds.filter((id) => id.trim() !== "");
      await (onSubmitData
        ? onSubmitData(datasetId, { categoryIds: validCategoryIds })
        : setSecondaryCategories(datasetId, { categoryIds: validCategoryIds }));
      setSuccess(true);

      setTimeout(() => {
        onSuccess?.();
      }, 1500);
    } catch (err: unknown) {
      console.error("Failed to update secondary categories:", err);
      const apiError = toDatasetUiError(err);
      setError(apiError.message || "Failed to update secondary categories");
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
                background: isDark
                  ? "color-mix(in srgb, var(--dashboard-danger) 10%, transparent)"
                  : "color-mix(in srgb, var(--dashboard-danger) 5%, transparent)",
                borderColor: isDark
                  ? "color-mix(in srgb, var(--dashboard-danger) 30%, transparent)"
                  : "color-mix(in srgb, var(--dashboard-danger) 20%, transparent)",
              }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  background:
                    "color-mix(in srgb, var(--dashboard-danger) 15%, transparent)",
                }}
              >
                <AlertCircle
                  className="w-4 h-4"
                  style={{ color: "var(--dashboard-danger-foreground)" }}
                />
              </div>
              <p
                className="text-sm font-medium"
                style={{ color: "var(--dashboard-danger-foreground)" }}
              >
                {error}
              </p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div
              className="rounded-xl border px-4 py-3 flex items-center gap-3 animate-in fade-in slide-in-from-top-1 duration-200"
              style={{
                background: isDark
                  ? "color-mix(in srgb, var(--dashboard-success) 10%, transparent)"
                  : "color-mix(in srgb, var(--dashboard-success) 5%, transparent)",
                borderColor: isDark
                  ? "color-mix(in srgb, var(--dashboard-success) 30%, transparent)"
                  : "color-mix(in srgb, var(--dashboard-success) 20%, transparent)",
              }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  background:
                    "color-mix(in srgb, var(--dashboard-success) 15%, transparent)",
                }}
              >
                <CheckCircle
                  className="w-4 h-4"
                  style={{ color: "var(--dashboard-success-foreground)" }}
                />
              </div>
              <p
                className="text-sm font-medium"
                style={{ color: "var(--dashboard-success-foreground)" }}
              >
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
          background: isDark
            ? "color-mix(in srgb, var(--dashboard-text) 2%, transparent)"
            : "color-mix(in srgb, var(--dashboard-text) 2%, transparent)",
          borderColor: tokens.borderSubtle || tokens.inputBorder,
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <Label
              className="text-sm font-medium"
              style={{ color: tokens.textPrimary }}
            >
              Secondary Category IDs
            </Label>
            <p className="text-xs mt-0.5" style={{ color: tokens.textMuted }}>
              Add additional categories to improve discoverability
            </p>
          </div>
          <DashboardButton
            type="button"
            size="compact"
            variant="outline"
            onClick={addCategory}
            disabled={submitting}
            className="h-9 gap-2 font-medium "
            style={{
              background: "transparent",
              borderColor: tokens.borderSubtle || tokens.inputBorder,
              color: tokens.textPrimary,
            }}
          >
            <Plus className="w-4 h-4" />
            Add
          </DashboardButton>
        </div>

        <div className="space-y-3">
          {categoryIds.map((categoryId, index) => (
            <div key={index} className="flex items-center gap-3">
              <span
                className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-medium flex-shrink-0"
                style={{
                  background: isDark
                    ? "color-mix(in srgb, var(--dashboard-action) 15%, transparent)"
                    : "color-mix(in srgb, var(--dashboard-action) 10%, transparent)",
                  color: "var(--dashboard-info-foreground)",
                }}
              >
                {index + 1}
              </span>
              <div className="flex-1">
                <CategoriesSelect
                  value={categoryId}
                  onValueChange={(value) => handleCategoryChange(index, value)}
                  disabled={submitting}
                  isDark={isDark}
                  tokens={tokens}
                />
              </div>
              {categoryIds.length > 1 && (
                <DashboardButton
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label={`Remove secondary category ${index + 1}`}
                  onClick={() => removeCategory(index)}
                  disabled={submitting}
                  className="h-10 w-10 flex-shrink-0 hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4 text-[var(--dashboard-danger-foreground)]" />
                </DashboardButton>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div
        className="flex items-center gap-3 pt-4 border-t"
        style={{ borderColor: tokens.borderSubtle || tokens.inputBorder }}
      >
        <DashboardButton
          type="submit"
          disabled={!isFormValid() || submitting}
          className="h-11 px-6 font-medium "
          style={{
            background:
              isFormValid() && !submitting
                ? "var(--dashboard-button-primary-background)"
                : "color-mix(in srgb, var(--dashboard-text-muted) 30%, transparent)",
            color: "var(--dashboard-button-primary-foreground)",
          }}
        >
          <Save className="w-4 h-4 mr-2" />
          {submitting ? "Saving..." : "Save Categories"}
        </DashboardButton>

        <DashboardButton
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={submitting}
          className="h-11 px-5 font-medium"
          style={{
            background: tokens.glassBg || "transparent",
            border: `1px solid ${tokens.glassBorder || tokens.inputBorder}`,
            color: tokens.textPrimary,
          }}
        >
          <X className="w-4 h-4 mr-2" />
          Cancel
        </DashboardButton>
      </div>
    </form>
  );
}
