"use client";

import {
  DashboardButton,
  DashboardCard,
  DashboardInlineAlert,
  DashboardStatusBadge,
  type DashboardTone,
} from "@/components/dashboard";
import { DollarSign } from "lucide-react";
import { PRICING_STATUS_CONFIG } from "@/constants/dataset.constants";
import type { DatasetDetailTokens } from "./detailTokens";
import type {
  DatasetPricingStatus,
  DatasetPricingVersion,
} from "@/types/dataset-proposal.types";

const PRICING_STATUS_TONES: Record<DatasetPricingStatus, DashboardTone> = {
  DRAFT: "neutral",
  SUBMITTED: "info",
  CHANGES_REQUESTED: "warning",
  RESUBMITTED: "info",
  UNDER_REVIEW: "warning",
  ACTIVE: "success",
  REJECTED: "danger",
  INACTIVE: "neutral",
};

const PRICING_STATUS_MESSAGES: Record<DatasetPricingStatus, string> = {
  DRAFT: "Your pricing is saved as a draft. Review and submit it when ready.",
  SUBMITTED: "Your pricing is submitted and awaiting admin review.",
  CHANGES_REQUESTED:
    "Admin requested pricing changes. Update the details and resubmit.",
  RESUBMITTED: "Your updated pricing is awaiting admin review.",
  UNDER_REVIEW: "Your pricing is currently being reviewed by an admin.",
  ACTIVE: "Your pricing is active and visible with the dataset.",
  REJECTED: "Your pricing was rejected. Edit it before resubmitting.",
  INACTIVE: "Your pricing is currently inactive.",
};

interface PricingSectionProps {
  pricingData: DatasetPricingVersion;
  isSampleProposal: boolean;
  onEditPricing: () => void;
  isDark: boolean;
  tokens: DatasetDetailTokens;
}

export function PricingSection({
  pricingData,
  isSampleProposal,
  onEditPricing,
}: PricingSectionProps) {
  const statusConfig = PRICING_STATUS_CONFIG[pricingData.status];
  const statusTone = PRICING_STATUS_TONES[pricingData.status];
  const currencySymbol = {
    USD: "$",
    INR: "₹",
    EUR: "€",
    GBP: "£",
  }[pricingData.currency];

  return (
    <DashboardCard className="overflow-hidden">
      <div className="space-y-5 p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="dashboard-tone-success flex size-12 shrink-0 items-center justify-center rounded-lg border">
              <DollarSign className="size-6" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">
                Pricing management
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {pricingData.isPaid
                  ? `${pricingData.price} ${pricingData.currency}`
                  : "Free dataset"}
              </p>
            </div>
          </div>
          <DashboardStatusBadge tone={statusTone} status={pricingData.status}>
            {statusConfig.label}
          </DashboardStatusBadge>
        </div>

        <div className="rounded-xl border border-border bg-[var(--dashboard-surface-muted)] p-4 sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Price type
              </p>
              <p className="mt-2 text-sm font-medium text-foreground">
                {pricingData.isPaid ? "Paid dataset" : "Free dataset"}
              </p>
            </div>
            {pricingData.isPaid ? (
              <div className="text-right">
                <p className="text-xs font-medium text-muted-foreground">
                  Amount
                </p>
                <p className="mt-2 text-2xl font-bold tracking-tight text-[var(--dashboard-success-foreground)]">
                  {currencySymbol}
                  {pricingData.price}
                </p>
              </div>
            ) : null}
          </div>
        </div>

        {pricingData.status === "CHANGES_REQUESTED" ? (
          <DashboardInlineAlert
            tone="warning"
            title="Pricing changes requested"
          >
            {pricingData.notes ? (
              <div className="mt-2 rounded-lg border border-current/20 bg-background/30 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em]">
                  Feedback notes
                </p>
                <p className="mt-1 leading-5">{pricingData.notes}</p>
              </div>
            ) : null}
            <p className="mt-2">
              Review the feedback and update your pricing before resubmitting.
            </p>
          </DashboardInlineAlert>
        ) : null}

        <DashboardInlineAlert
          tone={isSampleProposal ? "info" : statusTone}
          message={
            isSampleProposal
              ? "Sample proposal pricing is locked to free and cannot be edited here."
              : PRICING_STATUS_MESSAGES[pricingData.status]
          }
        />

        {!isSampleProposal &&
        ["DRAFT", "CHANGES_REQUESTED", "REJECTED"].includes(
          pricingData.status
        ) ? (
          <DashboardButton
            onClick={onEditPricing}
            variant={
              pricingData.status === "CHANGES_REQUESTED" ? "default" : "outline"
            }
            className="w-full"
          >
            <DollarSign aria-hidden="true" />
            {pricingData.status === "CHANGES_REQUESTED"
              ? "Update and resubmit pricing"
              : "Edit pricing"}
          </DashboardButton>
        ) : null}
      </div>
    </DashboardCard>
  );
}
