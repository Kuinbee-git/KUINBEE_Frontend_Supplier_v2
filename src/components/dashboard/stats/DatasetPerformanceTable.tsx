"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Coins,
  Eye,
  ShoppingCart,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatCurrencyValue } from "@/lib/utils/currency.utils";
import { cn } from "@/lib/utils";
import type { DatasetPerformanceItem } from "@/types/supplier-stats.types";

interface DatasetPerformanceTableProps {
  data: DatasetPerformanceItem[];
  loading?: boolean;
}

type SortKey = keyof DatasetPerformanceItem;
type SortDir = "asc" | "desc";

const PAGE_SIZE = 10;
const NUMERIC_SORT_KEYS = new Set<SortKey>([
  "views",
  "sales",
  "revenue",
  "conversionRate",
  "qualityScore",
]);

const statusClasses: Record<string, string> = {
  PUBLISHED:
    "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  VERIFIED:
    "border-blue-500/25 bg-blue-500/10 text-blue-600 dark:text-blue-400",
  SUBMITTED:
    "border-blue-500/25 bg-blue-500/10 text-blue-600 dark:text-blue-400",
  UNDER_REVIEW:
    "border-violet-500/25 bg-violet-500/10 text-violet-600 dark:text-violet-400",
  ARCHIVED:
    "border-slate-500/25 bg-slate-500/10 text-slate-600 dark:text-slate-300",
  REJECTED: "border-red-500/25 bg-red-500/10 text-red-600 dark:text-red-400",
  DRAFT:
    "border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

const columns: { key: SortKey; label: string; align?: "right" }[] = [
  { key: "title", label: "Dataset" },
  { key: "views", label: "Views", align: "right" },
  { key: "sales", label: "Sales", align: "right" },
  { key: "revenue", label: "Revenue", align: "right" },
  { key: "conversionRate", label: "Conversion", align: "right" },
  { key: "qualityScore", label: "Quality", align: "right" },
  { key: "status", label: "Status" },
];

function formatStatusLabel(status: string): string {
  return status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function DatasetStatus({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium",
        statusClasses[status.toUpperCase()] ??
          "border-border bg-muted text-muted-foreground"
      )}
    >
      {formatStatusLabel(status)}
    </span>
  );
}

