"use client";

import type { LucideIcon } from "lucide-react";

import {
  DashboardMetricCard,
  DashboardMetricGroup,
} from "@/components/dashboard";
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
  return (
    <DashboardMetricGroup
      columns={metrics.length <= 3 ? 3 : metrics.length === 4 ? 4 : 5}
    >
      {metrics.map((metric) => {
        const interactive = Boolean(onSelect && metric.filterValue);
        const active =
          metric.filterValue !== undefined &&
          activeValue === metric.filterValue;
        const cardClassName = cn(
          "min-h-0 p-4 md:px-6 md:py-4",
          interactive &&
            "cursor-pointer text-left transition-colors hover:border-foreground/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dashboard-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transform-none"
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
    </DashboardMetricGroup>
  );
}
