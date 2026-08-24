"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/datasets/shared/DatasetDialog";
import {
  DashboardButton,
  DashboardInlineAlert,
  DashboardProgress,
  DashboardStatusBadge,
} from "@/components/dashboard";
import { FILE_UPLOAD_CONSTRAINTS } from "@/constants/dataset.constants";
import { formatFileSize } from "@/utils/dataset.utils";
import {
  presignCurrentUpload,
  uploadFileToS3,
  completeCurrentUpload,
  presignSampleUpload,
  completeSampleUpload,
} from "@/lib/api";
import { Upload, FileText, CheckCircle, X } from "lucide-react";

interface DatasetUploadFlowProps {
  isOpen: boolean;
  onClose: () => void;
  datasetId: string;
  isDark?: boolean;
  isEditable: boolean;
  uploadKind?: "current" | "sample";
  onUploadComplete?: (fileInfo: { fileName: string; fileSize: string }) => void;
}

type UploadStep = "select" | "uploading" | "complete" | "error";

export function DatasetUploadFlow({
  isOpen,
  onClose,
  datasetId,
  isEditable,
  uploadKind = "current",
  onUploadComplete,
}: DatasetUploadFlowProps) {
  const [step, setStep] = useState<UploadStep>("select");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [uploadedFileInfo, setUploadedFileInfo] = useState<{
    fileName: string;
    fileSize: string;
  } | null>(null);

  const isSampleUpload = uploadKind === "sample";

  const validateFile = (file: File) => {
    if (file.size > FILE_UPLOAD_CONSTRAINTS.MAX_SIZE) {
      return `Choose a file smaller than ${formatFileSize(FILE_UPLOAD_CONSTRAINTS.MAX_SIZE)}.`;
    }

    const extension = `.${file.name.split(".").pop()?.toLowerCase() ?? ""}`;
    const extensionAllowed = FILE_UPLOAD_CONSTRAINTS.ALLOWED_EXTENSIONS.some(
      (allowedExtension) => allowedExtension === extension
    );

    if (!extensionAllowed) {
      return `Choose a ${FILE_UPLOAD_CONSTRAINTS.ALLOWED_EXTENSIONS.join(", ")} file.`;
    }

    return null;
  };

  const handleFileSelect = (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setSelectedFile(null);
      setErrorMessage(validationError);
      return;
    }

    setErrorMessage("");
    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    const validationError = validateFile(selectedFile);
    if (validationError) {
      setErrorMessage(validationError);
      setStep("select");
      return;
    }
    if (!isEditable) {
      setErrorMessage(
        "This proposal is no longer editable, so its files cannot be changed."
      );
      setStep("error");
      return;
    }

    setStep("uploading");
    setUploadProgress(0);

    try {
      // Step 1: Get presigned URL from backend
      const presignResponse = isSampleUpload
        ? await presignSampleUpload(datasetId, {
            originalFileName: selectedFile.name,
            contentType: selectedFile.type || "application/octet-stream",
          })
        : await presignCurrentUpload(datasetId, {
            originalFileName: selectedFile.name,
            contentType: selectedFile.type || "application/octet-stream",
          });

      // Step 2: Upload file directly to S3 with progress tracking
      await uploadFileToS3(presignResponse.putUrl, selectedFile, (progress) =>
        setUploadProgress(progress)
      );

      // Step 3: Notify backend that upload is complete
      if (isSampleUpload) {
        await completeSampleUpload(datasetId, {
          sizeBytes: selectedFile.size.toString(),
        });
      } else {
        await completeCurrentUpload(datasetId, {
          sizeBytes: selectedFile.size.toString(),
        });
      }

      // Success!
      const fileInfo = {
        fileName: selectedFile.name,
        fileSize: formatFileSize(selectedFile.size),
      };
      setUploadedFileInfo(fileInfo);
      setStep("complete");
      onUploadComplete?.(fileInfo);
    } catch (error: unknown) {
      console.error("Upload failed:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to upload file. Please try again."
      );
      setStep("error");
    }
  };

  const handleClose = () => {
    if (step === "uploading") return;
    setStep("select");
    setSelectedFile(null);
    setUploadProgress(0);
    setErrorMessage("");
    setUploadedFileInfo(null);
    onClose();
  };

  const handleRetry = () => {
    setStep("select");
    setSelectedFile(null);
    setErrorMessage("");
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && step !== "uploading" && handleClose()}
    >
      <DialogContent
        className="max-w-[600px]"
        showCloseButton={step !== "uploading"}
        onEscapeKeyDown={(event) => {
          if (step === "uploading") event.preventDefault();
        }}
        onPointerDownOutside={(event) => {
          if (step === "uploading") event.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>
            {step === "select" &&
              (isSampleUpload ? "Upload sample file" : "Upload dataset file")}
            {step === "uploading" && "Uploading file"}
            {step === "complete" && "Upload complete"}
            {step === "error" && "Upload failed"}
          </DialogTitle>
          <DialogDescription>
            {isSampleUpload
              ? "Add the sample buyers can inspect before purchase."
              : "Add the dataset file that Kuinbee should review."}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-5">
          {step === "select" && (
            <div className="space-y-5">
              {!selectedFile ? (
                <label
                  htmlFor="file-upload"
                  className="dashboard-glass-control block cursor-pointer rounded-xl border-2 border-dashed p-8 text-center outline-none transition-colors hover:bg-[var(--dashboard-control-background-hover)] focus-within:ring-2 focus-within:ring-[var(--dashboard-focus-ring)] sm:p-10"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                >
                  <span className="dashboard-tone-neutral mx-auto mb-4 flex size-12 items-center justify-center rounded-xl border">
                    <Upload className="size-6" aria-hidden="true" />
                  </span>
                  <span className="block text-sm font-medium text-foreground">
                    Drop your file here or browse
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    CSV, JSON, Parquet, XLSX, or ZIP up to 500 MB.
                  </span>
                  <input
                    id="file-upload"
                    type="file"
                    className="sr-only"
                    accept={FILE_UPLOAD_CONSTRAINTS.ALLOWED_EXTENSIONS.join(
                      ","
                    )}
                    onChange={handleFileInputChange}
                  />
                </label>
              ) : (
                <div className="flex items-start gap-4 rounded-xl border border-border bg-muted/35 p-4">
                  <span className="dashboard-tone-neutral flex size-10 shrink-0 items-center justify-center rounded-lg border">
                    <FileText className="size-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {selectedFile.name}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                  <DashboardButton
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label="Remove selected file"
                    onClick={() => setSelectedFile(null)}
                  >
                    <X aria-hidden="true" />
                  </DashboardButton>
                </div>
              )}

              {errorMessage ? (
                <DashboardInlineAlert
                  tone="danger"
                  title="Choose another file"
                  message={errorMessage}
                />
              ) : null}

              <DashboardInlineAlert
                tone="info"
                title="Before you upload"
                message="Confirm that this is the correct version and that it contains no credentials or unrelated personal files."
              />

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <DashboardButton variant="outline" onClick={handleClose}>
                  Cancel
                </DashboardButton>
                <DashboardButton
                  onClick={handleUpload}
                  disabled={!selectedFile || !isEditable}
                >
                  <Upload aria-hidden="true" />
                  Upload file
                </DashboardButton>
              </div>
            </div>
          )}

          {step === "uploading" && (
            <div className="space-y-6 py-6">
              <div className="text-center">
                <span className="dashboard-tone-info mx-auto mb-4 flex size-14 items-center justify-center rounded-xl border">
                  <Upload
                    className="size-7 animate-pulse motion-reduce:animate-none"
                    aria-hidden="true"
                  />
                </span>
                <p className="truncate text-sm font-medium text-foreground">
                  Uploading {selectedFile?.name}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Keep this dialog open until the upload finishes.
                </p>
              </div>
              <DashboardProgress
                label="Upload progress"
                value={uploadProgress}
              />
            </div>
          )}

          {step === "complete" && (
            <div className="space-y-5 py-4">
              <div className="text-center">
                <span className="dashboard-tone-success mx-auto mb-4 flex size-14 items-center justify-center rounded-xl border">
                  <CheckCircle className="size-7" aria-hidden="true" />
                </span>
                <p className="text-sm font-medium text-foreground">
                  {isSampleUpload
                    ? "Sample file uploaded"
                    : "Dataset file uploaded"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {isSampleUpload
                    ? "You can replace this sample before the proposal is reviewed."
                    : "Kuinbee can now process and review this file."}
                </p>
              </div>
              {uploadedFileInfo && (
                <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/35 p-4">
                  <FileText
                    className="size-5 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {uploadedFileInfo.fileName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {uploadedFileInfo.fileSize}
                    </p>
                  </div>
                  <DashboardStatusBadge tone="success" className="ml-auto">
                    Uploaded
                  </DashboardStatusBadge>
                </div>
              )}
              <div className="flex justify-end">
                <DashboardButton onClick={handleClose}>Done</DashboardButton>
              </div>
            </div>
          )}

          {step === "error" && (
            <div className="space-y-5 py-4">
              <DashboardInlineAlert
                tone="danger"
                title="The file could not be uploaded"
                message={errorMessage}
              />
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <DashboardButton variant="outline" onClick={handleClose}>
                  Cancel
                </DashboardButton>
                <DashboardButton onClick={handleRetry}>
                  Try again
                </DashboardButton>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
