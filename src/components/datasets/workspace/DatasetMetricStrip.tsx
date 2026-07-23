"use client";

import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type DatasetMetricTone =
  | "neutral"
  | "blue"
  | "green"
  | "amber"
  | "red"
  | "purple"
  | "slate";

export interface DatasetMetric<TValue extends string = string> {
  label: string;
  supportingText: string;
  value: number;
  filterValue?: TValue;
  icon: LucideIcon;
  tone: DatasetMetricTone;
}

const TONE_CLASSES: Record<DatasetMetricTone, string> = {
  neutral: "bg-foreground/[0.06] text-foreground",
  blue: "bg-blue-500/10 text-blue-500",
  green: "bg-emerald-500/10 text-emerald-500",
  amber: "bg-amber-500/10 text-amber-500",
  red: "bg-red-500/10 text-red-500",
  purple: "bg-violet-500/10 text-violet-500",
  slate: "bg-slate-500/10 text-slate-400",
};

export function DatasetMetricStrip<TValue extends string>({
  metrics,
  activeValue,
  onSelect,
  loading = false,
}: {
  metrics: DatasetMetric<TValue>[];
  activeValue?: TValue;
  onSelect?: (value: TValue) => void;
  loading?: boolean;
}) {
  const columnClass =
    metrics.length === 3
      ? "lg:grid-cols-3"
      : metrics.length === 4
        ? "lg:grid-cols-4"
        : "lg:grid-cols-5";
  const oddMobileCount = metrics.length % 2 === 1;

  if (loading) {
    return (
      <div className={cn("grid grid-cols-2 gap-3", columnClass)}>
        {metrics.map((metric, index) => (
          <div
            key={`${metric.label}-${index}`}
            className={cn(
              "supplier-glass-card h-[106px] animate-pulse rounded-xl border",
              oddMobileCount && index === metrics.length - 1 && "col-span-2 lg:col-span-1"
            )}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-2 gap-3", columnClass)}>
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        const interactive = Boolean(onSelect && metric.filterValue);
        const active =
          metric.filterValue !== undefined && activeValue === metric.filterValue;
        const className = cn(
          "supplier-glass-card min-h-[106px] rounded-xl border p-3.5 text-left transition-all sm:p-4",
          oddMobileCount && index === metrics.length - 1 && "col-span-2 lg:col-span-1",
          interactive &&
            "hover:-translate-y-0.5 hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          active && "border-primary/60 ring-1 ring-primary/25"
        );

        const content = (
          <>
            <div className="flex items-start justify-between gap-3">
              <span
                className={cn(
                  "flex size-8 items-center justify-center rounded-lg",
                  TONE_CLASSES[metric.tone]
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
              </span>
              <span className="text-xl font-semibold tabular-nums text-foreground">
                {metric.value}
              </span>
            </div>
            <p className="mt-3 text-xs font-semibold text-foreground sm:text-sm">
              {metric.label}
            </p>
            <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
              {metric.supportingText}
            </p>
          </>
        );

        if (!interactive || !metric.filterValue) {
          return (
            <div key={metric.label} className={className}>
              {content}
            </div>
          );
        }

        return (
          <button
            key={metric.label}
            type="button"
            onClick={() => onSelect?.(metric.filterValue as TValue)}
            aria-pressed={active}
            className={className}
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}
