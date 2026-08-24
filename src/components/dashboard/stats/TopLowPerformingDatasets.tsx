"use client";

import {
  BarChart3,
  Coins,
  Eye,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

import {
  DashboardButton,
  DashboardCard,
  DashboardSkeleton,
  DashboardStatusBadge,
} from "@/components/dashboard";
import { formatCurrencyValue } from "@/lib/utils/currency.utils";
import type { PerformingDataset } from "@/types/supplier-stats.types";

interface TopLowPerformingDatasetsProps {
  topPerforming: PerformingDataset | null;
  lowPerforming: PerformingDataset | null;
  loading?: boolean;
}

function PerformanceCard({
  dataset,
  type,
}: {
  dataset: PerformingDataset | null;
  type: "top" | "low";
}) {
  const isTop = type === "top";
  const Icon = isTop ? TrendingUp : TrendingDown;

  if (!dataset) {
    return (
      <DashboardCard className="flex min-h-52 flex-col items-center justify-center p-6 text-center">
        <span className="dashboard-tone-neutral flex size-11 items-center justify-center rounded-xl border">
          <Icon aria-hidden="true" />
        </span>
        <p className="mt-4 text-sm font-semibold text-foreground">
          {isTop ? "No sales data yet" : "No dataset needs attention"}
        </p>
        <p className="mt-1 max-w-xs text-xs leading-5 text-muted-foreground">
          Performance comparisons appear after marketplace activity is recorded.
        </p>
      </DashboardCard>
    );
  }

  const revenue = `${formatCurrencyValue(
    dataset.revenue,
    dataset.revenueCurrency
  )}${dataset.revenueCurrency === null ? " (Mixed)" : ""}`;
  const metrics = [
    { label: "Revenue", value: revenue, icon: Coins },
    { label: "Views", value: dataset.views.toLocaleString(), icon: Eye },
    {
      label: "Sales",
      value: dataset.sales.toLocaleString(),
      icon: ShoppingCart,
    },
    {
      label: "Conversion",
      value: `${(dataset.conversionRate * 100).toFixed(2)}%`,
      icon: BarChart3,
    },
  ];

  return (
    <DashboardCard className="flex min-h-52 flex-col p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <DashboardStatusBadge
            tone={isTop ? "success" : "warning"}
            icon={Icon}
          >
            {isTop ? "Top performer" : "Needs attention"}
          </DashboardStatusBadge>
          <h3
            className="mt-3 truncate text-base font-semibold text-foreground"
            title={dataset.title}
          >
            {dataset.title}
          </h3>
        </div>
        <DashboardButton asChild variant="ghost" size="compact">
          <Link href={`/dashboard/stats/datasets/${dataset.datasetId}`}>
            View analytics
          </Link>
        </DashboardButton>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-3">
        {metrics.map((metric) => {
          const MetricIcon = metric.icon;
          return (
            <div
              key={metric.label}
              className="rounded-lg border border-border bg-muted/40 p-3"
            >
              <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MetricIcon className="size-3.5" aria-hidden="true" />
                {metric.label}
              </dt>
              <dd className="mt-1 truncate text-sm font-semibold tabular-nums text-foreground">
                {metric.value}
              </dd>
            </div>
          );
        })}
      </dl>
    </DashboardCard>
  );
}

export function TopLowPerformingDatasets({
  topPerforming,
  lowPerforming,
  loading = false,
}: TopLowPerformingDatasetsProps) {
  if (loading) {
    return (
      <div
        className="grid gap-4 md:grid-cols-2"
        role="status"
        aria-label="Loading portfolio performance"
      >
        {[0, 1].map((index) => (
          <DashboardCard key={index} className="min-h-52 p-6">
            <DashboardSkeleton className="h-6 w-28 rounded-full" />
            <DashboardSkeleton className="mt-4 h-5 w-3/5" />
            <div className="mt-5 grid grid-cols-2 gap-3">
              {[0, 1, 2, 3].map((item) => (
                <DashboardSkeleton key={item} className="h-16" />
              ))}
            </div>
          </DashboardCard>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <PerformanceCard dataset={topPerforming} type="top" />
      <PerformanceCard dataset={lowPerforming} type="low" />
    </div>
  );
}
