"use client";

import { DashboardButton, DashboardInlineAlert } from "@/components/dashboard";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/datasets/shared/DatasetDialog";
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
}: SubmitConfirmModalProps) {
  const pricingWillSubmit =
    pricingData &&
    ["DRAFT", "CHANGES_REQUESTED", "REJECTED"].includes(pricingData.status);

  return (
    <Dialog open onOpenChange={(open) => !open && !submitting && onCancel()}>
      <DialogContent
        className="max-w-md"
        showCloseButton={!submitting}
        onEscapeKeyDown={(event) => submitting && event.preventDefault()}
        onPointerDownOutside={(event) => submitting && event.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-start gap-3">
            <span className="dashboard-tone-warning flex size-9 shrink-0 items-center justify-center rounded-lg border">
              <AlertTriangle className="size-4" aria-hidden="true" />
            </span>
            <div>
              <DialogTitle>
                {proposal.verification.status === "PENDING"
                  ? "Submit proposal for review?"
                  : "Resubmit proposal?"}
              </DialogTitle>
              <DialogDescription>
                Confirm the information that will enter Kuinbee&apos;s review
                queue.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-5 space-y-3">
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
                <span className="font-medium text-foreground">
                  {proposal.dataset.title}
                </span>
              </li>
              <li>
                • File:{" "}
                <span className="font-medium text-foreground">
                  {proposal.currentUpload?.originalFileName || "Uploaded"}
                </span>
              </li>
              <li>
                • Format:{" "}
                <span className="font-medium text-foreground">
                  {proposal.dataFormatInfo?.fileFormat || "Defined"}
                </span>
              </li>
              <li>
                • Features:{" "}
                <span className="font-medium text-foreground">
                  {proposal.features?.length || 0} column
                  {proposal.features?.length !== 1 ? "s" : ""}
                </span>
              </li>
              {pricingData && (
                <li>
                  • Pricing:{" "}
                  <span className="font-medium text-foreground">
                    {pricingData.isPaid
                      ? `${pricingData.price} ${pricingData.currency}`
                      : "Free"}
                  </span>
                </li>
              )}
            </ul>
          </div>

          {pricingWillSubmit && (
            <DashboardInlineAlert
              tone="success"
              title="Pricing will also be submitted"
              message="The saved pricing will enter review together with this proposal."
            />
          )}
        </div>

        <DialogFooter>
          <DashboardButton
            variant="outline"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </DashboardButton>
          <DashboardButton onClick={onConfirm} disabled={submitting}>
            <Send className="size-4" />
            {submitting ? "Submitting..." : "Confirm & Submit"}
          </DashboardButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
