"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import {
  DashboardErrorState,
  DashboardLoadingState,
} from "@/components/dashboard";
import { BuyerInsightsPanel } from "@/components/dashboard/stats/BuyerInsightsPanel";
import { getSupplierStats } from "@/lib/api/stats";
import type {
  BuyerInsights,
  DatasetPerformanceItem,
  StatsTimeRange,
} from "@/types/supplier-stats.types";

const EMPTY_INSIGHTS: BuyerInsights = {
  totalBuyers: 0,
  totalNonBuyingUsers: 0,
  topBuyers: [],
  highIntentNonBuyers: [],
};

const VALID_RANGES: StatsTimeRange[] = ["7d", "30d", "90d", "1y", "lifetime"];

function getTimeRange(value: string | null): StatsTimeRange {
  return VALID_RANGES.includes(value as StatsTimeRange)
    ? (value as StatsTimeRange)
    : "30d";
}

function BuyersContent() {
  const searchParams = useSearchParams();
  const range = getTimeRange(searchParams.get("range"));
  const [insights, setInsights] = useState<BuyerInsights | null>(null);
  const [datasetPerformance, setDatasetPerformance] = useState<
    DatasetPerformanceItem[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (selectedRange: StatsTimeRange) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSupplierStats(selectedRange);
      setInsights(data.buyerInsights);
      setDatasetPerformance(data.datasetPerformance);
    } catch (requestError: unknown) {
      setInsights(null);
      setDatasetPerformance([]);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Buyer analytics could not be loaded."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData(range);
  }, [fetchData, range]);

  if (error) {
    return (
      <DashboardErrorState
        title="Buyer analytics could not be loaded"
        message={error}
        onRetry={() => void fetchData(range)}
      />
    );
  }

  return (
    <BuyerInsightsPanel
      insights={insights ?? EMPTY_INSIGHTS}
      datasetPerformance={datasetPerformance}
      loading={loading}
    />
  );
}

export default function BuyersPage() {
  return (
    <Suspense
      fallback={
        <DashboardLoadingState
          label="Loading buyer analytics"
          variant="skeleton"
          rows={5}
        />
      }
    >
      <BuyersContent />
    </Suspense>
  );
}
