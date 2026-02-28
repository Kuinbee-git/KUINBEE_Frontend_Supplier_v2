"use client";

import { useSupplierTokens } from "@/hooks/useSupplierTokens";
import type { PerformingDataset } from "@/types/supplier-stats.types";
import { TrendingUp, TrendingDown, Eye, ShoppingCart, IndianRupee, BarChart2 } from "lucide-react";

interface TopLowPerformingDatasetsProps {
    topPerforming: PerformingDataset | null;
    lowPerforming: PerformingDataset | null;
    loading?: boolean;
}

function PerformanceCard({
    dataset,
    type,
}: {
    dataset: PerformingDataset | null;
    type: "top" | "low";
}) {
    const tokens = useSupplierTokens();
    const isTop = type === "top";

    const accentColor = isTop ? "#10b981" : "#f59e0b";
    const accentBg = isTop
        ? tokens.isDark
            ? "rgba(16, 185, 129, 0.08)"
            : "rgba(16, 185, 129, 0.06)"
        : tokens.isDark
            ? "rgba(245, 158, 11, 0.08)"
            : "rgba(245, 158, 11, 0.06)";
    const borderAccent = isTop
        ? tokens.isDark
            ? "rgba(16, 185, 129, 0.2)"
            : "rgba(16, 185, 129, 0.15)"
        : tokens.isDark
            ? "rgba(245, 158, 11, 0.2)"
            : "rgba(245, 158, 11, 0.15)";

    if (!dataset) {
        return (
            <div
                className="flex-1 rounded-xl p-5 flex flex-col items-center justify-center min-h-[180px]"
                style={{
                    background: tokens.glassBg,
                    backdropFilter: "blur(16px)",
                    border: `1px solid ${tokens.glassBorder}`,
                    boxShadow: tokens.glassShadow,
                }}
            >
                <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                    style={{ background: `${accentColor}12`, color: accentColor }}
                >
                    {isTop ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                </div>
                <p className="text-sm font-medium" style={{ color: tokens.textMuted }}>
                    {isTop ? "No sales data yet" : "No qualifying datasets"}
                </p>
            </div>
        );
    }

    return (
        <div
            className="flex-1 rounded-xl p-5 transition-all duration-300 hover:scale-[1.01]"
            style={{
                background: accentBg,
                backdropFilter: "blur(16px)",
                border: `1px solid ${borderAccent}`,
                boxShadow: tokens.glassShadow,
            }}
        >
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
                <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: `${accentColor}20`, color: accentColor }}
                >
                    {isTop ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                </div>
                <span
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: accentColor }}
                >
                    {isTop ? "Top Performer" : "Needs Attention"}
                </span>
            </div>

            {/* Dataset Name */}
            <p
                className="text-base font-semibold mb-4 truncate"
                style={{ color: tokens.textPrimary }}
                title={dataset.title}
            >
                {dataset.title}
            </p>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                    <IndianRupee className="w-3.5 h-3.5" style={{ color: tokens.textMuted }} />
                    <div>
                        <p className="text-xs" style={{ color: tokens.textMuted }}>Revenue</p>
                        <p className="text-sm font-semibold" style={{ color: tokens.textPrimary }}>
                            ₹{dataset.revenue.toLocaleString("en-IN")}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Eye className="w-3.5 h-3.5" style={{ color: tokens.textMuted }} />
                    <div>
                        <p className="text-xs" style={{ color: tokens.textMuted }}>Views</p>
                        <p className="text-sm font-semibold" style={{ color: tokens.textPrimary }}>
                            {dataset.views.toLocaleString()}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <ShoppingCart className="w-3.5 h-3.5" style={{ color: tokens.textMuted }} />
                    <div>
                        <p className="text-xs" style={{ color: tokens.textMuted }}>Sales</p>
                        <p className="text-sm font-semibold" style={{ color: tokens.textPrimary }}>
                            {dataset.sales}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <BarChart2 className="w-3.5 h-3.5" style={{ color: tokens.textMuted }} />
                    <div>
                        <p className="text-xs" style={{ color: tokens.textMuted }}>Conv. Rate</p>
                        <p className="text-sm font-semibold" style={{ color: accentColor }}>
                            {dataset.conversionRate.toFixed(2)}%
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function TopLowPerformingDatasets({
    topPerforming,
    lowPerforming,
    loading,
}: TopLowPerformingDatasetsProps) {
    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[0, 1].map((i) => (
                    <div
                        key={i}
                        className="rounded-xl animate-pulse"
                        style={{ background: "var(--muted)", height: "220px" }}
                    />
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PerformanceCard dataset={topPerforming} type="top" />
            <PerformanceCard dataset={lowPerforming} type="low" />
        </div>
    );
}
