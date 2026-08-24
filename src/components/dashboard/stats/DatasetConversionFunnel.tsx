"use client";

import { Eye, ShoppingCart, TrendingUp } from "lucide-react";

import {
  DashboardProgress,
  DashboardSkeleton,
  DashboardStatusBadge,
} from "@/components/dashboard";
import type { DatasetPerformanceItem } from "@/types/supplier-stats.types";

interface DatasetConversionFunnelProps {
  dataset: DatasetPerformanceItem;
  loading?: boolean;
}

export function DatasetConversionFunnel({
  dataset,
  loading = false,
}: DatasetConversionFunnelProps) {
  if (loading) return <DashboardSkeleton className="h-48" />;

  const conversionPercent = dataset.conversionRate * 100;

  return (
    <div
      className="space-y-6"
      aria-label={`${conversionPercent.toFixed(2)} percent of dataset views converted to sales`}
    >
      <div>
        <div className="mb-2 flex items-center justify-between gap-4">
          <span className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Eye className="size-4 text-muted-foreground" aria-hidden="true" />
            Views
          </span>
          <span className="text-sm font-semibold tabular-nums text-foreground">
            {dataset.views.toLocaleString()}
          </span>
        </div>
        <DashboardProgress
          label="Dataset views"
          value={100}
          showValue={false}
        />
      </div>

      <div className="flex justify-center">
        <DashboardStatusBadge tone="info" icon={TrendingUp}>
          {conversionPercent.toFixed(2)}% conversion
        </DashboardStatusBadge>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between gap-4">
          <span className="flex items-center gap-2 text-sm font-medium text-foreground">
            <ShoppingCart
              className="size-4 text-muted-foreground"
              aria-hidden="true"
            />
            Sales
          </span>
          <span className="text-sm font-semibold tabular-nums text-foreground">
            {dataset.sales.toLocaleString()}
          </span>
        </div>
        <DashboardProgress
          label="Dataset sales conversion"
          value={Math.min(100, conversionPercent)}
          showValue={false}
        />
      </div>
    </div>
  );
}
