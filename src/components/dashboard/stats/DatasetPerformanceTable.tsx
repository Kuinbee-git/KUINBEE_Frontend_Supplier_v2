"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BarChart3, Coins, Eye, ShoppingCart } from "lucide-react";

import {
  DashboardButton,
  DashboardDataTable,
  DashboardEmptyState,
  DashboardLoadingState,
  DashboardMobileRecordCard,
  DashboardPagination,
  DashboardSelect,
  DashboardSelectContent,
  DashboardSelectItem,
  DashboardSelectTrigger,
  DashboardSelectValue,
  DashboardStatusBadge,
  type DashboardSortDirection,
  type DashboardTableColumn,
  type DashboardTone,
} from "@/components/dashboard";
import { formatCurrencyValue } from "@/lib/utils/currency.utils";
import type { DatasetPerformanceItem } from "@/types/supplier-stats.types";

interface DatasetPerformanceTableProps {
  data: DatasetPerformanceItem[];
  loading?: boolean;
}

type SortKey = keyof DatasetPerformanceItem;
type SortDirection = "asc" | "desc";

const PAGE_SIZE = 10;
const NUMERIC_SORT_KEYS = new Set<SortKey>([
  "views",
  "sales",
  "revenue",
  "conversionRate",
  "qualityScore",
]);

const statusTones: Record<string, DashboardTone> = {
  PUBLISHED: "success",
  VERIFIED: "info",
  SUBMITTED: "info",
  UNDER_REVIEW: "warning",
  ARCHIVED: "neutral",
  REJECTED: "danger",
  DRAFT: "warning",
};

