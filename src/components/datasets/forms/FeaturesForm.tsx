"use client";

import { useState } from "react";
import { DashboardCard } from "@/components/dashboard";
import { DashboardButton } from "@/components/dashboard";
import { Label } from "@/components/ui/label";
import { DashboardInput } from "@/components/dashboard";
import { DashboardTextarea } from "@/components/dashboard";
import { DashboardCheckbox } from "@/components/dashboard";
import { getDatasetThemeTokens } from "@/constants/dataset.constants";
import { Save, X, Plus, Trash2, AlertCircle, CheckCircle } from "lucide-react";
import { replaceFeatures } from "@/lib/api";
import type {
  Feature,
  ReplaceFeaturesRequest,
  ReplaceFeaturesResponse,
} from "@/types/dataset-proposal.types";
import { toDatasetUiError } from "../shared/datasetUiError";

interface FeaturesFormProps {
  datasetId: string;
  initialData?: Feature[];
  isDark?: boolean;
  onSuccess?: (count: number) => void;
  onCancel?: () => void;
  onSubmitData?: (
    datasetId: string,
    data: ReplaceFeaturesRequest
  ) => Promise<ReplaceFeaturesResponse>;
}

export function FeaturesForm({
  datasetId,
  initialData,
  isDark = false,
  onSuccess,
  onCancel,
  onSubmitData,
}: FeaturesFormProps) {
  const tokens = getDatasetThemeTokens(isDark);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [features, setFeatures] = useState<Feature[]>(
    initialData && initialData.length > 0
      ? initialData
      : [{ name: "", dataType: "", description: null, isNullable: false }]
  );

  const handleAddFeature = () => {
    setFeatures([
      ...features,
      { name: "", dataType: "", description: null, isNullable: false },
    ]);
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

  const handleFeatureChange = <K extends keyof Feature>(
    index: number,
    field: K,
    value: Feature[K]
  ) => {
    const newFeatures = [...features];
    newFeatures[index] = { ...newFeatures[index], [field]: value };
    setFeatures(newFeatures);
    setError(null);
    setSuccess(false);
  };

  const isFormValid = () => {
    return features.every(
      (feature) => feature.name.trim() !== "" && feature.dataType.trim() !== ""
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid()) {
      setError("Please fill in name and data type for all features");
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

      const response = await (onSubmitData
        ? onSubmitData(datasetId, { features: cleanedFeatures })
        : replaceFeatures(datasetId, { features: cleanedFeatures }));
      setSuccess(true);

      if (onSuccess) {
        onSuccess(response.count);
      }

      // Auto-hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      console.error("Failed to save features:", err);
      const apiError = toDatasetUiError(err);
      setError(apiError.message || "Failed to save features");
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
          : [{ name: "", dataType: "", description: null, isNullable: false }]
      );
      setError(null);
      setSuccess(false);
    }
  };

  return (
    <DashboardCard
      className="border overflow-hidden"
      style={{
        background: tokens.surfaceCard,
        borderColor: tokens.borderDefault,
      }}
    >
      <div className="p-6">
        {/* Header */}
        <div
          className="mb-6 pb-4 border-b"
          style={{ borderColor: tokens.borderSubtle }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2
                className="text-lg font-semibold mb-1"
                style={{ color: tokens.textPrimary }}
              >
                Features / Columns
              </h2>
              <p className="text-sm" style={{ color: tokens.textMuted }}>
                Define the features (columns) in your dataset schema
              </p>
            </div>
            <span
              className="text-xs font-medium px-3 py-1.5 rounded-full"
              style={{
                background: isDark
                  ? "color-mix(in srgb, var(--dashboard-action) 15%, transparent)"
                  : "color-mix(in srgb, var(--dashboard-action) 10%, transparent)",
                color: "var(--dashboard-info-foreground)",
              }}
            >
              {features.length} feature{features.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Status Messages */}
        {(success || error) && (
          <div className="mb-6 space-y-3">
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
                  Features saved successfully!
                </p>
              </div>
            )}

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
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Feature Cards */}
          <div className="space-y-4">
            {features.map((feature, index) => (
              <div
                key={index}
                className="rounded-xl border overflow-hidden transition-shadow duration-200 motion-reduce:transition-none"
                style={{
                  background: isDark
                    ? "color-mix(in srgb, var(--dashboard-text) 2%, transparent)"
                    : "color-mix(in srgb, var(--dashboard-text) 2%, transparent)",
                  borderColor: tokens.borderSubtle,
                }}
              >
                {/* Feature Header */}
                <div
                  className="flex items-center justify-between px-4 py-3 border-b"
                  style={{
                    background: isDark
                      ? "color-mix(in srgb, var(--dashboard-text) 3%, transparent)"
                      : "color-mix(in srgb, var(--dashboard-text) 3%, transparent)",
                    borderColor: tokens.borderSubtle,
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-medium"
                      style={{
                        background: isDark
                          ? "color-mix(in srgb, var(--dashboard-action) 15%, transparent)"
                          : "color-mix(in srgb, var(--dashboard-action) 10%, transparent)",
                        color: "var(--dashboard-info-foreground)",
                      }}
                    >
                      {index + 1}
                    </span>
                    <h3
                      className="text-sm font-medium"
                      style={{ color: tokens.textPrimary }}
                    >
                      {feature.name || `Feature ${index + 1}`}
                    </h3>
                  </div>
                  {features.length > 1 && (
                    <DashboardButton
                      type="button"
                      variant="ghost"
                      size="compact"
                      onClick={() => handleRemoveFeature(index)}
                      disabled={submitting}
                      className="h-8 w-8 p-0 hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4 text-[var(--dashboard-danger-foreground)]" />
                    </DashboardButton>
                  )}
                </div>

                {/* Feature Fields */}
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Feature Name */}
                    <div className="space-y-2">
                      <Label
                        className="text-sm font-medium"
                        style={{ color: tokens.textPrimary }}
                      >
                        Name{" "}
                        <span className="text-[var(--dashboard-danger-foreground)]">
                          *
                        </span>
                      </Label>
                      <DashboardInput
                        value={feature.name}
                        onChange={(e) =>
                          handleFeatureChange(index, "name", e.target.value)
                        }
                        placeholder="e.g., customer_id, price, category"
                        disabled={submitting}
                        required
                        className="h-10 transition-colors focus-visible:ring-2"
                        style={{
                          background: tokens.inputBg,
                          borderColor: tokens.inputBorder,
                          color: tokens.textPrimary,
                        }}
                      />
                    </div>

                    {/* Data Type */}
                    <div className="space-y-2">
                      <Label
                        className="text-sm font-medium"
                        style={{ color: tokens.textPrimary }}
                      >
                        Data Type{" "}
                        <span className="text-[var(--dashboard-danger-foreground)]">
                          *
                        </span>
                      </Label>
                      <DashboardInput
                        value={feature.dataType}
                        onChange={(e) =>
                          handleFeatureChange(index, "dataType", e.target.value)
                        }
                        placeholder="e.g., string, integer, float, date"
                        disabled={submitting}
                        required
                        className="h-10 transition-colors focus-visible:ring-2"
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
                    <Label
                      className="text-sm font-medium"
                      style={{ color: tokens.textPrimary }}
                    >
                      Description
                    </Label>
                    <DashboardTextarea
                      value={feature.description || ""}
                      onChange={(e) =>
                        handleFeatureChange(
                          index,
                          "description",
                          e.target.value || null
                        )
                      }
                      placeholder="Describe what this feature represents"
                      rows={2}
                      disabled={submitting}
                      className="transition-colors focus-visible:ring-2 resize-none"
                      style={{
                        background: tokens.inputBg,
                        borderColor: tokens.inputBorder,
                        color: tokens.textPrimary,
                      }}
                    />
                  </div>

                  {/* Is Nullable */}
                  <div
                    className="flex items-center gap-3 p-3 rounded-lg"
                    style={{
                      background: isDark
                        ? "color-mix(in srgb, var(--dashboard-text) 2%, transparent)"
                        : "color-mix(in srgb, var(--dashboard-text) 2%, transparent)",
                    }}
                  >
                    <DashboardCheckbox
                      id={`nullable-${index}`}
                      checked={feature.isNullable || false}
                      onCheckedChange={(checked) =>
                        handleFeatureChange(
                          index,
                          "isNullable",
                          checked === true
                        )
                      }
                      disabled={submitting}
                      className="h-5 w-5"
                    />
                    <div>
                      <Label
                        htmlFor={`nullable-${index}`}
                        className="text-sm font-medium cursor-pointer"
                        style={{ color: tokens.textPrimary }}
                      >
                        Allow null/missing values
                      </Label>
                      <p
                        className="text-xs mt-0.5"
                        style={{ color: tokens.textMuted }}
                      >
                        Check if this field can contain empty or null values
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add Feature Button */}
          <DashboardButton
            type="button"
            variant="outline"
            onClick={handleAddFeature}
            disabled={submitting}
            className="h-12 w-full gap-2 border-dashed font-medium"
            style={{
              background: "transparent",
              borderColor: tokens.borderSubtle,
              color: tokens.textSecondary,
            }}
          >
            <Plus className="w-5 h-5" />
            Add Another Feature
          </DashboardButton>

          {/* Action Buttons */}
          <div
            className="flex items-center gap-3 pt-6 border-t"
            style={{ borderColor: tokens.borderSubtle }}
          >
            <DashboardButton
              type="submit"
              disabled={!isFormValid() || submitting}
              className="h-11 px-6 font-medium"
              style={{
                background:
                  isFormValid() && !submitting
                    ? "var(--dashboard-button-primary-background)"
                    : "color-mix(in srgb, var(--dashboard-text-muted) 30%, transparent)",
              }}
            >
              <Save className="w-4 h-4 mr-2" />
              {submitting
                ? "Saving..."
                : `Save ${features.length} Feature${features.length !== 1 ? "s" : ""}`}
            </DashboardButton>

            {onCancel && (
              <DashboardButton
                type="button"
                variant="outline"
                onClick={handleCancel}
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
            )}
          </div>
        </form>
      </div>
    </DashboardCard>
  );
}
