"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/datasets/shared/DatasetDialog";
import {
  DashboardButton,
  DashboardCheckbox,
  DashboardInlineAlert,
  DashboardInput,
  DashboardStatusBadge,
} from "@/components/dashboard";
import { Label } from "@/components/ui/label";
import { DatasetSelect } from "@/components/datasets/shared/DatasetSelect";
import {
  DollarSign,
  Loader2,
  Euro,
  PoundSterling,
  IndianRupee,
} from "lucide-react";
import {
  submitDatasetPricing,
  submitProposalPricing,
  upsertDatasetPricing,
  upsertProposalPricing,
} from "@/lib/api";
import { toast } from "sonner";
import type {
  Currency,
  DatasetPricingVersion,
  UpsertPricingRequest,
  DatasetPricingStatus,
} from "@/types/dataset-proposal.types";
import { toDatasetUiError } from "../shared/datasetUiError";

interface PricingEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  datasetId: string;
  currentPricing: DatasetPricingVersion | null;
  onSuccess: () => void;
  isDark?: boolean;
  feedbackMessage?: string;
  pricingStatus?: DatasetPricingStatus;
  mode?: "proposal" | "dataset";
}

const CURRENCY_OPTIONS = [
  { value: "USD", label: "USD ($)" },
  { value: "INR", label: "INR (₹)" },
  { value: "EUR", label: "EUR (€)" },
  { value: "GBP", label: "GBP (£)" },
] satisfies ReadonlyArray<{ value: Currency; label: string }>;

const isCurrency = (value: string): value is Currency =>
  CURRENCY_OPTIONS.some((option) => option.value === value);

const PRICING_STATUS_PRESENTATION: Record<
  DatasetPricingStatus,
  {
    label: string;
    tone: "neutral" | "info" | "success" | "warning" | "danger";
  }
> = {
  DRAFT: { label: "Draft", tone: "neutral" },
  SUBMITTED: { label: "Submitted for review", tone: "info" },
  CHANGES_REQUESTED: { label: "Changes requested", tone: "warning" },
  RESUBMITTED: { label: "Resubmitted", tone: "info" },
  UNDER_REVIEW: { label: "Under review", tone: "info" },
  ACTIVE: { label: "Active", tone: "success" },
  REJECTED: { label: "Rejected", tone: "danger" },
  INACTIVE: { label: "Inactive", tone: "neutral" },
};

const getCurrencyIcon = (currency: Currency) => {
  switch (currency) {
    case "INR":
      return <IndianRupee className="w-4 h-4" />;
    case "EUR":
      return <Euro className="w-4 h-4" />;
    case "GBP":
      return <PoundSterling className="w-4 h-4" />;
    case "USD":
    default:
      return <DollarSign className="w-4 h-4" />;
  }
};

const getCurrencySymbol = (currency: Currency) => {
  switch (currency) {
    case "USD":
      return "$";
    case "EUR":
      return "€";
    case "GBP":
      return "£";
    case "INR":
      return "₹";
    default:
      return "$";
  }
};

