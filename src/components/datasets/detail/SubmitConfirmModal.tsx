"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Send } from "lucide-react";
import type {
  ProposalDetailsResponse,
  DatasetPricingVersion,
} from "@/types/dataset-proposal.types";
import type { DatasetDetailTokens } from "./detailTokens";

interface SubmitConfirmModalProps {
  proposal: ProposalDetailsResponse;
  pricingData: DatasetPricingVersion | null;
  submitting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isDark: boolean;
  tokens: DatasetDetailTokens;
}

export function SubmitConfirmModal({
  proposal,
  pricingData,
  submitting,
  onConfirm,
  onCancel,
  isDark,
  tokens,
}: SubmitConfirmModalProps) {
  const pricingWillSubmit =
    pricingData &&
    ["DRAFT", "CHANGES_REQUESTED", "REJECTED"].includes(pricingData.status);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="submit-proposal-title"
    >
      <Card className="supplier-glass-card w-full max-w-md rounded-2xl border shadow-2xl">
        <div className="p-6">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="size-4" />
            </span>
            <h3
              id="submit-proposal-title"
              className="text-lg font-semibold text-foreground"
            >
              {proposal.verification.status === "PENDING"
                ? "Submit Proposal for Review?"
                : "Resubmit Proposal?"}
            </h3>
          </div>

          <div className="space-y-3 mb-6">
            <p className="text-sm leading-6 text-muted-foreground">
              {proposal.verification.status === "PENDING"
                ? "Once submitted, your proposal will be sent to the admin review queue. You can make edits if the admin requests changes."
                : "You are resubmitting your proposal after addressing the admin's feedback."}
            </p>

            <div className="space-y-2 rounded-xl border border-border/80 bg-muted/35 p-4">
              <p className="text-sm font-medium text-foreground">
                Your submission includes:
              </p>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li>
                  • Dataset Title:{" "}
                  <span
                    style={{ color: tokens.textPrimary }}
                    className="font-medium"
                  >
                    {proposal.dataset.title}
                  </span>
                </li>
                <li>
                  • File:{" "}
                  <span
                    style={{ color: tokens.textPrimary }}
                    className="font-medium"
                  >
                    {proposal.currentUpload?.originalFileName || "Uploaded"}
                  </span>
                </li>
                <li>
                  • Format:{" "}
                  <span
                    style={{ color: tokens.textPrimary }}
                    className="font-medium"
                  >
                    {proposal.dataFormatInfo?.fileFormat || "Defined"}
                  </span>
                </li>
                <li>
                  • Features:{" "}
                  <span
                    style={{ color: tokens.textPrimary }}
                    className="font-medium"
                  >
                    {proposal.features?.length || 0} column
                    {proposal.features?.length !== 1 ? "s" : ""}
                  </span>
                </li>
                {pricingData && (
                  <li>
                    • Pricing:{" "}
                    <span
                      style={{ color: tokens.textPrimary }}
                      className="font-medium"
                    >
                      {pricingData.isPaid
                        ? `${pricingData.price} ${pricingData.currency}`
                        : "Free"}
                    </span>
                  </li>
                )}
              </ul>
            </div>

            {pricingWillSubmit && (
              <div
                className="rounded-lg p-3 border-l-4"
                style={{
                  background: isDark
                    ? "rgba(34, 197, 94, 0.1)"
                    : "rgba(34, 197, 94, 0.08)",
                  borderColor: "#22c55e",
                }}
              >
                <p
                  className="text-xs font-semibold mb-1"
                  style={{ color: "#22c55e" }}
                >
                  ✓ Pricing will also be submitted
                </p>
                <p
                  className="text-xs leading-relaxed"
                  style={{ color: tokens.textMuted }}
                >
                  Your pricing will be submitted or resubmitted together with
                  this proposal for admin review.
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={submitting}
              className="h-10 flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              disabled={submitting}
              className="h-10 flex-1 gap-2"
            >
              <Send className="size-4" />
              {submitting ? "Submitting..." : "Confirm & Submit"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
