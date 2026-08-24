"use client";

import { useState } from "react";
import { DashboardCard } from "@/components/dashboard";
import { DashboardButton } from "@/components/dashboard";
import { Label } from "@/components/ui/label";
import { DashboardInput } from "@/components/dashboard";
import { DatasetSelect } from "@/components/datasets/shared/DatasetSelect";
import { getDatasetThemeTokens } from "@/constants/dataset.constants";
import { Save, X, AlertCircle, CheckCircle } from "lucide-react";
import { upsertDataFormatInfo } from "@/lib/api";
import { ENCODING_TYPES } from "@/types/dataset-proposal.types";
import type {
  DataFormatInfo,
  UpsertDataFormatRequest,
  UpsertDataFormatResponse,
  FileFormat,
  CompressionType,
  EncodingType,
} from "@/types/dataset-proposal.types";
import { toDatasetUiError } from "../shared/datasetUiError";

type DataFormatInitialData = {
  fileFormat?: string | null;
  rows?: number | null;
  cols?: number | null;
  fileSize?: string | null;
  compressionType?: string | null;
  encoding?: string | null;
};

interface DataFormatFormProps {
  datasetId: string;
  initialData?: DataFormatInitialData;
  isDark?: boolean;
  onSuccess?: (data: DataFormatInfo) => void;
  onCancel?: () => void;
  onSubmitData?: (
    datasetId: string,
    data: UpsertDataFormatRequest
  ) => Promise<UpsertDataFormatResponse>;
}

const FILE_FORMATS: FileFormat[] = [
  "CSV",
  "JSON",
  "EXCEL",
  "PARQUET",
  "SQL",
  "XML",
  "TSV",
  "AVRO",
  "HDF5",
  "PICKLE",
  "FEATHER",
  "OTHER",
];

const COMPRESSION_TYPES: CompressionType[] = [
  "NONE",
  "ZIP",
  "GZIP",
  "BZIP2",
  "TAR",
  "RAR",
];

