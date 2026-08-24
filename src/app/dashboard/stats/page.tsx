"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import {
  DashboardErrorState,
  DashboardLoadingState,
  DashboardSection,
} from "@/components/dashboard";
import { RevenueTrendChart } from "@/components/dashboard/stats/RevenueTrendChart";
import { StatsOverviewCards } from "@/components/dashboard/stats/StatsOverviewCards";
import { TopLowPerformingDatasets } from "@/components/dashboard/stats/TopLowPerformingDatasets";
import { getSupplierStats } from "@/lib/api/stats";
import type {
  StatsOverview,
  StatsTimeRange,
  SupplierStatsResponse,
} from "@/types/supplier-stats.types";

const EMPTY_OVERVIEW: StatsOverview = {
  totalRevenue: 0,
  totalRevenueCurrency: null,
  totalRevenueByCurrency: [],
  totalSales: 0,
  activeDatasets: 0,
  totalViews: 0,
  averageQualityScore: null,
  pendingValidationCount: 0,
  conversionRate: 0,
};

const VALID_RANGES: StatsTimeRange[] = ["7d", "30d", "90d", "1y", "lifetime"];

function getTimeRange(value: string | null): StatsTimeRange {
  return VALID_RANGES.includes(value as StatsTimeRange)
    ? (value as StatsTimeRange)
    : "30d";
}

function StatsOverviewContent() {
  const searchParams = useSearchParams();
  const range = getTimeRange(searchParams.get("range"));
  const [stats, setStats] = useState<SupplierStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async (selectedRange: StatsTimeRange) => {
    setLoading(true);
    setError(null);
    try {
      setStats(await getSupplierStats(selectedRange));
    } catch (requestError: unknown) {
      setStats(null);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Analytics could not be loaded."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchStats(range);
  }, [fetchStats, range]);

  if (error) {
    return (
      <DashboardErrorState
        title="Analytics could not be loaded"
        message={error}
        onRetry={() => void fetchStats(range)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <StatsOverviewCards
        overview={stats?.overview ?? EMPTY_OVERVIEW}
        loading={loading}
      />

      <DashboardSection
        title="Revenue trend"
        description="Recognized marketplace revenue during the selected period."
      >
        <RevenueTrendChart data={stats?.revenueTrend ?? []} loading={loading} />
      </DashboardSection>

      <DashboardSection
        title="Portfolio performance"
        description="Compare your strongest dataset with the listing that may need attention."
        surface="plain"
      >
        <TopLowPerformingDatasets
          topPerforming={stats?.topPerformingDataset ?? null}
          lowPerforming={stats?.lowPerformingDataset ?? null}
          loading={loading}
        />
      </DashboardSection>
    </div>
  );
}

export default function StatsOverviewPage() {
  return (
    <Suspense
      fallback={
        <DashboardLoadingState
          label="Loading analytics overview"
          variant="skeleton"
          rows={5}
        />
      }
    >
      <StatsOverviewContent />
    </Suspense>
  );
}
