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

import { DatasetPerformanceTable } from "@/components/dashboard/stats/DatasetPerformanceTable";
import {
  DatasetErrorBanner,
  DatasetMetricStrip,
  DatasetSection,
} from "@/components/datasets/workspace";
import { Button } from "@/components/ui/button";
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
        supportingText: "Datasets with performance data",
        value: datasets.length,
        icon: Database,
        tone: "neutral" as const,
      },
      {
        label: "Marketplace views",
        supportingText: "Attention in the selected period",
        value: totalViews,
        icon: Eye,
        tone: "blue" as const,
      },
      {
        label: "Completed sales",
        supportingText: "Purchases in the selected period",
        value: totalSales,
        icon: ShoppingCart,
        tone: "green" as const,
      },
      {
        label: "Portfolio conversion",
        supportingText: `${conversion.toFixed(2)}% of views converted`,
        value: Number(conversion.toFixed(2)),
        icon: BarChart3,
        tone: "purple" as const,
      },
    ];
  }, [datasets]);

  return (
    <div className="space-y-6">
      {!error && <DatasetMetricStrip metrics={metrics} loading={loading} />}

      {error && (
        <DatasetErrorBanner
          title="Dataset analytics could not be loaded"
          message={error}
          onRetry={() => void fetchData()}
        />
      )}

      {!error && (
        <DatasetSection
          title="Dataset performance"
          description="Compare marketplace reach, conversion, quality, and revenue. Open a dataset for its full trend history."
          icon={Database}
          action={
            !loading && !error ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-2"
                onClick={() => void fetchData()}
              >
                <RefreshCw /> Refresh
              </Button>
            ) : undefined
          }
        >
          <DatasetPerformanceTable data={datasets} loading={loading} />
        </DatasetSection>
      )}
    </div>
  );
}

export default function DatasetsPage() {
  return (
    <Suspense
      fallback={
        <div
          className="space-y-6"
          aria-label="Loading dataset analytics"
          aria-busy="true"
        >
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="supplier-glass-card h-[106px] animate-pulse rounded-xl border"
              />
            ))}
          </div>
          <div className="supplier-glass-card h-96 animate-pulse rounded-xl border" />
        </div>
      }
    >
      <DatasetsContent />
    </Suspense>
  );
}