export function DatasetPerformanceTable({
  data,
  loading,
}: DatasetPerformanceTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("revenue");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(0);

  const sorted = useMemo(
    () =>
      [...data].sort((first, second) => {
        const firstValue = first[sortKey];
        const secondValue = second[sortKey];

        if (NUMERIC_SORT_KEYS.has(sortKey)) {
          if (firstValue === null || firstValue === undefined) return 1;
          if (secondValue === null || secondValue === undefined) return -1;
          const difference = Number(firstValue) - Number(secondValue);
          return sortDir === "asc" ? difference : -difference;
        }

        const difference = String(firstValue ?? "").localeCompare(
          String(secondValue ?? "")
        );
        return sortDir === "asc" ? difference : -difference;
      }),
    [data, sortDir, sortKey]
  );

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const currentPage = Math.min(page, Math.max(0, totalPages - 1));
  const pageData = sorted.slice(
    currentPage * PAGE_SIZE,
    (currentPage + 1) * PAGE_SIZE
  );

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((direction) => (direction === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
    setPage(0);
  };

  if (loading) {
    return (
      <div
        className="space-y-3"
        aria-label="Loading dataset performance"
        aria-busy="true"
      >
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="h-20 animate-pulse rounded-xl bg-foreground/[0.055]"
          />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border/80 px-6 text-center">
        <span className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <BarChart3 className="size-6" aria-hidden="true" />
        </span>
        <p className="mt-4 text-sm font-semibold text-foreground">
          No dataset performance yet
        </p>
        <p className="mt-1 max-w-md text-xs leading-5 text-muted-foreground">
          Views, sales, and revenue will appear after a dataset is available to
          buyers.
        </p>
      </div>
    );
  }

  const sortIcon = (key: SortKey) => {
    if (sortKey !== key) return <ArrowUpDown className="size-3 opacity-40" />;
    return sortDir === "asc" ? (
      <ArrowUp className="size-3" />
    ) : (
      <ArrowDown className="size-3" />
    );
  };

  return (
    <div>
      <div className="space-y-3 md:hidden">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-medium text-muted-foreground">
            Sort performance
          </p>
          <select
            value={`${sortKey}:${sortDir}`}
            onChange={(event) => {
              const [nextKey, nextDirection] = event.target.value.split(
                ":"
              ) as [SortKey, SortDir];
              setSortKey(nextKey);
              setSortDir(nextDirection);
              setPage(0);
            }}
            className="supplier-glass-input h-9 rounded-lg border px-3 text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Sort dataset performance"
          >
            <option value="revenue:desc">Revenue: high to low</option>
            <option value="views:desc">Views: high to low</option>
            <option value="sales:desc">Sales: high to low</option>
            <option value="conversionRate:desc">Conversion: high to low</option>
            <option value="qualityScore:desc">Quality: high to low</option>
            <option value="title:asc">Dataset: A to Z</option>
          </select>
        </div>

        {pageData.map((item) => (
          <Link
            key={item.datasetId}
            href={`/dashboard/stats/datasets/${item.datasetId}`}
            className="supplier-glass-panel block rounded-xl border p-4 transition-colors hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  {item.title}
                </p>
                <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                  {item.datasetId}
                </p>
              </div>
              <DatasetStatus status={item.status} />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              {[
                [Eye, "Views", item.views.toLocaleString()],
                [ShoppingCart, "Sales", item.sales.toLocaleString()],
                [
                  Coins,
                  "Revenue",
                  formatCurrencyValue(item.revenue, item.revenueCurrency),
                ],
                [
                  BarChart3,
                  "Conversion",
                  `${(item.conversionRate * 100).toFixed(2)}%`,
                ],
              ].map(([Icon, label, value]) => {
                const MetricIcon = Icon as typeof Eye;
                return (
                  <div
                    key={label as string}
                    className="rounded-lg bg-foreground/[0.035] p-3"
                  >
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <MetricIcon className="size-3.5" aria-hidden="true" />
                      <span className="text-[11px]">{label as string}</span>
                    </div>
                    <p className="mt-1 truncate text-sm font-semibold tabular-nums text-foreground">
                      {value as string}
                    </p>
                  </div>
                );
              })}
            </div>
          </Link>
        ))}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[900px] text-left">
          <thead>
            <tr className="border-b border-border/70">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    "px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground",
                    column.align === "right" && "text-right"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => handleSort(column.key)}
                    className="inline-flex items-center gap-1.5 rounded-md transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={`Sort by ${column.label}`}
                  >
                    {column.label}
                    {sortIcon(column.key)}
                  </button>
                </th>
              ))}
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {pageData.map((item) => (
              <tr
                key={item.datasetId}
                className="border-b border-border/60 transition-colors last:border-0 hover:bg-foreground/[0.025]"
              >
                <td className="px-4 py-3.5">
                  <p
                    className="max-w-[240px] truncate text-sm font-semibold text-foreground"
                    title={item.title}
                  >
                    {item.title}
                  </p>
                  <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                    {item.datasetId}
                  </p>
                </td>
                <td className="px-4 py-3.5 text-right text-sm tabular-nums text-muted-foreground">
                  {item.views.toLocaleString()}
                </td>
                <td className="px-4 py-3.5 text-right text-sm tabular-nums text-muted-foreground">
                  {item.sales.toLocaleString()}
                </td>
                <td className="px-4 py-3.5 text-right text-sm font-medium tabular-nums text-foreground">
                  {formatCurrencyValue(item.revenue, item.revenueCurrency)}
                </td>
                <td className="px-4 py-3.5 text-right text-sm tabular-nums text-muted-foreground">
                  {(item.conversionRate * 100).toFixed(2)}%
                </td>
                <td className="px-4 py-3.5 text-right text-sm font-medium tabular-nums text-foreground">
                  {item.qualityScore == null
                    ? "—"
                    : Number(item.qualityScore).toFixed(0)}
                </td>
                <td className="px-4 py-3.5">
                  <DatasetStatus status={item.status} />
                </td>
                <td className="px-4 py-3.5 text-right">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/dashboard/stats/datasets/${item.datasetId}`}>
                      View analytics
                    </Link>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex flex-col gap-3 border-t border-border/70 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground" aria-live="polite">
            Showing {currentPage * PAGE_SIZE + 1}–
            {Math.min((currentPage + 1) * PAGE_SIZE, sorted.length)} of{" "}
            {sorted.length} datasets
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => setPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              aria-label="Previous page"
            >
              <ChevronLeft />
            </Button>
            <span className="min-w-16 text-center text-xs font-medium text-muted-foreground">
              {currentPage + 1} / {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => setPage(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage === totalPages - 1}
              aria-label="Next page"
            >
              <ChevronRight />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
