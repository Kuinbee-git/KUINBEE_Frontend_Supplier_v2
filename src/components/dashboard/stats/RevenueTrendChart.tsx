"use client";

import { useSupplierTokens } from "@/hooks/useSupplierTokens";
import type { RevenueTrendPoint } from "@/types/supplier-stats.types";
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

interface RevenueTrendChartProps {
    data: RevenueTrendPoint[];
    loading?: boolean;
}

function formatDate(dateStr: string): string {
    if (dateStr.length === 7) {
        // Monthly: YYYY-MM
        const [year, month] = dateStr.split("-");
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return `${months[parseInt(month) - 1]} '${year.slice(2)}`;
    }
    // Daily: YYYY-MM-DD
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function formatCurrency(value: number): string {
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
    return `₹${value}`;
}

export function RevenueTrendChart({ data, loading }: RevenueTrendChartProps) {
    const tokens = useSupplierTokens();

    if (loading) {
        return (
            <div
                className="rounded-xl animate-pulse"
                style={{ background: "var(--muted)", height: "320px" }}
            />
        );
    }

    const gradientId = "revenueGradient";
    const lineColor = tokens.isDark ? "#4a90e2" : "#1a2240";
    const gridColor = tokens.isDark ? "rgba(255,255,255,0.06)" : "rgba(26,34,64,0.08)";

    return (
        <div style={{ width: "100%", height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={data}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                    <defs>
                        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={lineColor} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={lineColor} stopOpacity={0.02} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={gridColor}
                        vertical={false}
                    />
                    <XAxis
                        dataKey="date"
                        tickFormatter={formatDate}
                        tick={{ fill: tokens.textMuted, fontSize: 11 }}
                        axisLine={{ stroke: gridColor }}
                        tickLine={false}
                        interval="preserveStartEnd"
                        minTickGap={40}
                    />
                    <YAxis
                        tickFormatter={formatCurrency}
                        tick={{ fill: tokens.textMuted, fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        width={60}
                    />
                    <Tooltip
                        contentStyle={{
                            background: tokens.isDark
                                ? "rgba(20, 27, 54, 0.95)"
                                : "rgba(255, 255, 255, 0.95)",
                            border: `1px solid ${tokens.borderDefault}`,
                            borderRadius: "12px",
                            backdropFilter: "blur(16px)",
                            boxShadow: tokens.glassShadow,
                            padding: "12px 16px",
                        }}
                        labelStyle={{
                            color: tokens.textSecondary,
                            fontSize: 12,
                            marginBottom: 4,
                        }}
                        itemStyle={{
                            color: tokens.textPrimary,
                            fontSize: 14,
                            fontWeight: 600,
                        }}
                        formatter={(value: number) => [`₹${value.toLocaleString("en-IN")}`, "Revenue"]}
                        labelFormatter={formatDate}
                    />
                    <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke={lineColor}
                        strokeWidth={2.5}
                        fill={`url(#${gradientId})`}
                        dot={false}
                        activeDot={{
                            r: 5,
                            fill: lineColor,
                            stroke: tokens.isDark ? "#0f1428" : "#ffffff",
                            strokeWidth: 2.5,
                        }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
