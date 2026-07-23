"use client";

import type { StatsTimeRange } from "@/types/supplier-stats.types";
import { cn } from "@/lib/utils";

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
    <div
      className="supplier-glass-panel inline-flex min-w-max gap-1 rounded-xl border p-1"
      role="group"
      aria-label="Analytics time range"
    >
      {ranges.map((range) => {
        const isActive = value === range.value;
        return (
          <button
            key={range.value}
            onClick={() => onChange(range.value)}
            className={cn(
              "rounded-lg border border-transparent px-3 py-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-foreground/[0.04] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-4",
              isActive && "border-primary/25 bg-primary/10 text-primary"
            )}
            aria-pressed={isActive}
          >
            {range.label}
          </button>
        );
      })}
    </div>
  );
}
