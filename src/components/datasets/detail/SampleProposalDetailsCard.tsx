"use client";

import {
  DashboardButton,
  DashboardCard,
  DashboardStatusBadge,
} from "@/components/dashboard";
import type { DatasetDetailTokens } from "./detailTokens";

interface SampleProposalDetailsCardProps {
  actualPrice: number | null | undefined;
  actualPriceCurrency: string | undefined;
  isNegotiable: boolean | null | undefined;
  sampleNotes:
    | {
        whySample: string;
        actualDataSize: string;
        completeness?: string;
        deliveryMechanism: string;
        deliveryMechanismNotes?: string;
      }
    | null
    | undefined;
  isEditable: boolean;
  onEditClick: () => void;
  isDark: boolean;
  tokens: DatasetDetailTokens;
}

export function SampleProposalDetailsCard({
  actualPrice,
  actualPriceCurrency,
  isNegotiable,
  sampleNotes,
  isEditable,
  onEditClick,
}: SampleProposalDetailsCardProps) {
  return (
    <DashboardCard className="overflow-hidden">
      <div className="space-y-4 p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-foreground">
            Sample proposal details
          </h3>
          <div className="flex items-center gap-2">
            <DashboardStatusBadge tone="info" status="sample">
              Sample
            </DashboardStatusBadge>
            {isEditable ? (
              <DashboardButton
                size="compact"
                variant="outline"
                onClick={onEditClick}
              >
                Edit
              </DashboardButton>
            ) : null}
          </div>
        </div>

        <dl className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <dt className="text-sm font-medium text-muted-foreground">
              Actual price
            </dt>
            <dd className="text-sm font-medium text-foreground">
              {actualPrice ?? 0} {actualPriceCurrency ?? ""}
            </dd>
          </div>
          <div className="space-y-2">
            <dt className="text-sm font-medium text-muted-foreground">
              Negotiable
            </dt>
            <dd className="text-sm text-foreground">
              {isNegotiable === true
                ? "Yes"
                : isNegotiable === false
                  ? "No"
                  : "N/A"}
            </dd>
          </div>
        </dl>

        {sampleNotes ? (
          <div className="space-y-2 rounded-lg border border-border bg-[var(--dashboard-surface-muted)] p-4">
            <p className="text-sm font-medium text-muted-foreground">
              Sample notes
            </p>
            <p className="text-sm text-foreground">
              <span className="font-medium">Why sample:</span>{" "}
              {sampleNotes.whySample}
            </p>
            <p className="text-sm text-foreground">
              <span className="font-medium">Actual data size:</span>{" "}
              {sampleNotes.actualDataSize}
            </p>
            {sampleNotes.completeness ? (
              <p className="text-sm text-foreground">
                <span className="font-medium">Completeness:</span>{" "}
                {sampleNotes.completeness}
              </p>
            ) : null}
            <p className="text-sm text-foreground">
              <span className="font-medium">Delivery mechanism:</span>{" "}
              {sampleNotes.deliveryMechanism}
            </p>
            {sampleNotes.deliveryMechanismNotes ? (
              <p className="text-sm text-foreground">
                <span className="font-medium">Delivery notes:</span>{" "}
                {sampleNotes.deliveryMechanismNotes}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </DashboardCard>
  );
}
