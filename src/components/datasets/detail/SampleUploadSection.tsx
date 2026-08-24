"use client";

import { DashboardCard } from "@/components/dashboard";
import { DashboardButton } from "@/components/dashboard";
import { Label } from "@/components/ui/label";
import { Upload, FileText } from "lucide-react";
import type { DatasetDetailTokens } from "./detailTokens";

interface SampleUploadSectionProps {
  sampleUpload:
    | {
        id: string;
        status: string;
        originalFileName: string | null;
        contentType: string | null;
        sizeBytes: string | null;
        updatedAt: string;
      }
    | null
    | undefined;
  isEditable: boolean;
  onUploadClick: () => void;
  isDark: boolean;
  tokens: DatasetDetailTokens;
  formatDate: (dateStr: string) => string;
  formatFileSize: (bytes: string | null) => string;
}

export function SampleUploadSection({
  sampleUpload,
  isEditable,
  onUploadClick,
  isDark,
  tokens,
  formatDate,
  formatFileSize,
}: SampleUploadSectionProps) {
  return (
    <DashboardCard className="overflow-hidden rounded-xl border">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText
              className="w-5 h-5"
              style={{ color: "var(--dashboard-success-foreground)" }}
            />
            <div>
              <h3
                className="text-sm font-semibold"
                style={{ color: tokens.textPrimary }}
              >
                Sample File Upload
              </h3>
              <p className="text-xs" style={{ color: tokens.textMuted }}>
                Buyers can download this file freely before purchase
              </p>
            </div>
          </div>
          {isEditable && (
            <DashboardButton
              size="compact"
              variant="outline"
              onClick={onUploadClick}
              className="h-10 gap-2 px-4"
            >
              <Upload className="w-4 h-4" />
              {sampleUpload ? "Replace sample file" : "Upload sample file"}
            </DashboardButton>
          )}
        </div>

        {sampleUpload ? (
          <div
            className="p-4 rounded-lg border"
            style={{
              background: isDark
                ? "color-mix(in srgb, var(--dashboard-text) 2%, transparent)"
                : "color-mix(in srgb, var(--dashboard-text) 2%, transparent)",
              borderColor: tokens.borderSubtle,
            }}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label style={{ color: tokens.textSecondary }}>
                    File Name
                  </Label>
                  <p
                    className="text-sm font-medium"
                    style={{ color: tokens.textPrimary }}
                  >
                    {sampleUpload.originalFileName || "N/A"}
                  </p>
                </div>
                <span
                  className="px-3 py-1 text-xs font-medium rounded-full"
                  style={{
                    background:
                      sampleUpload.status === "UPLOADED"
                        ? "color-mix(in srgb, var(--dashboard-success) 10%, transparent)"
                        : sampleUpload.status === "UPLOADING"
                          ? "color-mix(in srgb, var(--dashboard-warning) 10%, transparent)"
                          : sampleUpload.status === "FAILED"
                            ? "color-mix(in srgb, var(--dashboard-danger) 10%, transparent)"
                            : "color-mix(in srgb, var(--dashboard-action) 10%, transparent)",
                    color:
                      sampleUpload.status === "UPLOADED"
                        ? "var(--dashboard-success-foreground)"
                        : sampleUpload.status === "UPLOADING"
                          ? "var(--dashboard-warning-foreground)"
                          : sampleUpload.status === "FAILED"
                            ? "var(--dashboard-danger-foreground)"
                            : "var(--dashboard-info-foreground)",
                  }}
                >
                  {sampleUpload.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label style={{ color: tokens.textSecondary }}>
                    Content Type
                  </Label>
                  <p className="text-sm" style={{ color: tokens.textPrimary }}>
                    {sampleUpload.contentType || "N/A"}
                  </p>
                </div>
                <div>
                  <Label style={{ color: tokens.textSecondary }}>
                    File Size
                  </Label>
                  <p className="text-sm" style={{ color: tokens.textPrimary }}>
                    {formatFileSize(sampleUpload.sizeBytes)}
                  </p>
                </div>
              </div>

              <div>
                <Label style={{ color: tokens.textSecondary }}>
                  Last Updated
                </Label>
                <p className="text-sm" style={{ color: tokens.textPrimary }}>
                  {formatDate(sampleUpload.updatedAt)}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-sm" style={{ color: tokens.textMuted }}>
            No sample file uploaded yet.
          </div>
        )}
      </div>
    </DashboardCard>
  );
}
