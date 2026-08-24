"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/datasets/shared/DatasetDialog";
import { DashboardButton } from "@/components/dashboard";
import { DatasetSelect } from "@/components/datasets/shared/DatasetSelect";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Lock, Loader2, Info } from "lucide-react";
import { changeDatasetVisibility } from "@/lib/api/datasets";
import { toast } from "sonner";
import { getDatasetThemeTokens } from "@/constants/dataset.constants";
import type { DatasetVisibility } from "@/types/dataset-proposal.types";

interface ChangeVisibilityDialogProps {
  isOpen: boolean;
  onClose: () => void;
  datasetId: string;
  currentVisibility: DatasetVisibility;
  onSuccess: () => void;
  isDark?: boolean;
}

const VISIBILITY_OPTIONS = [
  {
    value: "PUBLIC" as const,
    label: "Public",
    description: "Visible to all users on the marketplace",
    icon: Eye,
    color: "var(--dashboard-success-foreground)",
  },
  {
    value: "PRIVATE" as const,
    label: "Private",
    description: "Only visible to users you specifically grant access",
    icon: Lock,
    color: "var(--dashboard-danger-foreground)",
  },
  {
    value: "UNLISTED" as const,
    label: "Unlisted",
    description: "Not shown in marketplace, accessible via direct link only",
    icon: EyeOff,
    color: "var(--dashboard-warning-foreground)",
  },
];

export function ChangeVisibilityDialog({
  isOpen,
  onClose,
  datasetId,
  currentVisibility,
  onSuccess,
  isDark = false,
}: ChangeVisibilityDialogProps) {
  const [visibility, setVisibility] =
    useState<DatasetVisibility>(currentVisibility);
  const [saving, setSaving] = useState(false);
  const tokens = getDatasetThemeTokens(isDark);

  // Discard an unsubmitted selection when the dialog closes. Without this,
  // cancelling and reopening could show (and subsequently save) a visibility
  // value that was never applied to the dataset.
  useEffect(() => {
    if (isOpen) {
      setVisibility(currentVisibility);
    }
  }, [currentVisibility, isOpen]);

  const handleSave = async () => {
    if (visibility === currentVisibility) {
      onClose();
      return;
    }

    setSaving(true);
    try {
      await changeDatasetVisibility(datasetId, { visibility });

      toast.success("Visibility changed successfully", {
        description: `Dataset is now ${visibility.toLowerCase()}.`,
      });

      onClose();
      onSuccess();
    } catch (error: unknown) {
      console.error("Failed to change visibility:", error);
      toast.error("Failed to change visibility", {
        description:
          error instanceof Error ? error.message : "Please try again later.",
        duration: 6000,
      });
    } finally {
      setSaving(false);
    }
  };

  const selectedOption = VISIBILITY_OPTIONS.find(
    (opt) => opt.value === visibility
  );
  const Icon = selectedOption?.icon || Eye;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && !saving && onClose()}
    >
      <DialogContent
        className="max-w-md border backdrop-blur-sm rounded-lg"
        showCloseButton={!saving}
        onEscapeKeyDown={(event) => saving && event.preventDefault()}
        onPointerDownOutside={(event) => saving && event.preventDefault()}
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
              style={{
                background: `color-mix(in srgb, ${selectedOption?.color || "var(--dashboard-info-foreground)"} 10%, transparent)`,
              }}
            >
              <Icon
                className="w-6 h-6"
                style={{
                  color:
                    selectedOption?.color || "var(--dashboard-info-foreground)",
                }}
              />
            </div>
            <div>
              <DialogTitle
                className="text-lg mb-1"
                style={{ color: tokens.textPrimary }}
              >
                Change Visibility
              </DialogTitle>
              <DialogDescription style={{ color: tokens.textSecondary }}>
                Control who can discover your dataset
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div>
            <Label
              htmlFor="dataset-visibility"
              className="mb-3 block text-sm font-medium"
              style={{ color: tokens.textPrimary }}
            >
              Visibility Setting
            </Label>
            <DatasetSelect
              triggerId="dataset-visibility"
              options={VISIBILITY_OPTIONS.map((option) => ({
                label: option.label,
                value: option.value,
              }))}
              value={visibility}
              onValueChange={(value) =>
                setVisibility(value as DatasetVisibility)
              }
              isDark={tokens.isDark}
              tokens={{
                inputBg: tokens.inputBg,
                inputBorder: tokens.inputBorder,
                textPrimary: tokens.textPrimary,
                textSecondary: tokens.textSecondary,
                textMuted: tokens.textMuted,
                surfaceCard: tokens.glassBg,
                borderDefault: tokens.borderDefault,
              }}
            />
          </div>

          {/* Selected Option Description */}
          {selectedOption && (
            <div
              className="rounded-xl p-4 flex items-start gap-3"
              style={{
                background: `${selectedOption.color}10`,
                border: `1px solid ${selectedOption.color}30`,
              }}
            >
              <Info
                className="w-4 h-4 flex-shrink-0 mt-0.5"
                style={{ color: selectedOption.color }}
              />
              <div className="text-sm" style={{ color: tokens.textPrimary }}>
                <span className="font-medium">{selectedOption.label}:</span>{" "}
                <span style={{ color: tokens.textSecondary }}>
                  {selectedOption.description}
                </span>
              </div>
            </div>
          )}

          {/* Change indicator */}
          {visibility !== currentVisibility && (
            <div
              className="pt-3 border-t text-xs flex items-center gap-2"
              style={{
                borderColor: tokens.borderSubtle,
                color: tokens.textMuted,
              }}
            >
              <span>Change:</span>
              <span
                className="px-2 py-0.5 rounded"
                style={{ background: tokens.errorBg, color: tokens.errorText }}
              >
                {currentVisibility}
              </span>
              <span>→</span>
              <span
                className="px-2 py-0.5 rounded"
                style={{
                  background: tokens.successBg,
                  color: tokens.successText,
                }}
              >
                {visibility}
              </span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-3 pt-2">
          <DashboardButton
            variant="outline"
            onClick={onClose}
            disabled={saving}
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
            onClick={handleSave}
            disabled={saving || visibility === currentVisibility}
            className="gap-2"
            style={{
              background:
                saving || visibility === currentVisibility
                  ? tokens.textMuted
                  : "var(--dashboard-button-primary-background)",
            }}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </DashboardButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
