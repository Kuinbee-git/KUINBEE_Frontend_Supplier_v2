"use client";

import { DashboardCard } from "@/components/dashboard";
import { DashboardButton } from "@/components/dashboard";
import { Label } from "@/components/ui/label";
import { Upload, ChevronUp, ChevronDown, Info, RefreshCw } from "lucide-react";
import type { DatasetDetailTokens } from "./detailTokens";

interface CurrentUploadSectionProps {
  currentUpload: {
    id: string;
    status: string;
    originalFileName: string | null;
    contentType: string | null;
    sizeBytes: string | null;
    updatedAt: string;
  } | null;
  isExpanded: boolean;
  onToggle: () => void;
  isEditable: boolean;
  onUploadClick: () => void;
  isDark: boolean;
  tokens: DatasetDetailTokens;
  formatDate: (dateStr: string) => string;
  formatFileSize: (bytes: string | null) => string;
}

export function CurrentUploadSection({
  currentUpload,
  isExpanded,
  onToggle,
  isEditable,
  onUploadClick,
  isDark,
  tokens,
  formatDate,
  formatFileSize,
}: CurrentUploadSectionProps) {
  return (
    <DashboardCard className="overflow-hidden rounded-xl border">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-6 py-4 border-b transition-colors duration-200"
        style={{ borderColor: tokens.borderSubtle }}
      >
        <div className="flex items-center gap-2">
          <Upload className="w-5 h-5" style={{ color: tokens.textSecondary }} />
          <div className="text-left">
            <h3
              className="text-sm font-semibold"
              style={{ color: tokens.textPrimary }}
            >
              Current Upload
            </h3>
            <p className="text-xs" style={{ color: tokens.textMuted }}>
              {currentUpload
                ? `Status: ${currentUpload.status}`
                : "No upload yet"}
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5" style={{ color: tokens.textMuted }} />
        ) : (
          <ChevronDown
            className="w-5 h-5"
            style={{ color: tokens.textMuted }}
          />
        )}
      </button>

      {isExpanded && (
        <div className="p-6">
          {!currentUpload ? (
            <div className="text-center py-8">
              <Upload
                className="w-12 h-12 mx-auto mb-3"
                style={{ color: tokens.textMuted }}
              />
              <p className="text-sm mb-4" style={{ color: tokens.textMuted }}>
                No file uploaded yet
              </p>
              {isEditable && (
                <DashboardButton onClick={onUploadClick} className="gap-2">
                  <Upload className="w-4 h-4" />
                  Upload file
                </DashboardButton>
              )}
            </div>
          ) : (
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
                      {currentUpload.originalFileName || "N/A"}
                    </p>
                  </div>
                  <span
                    className="px-3 py-1 text-xs font-medium rounded-full"
                    style={{
                      background:
                        currentUpload.status === "UPLOADED"
                          ? "color-mix(in srgb, var(--dashboard-success) 10%, transparent)"
                          : currentUpload.status === "UPLOADING"
                            ? "color-mix(in srgb, var(--dashboard-warning) 10%, transparent)"
                            : currentUpload.status === "FAILED"
                              ? "color-mix(in srgb, var(--dashboard-danger) 10%, transparent)"
                              : "color-mix(in srgb, var(--dashboard-action) 10%, transparent)",
                      color:
                        currentUpload.status === "UPLOADED"
                          ? "var(--dashboard-success-foreground)"
                          : currentUpload.status === "UPLOADING"
                            ? "var(--dashboard-warning-foreground)"
                            : currentUpload.status === "FAILED"
                              ? "var(--dashboard-danger-foreground)"
                              : "var(--dashboard-info-foreground)",
                    }}
                  >
                    {currentUpload.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label style={{ color: tokens.textSecondary }}>
                      Content Type
                    </Label>
                    <p
                      className="text-sm"
                      style={{ color: tokens.textPrimary }}
                    >
                      {currentUpload.contentType || "N/A"}
                    </p>
                  </div>
                  <div>
                    <Label style={{ color: tokens.textSecondary }}>
                      File Size
                    </Label>
                    <p
                      className="text-sm"
                      style={{ color: tokens.textPrimary }}
                    >
                      {formatFileSize(currentUpload.sizeBytes)}
                    </p>
                  </div>
                </div>

                <div>
                  <Label style={{ color: tokens.textSecondary }}>
                    Last Updated
                  </Label>
                  <p className="text-sm" style={{ color: tokens.textPrimary }}>
                    {formatDate(currentUpload.updatedAt)}
                  </p>
                </div>

                {isEditable && currentUpload.status === "UPLOADING" && (
                  <div
                    className="pt-3 border-t"
                    style={{ borderColor: tokens.borderSubtle }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="relative group">
                        <Info
                          className="w-4 h-4 cursor-help"
                          style={{
                            color: "var(--dashboard-warning-foreground)",
                          }}
                        />
                        <div
                          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap invisible opacity-0 transition-opacity duration-150 group-hover:visible group-hover:opacity-100 motion-reduce:transition-none z-50 pointer-events-none"
                          style={{
                            background: isDark
                              ? "var(--dashboard-text)"
                              : "var(--dashboard-text)",
                            color: "var(--dashboard-surface)",
                            boxShadow:
                              "0 4px 12px color-mix(in srgb, var(--background) 30%, transparent)",
                            border: `1px solid ${isDark ? "color-mix(in srgb, var(--dashboard-text) 10%, transparent)" : "color-mix(in srgb, var(--dashboard-text) 15%, transparent)"}`,
                          }}
                        >
                          If the status is stuck as uploading, reupload
                          <div
                            className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 rotate-45"
                            style={{
                              background: isDark
                                ? "var(--dashboard-text)"
                                : "var(--dashboard-text)",
                              marginTop: "-4px",
                            }}
                          />
                        </div>
                      </div>
                      <span
                        className="text-xs"
                        style={{ color: "var(--dashboard-warning-foreground)" }}
                      >
                        Upload may be stuck
                      </span>
                    </div>
                    <DashboardButton
                      size="compact"
                      variant="outline"
                      onClick={onUploadClick}
                      className="w-full font-semibold"
                      style={{
                        background: isDark
                          ? "color-mix(in srgb, var(--dashboard-warning) 10%, transparent)"
                          : "color-mix(in srgb, var(--dashboard-warning) 8%, transparent)",
                        border:
                          "1.5px solid color-mix(in srgb, var(--dashboard-warning) 40%, transparent)",
                        color: isDark
                          ? "var(--dashboard-warning-foreground)"
                          : "var(--dashboard-warning-foreground)",
                      }}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Reupload
                    </DashboardButton>
                  </div>
                )}

                {isEditable && currentUpload.status !== "UPLOADING" && (
                  <div
                    className="pt-3 border-t"
                    style={{ borderColor: tokens.borderSubtle }}
                  >
                    <DashboardButton
                      size="compact"
                      variant="outline"
                      onClick={onUploadClick}
                      className="w-full gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      Replace file
                    </DashboardButton>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </DashboardCard>
  );
}
