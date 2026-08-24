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
import { AlertCircle, Upload, CheckCircle, Loader2 } from "lucide-react";
import { publishDataset } from "@/lib/api/datasets";
import { toast } from "sonner";
import { toDatasetUiError } from "../shared/datasetUiError";

interface PublishConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  datasetId: string;
  datasetTitle: string;
  uploadFileName?: string | null;
  onSuccess: () => void;
  isDark?: boolean;
}

export function PublishConfirmDialog({
  isOpen,
  onClose,
  datasetId,
  datasetTitle,
  uploadFileName,
  onSuccess,
}: PublishConfirmDialogProps) {
  const [publishing, setPublishing] = useState(false);

  const handleConfirm = async () => {
    setPublishing(true);
    try {
      await publishDataset(datasetId);

      toast.success("Dataset published successfully", {
        description: "Your dataset is now live on the marketplace.",
      });

      onClose();
      onSuccess();
    } catch (error: unknown) {
      const apiError = toDatasetUiError(error);
      const errorMessages: Record<string, string> = {
        INVALID_STATE: "Dataset is not in VERIFIED state.",
        NOT_VERIFIED: "Dataset verification is not complete.",
        NO_UPLOAD: "No verified upload available to publish.",
        UPLOAD_NOT_READY: "Upload is not ready for publishing.",
        NOT_FOUND: "Dataset not found.",
        FORBIDDEN: "You do not have permission to publish this dataset.",
        OFFLINE_CONTRACT_REQUIRED:
          "Offline contracting is required before publishing. Please contact support to complete your offline contract.",
        OFFLINE_CONTRACT_NOT_DONE:
          "Offline contracting is required before publishing. Please contact support to complete your offline contract.",
        HTTP_403:
          "Offline contracting is required before publishing. Please contact support to complete your offline contract.",
      };

      // Get error code - prefer the code from the error object
      const errorCode =
        apiError.code || (apiError.status === 403 ? "HTTP_403" : "");
      const message =
        errorMessages[errorCode] ||
        apiError.message ||
        "Failed to publish dataset";

      toast.error("Failed to publish dataset", {
        description: message,
        duration: 6000,
      });
    } finally {
      setPublishing(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && !publishing && onClose()}
    >
      <DialogContent
        className="max-w-md"
        showCloseButton={!publishing}
        onEscapeKeyDown={(event) => publishing && event.preventDefault()}
        onPointerDownOutside={(event) => publishing && event.preventDefault()}
      >
        <DialogHeader>
          <div className="mb-4 flex items-start gap-3">
            <div className="dashboard-tone-info flex size-11 shrink-0 items-center justify-center rounded-xl border">
              <Upload className="size-5" aria-hidden="true" />
            </div>
            <div>
              <DialogTitle className="mb-1">Publish dataset</DialogTitle>
              <DialogDescription>
                Make your dataset available on the marketplace
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Dataset Info */}
          <DashboardInlineAlert
            tone="info"
            title="Dataset to publish"
            message={
              <div>
                <p className="font-medium">{datasetTitle}</p>
                {uploadFileName ? (
                  <p className="mt-1 text-xs opacity-80">
                    File: {uploadFileName}
                  </p>
                ) : null}
              </div>
            }
          />

          {/* Important Notice */}
          <DashboardInlineAlert
            tone="warning"
            icon={AlertCircle}
            title="Important"
          >
            <ul className="space-y-1 text-xs">
              <li>• Pricing cannot be changed directly after publishing</li>
              <li>• You can still change visibility settings</li>
              <li>• Contact support for pricing modifications</li>
            </ul>
          </DashboardInlineAlert>

          {/* Success Info */}
          <DashboardInlineAlert
            tone="success"
            icon={CheckCircle}
            title="After publishing"
          >
            <ul className="space-y-1 text-xs">
              <li>• Dataset will be visible on the marketplace</li>
              <li>• Users can discover and access your data</li>
              <li>• You will receive download notifications</li>
            </ul>
          </DashboardInlineAlert>
        </div>

        <DialogFooter className="gap-3 sm:gap-3">
          <DashboardButton
            variant="outline"
            onClick={onClose}
            disabled={publishing}
          >
            Cancel
          </DashboardButton>
          <DashboardButton onClick={handleConfirm} disabled={publishing}>
            {publishing ? (
              <>
                <Loader2 className="animate-spin" aria-hidden="true" />
                Publishing...
              </>
            ) : (
              <>
                <Upload aria-hidden="true" />
                Publish Dataset
              </>
            )}
          </DashboardButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
