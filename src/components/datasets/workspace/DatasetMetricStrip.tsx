"use client";

import type { LucideIcon } from "lucide-react";

import { DashboardMetricCard } from "@/components/dashboard";
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

  return (
    <div className={cn("grid grid-cols-2 gap-3", columnClass)}>
      {metrics.map((metric, index) => {
        const interactive = Boolean(onSelect && metric.filterValue);
        const active =
          metric.filterValue !== undefined &&
          activeValue === metric.filterValue;
        const cardClassName = cn(
          oddMobileCount &&
            index === metrics.length - 1 &&
            "col-span-2 lg:col-span-1",
          interactive &&
            "cursor-pointer text-left transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-foreground/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dashboard-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transform-none",
          active &&
            "border-[var(--dashboard-focus-ring)] ring-1 ring-[var(--dashboard-focus-ring)]"
        );

        return (
          <DashboardMetricCard
            key={metric.label}
            icon={metric.icon}
            label={metric.label}
            value={metric.value}
            supportingText={metric.supportingText}
            loading={loading}
            loadingLabel={`Loading ${metric.label}`}
            role={interactive ? "button" : undefined}
            tabIndex={interactive ? 0 : undefined}
            aria-pressed={interactive ? active : undefined}
            onClick={
              interactive && metric.filterValue
                ? () => onSelect?.(metric.filterValue as TValue)
                : undefined
            }
            onKeyDown={
              interactive && metric.filterValue
                ? (event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelect?.(metric.filterValue as TValue);
                    }
                  }
                : undefined
            }
            className={cardClassName}
          />
        );
      })}
    </div>
  );
}