export function DataFormatForm({
  datasetId,
  initialData,
  isDark = false,
  onSuccess,
  onCancel,
  onSubmitData,
}: DataFormatFormProps) {
  const normalizeEncoding = (value?: string | null): EncodingType => {
    if (value && ENCODING_TYPES.includes(value as EncodingType)) {
      return value as EncodingType;
    }
    return "UTF-8";
  };

  const tokens = getDatasetThemeTokens(isDark);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState<UpsertDataFormatRequest>({
    fileFormat: (initialData?.fileFormat as FileFormat) || "CSV",
    rows: initialData?.rows || 0,
    cols: initialData?.cols || 0,
    fileSize: initialData?.fileSize || "",
    compressionType:
      (initialData?.compressionType as CompressionType) || "NONE",
    encoding: normalizeEncoding(initialData?.encoding),
  });

  const handleFieldChange = <K extends keyof UpsertDataFormatRequest>(
    field: K,
    value: UpsertDataFormatRequest[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(false);
  };

  const isFormValid = () => {
    return (
      formData.fileFormat &&
      formData.rows > 0 &&
      formData.cols > 0 &&
      formData.fileSize.trim() !== ""
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid()) {
      setError("Please fill in all required fields with valid values");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await (onSubmitData
        ? onSubmitData(datasetId, formData)
        : upsertDataFormatInfo(datasetId, formData));
      setSuccess(true);

      if (onSuccess) {
        onSuccess(response.dataFormat);
      }

      // Auto-hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      console.error("Failed to save data format:", err);
      const apiError = toDatasetUiError(err);
      setError(apiError.message || "Failed to save data format");
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
        fileFormat: (initialData?.fileFormat as FileFormat) || "CSV",
        rows: initialData?.rows || 0,
        cols: initialData?.cols || 0,
        fileSize: initialData?.fileSize || "",
        compressionType:
          (initialData?.compressionType as CompressionType) || "NONE",
        encoding: normalizeEncoding(initialData?.encoding),
      });
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
          <h2
            className="text-lg font-semibold mb-1"
            style={{ color: tokens.textPrimary }}
          >
            Data Format & Structure
          </h2>
          <p className="text-sm" style={{ color: tokens.textMuted }}>
            Specify the format and structural details of your dataset file
          </p>
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
                  Data format saved successfully!
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
                  className="w-8 h-8 rounded-lg flex items-cente150 r justify-center flex-shrink-0"
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

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Information Section */}
          <div
            className="rounded-xl border p-5 space-y-5"
            style={{
              background: isDark
                ? "color-mix(in srgb, var(--dashboard-text) 2%, transparent)"
                : "color-mix(in srgb, var(--dashboard-text) 2%, transparent)",
              borderColor: tokens.borderSubtle,
            }}
          >
            <div
              className="flex items-center gap-2 pb-3 border-b"
              style={{ borderColor: tokens.borderSubtle }}
            >
              <span
                className="text-sm font-medium"
                style={{ color: tokens.textPrimary }}
              >
                File Information
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* File Format */}
              <div className="space-y-2">
                <Label
                  htmlFor="fileFormat"
                  className="text-sm font-medium"
                  style={{ color: tokens.textPrimary }}
                >
                  File Format{" "}
                  <span className="text-[var(--dashboard-danger-foreground)]">
                    *
                  </span>
                </Label>
                <DatasetSelect
                  triggerId="fileFormat"
                  options={FILE_FORMATS.map((format) => ({
                    label: format,
                    value: format,
                  }))}
                  value={formData.fileFormat}
                  onValueChange={(value) =>
                    handleFieldChange("fileFormat", value as FileFormat)
                  }
                  disabled={submitting}
                  tokens={tokens}
                  isDark={isDark}
                />
              </div>

              {/* File Size */}
              <div className="space-y-2">
                <Label
                  htmlFor="fileSize"
                  className="text-sm font-medium"
                  style={{ color: tokens.textPrimary }}
                >
                  File Size{" "}
                  <span className="text-[var(--dashboard-danger-foreground)]">
                    *
                  </span>
                </Label>
                <DashboardInput
                  id="fileSize"
                  value={formData.fileSize}
                  onChange={(e) =>
                    handleFieldChange("fileSize", e.target.value)
                  }
                  placeholder="e.g., 10.5, 2.3"
                  disabled={submitting}
                  required
                  className="h-11 transition-colors focus-visible:ring-2"
                  style={{
                    background: tokens.inputBg,
                    borderColor: tokens.inputBorder,
                    color: tokens.textPrimary,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Data Structure Section */}
          <div
            className="rounded-xl border p-5 space-y-5"
            style={{
              background: isDark
                ? "color-mix(in srgb, var(--dashboard-text) 2%, transparent)"
                : "color-mix(in srgb, var(--dashboard-text) 2%, transparent)",
              borderColor: tokens.borderSubtle,
            }}
          >
            <div
              className="flex items-center gap-2 pb-3 border-b"
              style={{ borderColor: tokens.borderSubtle }}
            >
              <span
                className="text-sm font-medium"
                style={{ color: tokens.textPrimary }}
              >
                Data Structure
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Rows */}
              <div className="space-y-2">
                <Label
                  htmlFor="rows"
                  className="text-sm font-medium"
                  style={{ color: tokens.textPrimary }}
                >
                  Number of Rows{" "}
                  <span className="text-[var(--dashboard-danger-foreground)]">
                    *
                  </span>
                </Label>
                <DashboardInput
                  id="rows"
                  type="number"
                  min="1"
                  value={formData.rows}
                  onChange={(e) =>
                    handleFieldChange("rows", parseInt(e.target.value, 10) || 0)
                  }
                  placeholder="e.g., 10000"
                  disabled={submitting}
                  required
                  className="h-11 transition-colors focus-visible:ring-2"
                  style={{
                    background: tokens.inputBg,
                    borderColor: tokens.inputBorder,
                    color: tokens.textPrimary,
                  }}
                />
              </div>

              {/* Columns */}
              <div className="space-y-2">
                <Label
                  htmlFor="cols"
                  className="text-sm font-medium"
                  style={{ color: tokens.textPrimary }}
                >
                  Number of Columns{" "}
                  <span className="text-[var(--dashboard-danger-foreground)]">
                    *
                  </span>
                </Label>
                <DashboardInput
                  id="cols"
                  type="number"
                  min="1"
                  value={formData.cols}
                  onChange={(e) =>
                    handleFieldChange("cols", parseInt(e.target.value, 10) || 0)
                  }
                  placeholder="e.g., 25"
                  disabled={submitting}
                  required
                  className="h-11 transition-colors focus-visible:ring-2"
                  style={{
                    background: tokens.inputBg,
                    borderColor: tokens.inputBorder,
                    color: tokens.textPrimary,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Technical Details Section */}
          <div
            className="rounded-xl border p-5 space-y-5"
            style={{
              background: isDark
                ? "color-mix(in srgb, var(--dashboard-text) 2%, transparent)"
                : "color-mix(in srgb, var(--dashboard-text) 2%, transparent)",
              borderColor: tokens.borderSubtle,
            }}
          >
            <div
              className="flex items-center gap-2 pb-3 border-b"
              style={{ borderColor: tokens.borderSubtle }}
            >
              <span
                className="text-sm font-medium"
                style={{ color: tokens.textPrimary }}
              >
                Technical Details
              </span>
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: tokens.inputBg, color: tokens.textMuted }}
              >
                Optional
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Compression Type */}
              <div className="space-y-2">
                <Label
                  htmlFor="compressionType"
                  className="text-sm font-medium"
                  style={{ color: tokens.textPrimary }}
                >
                  Compression Type
                </Label>
                <DatasetSelect
                  triggerId="compressionType"
                  options={COMPRESSION_TYPES.map((type) => ({
                    label: type === "NONE" ? "None" : type,
                    value: type,
                  }))}
                  value={formData.compressionType || "NONE"}
                  onValueChange={(value) =>
                    handleFieldChange(
                      "compressionType",
                      value as CompressionType
                    )
                  }
                  disabled={submitting}
                  tokens={tokens}
                  isDark={isDark}
                />
              </div>

              {/* Encoding */}
              <div className="space-y-2">
                <Label
                  htmlFor="encoding"
                  className="text-sm font-medium"
                  style={{ color: tokens.textPrimary }}
                >
                  Encoding
                </Label>
                <DatasetSelect
                  triggerId="encoding"
                  options={ENCODING_TYPES.map((encoding) => ({
                    label: encoding,
                    value: encoding,
                  }))}
                  value={formData.encoding || "UTF-8"}
                  onValueChange={(value) =>
                    handleFieldChange("encoding", value as EncodingType)
                  }
                  disabled={submitting}
                  tokens={tokens}
                  isDark={isDark}
                />
              </div>
            </div>
          </div>

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
              {submitting ? "Saving..." : "Save Format"}
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
