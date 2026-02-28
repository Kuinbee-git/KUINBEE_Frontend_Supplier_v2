"use client";

import { useSupplierTokens } from "@/hooks/useSupplierTokens";
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
    const tokens = useSupplierTokens();

    return (
        <div
            className="inline-flex rounded-xl p-1 gap-1"
            style={{
                background: tokens.glassBg,
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                border: `1px solid ${tokens.glassBorder}`,
            }}
        >
            {ranges.map((range) => {
                const isActive = value === range.value;
                return (
                    <button
                        key={range.value}
                        onClick={() => onChange(range.value)}
                        className="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-300"
                        style={{
                            background: isActive
                                ? tokens.isDark
                                    ? "rgba(74, 144, 226, 0.25)"
                                    : "rgba(26, 34, 64, 0.1)"
                                : "transparent",
                            color: isActive ? tokens.textPrimary : tokens.textMuted,
                            border: isActive
                                ? `1px solid ${tokens.isDark ? "rgba(74, 144, 226, 0.4)" : "rgba(26, 34, 64, 0.15)"}`
                                : "1px solid transparent",
                        }}
                    >
                        {range.label}
                    </button>
                );
            })}
        </div>
    );
}
