"use client";

import { useSupplierTokens } from "@/hooks/useSupplierTokens";
import type { DatasetPerformanceItem } from "@/types/supplier-stats.types";
import { Eye, ShoppingCart, TrendingUp } from "lucide-react";

interface DatasetConversionFunnelProps {
    dataset: DatasetPerformanceItem;
    loading?: boolean;
}

export function DatasetConversionFunnel({ dataset, loading }: DatasetConversionFunnelProps) {
    const tokens = useSupplierTokens();

    if (loading) {
        return (
            <div className="rounded-xl animate-pulse" style={{ background: "var(--muted)", height: "180px" }} />
        );
    }

    const conversionWidth = Math.max(dataset.conversionRate * 10, 8); // min 8% visual width

    return (
        <div className="space-y-5">
            {/* Views Stage */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4" style={{ color: "#4a90e2" }} />
                        <span className="text-sm font-medium" style={{ color: tokens.textPrimary }}>
                            Views
                        </span>
                    </div>
                    <span className="text-sm font-semibold" style={{ color: tokens.textPrimary }}>
                        {dataset.views.toLocaleString()}
                    </span>
                </div>
                <div
                    className="h-8 rounded-lg"
                    style={{
                        background: tokens.isDark ? "rgba(74, 144, 226, 0.2)" : "rgba(74, 144, 226, 0.15)",
                        width: "100%",
                    }}
                >
                    <div
                        className="h-full rounded-lg flex items-center justify-end px-3 transition-all duration-700"
                        style={{
                            background: "linear-gradient(90deg, rgba(74, 144, 226, 0.4), rgba(74, 144, 226, 0.8))",
                            width: "100%",
                        }}
                    >
                        <span className="text-xs font-semibold" style={{ color: "#fff" }}>100%</span>
                    </div>
                </div>
            </div>

            {/* Arrow */}
            <div className="flex items-center justify-center">
                <div
                    className="flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold"
                    style={{
                        background: tokens.isDark ? "rgba(139, 92, 246, 0.15)" : "rgba(139, 92, 246, 0.08)",
                        color: "#8b5cf6",
                        border: `1px solid ${tokens.isDark ? "rgba(139, 92, 246, 0.3)" : "rgba(139, 92, 246, 0.15)"}`,
                    }}
                >
                    <TrendingUp className="w-3 h-3" />
                    {dataset.conversionRate.toFixed(2)}% conversion
                </div>
            </div>

            {/* Sales Stage */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <ShoppingCart className="w-4 h-4" style={{ color: "#10b981" }} />
                        <span className="text-sm font-medium" style={{ color: tokens.textPrimary }}>
                            Sales
                        </span>
                    </div>
                    <span className="text-sm font-semibold" style={{ color: tokens.textPrimary }}>
                        {dataset.sales.toLocaleString()}
                    </span>
                </div>
                <div
                    className="h-8 rounded-lg"
                    style={{
                        background: tokens.isDark ? "rgba(16, 185, 129, 0.1)" : "rgba(16, 185, 129, 0.08)",
                        width: "100%",
                    }}
                >
                    <div
                        className="h-full rounded-lg flex items-center justify-end px-3 transition-all duration-700"
                        style={{
                            background: "linear-gradient(90deg, rgba(16, 185, 129, 0.4), rgba(16, 185, 129, 0.8))",
                            width: `${conversionWidth}%`,
                            minWidth: "60px",
                        }}
                    >
                        <span className="text-xs font-semibold" style={{ color: "#fff" }}>
                            {dataset.conversionRate.toFixed(1)}%
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
