"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Users } from "lucide-react";

import {
  DashboardButton,
  DashboardDataTable,
  DashboardEmptyState,
  DashboardErrorState,
  DashboardLoadingState,
  DashboardMobileRecordCard,
  DashboardPage,
  DashboardPageHeader,
  DashboardSection,
  type DashboardTableColumn,
} from "@/components/dashboard";
import { DatasetConversionFunnel } from "@/components/dashboard/stats/DatasetConversionFunnel";
import { DatasetDetailHeader } from "@/components/dashboard/stats/DatasetDetailHeader";
import { DatasetViewsSalesChart } from "@/components/dashboard/stats/DatasetViewsSalesChart";
import { RevenueTrendChart } from "@/components/dashboard/stats/RevenueTrendChart";
import { TimeRangeSelector } from "@/components/dashboard/stats/TimeRangeSelector";
import { getSupplierDatasetStats } from "@/lib/api/stats";
import { formatCurrencyValue } from "@/lib/utils/currency.utils";
import type {
  DatasetBuyer,
  DatasetDetailStats,
  StatsTimeRange,
} from "@/types/supplier-stats.types";

const VALID_RANGES: StatsTimeRange[] = ["7d", "30d", "90d", "1y", "lifetime"];

function getTimeRange(value: string | null): StatsTimeRange {
  return VALID_RANGES.includes(value as StatsTimeRange)
    ? (value as StatsTimeRange)
    : "30d";
}

function formatPurchaseDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function AnalyticsSkeleton() {
  return (
    <DashboardPage width="wide">
      <DashboardPageHeader
        title="Dataset analytics"
        description="Loading marketplace performance for this dataset."
      />
      <DashboardLoadingState
        label="Loading dataset analytics"
        variant="skeleton"
        rows={6}
      />
    </DashboardPage>
  );
}

function DatasetDetailContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const datasetId = params.id as string;
  const range = getTimeRange(searchParams.get("range"));
  const [detail, setDetail] = useState<DatasetDetailStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleRangeChange = (newRange: StatsTimeRange) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("range", newRange);
    router.push(
      `/dashboard/stats/datasets/${datasetId}?${nextParams.toString()}`
    );
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setDetail(await getSupplierDatasetStats(datasetId, range));
    } catch (requestError: unknown) {
      setDetail(null);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "The analytics request could not be completed."
      );
    } finally {
      setLoading(false);
    }
  }, [datasetId, range]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const buyerColumns = useMemo<readonly DashboardTableColumn<DatasetBuyer>[]>(
    () => [
      {
        id: "buyer",
        header: "Buyer",
        rowHeader: true,
        cell: (buyer) => (
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {buyer.name || "Buyer"}
            </p>
            <p className="mt-1 truncate text-xs font-normal text-muted-foreground">
              {buyer.companyName || "No company provided"}
            </p>
          </div>
        ),
      },
      {
        id: "date",
        header: "Purchase date",
        className: "text-muted-foreground",
        cell: (buyer) => formatPurchaseDate(buyer.purchaseDate),
      },
      {
        id: "amount",
        header: "Amount",
        align: "end",
        className: "font-medium tabular-nums",
        cell: (buyer) => formatCurrencyValue(buyer.amount, buyer.currency),
      },
    ],
    []
  );

  if (loading) return <AnalyticsSkeleton />;

  if (error || !detail) {
    return (
      <DashboardPage width="wide">
        <DashboardButton
          variant="ghost"
          className="self-start"
          onClick={() => router.back()}
        >
          <ArrowLeft aria-hidden="true" />
          Back to analytics
        </DashboardButton>
        <DashboardPageHeader
          title="Dataset analytics"
          description="Review marketplace performance for this dataset."
        />
        <DashboardErrorState
          title="Dataset analytics could not be loaded"
          message={error ?? "This dataset is unavailable or has been removed."}
          onRetry={() => void fetchData()}
        />
      </DashboardPage>
    );
  }

  return (
    <DashboardPage width="wide">
      <DashboardButton
        variant="ghost"
        className="self-start"
        onClick={() => router.back()}
      >
        <ArrowLeft aria-hidden="true" />
        Back to analytics
      </DashboardButton>

      <DatasetDetailHeader
        dataset={detail.dataset}
        action={
          <div className="max-w-full overflow-x-auto pb-1">
            <TimeRangeSelector value={range} onChange={handleRangeChange} />
          </div>
        }
      />

      <div className="grid items-start gap-4 xl:grid-cols-2">
        <DashboardSection
          title="Revenue over time"
          description="Recognized dataset revenue within the selected period."
        >
          <RevenueTrendChart data={detail.revenueTrend} />
        </DashboardSection>

        <DashboardSection
          title="Views and sales"
          description="Compare marketplace attention with completed purchases."
        >
          <DatasetViewsSalesChart data={detail.timeSeries} />
        </DashboardSection>

        <DashboardSection
          title="Conversion funnel"
          description="See how views progress into paid orders."
        >
          <DatasetConversionFunnel dataset={detail.dataset} />
        </DashboardSection>

        <DashboardSection
          title="Recent buyers"
          description="Latest purchases attributed to this dataset."
        >
          {detail.recentBuyers.length ? (
            <DashboardDataTable
              caption="Recent dataset buyers"
              columns={buyerColumns}
              items={detail.recentBuyers}
              getRowId={(buyer) => buyer.purchaseId}
              renderMobileItem={(buyer) => (
                <DashboardMobileRecordCard>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold text-foreground">
                        {buyer.name || "Buyer"}
                      </h3>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {buyer.companyName || "No company provided"}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                      {formatCurrencyValue(buyer.amount, buyer.currency)}
                    </p>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {formatPurchaseDate(buyer.purchaseDate)}
                  </p>
                </DashboardMobileRecordCard>
              )}
            />
          ) : (
            <DashboardEmptyState
              surface="plain"
              icon={Users}
              title="No buyers in this period"
              description="Try a longer time range to view earlier purchases."
            />
          )}
        </DashboardSection>
      </div>
    </DashboardPage>
  );
}

export default function DatasetDetailPage() {
  return (
    <Suspense fallback={<AnalyticsSkeleton />}>
      <DatasetDetailContent />
    </Suspense>
  );
}