export function PricingEditDialog({
  isOpen,
  onClose,
  datasetId,
  currentPricing,
  onSuccess,
  feedbackMessage,
  pricingStatus,
  mode = "proposal",
}: PricingEditDialogProps) {
  const [isPaid, setIsPaid] = useState(currentPricing?.isPaid ?? false);
  const [price, setPrice] = useState(currentPricing?.price ?? "");
  const [currency, setCurrency] = useState<Currency>(
    currentPricing?.currency ?? "USD"
  );
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);

  const upsertPricing = async (payload: UpsertPricingRequest) => {
    if (mode === "dataset") {
      await upsertDatasetPricing(datasetId, payload);
      return;
    }
    await upsertProposalPricing(datasetId, payload);
  };

  const submitPricing = async () => {
    if (mode === "dataset") {
      await submitDatasetPricing(datasetId);
      return;
    }
    await submitProposalPricing(datasetId);
  };

  useEffect(() => {
    if (currentPricing) {
      setIsPaid(currentPricing.isPaid);
      setPrice(currentPricing.price ?? "");
      setCurrency(currentPricing.currency);
    }
  }, [currentPricing]);

  const handleSaveAndSubmit = async () => {
    if (!isPaid && !price) {
      // Free dataset - no price needed
      setSubmitting(true);
      try {
        // Save first
        await upsertPricing({ isPaid: false, price: null, currency });

        // Then submit
        await submitPricing();

        toast.success("Pricing submitted successfully", {
          description: "Admin will review your pricing now.",
        });

        onClose();
        onSuccess();
      } catch (error: unknown) {
        console.error("Failed to submit pricing:", error);
        const apiError = toDatasetUiError(error);
        toast.error("Failed to submit pricing", {
          description: apiError.message || "Please try again later.",
        });
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (isPaid && !price) {
      toast.error("Price is required", {
        description: "Please enter a price for paid datasets.",
      });
      return;
    }

    setSubmitting(true);
    try {
      // Save first
      await upsertPricing({
        isPaid,
        price: isPaid ? price : null,
        currency,
      });

      // Then submit
      await submitPricing();

      toast.success("Pricing submitted successfully", {
        description: "Admin will review your pricing now.",
      });

      onClose();
      onSuccess();
    } catch (error: unknown) {
      console.error("Failed to submit pricing:", error);
      const apiError = toDatasetUiError(error);
      toast.error("Failed to submit pricing", {
        description: apiError.message || "Please try again later.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    if (isPaid && !price) {
      toast.error("Price is required", {
        description: "Please enter a price for paid datasets.",
      });
      return;
    }

    setSaving(true);
    try {
      await upsertPricing({
        isPaid,
        price: isPaid ? price : null,
        currency,
      });

      toast.success("Pricing saved", {
        description: "Your changes are saved as draft.",
      });

      onClose();
      onSuccess();
    } catch (error: unknown) {
      console.error("Failed to save pricing:", error);
      const apiError = toDatasetUiError(error);
      toast.error("Failed to save pricing", {
        description: apiError.message || "Please try again later.",
      });
    } finally {
      setSaving(false);
    }
  };

  const isChangesRequested = pricingStatus === "CHANGES_REQUESTED";
  const isResubmitting = isChangesRequested;
  const pricingBusy = submitting || saving;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && !pricingBusy && onClose()}
    >
      <DialogContent
        className="max-w-md"
        showCloseButton={!pricingBusy}
        onEscapeKeyDown={(event) => pricingBusy && event.preventDefault()}
        onPointerDownOutside={(event) => pricingBusy && event.preventDefault()}
      >
        <DialogHeader>
          <div className="mb-2 flex items-start gap-3">
            <div className="dashboard-tone-info flex size-10 shrink-0 items-center justify-center rounded-lg border">
              <DollarSign className="size-5" aria-hidden="true" />
            </div>
            <div>
              <DialogTitle>Edit pricing</DialogTitle>
              <DialogDescription>Update your dataset pricing</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Feedback Message */}
          {feedbackMessage && isChangesRequested && (
            <DashboardInlineAlert
              tone="warning"
              title="Admin feedback"
              message={feedbackMessage}
            />
          )}

          {/* Current Status */}
          {currentPricing && pricingStatus && (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/35 px-3 py-2.5">
              <p className="text-xs font-medium text-muted-foreground">
                Pricing status
              </p>
              <DashboardStatusBadge
                status={pricingStatus}
                tone={PRICING_STATUS_PRESENTATION[pricingStatus].tone}
              >
                {PRICING_STATUS_PRESENTATION[pricingStatus].label}
              </DashboardStatusBadge>
            </div>
          )}

          {/* Paid Toggle */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <DashboardCheckbox
                id="pricing-is-paid"
                checked={isPaid}
                onCheckedChange={(checked) => setIsPaid(checked === true)}
                disabled={submitting || saving}
              />
              <Label
                htmlFor="pricing-is-paid"
                className="cursor-pointer font-medium text-foreground"
              >
                This dataset is paid
              </Label>
            </div>

            {isPaid && (
              <div className="space-y-3 border-t border-border pt-3">
                {/* Price Input */}
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-foreground">
                    Price
                    <span
                      className="ml-1 text-[var(--dashboard-danger-foreground)]"
                      aria-hidden="true"
                    >
                      *
                    </span>
                    <span className="sr-only"> (required)</span>
                  </Label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground">
                      {getCurrencyIcon(currency)}
                    </div>
                    <DashboardInput
                      id="price"
                      type="text"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="99.99"
                      disabled={submitting || saving}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Currency Select */}
                <div className="space-y-2">
                  <Label htmlFor="pricing-currency" className="text-foreground">
                    Currency
                  </Label>
                  <DatasetSelect
                    value={currency}
                    onValueChange={(value) => {
                      if (isCurrency(value)) setCurrency(value);
                    }}
                    options={CURRENCY_OPTIONS}
                    placeholder="Select currency"
                    triggerId="pricing-currency"
                  />
                </div>

                {/* Price Preview */}
                {price && (
                  <div className="dashboard-tone-success rounded-lg border p-3">
                    <p className="text-xs opacity-80">Preview</p>
                    <p className="mt-1 text-lg font-bold">
                      {getCurrencySymbol(currency)}
                      {price}
                    </p>
                  </div>
                )}
              </div>
            )}

            {!isPaid && (
              <DashboardInlineAlert
                tone="success"
                title="Free dataset"
                message="No payment is required for access."
              />
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <DashboardButton
            variant="outline"
            onClick={onClose}
            disabled={submitting || saving}
          >
            Cancel
          </DashboardButton>
          <DashboardButton
            variant="secondary"
            onClick={handleSaveDraft}
            disabled={submitting || saving}
          >
            {saving ? (
              <>
                <Loader2 className="animate-spin" aria-hidden="true" />
                Saving...
              </>
            ) : (
              "Save Draft"
            )}
          </DashboardButton>
          <DashboardButton
            onClick={handleSaveAndSubmit}
            disabled={submitting || saving}
          >
            {submitting ? (
              <>
                <Loader2 className="animate-spin" aria-hidden="true" />
                Submitting...
              </>
            ) : isResubmitting ? (
              "Resubmit"
            ) : (
              "Submit for Review"
            )}
          </DashboardButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
