"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  BarChart3,
  Database,
  Eye,
  RefreshCw,
  ShoppingCart,
} from "lucide-react";

import {
  DashboardButton,
  DashboardErrorState,
  DashboardLoadingState,
  DashboardMetricCard,
  DashboardSection,
} from "@/components/dashboard";
import { DatasetPerformanceTable } from "@/components/dashboard/stats/DatasetPerformanceTable";
import { getSupplierStats } from "@/lib/api/stats";
import type {
  DatasetPerformanceItem,
  StatsTimeRange,
} from "@/types/supplier-stats.types";

const VALID_RANGES: StatsTimeRange[] = ["7d", "30d", "90d", "1y", "lifetime"];

function getTimeRange(value: string | null): StatsTimeRange {
  return VALID_RANGES.includes(value as StatsTimeRange)
    ? (value as StatsTimeRange)
    : "30d";
}

function DatasetsContent() {
  const searchParams = useSearchParams();
  const range = getTimeRange(searchParams.get("range"));
  const [datasets, setDatasets] = useState<DatasetPerformanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSupplierStats(range);
      setDatasets(data.datasetPerformance);
    } catch (requestError: unknown) {
      setDatasets([]);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Dataset performance could not be loaded."
      );
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const metrics = useMemo(() => {
    const totalViews = datasets.reduce(
      (total, dataset) => total + dataset.views,
      0
    );
    const totalSales = datasets.reduce(
      (total, dataset) => total + dataset.sales,
      0
    );
    const conversion = totalViews === 0 ? 0 : (totalSales / totalViews) * 100;

    return [
      {
        label: "Tracked datasets",
        value: datasets.length.toLocaleString(),
        supportingText: "Datasets with performance data",
        icon: Database,
      },
      {
        label: "Marketplace views",
        value: totalViews.toLocaleString(),
        supportingText: "Attention in the selected period",
        icon: Eye,
      },
      {
        label: "Completed sales",
        value: totalSales.toLocaleString(),
        supportingText: "Purchases in the selected period",
        icon: ShoppingCart,
      },
      {
        label: "Portfolio conversion",
        value: `${conversion.toFixed(2)}%`,
        supportingText: "Views converted to purchases",
        icon: BarChart3,
      },
    ];
  }, [datasets]);

  if (error) {
    return (
      <DashboardErrorState
        title="Dataset analytics could not be loaded"
        message={error}
        onRetry={() => void fetchData()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <section
        aria-label="Dataset analytics summary"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {metrics.map((metric) => (
          <DashboardMetricCard
            key={metric.label}
            {...metric}
            loading={loading && datasets.length === 0}
          />
        ))}
      </section>

      <DashboardSection
        title="Dataset performance"
        description="Compare marketplace reach, conversion, quality, and revenue."
        actions={
          <DashboardButton
            type="button"
            variant="outline"
            size="compact"
            onClick={() => void fetchData()}
            disabled={loading}
          >
            <RefreshCw aria-hidden="true" />
            Refresh
          </DashboardButton>
        }
      >
        <DatasetPerformanceTable data={datasets} loading={loading} />
      </DashboardSection>
    </div>
  );
}

export default function DatasetsPage() {
  return (
    <Suspense
      fallback={
        <DashboardLoadingState
          label="Loading dataset analytics"
          variant="skeleton"
          rows={5}
        />
      }
    >
      <DatasetsContent />
    </Suspense>
  );
}
