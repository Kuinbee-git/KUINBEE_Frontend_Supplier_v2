"use client";

import type { ReactNode } from "react";
import { Coins, Eye, Percent, ShoppingCart, Star } from "lucide-react";

import {
  DashboardMetricCard,
  DashboardPageHeader,
  DashboardStatusBadge,
  type DashboardTone,
} from "@/components/dashboard";
import { formatCurrencyValue } from "@/lib/utils/currency.utils";
import type { DatasetPerformanceItem } from "@/types/supplier-stats.types";

interface DatasetDetailHeaderProps {
  dataset: DatasetPerformanceItem;
  action?: ReactNode;
}

const statusTones: Record<string, DashboardTone> = {
  PUBLISHED: "success",
  VERIFIED: "info",
  SUBMITTED: "info",
  UNDER_REVIEW: "warning",
  ARCHIVED: "neutral",
  REJECTED: "danger",
  DRAFT: "warning",
};

function formatStatus(status: string) {
  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function DatasetDetailHeader({
  dataset,
  action,
}: DatasetDetailHeaderProps) {
  const status = dataset.status.toUpperCase();
  const revenue = `${formatCurrencyValue(
    dataset.revenue,
    dataset.revenueCurrency
  )}${dataset.revenueCurrency === null ? " (Mixed)" : ""}`;
  const metrics = [
    {
      icon: Coins,
      label: "Revenue",
      value: revenue,
      supportingText: "Recognized marketplace revenue",
    },
    {
      icon: Eye,
      label: "Views",
      value: dataset.views.toLocaleString(),
      supportingText: "Marketplace dataset views",
    },
    {
      icon: ShoppingCart,
      label: "Sales",
      value: dataset.sales.toLocaleString(),
      supportingText: "Completed purchases",
    },
    {
      icon: Percent,
      label: "Conversion rate",
      value: `${(dataset.conversionRate * 100).toFixed(2)}%`,
      supportingText: "Views converted to purchases",
    },
  ];

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title={dataset.title}
        description="Understand how marketplace discovery converts into purchases and revenue for this dataset."
        meta={
          <>
            <span className="font-mono text-xs">{dataset.datasetId}</span>
            <DashboardStatusBadge
              tone={statusTones[status] ?? "neutral"}
              status={status}
            >
              {formatStatus(dataset.status)}
            </DashboardStatusBadge>
            <DashboardStatusBadge tone="neutral" icon={Star}>
              Quality {dataset.qualityScore ?? "—"}/100
            </DashboardStatusBadge>
          </>
        }
        actions={action}
      />

      <section
        aria-label="Dataset analytics summary"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {metrics.map((metric) => (
          <DashboardMetricCard key={metric.label} {...metric} />
        ))}
      </section>
    </div>
  );
}
