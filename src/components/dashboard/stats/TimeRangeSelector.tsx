"use client";

import { DashboardButton, DashboardCard } from "@/components/dashboard";
import type { StatsTimeRange } from "@/types/supplier-stats.types";

const ranges: { value: StatsTimeRange; label: string }[] = [
  { value: "7d", label: "7D" },
  { value: "30d", label: "30D" },
  { value: "90d", label: "90D" },
  { value: "1y", label: "1Y" },
  { value: "lifetime", label: "All" },
];

interface TimeRangeSelectorProps {
  value: StatsTimeRange;
  onChange: (range: StatsTimeRange) => void;
}

export function TimeRangeSelector({ value, onChange }: TimeRangeSelectorProps) {
  return (
    <DashboardCard
      className="inline-flex min-w-max gap-1 p-1"
      role="group"
      aria-label="Analytics time range"
    >
      {ranges.map((range) => {
        const active = value === range.value;

        return (
          <DashboardButton
            key={range.value}
            type="button"
            variant={active ? "secondary" : "ghost"}
            size="compact"
            className="min-w-10 px-2.5 shadow-none"
            aria-pressed={active}
            onClick={() => onChange(range.value)}
          >
            {range.label}
          </DashboardButton>
        );
      })}
    </DashboardCard>
  );
}
