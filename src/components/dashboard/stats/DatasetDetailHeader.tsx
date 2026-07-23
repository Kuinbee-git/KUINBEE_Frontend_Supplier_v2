"use client";

import type { ReactNode } from "react";
import { Coins, Eye, Percent, ShoppingCart, Star } from "lucide-react";

import { DatasetEntityHeader } from "@/components/datasets/workspace";
import { formatCurrencyValue } from "@/lib/utils/currency.utils";
import type { DatasetPerformanceItem } from "@/types/supplier-stats.types";

interface DatasetDetailHeaderProps {
  dataset: DatasetPerformanceItem;
  action?: ReactNode;
}

const statusClasses: Record<string, string> = {
  PUBLISHED:
    "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  VERIFIED:
    "border-blue-500/25 bg-blue-500/10 text-blue-600 dark:text-blue-400",
  SUBMITTED:
    "border-blue-500/25 bg-blue-500/10 text-blue-600 dark:text-blue-400",
  UNDER_REVIEW:
    "border-violet-500/25 bg-violet-500/10 text-violet-600 dark:text-violet-400",
  ARCHIVED:
    "border-slate-500/25 bg-slate-500/10 text-slate-600 dark:text-slate-300",
};

export function DatasetDetailHeader({ dataset, action }: DatasetDetailHeaderProps) {
  const status = dataset.status.toUpperCase();
  const isMixed = dataset.revenueCurrency === null;
  const revenueDisplay = `${formatCurrencyValue(dataset.revenue, dataset.revenueCurrency)}${isMixed ? " (Mixed)" : ""}`;
  const conversionPercent = dataset.conversionRate * 100;

  const metrics = [
    {
      icon: Coins,
      label: "Revenue",
      value: revenueDisplay,
      className: "bg-emerald-500/10 text-emerald-500",
    },
    {
      icon: Eye,
      label: "Views",
      value: dataset.views.toLocaleString(),
      className: "bg-amber-500/10 text-amber-500",
    },
    {
      icon: ShoppingCart,
      label: "Sales",
      value: dataset.sales.toLocaleString(),
      className: "bg-blue-500/10 text-blue-500",
    },
    {
      icon: Percent,
      label: "Conversion rate",
      value: `${conversionPercent.toFixed(2)}%`,
      className: "bg-violet-500/10 text-violet-500",
    },
  ];

  return (
    <div className="space-y-4">
      <DatasetEntityHeader
        eyebrow="Dataset performance"
        title={dataset.title}
        identifier={dataset.datasetId}
        description="Understand how marketplace discovery converts into purchases and revenue for this dataset."
        badges={
          <>
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${
                statusClasses[status] ??
                "border-border bg-muted text-muted-foreground"
              }`}
            >
              {dataset.status.replaceAll("_", " ")}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-pink-500/25 bg-pink-500/10 px-2.5 py-1 text-xs font-medium text-pink-600 dark:text-pink-400">
              <Star className="size-3" aria-hidden="true" />
              Quality {dataset.qualityScore ?? "—"}/100
            </span>
          </>
        }
        actions={action}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div
              key={metric.label}
              className="supplier-glass-card flex min-h-24 items-center gap-3 rounded-xl border p-4"
            >
              <span
                className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${metric.className}`}
              >
                <Icon className="size-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{metric.label}</p>
                <p className="mt-1 truncate text-sm font-semibold tabular-nums text-foreground sm:text-base">
                  {metric.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
