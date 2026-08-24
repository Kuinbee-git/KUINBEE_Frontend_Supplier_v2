"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/datasets/shared/DatasetDialog";
import { DashboardButton } from "@/components/dashboard";
import { Archive, AlertTriangle, Loader2, Database } from "lucide-react";
import { delistDataset } from "@/lib/api/datasets";
import { toast } from "sonner";
import { getDatasetThemeTokens } from "@/constants/dataset.constants";
import { toDatasetUiError } from "../shared/datasetUiError";

interface DelistConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  datasetId: string;
  datasetTitle: string;
  onSuccess: () => void;
}

export function DelistConfirmDialog({
  isOpen,
  onClose,
  datasetId,
  datasetTitle,
  onSuccess,
}: DelistConfirmDialogProps) {
  const [delisting, setDelisting] = useState(false);
  const tokens = getDatasetThemeTokens(false);

  const handleConfirm = async () => {
    setDelisting(true);
    try {
      await delistDataset(datasetId);

      toast.success("Dataset delisted successfully", {
        description:
          "You can now edit metadata and pricing, then submit for review.",
      });

      onClose();
      onSuccess();
    } catch (error: unknown) {
      console.error("Failed to delist dataset:", error);
      const apiError = toDatasetUiError(error);

      const errorMessages: Record<string, string> = {
        INVALID_STATE: "Only published datasets can be delisted.",
        NOT_FOUND: "Dataset not found.",
        FORBIDDEN: "You do not have permission to delist this dataset.",
      };

      const message =
        errorMessages[apiError.code ?? ""] ||
        apiError.message ||
        "Failed to delist dataset";

      toast.error("Failed to delist dataset", {
        description: message,
        duration: 6000,
      });
    } finally {
      setDelisting(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && !delisting && onClose()}
    >
      <DialogContent
        className="max-w-md border backdrop-blur-sm rounded-lg"
        showCloseButton={!delisting}
        onEscapeKeyDown={(event) => delisting && event.preventDefault()}
        onPointerDownOutside={(event) => delisting && event.preventDefault()}
        style={{
          background: tokens.isDark
            ? "var(--dashboard-glass-background-strong)"
            : "var(--dashboard-glass-background-strong)",
          borderColor: tokens.borderDefault,
          boxShadow: tokens.glassShadow,
        }}
      >
        <DialogHeader>
          <div className="flex items-start gap-3 mb-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: tokens.warningBg }}
            >
              <Archive
                className="w-6 h-6"
                style={{ color: tokens.warningText }}
              />
            </div>
            <div>
              <DialogTitle
                className="text-lg mb-1"
                style={{ color: tokens.textPrimary }}
              >
                Delist Dataset
              </DialogTitle>
              <DialogDescription style={{ color: tokens.textSecondary }}>
                Temporarily remove from marketplace to edit and resubmit
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div
            className="rounded-xl p-4 flex items-start gap-3"
            style={{ background: tokens.infoBg }}
          >
            <Database
              className="w-4 h-4 flex-shrink-0 mt-0.5"
              style={{ color: tokens.textSecondary }}
            />
            <div>
              <p className="text-xs mb-1" style={{ color: tokens.textMuted }}>
                Dataset to delist
              </p>
              <p
                className="text-sm font-medium"
                style={{ color: tokens.textPrimary }}
              >
                {datasetTitle}
              </p>
            </div>
          </div>

          <div
            className="rounded-xl p-4 flex items-start gap-3"
            style={{
              background: tokens.warningBg,
              border: `1px solid ${tokens.warningBorder}`,
            }}
          >
            <AlertTriangle
              className="w-4 h-4 flex-shrink-0 mt-0.5"
              style={{ color: tokens.warningText }}
            />
            <div className="text-xs" style={{ color: tokens.textPrimary }}>
              <p className="font-medium mb-1.5">What happens when you delist</p>
              <ul className="space-y-1 opacity-80">
                <li>
                  • Dataset is temporarily hidden from marketplace listings
                </li>
                <li>
                  • Edit page is unlocked for metadata and pricing updates
                </li>
                <li>• Submit update for admin re-review</li>
                <li>• Publish again after verification is complete</li>
              </ul>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-3 sm:gap-3">
          <DashboardButton
            variant="outline"
            onClick={onClose}
            disabled={delisting}
            className=""
            style={{
              borderColor: tokens.borderDefault,
              color: tokens.textPrimary,
              background: tokens.glassBg,
            }}
          >
            Cancel
          </DashboardButton>
          <DashboardButton
            onClick={handleConfirm}
            disabled={delisting}
            className="gap-2"
            style={{
              background: delisting
                ? tokens.textMuted
                : "var(--dashboard-warning-foreground)",
            }}
          >
            {delisting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Delisting...
              </>
            ) : (
              <>
                <Archive className="w-4 h-4" />
                Delist Dataset
              </>
            )}
          </DashboardButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
