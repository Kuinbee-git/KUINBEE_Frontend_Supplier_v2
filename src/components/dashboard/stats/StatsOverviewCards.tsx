"use client";

import {
  Clock,
  Coins,
  Database,
  Eye,
  ShoppingCart,
  Star,
  TrendingUp,
} from "lucide-react";

import { DashboardMetricCard } from "@/components/dashboard";
import { formatCurrencyValue } from "@/lib/utils/currency.utils";
import type { StatsOverview } from "@/types/supplier-stats.types";

interface StatsOverviewCardsProps {
  overview: StatsOverview;
  loading?: boolean;
}

export function StatsOverviewCards({
  overview,
  loading = false,
}: StatsOverviewCardsProps) {
  const hasMixedRevenue =
    overview.totalRevenueCurrency === null &&
    (overview.totalRevenueByCurrency?.length ?? 0) > 1;
  const revenueValue =
    hasMixedRevenue && overview.totalRevenueByCurrency
      ? overview.totalRevenueByCurrency
          .map((item) => formatCurrencyValue(item.revenue, item.currency))
          .join(" · ")
      : formatCurrencyValue(
          overview.totalRevenue ?? 0,
          overview.totalRevenueCurrency
        );

  const metrics = [
    {
      label: "Total revenue",
      value: revenueValue,
      supportingText: hasMixedRevenue
        ? "Revenue shown by currency"
        : "Recognized marketplace revenue",
      icon: Coins,
    },
    {
      label: "Total sales",
      value: Number(overview.totalSales).toLocaleString(),
      supportingText: "Completed purchases",
      icon: ShoppingCart,
    },
    {
      label: "Active datasets",
      value: overview.activeDatasets.toLocaleString(),
      supportingText: "Available to marketplace buyers",
      icon: Database,
    },
    {
      label: "Total views",
      value: Number(overview.totalViews).toLocaleString(),
      supportingText: "Marketplace dataset views",
      icon: Eye,
    },
    {
      label: "Average quality",
      value:
        overview.averageQualityScore === null
          ? "Not available"
          : Number(overview.averageQualityScore).toFixed(1),
      supportingText: "Across scored datasets",
      icon: Star,
    },
    {
      label: "Pending validations",
      value: overview.pendingValidationCount.toLocaleString(),
      supportingText: "Awaiting marketplace review",
      icon: Clock,
      status:
        overview.pendingValidationCount > 0
          ? `${overview.pendingValidationCount} pending`
          : "Clear",
      statusTone: overview.pendingValidationCount > 0 ? "warning" : "success",
    },
    {
      label: "Conversion rate",
      value: `${(Number(overview.conversionRate) * 100).toFixed(2)}%`,
      supportingText: "Views converted to purchases",
      icon: TrendingUp,
    },
  ] as const;

  return (
    <section
      aria-label="Analytics summary"
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      {metrics.map((metric) => (
        <DashboardMetricCard
          key={metric.label}
          label={metric.label}
          value={metric.value}
          supportingText={metric.supportingText}
          icon={metric.icon}
          status={"status" in metric ? metric.status : undefined}
          statusTone={"statusTone" in metric ? metric.statusTone : undefined}
          loading={loading}
          loadingLabel={`Loading ${metric.label.toLowerCase()}`}
        />
      ))}
    </section>
  );
}
