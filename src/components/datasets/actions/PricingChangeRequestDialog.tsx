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
import { DashboardInput } from "@/components/dashboard";
import { DashboardTextarea } from "@/components/dashboard";
import { Label } from "@/components/ui/label";
import { DatasetSelect } from "@/components/datasets/shared/DatasetSelect";
import { AlertCircle, Loader2, FileText } from "lucide-react";
import { requestPricingChange } from "@/lib/api/datasets";
import { toast } from "sonner";
import { getDatasetThemeTokens } from "@/constants/dataset.constants";
import type { Currency } from "@/types/dataset-proposal.types";
import { toDatasetUiError } from "../shared/datasetUiError";

interface PricingChangeRequestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  datasetId: string;
  datasetTitle: string;
  currentIsPaid: boolean;
  currentPrice?: string | null;
  currentCurrency?: Currency;
  onSuccess: () => void;
  isDark?: boolean;
}

export function PricingChangeRequestDialog({
  isOpen,
  onClose,
  datasetId,
  currentIsPaid,
  currentPrice,
  currentCurrency = "USD",
  onSuccess,
  isDark = false,
}: PricingChangeRequestDialogProps) {
  const [requestedIsPaid, setRequestedIsPaid] = useState(currentIsPaid);
  const [requestedPrice, setRequestedPrice] = useState(currentPrice || "");
  const [requestedCurrency, setRequestedCurrency] =
    useState<Currency>(currentCurrency);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const tokens = getDatasetThemeTokens(isDark);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast.error("Reason is required", {
        description: "Please provide a reason for this pricing change.",
      });
      return;
    }

    if (requestedIsPaid && !requestedPrice) {
      toast.error("Price is required", {
        description: "Please enter the requested price.",
      });
      return;
    }

    setSubmitting(true);
    try {
      await requestPricingChange(datasetId, {
        requestedIsPaid,
        requestedPrice: requestedIsPaid ? requestedPrice : null,
        requestedCurrency: requestedIsPaid ? requestedCurrency : undefined,
        reason: reason.trim(),
      });

      toast.success("Pricing change request submitted", {
        description:
          "Support team will review your request and contact you soon.",
      });

      onClose();
      onSuccess();
    } catch (error: unknown) {
      console.error("Failed to submit pricing change request:", error);
      const apiError = toDatasetUiError(error);
      toast.error("Failed to submit request", {
        description: apiError.message || "Please try again later.",
        duration: 6000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && !submitting && onClose()}
    >
      <DialogContent
        className="max-w-md max-h-[90vh] overflow-y-auto border backdrop-blur-sm rounded-lg"
        showCloseButton={!submitting}
        onEscapeKeyDown={(event) => submitting && event.preventDefault()}
        onPointerDownOutside={(event) => submitting && event.preventDefault()}
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
              style={{ background: tokens.infoBg }}
            >
              <FileText
                className="w-6 h-6"
                style={{ color: "var(--dashboard-info-foreground)" }}
              />
            </div>
            <div>
              <DialogTitle
                className="text-lg mb-1"
                style={{ color: tokens.textPrimary }}
              >
                Request Pricing Change
              </DialogTitle>
              <DialogDescription style={{ color: tokens.textSecondary }}>
                Submit a request to modify pricing
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Important Notice */}
          <div
            className="rounded-xl p-4 flex items-start gap-3"
            style={{
              background: tokens.warningBg,
              border: `1px solid ${tokens.warningBorder}`,
            }}
          >
            <AlertCircle
              className="w-4 h-4 flex-shrink-0 mt-0.5"
              style={{ color: "var(--dashboard-warning-foreground)" }}
            />
            <p className="text-xs" style={{ color: tokens.textPrimary }}>
              Pricing changes require approval and cannot be applied
              immediately. Support will contact you via email.
            </p>
          </div>

          {/* Current Pricing */}
          <div className="rounded-xl p-4" style={{ background: tokens.infoBg }}>
            <Label className="text-xs" style={{ color: tokens.textMuted }}>
              Current Pricing
            </Label>
            <p
              className="text-sm font-medium mt-1"
              style={{ color: tokens.textPrimary }}
            >
              {currentIsPaid ? `${currentPrice} ${currentCurrency}` : "Free"}
            </p>
          </div>

          {/* Requested Pricing Type */}
          <div>
            <Label
              htmlFor="requested-pricing-type"
              className="mb-2.5 block text-sm"
              style={{ color: tokens.textPrimary }}
            >
              New Pricing Type
            </Label>
            <DatasetSelect
              triggerId="requested-pricing-type"
              options={[
                { label: "Free", value: "free" },
                { label: "Paid", value: "paid" },
              ]}
              value={requestedIsPaid ? "paid" : "free"}
              onValueChange={(value) => setRequestedIsPaid(value === "paid")}
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

          {/* Price & Currency (if paid) */}
          {requestedIsPaid && (
            <>
              <div>
                <Label
                  htmlFor="price"
                  className="mb-2.5 block text-sm"
                  style={{ color: tokens.textPrimary }}
                >
                  Requested Price
                </Label>
                <DashboardInput
                  id="price"
                  type="text"
                  placeholder="99.99"
                  value={requestedPrice}
                  onChange={(e) => setRequestedPrice(e.target.value)}
                  style={{
                    background: tokens.inputBg,
                    borderColor: tokens.inputBorder,
                    color: tokens.textPrimary,
                  }}
                />
              </div>

              <div>
                <Label
                  htmlFor="requested-pricing-currency"
                  className="mb-2.5 block text-sm"
                  style={{ color: tokens.textPrimary }}
                >
                  Currency
                </Label>
                <DatasetSelect
                  triggerId="requested-pricing-currency"
                  options={[
                    { label: "INR (₹)", value: "INR" },
                    { label: "USD ($)", value: "USD" },
                    { label: "EUR (€)", value: "EUR" },
                    { label: "GBP (£)", value: "GBP" },
                  ]}
                  value={requestedCurrency}
                  onValueChange={(value) =>
                    setRequestedCurrency(value as Currency)
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
            </>
          )}

          {/* Reason */}
          <div>
            <Label
              htmlFor="reason"
              className="mb-2.5 block text-sm"
              style={{ color: tokens.textPrimary }}
            >
              Reason for Change{" "}
              <span style={{ color: tokens.errorText }}>*</span>
            </Label>
            <DashboardTextarea
              id="reason"
              placeholder="Explain why you need to change the pricing..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              required
              style={{
                background: tokens.inputBg,
                borderColor: tokens.inputBorder,
                color: tokens.textPrimary,
              }}
            />
            <p className="text-xs mt-1.5" style={{ color: tokens.textMuted }}>
              Be specific about your business needs and market conditions.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-3 sm:gap-3">
          <DashboardButton
            variant="outline"
            onClick={onClose}
            disabled={submitting}
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
            onClick={handleSubmit}
            disabled={submitting || !reason.trim()}
            className="gap-2"
            style={{
              background:
                submitting || !reason.trim()
                  ? tokens.textMuted
                  : "var(--dashboard-button-primary-background)",
            }}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                Submit Request
              </>
            )}
          </DashboardButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