function formatStatus(status: string) {
  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function DatasetStatus({ status }: { status: string }) {
  const normalizedStatus = status.toUpperCase();
  return (
    <DashboardStatusBadge
      tone={statusTones[normalizedStatus] ?? "neutral"}
      status={normalizedStatus}
    >
      {formatStatus(status)}
    </DashboardStatusBadge>
  );
}

export function DatasetPerformanceTable({
  data,
  loading = false,
}: DatasetPerformanceTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("revenue");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [page, setPage] = useState(1);

  const sorted = useMemo(
    () =>
      [...data].sort((first, second) => {
        const firstValue = first[sortKey];
        const secondValue = second[sortKey];

        if (NUMERIC_SORT_KEYS.has(sortKey)) {
          if (firstValue === null || firstValue === undefined) return 1;
          if (secondValue === null || secondValue === undefined) return -1;
          const difference = Number(firstValue) - Number(secondValue);
          return sortDirection === "asc" ? difference : -difference;
        }

        const difference = String(firstValue ?? "").localeCompare(
          String(secondValue ?? "")
        );
        return sortDirection === "asc" ? difference : -difference;
      }),
    [data, sortDirection, sortKey]
  );
  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageData = sorted.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("desc");
    }
    setPage(1);
  };

  const getSortDirection = (key: SortKey): DashboardSortDirection => {
    if (key !== sortKey) return "none";
    return sortDirection === "asc" ? "ascending" : "descending";
  };

  const columns: readonly DashboardTableColumn<DatasetPerformanceItem>[] = [
    {
      id: "dataset",
      header: "Dataset",
      rowHeader: true,
      className: "min-w-56",
      sort: {
        direction: getSortDirection("title"),
        onToggle: () => handleSort("title"),
        sortLabel: "dataset title",
      },
      cell: (dataset) => (
        <div className="min-w-0">
          <p
            className="max-w-64 truncate text-sm font-semibold text-foreground"
            title={dataset.title}
          >
            {dataset.title}
          </p>
          <p className="mt-1 truncate font-mono text-xs font-normal text-muted-foreground">
            {dataset.datasetId}
          </p>
        </div>
      ),
    },
    {
      id: "views",
      header: "Views",
      align: "end",
      className: "tabular-nums text-muted-foreground",
      sort: {
        direction: getSortDirection("views"),
        onToggle: () => handleSort("views"),
        sortLabel: "views",
      },
      cell: (dataset) => dataset.views.toLocaleString(),
    },
    {
      id: "sales",
      header: "Sales",
      align: "end",
      className: "tabular-nums text-muted-foreground",
      sort: {
        direction: getSortDirection("sales"),
        onToggle: () => handleSort("sales"),
        sortLabel: "sales",
      },
      cell: (dataset) => dataset.sales.toLocaleString(),
    },
    {
      id: "revenue",
      header: "Revenue",
      align: "end",
      className: "font-medium tabular-nums",
      sort: {
        direction: getSortDirection("revenue"),
        onToggle: () => handleSort("revenue"),
        sortLabel: "revenue",
      },
      cell: (dataset) =>
        formatCurrencyValue(dataset.revenue, dataset.revenueCurrency),
    },
    {
      id: "conversion",
      header: "Conversion",
      align: "end",
      className: "tabular-nums text-muted-foreground",
      sort: {
        direction: getSortDirection("conversionRate"),
        onToggle: () => handleSort("conversionRate"),
        sortLabel: "conversion rate",
      },
      cell: (dataset) => `${(dataset.conversionRate * 100).toFixed(2)}%`,
    },
    {
      id: "quality",
      header: "Quality",
      align: "end",
      className: "font-medium tabular-nums",
      sort: {
        direction: getSortDirection("qualityScore"),
        onToggle: () => handleSort("qualityScore"),
        sortLabel: "quality score",
      },
      cell: (dataset) =>
        dataset.qualityScore === null
          ? "—"
          : Number(dataset.qualityScore).toFixed(0),
    },
    {
      id: "status",
      header: "Status",
      cell: (dataset) => <DatasetStatus status={dataset.status} />,
    },
    {
      id: "action",
      header: <span className="sr-only">Action</span>,
      align: "end",
      cell: (dataset) => (
        <DashboardButton asChild variant="outline" size="compact">
          <Link href={`/dashboard/stats/datasets/${dataset.datasetId}`}>
            View
          </Link>
        </DashboardButton>
      ),
    },
  ];

  if (loading && data.length === 0) {
    return (
      <DashboardLoadingState
        label="Loading dataset performance"
        variant="skeleton"
        rows={5}
        surface="plain"
      />
    );
  }

  if (!loading && data.length === 0) {
    return (
      <DashboardEmptyState
        surface="plain"
        icon={BarChart3}
        title="No dataset performance yet"
        description="Views, sales, and revenue will appear after a dataset becomes available to buyers."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 md:hidden">
        <label
          htmlFor="dataset-performance-sort"
          className="text-sm font-medium text-muted-foreground"
        >
          Sort by
        </label>
        <DashboardSelect
          value={`${sortKey}:${sortDirection}`}
          onValueChange={(value) => {
            const [nextKey, nextDirection] = value.split(":") as [
              SortKey,
              SortDirection,
            ];
            setSortKey(nextKey);
            setSortDirection(nextDirection);
            setPage(1);
          }}
        >
          <DashboardSelectTrigger
            id="dataset-performance-sort"
            className="w-52"
          >
            <DashboardSelectValue />
          </DashboardSelectTrigger>
          <DashboardSelectContent>
            <DashboardSelectItem value="revenue:desc">
              Revenue: high to low
            </DashboardSelectItem>
            <DashboardSelectItem value="views:desc">
              Views: high to low
            </DashboardSelectItem>
            <DashboardSelectItem value="sales:desc">
              Sales: high to low
            </DashboardSelectItem>
            <DashboardSelectItem value="conversionRate:desc">
              Conversion: high to low
            </DashboardSelectItem>
            <DashboardSelectItem value="qualityScore:desc">
              Quality: high to low
            </DashboardSelectItem>
            <DashboardSelectItem value="title:asc">
              Dataset: A to Z
            </DashboardSelectItem>
          </DashboardSelectContent>
        </DashboardSelect>
      </div>

      <DashboardDataTable
        caption="Dataset performance"
        columns={columns}
        items={pageData}
        busy={loading}
        getRowId={(dataset) => dataset.datasetId}
        renderMobileItem={(dataset) => (
          <DashboardMobileRecordCard>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold text-foreground">
                  {dataset.title}
                </h3>
                <p className="mt-1 truncate font-mono text-xs text-muted-foreground">
                  {dataset.datasetId}
                </p>
              </div>
              <DatasetStatus status={dataset.status} />
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3">
              {[
                [Eye, "Views", dataset.views.toLocaleString()],
                [ShoppingCart, "Sales", dataset.sales.toLocaleString()],
                [
                  Coins,
                  "Revenue",
                  formatCurrencyValue(dataset.revenue, dataset.revenueCurrency),
                ],
                [
                  BarChart3,
                  "Conversion",
                  `${(dataset.conversionRate * 100).toFixed(2)}%`,
                ],
              ].map(([Icon, label, value]) => {
                const MetricIcon = Icon as typeof Eye;
                return (
                  <div
                    key={label as string}
                    className="rounded-lg border border-border bg-muted/40 p-3"
                  >
                    <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MetricIcon className="size-3.5" aria-hidden="true" />
                      {label as string}
                    </dt>
                    <dd className="mt-1 truncate text-sm font-semibold tabular-nums text-foreground">
                      {value as string}
                    </dd>
                  </div>
                );
              })}
            </dl>
            <DashboardButton asChild variant="outline" className="mt-4 w-full">
              <Link href={`/dashboard/stats/datasets/${dataset.datasetId}`}>
                View analytics
              </Link>
            </DashboardButton>
          </DashboardMobileRecordCard>
        )}
      />

      <DashboardPagination
        page={currentPage}
        pageSize={PAGE_SIZE}
        totalItems={sorted.length}
        itemLabel="datasets"
        onPageChange={setPage}
        disabled={loading}
      />
    </div>
  );
}
