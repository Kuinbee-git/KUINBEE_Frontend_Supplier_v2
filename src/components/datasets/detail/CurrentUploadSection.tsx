"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
    <Card className="supplier-glass-card overflow-hidden rounded-xl border">
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
                <Button onClick={onUploadClick} className="gap-2">
                  <Upload className="w-4 h-4" />
                  Upload file
                </Button>
              )}
            </div>
          ) : (
            <div
              className="p-4 rounded-lg border"
              style={{
                background: isDark
                  ? "rgba(255, 255, 255, 0.02)"
                  : "rgba(26, 34, 64, 0.02)",
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
                          ? "rgba(34, 197, 94, 0.1)"
                          : currentUpload.status === "UPLOADING"
                            ? "rgba(234, 179, 8, 0.1)"
                            : currentUpload.status === "FAILED"
                              ? "rgba(239, 68, 68, 0.1)"
                              : "rgba(59, 130, 246, 0.1)",
                      color:
                        currentUpload.status === "UPLOADED"
                          ? "#22c55e"
                          : currentUpload.status === "UPLOADING"
                            ? "#eab308"
                            : currentUpload.status === "FAILED"
                              ? "#ef4444"
                              : "#3b82f6",
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
                          style={{ color: "#eab308" }}
                        />
                        <div
                          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none"
                          style={{
                            background: isDark ? "#1e293b" : "#1a2240",
                            color: "#f8fafc",
                            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                            border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.15)"}`,
                          }}
                        >
                          If the status is stuck as uploading, reupload
                          <div
                            className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 rotate-45"
                            style={{
                              background: isDark ? "#1e293b" : "#1a2240",
                              marginTop: "-4px",
                            }}
                          />
                        </div>
                      </div>
                      <span className="text-xs" style={{ color: "#eab308" }}>
                        Upload may be stuck
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={onUploadClick}
                      className="w-full font-semibold transition-all duration-200 hover:shadow-md hover:scale-[1.01] active:scale-[0.99]"
                      style={{
                        background: isDark
                          ? "rgba(234, 179, 8, 0.1)"
                          : "rgba(234, 179, 8, 0.08)",
                        border: "1.5px solid rgba(234, 179, 8, 0.4)",
                        color: isDark ? "#fbbf24" : "#b45309",
                      }}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Reupload
                    </Button>
                  </div>
                )}

                {isEditable && currentUpload.status !== "UPLOADING" && (
                  <div
                    className="pt-3 border-t"
                    style={{ borderColor: tokens.borderSubtle }}
                  >
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={onUploadClick}
                      className="w-full gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      Replace file
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
