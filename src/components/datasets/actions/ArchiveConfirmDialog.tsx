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
import { DashboardButton, DashboardInlineAlert } from "@/components/dashboard";
import { Archive, AlertTriangle, Loader2, Database } from "lucide-react";
import { archiveDataset } from "@/lib/api/datasets";
import { toast } from "sonner";
import { toDatasetUiError } from "../shared/datasetUiError";

interface ArchiveConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  datasetId: string;
  datasetTitle: string;
  onSuccess: () => void;
  isDark?: boolean;
}

export function ArchiveConfirmDialog({
  isOpen,
  onClose,
  datasetId,
  datasetTitle,
  onSuccess,
}: ArchiveConfirmDialogProps) {
  const [archiving, setArchiving] = useState(false);

  const handleConfirm = async () => {
    setArchiving(true);
    try {
      await archiveDataset(datasetId);

      toast.success("Dataset archived successfully", {
        description: "The dataset is now hidden from the marketplace.",
      });

      onClose();
      onSuccess();
    } catch (error: unknown) {
      console.error("Failed to archive dataset:", error);
      const apiError = toDatasetUiError(error);

      const errorMessages: Record<string, string> = {
        INVALID_STATE: "Dataset cannot be archived in its current state.",
        NOT_FOUND: "Dataset not found.",
        FORBIDDEN: "You do not have permission to archive this dataset.",
      };

      const message =
        errorMessages[apiError.code ?? ""] ||
        apiError.message ||
        "Failed to archive dataset";

      toast.error("Failed to archive dataset", {
        description: message,
        duration: 6000,
      });
    } finally {
      setArchiving(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && !archiving && onClose()}
    >
      <DialogContent
        className="max-w-md"
        showCloseButton={!archiving}
        onEscapeKeyDown={(event) => archiving && event.preventDefault()}
        onPointerDownOutside={(event) => archiving && event.preventDefault()}
      >
        <DialogHeader>
          <div className="mb-4 flex items-start gap-3">
            <div className="dashboard-tone-danger flex size-11 shrink-0 items-center justify-center rounded-xl border">
              <Archive className="size-5" aria-hidden="true" />
            </div>
            <div>
              <DialogTitle className="mb-1">Archive dataset</DialogTitle>
              <DialogDescription>
                Remove this dataset from the marketplace
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Dataset Info */}
          <DashboardInlineAlert
            tone="neutral"
            icon={Database}
            title="Dataset to archive"
            message={datasetTitle}
          />

          {/* Warning */}
          <DashboardInlineAlert
            tone="danger"
            icon={AlertTriangle}
            title="What happens when you archive"
          >
            <ul className="space-y-1 text-xs">
              <li>• Dataset will be hidden from marketplace listings</li>
              <li>• Users will no longer be able to discover it</li>
              <li>• Existing downloads remain accessible to buyers</li>
              <li>• Contact support to restore it if needed</li>
            </ul>
          </DashboardInlineAlert>

          <p className="px-1 text-xs leading-5 text-muted-foreground">
            This action moves the dataset to archived status. It will not be
            deleted, but it will no longer be visible to users.
          </p>
        </div>

        <DialogFooter className="gap-3 sm:gap-3">
          <DashboardButton
            variant="outline"
            onClick={onClose}
            disabled={archiving}
          >
            Cancel
          </DashboardButton>
          <DashboardButton
            variant="destructive"
            onClick={handleConfirm}
            disabled={archiving}
          >
            {archiving ? (
              <>
                <Loader2 className="animate-spin" aria-hidden="true" />
                Archiving...
              </>
            ) : (
              <>
                <Archive aria-hidden="true" />
                Archive Dataset
              </>
            )}
          </DashboardButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
