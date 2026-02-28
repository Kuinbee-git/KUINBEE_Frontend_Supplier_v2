"use client";

import { useSupplierTokens } from "@/hooks/useSupplierTokens";
import type { StatsOverview } from "@/types/supplier-stats.types";
import {
    IndianRupee,
    ShoppingCart,
    Database,
    Eye,
    Star,
    Clock,
    TrendingUp,
} from "lucide-react";
import { type ReactNode } from "react";

interface StatsOverviewCardsProps {
    overview: StatsOverview;
    loading?: boolean;
}

interface MetricCardProps {
    icon: ReactNode;
    label: string;
    value: string;
    accentColor: string;
}

function MetricCard({ icon, label, value, accentColor }: MetricCardProps) {
    const tokens = useSupplierTokens();

    return (
        <div
            className="rounded-xl p-5 transition-all duration-300 hover:scale-[1.02] group"
            style={{
                background: tokens.glassBg,
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                border: `1px solid ${tokens.glassBorder}`,
                boxShadow: tokens.glassShadow,
            }}
        >
            <div className="flex items-center gap-3 mb-3">
                <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                    style={{
                        background: `${accentColor}15`,
                        color: accentColor,
                    }}
                >
                    {icon}
                </div>
                <p
                    className="text-xs font-medium uppercase tracking-wider"
                    style={{ color: tokens.textMuted }}
                >
                    {label}
                </p>
            </div>
            <p
                className="text-2xl font-bold"
                style={{ color: tokens.textPrimary, lineHeight: "1.2" }}
            >
                {value}
            </p>
        </div>
    );
}

export function StatsOverviewCards({ overview, loading }: StatsOverviewCardsProps) {
    if (loading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 7 }).map((_, i) => (
                    <div
                        key={i}
                        className="rounded-xl p-5 animate-pulse"
                        style={{ background: "var(--muted)", height: "120px" }}
                    />
                ))}
            </div>
        );
    }

    const metrics: MetricCardProps[] = [
        {
            icon: <IndianRupee className="w-5 h-5" />,
            label: "Total Revenue",
            value: `₹${overview.totalRevenue.toLocaleString("en-IN")}`,
            accentColor: "#10b981",
        },
        {
            icon: <ShoppingCart className="w-5 h-5" />,
            label: "Total Sales",
            value: overview.totalSales.toLocaleString(),
            accentColor: "#4a90e2",
        },
        {
            icon: <Database className="w-5 h-5" />,
            label: "Active Datasets",
            value: overview.activeDatasets.toString(),
            accentColor: "#8b5cf6",
        },
        {
            icon: <Eye className="w-5 h-5" />,
            label: "Total Views",
            value: overview.totalViews.toLocaleString(),
            accentColor: "#f59e0b",
        },
        {
            icon: <Star className="w-5 h-5" />,
            label: "Avg Quality Score",
            value: `${overview.averageQualityScore.toFixed(1)}`,
            accentColor: "#ec4899",
        },
        {
            icon: <Clock className="w-5 h-5" />,
            label: "Pending Validations",
            value: overview.pendingValidationCount.toString(),
            accentColor: "#f97316",
        },
        {
            icon: <TrendingUp className="w-5 h-5" />,
            label: "Conversion Rate",
            value: `${overview.conversionRate.toFixed(2)}%`,
            accentColor: "#06b6d4",
        },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.map((metric) => (
                <MetricCard key={metric.label} {...metric} />
            ))}
        </div>
    );
}
