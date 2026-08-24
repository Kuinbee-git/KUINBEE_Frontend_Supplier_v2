"use client";

import { useState } from "react";
import {
  DashboardButton,
  type DashboardButtonSize,
} from "@/components/dashboard";
import { Download, Loader2 } from "lucide-react";
import { getPublishedFileDownloadUrl } from "@/lib/api/datasets";
import { toast } from "sonner";
import { toDatasetUiError } from "../shared/datasetUiError";

interface DownloadButtonProps {
  datasetId: string;
  fileName?: string | null;
  variant?: "default" | "outline" | "ghost";
  size?: Exclude<DashboardButtonSize, "icon">;
  className?: string;
}

export function DownloadButton({
  datasetId,
  fileName,
  variant = "outline",
  size = "default",
  className = "",
}: DownloadButtonProps) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const response = await getPublishedFileDownloadUrl(datasetId);

      // Open the presigned URL in a new tab to trigger download
      window.open(response.url, "_blank");

      toast.success("Download started", {
        description: fileName || "Your file download should begin shortly.",
      });
    } catch (error: unknown) {
      console.error("Failed to get download URL:", error);
      const apiError = toDatasetUiError(error);

      const errorMessages: Record<string, string> = {
        NOT_PUBLISHED: "Dataset is not published yet.",
        NOT_FOUND: "Dataset or file not found.",
        FORBIDDEN: "You do not have permission to download this file.",
        STORAGE_UNAVAILABLE: "Storage service is temporarily unavailable.",
      };

      const message =
        errorMessages[apiError.code ?? ""] ||
        apiError.message ||
        "Failed to generate download link";

      toast.error("Download failed", {
        description: message,
        duration: 6000,
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <DashboardButton
      variant={variant}
      size={size}
      onClick={handleDownload}
      disabled={downloading}
      className={`gap-2 ${variant === "default" ? "bg-primary hover:bg-primary/90 text-primary-foreground" : ""} ${className}`}
    >
      {downloading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Download className="w-4 h-4" />
      )}
      {downloading ? "Preparing..." : "Download File"}
    </DashboardButton>
  );
}
