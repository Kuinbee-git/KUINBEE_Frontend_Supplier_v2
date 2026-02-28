"use client";

import { useSupplierTokens } from "@/hooks/useSupplierTokens";
import type { DatasetPerformanceItem } from "@/types/supplier-stats.types";
import { ArrowLeft, Star, Eye, ShoppingCart, IndianRupee } from "lucide-react";
import { useRouter } from "next/navigation";

interface DatasetDetailHeaderProps {
    dataset: DatasetPerformanceItem;
}

const statusColors: Record<string, { bg: string; text: string }> = {
    published: { bg: "rgba(16, 185, 129, 0.12)", text: "#10b981" },
    draft: { bg: "rgba(245, 158, 11, 0.12)", text: "#f59e0b" },
    pending: { bg: "rgba(74, 144, 226, 0.12)", text: "#4a90e2" },
    archived: { bg: "rgba(107, 114, 128, 0.12)", text: "#6b7280" },
};

export function DatasetDetailHeader({ dataset }: DatasetDetailHeaderProps) {
    const tokens = useSupplierTokens();
    const router = useRouter();
    const statusStyle = statusColors[dataset.status] || statusColors.draft;

    return (
        <div>
            {/* Back Button */}
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 mb-5 text-sm font-medium transition-all duration-200 hover:gap-3"
                style={{ color: tokens.textSecondary }}
            >
                <ArrowLeft className="w-4 h-4" />
                Back to Datasets
            </button>

            {/* Title Row */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <h1
                        className="text-2xl font-semibold"
                        style={{ color: tokens.textPrimary }}
                    >
                        {dataset.title}
                    </h1>
                    <span
                        className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold capitalize"
                        style={{ background: statusStyle.bg, color: statusStyle.text }}
                    >
                        {dataset.status}
                    </span>
                </div>

                {/* Quality Score Badge */}
                <div
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl"
                    style={{
                        background: tokens.isDark
                            ? "rgba(236, 72, 153, 0.1)"
                            : "rgba(236, 72, 153, 0.06)",
                        border: `1px solid ${tokens.isDark ? "rgba(236, 72, 153, 0.25)" : "rgba(236, 72, 153, 0.15)"}`,
                    }}
                >
                    <Star className="w-4 h-4" style={{ color: "#ec4899" }} />
                    <span className="text-sm font-semibold" style={{ color: tokens.textPrimary }}>
                        Quality: {dataset.qualityScore}/100
                    </span>
                </div>
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {[
                    { icon: <IndianRupee className="w-4 h-4" />, label: "Revenue", value: `₹${dataset.revenue.toLocaleString("en-IN")}`, color: "#10b981" },
                    { icon: <Eye className="w-4 h-4" />, label: "Views", value: dataset.views.toLocaleString(), color: "#f59e0b" },
                    { icon: <ShoppingCart className="w-4 h-4" />, label: "Sales", value: dataset.sales.toString(), color: "#4a90e2" },
                    { icon: <span className="text-xs font-bold">%</span>, label: "Conv. Rate", value: `${dataset.conversionRate.toFixed(2)}%`, color: "#8b5cf6" },
                ].map((stat) => (
                    <div
                        key={stat.label}
                        className="rounded-xl p-3.5 flex items-center gap-3"
                        style={{
                            background: tokens.glassBg,
                            backdropFilter: "blur(16px)",
                            border: `1px solid ${tokens.glassBorder}`,
                        }}
                    >
                        <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ background: `${stat.color}15`, color: stat.color }}
                        >
                            {stat.icon}
                        </div>
                        <div>
                            <p className="text-xs" style={{ color: tokens.textMuted }}>{stat.label}</p>
                            <p className="text-sm font-semibold" style={{ color: tokens.textPrimary }}>{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
