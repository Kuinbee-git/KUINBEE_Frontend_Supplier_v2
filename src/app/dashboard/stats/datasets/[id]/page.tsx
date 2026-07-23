"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, BarChart3, RefreshCw, TrendingUp, Users } from "lucide-react";

import { DatasetSection, DatasetWorkspace } from "@/components/datasets/workspace";
import { DatasetConversionFunnel } from "@/components/dashboard/stats/DatasetConversionFunnel";
import { DatasetDetailHeader } from "@/components/dashboard/stats/DatasetDetailHeader";
import { DatasetViewsSalesChart } from "@/components/dashboard/stats/DatasetViewsSalesChart";
import { RevenueTrendChart } from "@/components/dashboard/stats/RevenueTrendChart";
import { TimeRangeSelector } from "@/components/dashboard/stats/TimeRangeSelector";
import { PageBackground } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { getSupplierDatasetStats } from "@/lib/api/stats";
import { formatCurrencyValue } from "@/lib/utils/currency.utils";
import type {
  DatasetDetailStats,
  StatsTimeRange,
} from "@/types/supplier-stats.types";

const VALID_RANGES: StatsTimeRange[] = ["7d", "30d", "90d", "1y", "lifetime"];

function getTimeRange(value: string | null): StatsTimeRange {
  return VALID_RANGES.includes(value as StatsTimeRange)
    ? (value as StatsTimeRange)
    : "30d";
}

function AnalyticsSkeleton() {
  return (
    <PageBackground withGrid>
      <DatasetWorkspace className="max-w-[1380px]">
        <div className="space-y-4" aria-label="Loading dataset analytics" aria-busy="true">
          <div className="h-10 w-40 animate-pulse rounded-lg bg-foreground/[0.06]" />
          <div className="supplier-glass-card h-52 animate-pulse rounded-2xl border" />
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="supplier-glass-card h-80 animate-pulse rounded-xl border" />
            <div className="supplier-glass-card h-80 animate-pulse rounded-xl border" />
          </div>
        </div>
      </DatasetWorkspace>
    </PageBackground>
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
    router.push(`/dashboard/stats/datasets/${datasetId}?${nextParams.toString()}`);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSupplierDatasetStats(datasetId, range);
      setDetail(data);
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

  if (loading) {
    return <AnalyticsSkeleton />;
  }

  if (error || !detail) {
    return (
      <PageBackground withGrid>
        <DatasetWorkspace className="max-w-[1380px]">
          <Button variant="outline" className="mb-5 gap-2" onClick={() => router.back()}>
            <ArrowLeft className="size-4" /> Back to analytics
          </Button>
          <section className="supplier-glass-card rounded-2xl border p-6 sm:p-8">
            <h1 className="text-xl font-semibold text-foreground">Dataset analytics could not be loaded</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              {error ?? "This dataset is unavailable or has been removed."}
            </p>
            <Button className="mt-5 gap-2" onClick={() => void fetchData()}>
              <RefreshCw className="size-4" /> Try again
            </Button>
          </section>
        </DatasetWorkspace>
      </PageBackground>
    );
  }

  return (
    <PageBackground withGrid>
      <DatasetWorkspace className="max-w-[1380px]">
        <Button variant="ghost" className="-ml-3 gap-2" onClick={() => router.back()}>
          <ArrowLeft className="size-4" /> Back to analytics
        </Button>

        <div className="mt-5">
          <DatasetDetailHeader
            dataset={detail.dataset}
            action={
              <div className="max-w-full overflow-x-auto pb-1">
                <TimeRangeSelector value={range} onChange={handleRangeChange} />
              </div>
            }
          />
        </div>

        <div className="mt-6 grid items-start gap-5 lg:grid-cols-2">
          <DatasetSection
            title="Revenue over time"
            description="Recognized dataset revenue within the selected period."
            icon={TrendingUp}
          >
            <RevenueTrendChart data={detail.revenueTrend} loading={false} />
          </DatasetSection>

          <DatasetSection
            title="Views and sales"
            description="Compare marketplace attention with completed purchases."
            icon={BarChart3}
          >
            <DatasetViewsSalesChart data={detail.timeSeries} loading={false} />
          </DatasetSection>

          <DatasetSection
            title="Conversion funnel"
            description="See how views progress into paid orders."
            icon={TrendingUp}
          >
            <DatasetConversionFunnel dataset={detail.dataset} loading={false} />
          </DatasetSection>

          <DatasetSection
            title="Recent buyers"
            description="Latest purchases attributed to this dataset."
            icon={Users}
          >
            {detail.recentBuyers.length > 0 ? (
              <>
                <div className="space-y-3 sm:hidden">
                  {detail.recentBuyers.map((buyer) => (
                    <article key={buyer.purchaseId} className="rounded-xl border border-border/70 bg-background/35 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">{buyer.name || "Buyer"}</p>
                          <p className="mt-1 truncate text-xs text-muted-foreground">{buyer.companyName || "No company provided"}</p>
                        </div>
                        <p className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                          {formatCurrencyValue(buyer.amount, buyer.currency)}
                        </p>
                      </div>
                      <p className="mt-3 text-xs text-muted-foreground">
                        {new Date(buyer.purchaseDate).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </article>
                  ))}
                </div>

                <div className="hidden overflow-x-auto sm:block">
                  <table className="w-full min-w-[560px] text-left">
                    <thead>
                      <tr className="border-b border-border/70">
                        {[
                          ["Buyer", "text-left"],
                          ["Company", "text-left"],
                          ["Date", "text-left"],
                          ["Amount", "text-right"],
                        ].map(([label, alignment]) => (
                          <th key={label} className={`px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground ${alignment}`}>
                            {label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {detail.recentBuyers.map((buyer) => (
                        <tr key={buyer.purchaseId} className="border-b border-border/60 last:border-0 hover:bg-foreground/[0.025]">
                          <td className="px-3 py-3 text-sm font-medium text-foreground">{buyer.name || "Buyer"}</td>
                          <td className="px-3 py-3 text-sm text-muted-foreground">{buyer.companyName || "—"}</td>
                          <td className="px-3 py-3 text-sm text-muted-foreground">
                            {new Date(buyer.purchaseDate).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          <td className="px-3 py-3 text-right text-sm font-medium tabular-nums text-foreground">
                            {formatCurrencyValue(buyer.amount, buyer.currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-border py-10 text-center">
                <p className="text-sm font-medium text-foreground">No buyers in this period</p>
                <p className="mt-1 text-xs text-muted-foreground">Try a longer time range to view earlier purchases.</p>
              </div>
            )}
          </DatasetSection>
        </div>
      </DatasetWorkspace>
    </PageBackground>
  );
}

export default function DatasetDetailPage() {
  return (
    <Suspense fallback={<AnalyticsSkeleton />}>
      <DatasetDetailContent />
    </Suspense>
  );
}
