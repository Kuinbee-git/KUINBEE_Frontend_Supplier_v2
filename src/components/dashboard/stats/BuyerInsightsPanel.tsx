"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Calendar, Crown, Eye, ShoppingBag, UserX, Users } from "lucide-react";

import {
  DashboardDataTable,
  DashboardEmptyState,
  DashboardMetricCard,
  DashboardMobileRecordCard,
  DashboardSection,
  DashboardSkeleton,
  type DashboardTableColumn,
} from "@/components/dashboard";
import {
  formatCurrencyShort,
  formatCurrencyValue,
} from "@/lib/utils/currency.utils";
import type {
  BuyerInsights,
  DatasetPerformanceItem,
  HighIntentNonBuyer,
} from "@/types/supplier-stats.types";

interface BuyerInsightsPanelProps {
  insights: BuyerInsights;
  loading?: boolean;
  datasetPerformance?: DatasetPerformanceItem[];
}

const BAR_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

function formatRelativeDate(dateValue: string): string {
  const date = new Date(dateValue);
  const difference = Date.now() - date.getTime();
  const days = Math.floor(difference / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function BuyerInsightsPanel({
  insights,
  loading = false,
  datasetPerformance = [],
}: BuyerInsightsPanelProps) {
  const datasetTitleMap = useMemo(
    () =>
      new Map(
        datasetPerformance.map((dataset) => [dataset.datasetId, dataset.title])
      ),
    [datasetPerformance]
  );
  const chartData = insights.topBuyers.map((buyer) => ({
    name: buyer.name?.split(" ")[0] || "Anonymous",
    spent: Number(buyer.totalSpent),
    currency: buyer.totalSpentCurrency,
  }));
  const currencies = new Set(
    insights.topBuyers
      .map((buyer) => buyer.totalSpentCurrency)
      .filter((currency) => Boolean(currency))
  );
  const dominantCurrency = currencies.size === 1 ? [...currencies][0] : null;

  const highIntentColumns = useMemo<
    readonly DashboardTableColumn<HighIntentNonBuyer>[]
  >(
    () => [
      {
        id: "visitor",
        header: "Visitor",
        rowHeader: true,
        cell: (visitor) => (
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {visitor.name ?? "Anonymous user"}
            </p>
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {visitor.companyName || "No company provided"}
            </p>
          </div>
        ),
      },
      {
        id: "views",
        header: "Views",
        align: "end",
        className: "font-medium tabular-nums",
        cell: (visitor) => visitor.totalViews.toLocaleString(),
      },
      {
        id: "datasets",
        header: "Viewed datasets",
        cell: (visitor) => (
          <div className="flex max-w-xl flex-wrap gap-1.5">
            {visitor.viewedDatasets.slice(0, 3).map((datasetId) => {
              const title = datasetTitleMap.get(datasetId) ?? datasetId;
              return (
                <span
                  key={datasetId}
                  title={title}
                  className="max-w-48 truncate rounded-md border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                >
                  {title}
                </span>
              );
            })}
            {visitor.viewedDatasets.length > 3 ? (
              <span className="px-1 py-0.5 text-xs text-muted-foreground">
                +{visitor.viewedDatasets.length - 3}
              </span>
            ) : null}
          </div>
        ),
      },
    ],
    [datasetTitleMap]
  );

  if (loading) {
    return (
      <div
        className="space-y-6"
        role="status"
        aria-label="Loading buyer analytics"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <DashboardSkeleton className="h-36" />
          <DashboardSkeleton className="h-36" />
        </div>
        <DashboardSkeleton className="h-96" />
        <DashboardSkeleton className="h-72" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section aria-label="Buyer summary" className="grid gap-4 sm:grid-cols-2">
        <DashboardMetricCard
          label="Total buyers"
          value={insights.totalBuyers.toLocaleString()}
          supportingText="Customers who completed a purchase"
          icon={Users}
        />
        <DashboardMetricCard
          label="High-intent visitors"
          value={insights.totalNonBuyingUsers.toLocaleString()}
          supportingText="Visitors who viewed datasets without purchasing"
          icon={UserX}
        />
      </section>

      <DashboardSection
        title="Top buyers by spend"
        description="Your highest-value marketplace customers during the selected period."
      >
        {chartData.length ? (
          <div className="space-y-5">
            <div
              className="h-56 w-full"
              role="img"
              aria-label="Top buyers ranked by spend"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
                >
                  <XAxis
                    type="number"
                    tickFormatter={(value: number) =>
                      formatCurrencyShort(value, dominantCurrency)
                    }
                    tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    width={80}
                  />
                  <Tooltip
                    cursor={{ fill: "var(--muted)" }}
                    contentStyle={{
                      background: "var(--dashboard-glass-background-strong)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      boxShadow: "var(--dashboard-glass-shadow)",
                    }}
                    formatter={(value) => [
                      formatCurrencyValue(Number(value), dominantCurrency),
                      "Total spent",
                    ]}
                  />
                  <Bar dataKey="spent" radius={[0, 6, 6, 0]} barSize={24}>
                    {chartData.map((buyer, index) => (
                      <Cell
                        key={`${buyer.name}-${index}`}
                        fill={BAR_COLORS[index % BAR_COLORS.length]}
                        fillOpacity={0.9}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {insights.topBuyers.map((buyer, index) => (
                <article
                  key={buyer.userId}
                  className="rounded-xl border border-border bg-muted/35 p-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="dashboard-tone-neutral flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold text-foreground">
                        {buyer.name ?? "Anonymous user"}
                      </h3>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {buyer.companyName || "No company provided"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <ShoppingBag className="size-3.5" aria-hidden="true" />
                      {buyer.totalPurchases} purchases
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="size-3.5" aria-hidden="true" />
                      {buyer.lastPurchaseDate
                        ? formatRelativeDate(buyer.lastPurchaseDate)
                        : "No recent purchase"}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : (
          <DashboardEmptyState
            surface="plain"
            icon={Crown}
            title="No buyer spend yet"
            description="Top buyers will appear after marketplace purchases are recorded."
          />
        )}
      </DashboardSection>

      <DashboardSection
        title="High-intent visitors"
        description="Visitors who repeatedly viewed your datasets but did not complete a purchase."
      >
        {insights.highIntentNonBuyers.length ? (
          <DashboardDataTable
            caption="High-intent visitors"
            columns={highIntentColumns}
            items={insights.highIntentNonBuyers}
            getRowId={(visitor) => visitor.userId}
            renderMobileItem={(visitor) => (
              <DashboardMobileRecordCard>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-foreground">
                      {visitor.name ?? "Anonymous user"}
                    </h3>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {visitor.companyName || "No company provided"}
                    </p>
                  </div>
                  <span className="flex shrink-0 items-center gap-1.5 text-sm font-semibold tabular-nums text-foreground">
                    <Eye
                      className="size-4 text-muted-foreground"
                      aria-hidden="true"
                    />
                    {visitor.totalViews}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {visitor.viewedDatasets.slice(0, 3).map((datasetId) => (
                    <span
                      key={datasetId}
                      className="max-w-full truncate rounded-md border border-border bg-muted px-2 py-1 text-xs text-muted-foreground"
                    >
                      {datasetTitleMap.get(datasetId) ?? datasetId}
                    </span>
                  ))}
                </div>
              </DashboardMobileRecordCard>
            )}
          />
        ) : (
          <DashboardEmptyState
            surface="plain"
            icon={UserX}
            title="No high-intent visitors"
            description="Visitors matching this behavior will appear here when enough activity is available."
          />
        )}
      </DashboardSection>
    </div>
  );
}
