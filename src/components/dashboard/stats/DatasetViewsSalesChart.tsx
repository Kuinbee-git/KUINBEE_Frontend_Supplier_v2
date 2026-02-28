"use client";

import { useSupplierTokens } from "@/hooks/useSupplierTokens";
import type { DatasetTimePoint } from "@/types/supplier-stats.types";
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

interface DatasetViewsSalesChartProps {
    data: DatasetTimePoint[];
    loading?: boolean;
}

function formatDate(dateStr: string): string {
    if (dateStr.length === 7) {
        const [year, month] = dateStr.split("-");
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return `${months[parseInt(month) - 1]} '${year.slice(2)}`;
    }
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function DatasetViewsSalesChart({ data, loading }: DatasetViewsSalesChartProps) {
    const tokens = useSupplierTokens();

    if (loading) {
        return (
            <div className="rounded-xl animate-pulse" style={{ background: "var(--muted)", height: "280px" }} />
        );
    }

    const viewsColor = tokens.isDark ? "#4a90e2" : "#1a2240";
    const salesColor = "#10b981";
    const gridColor = tokens.isDark ? "rgba(255,255,255,0.06)" : "rgba(26,34,64,0.08)";

    return (
        <div style={{ width: "100%", height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={viewsColor} stopOpacity={0.2} />
                            <stop offset="95%" stopColor={viewsColor} stopOpacity={0.01} />
                        </linearGradient>
                        <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={salesColor} stopOpacity={0.2} />
                            <stop offset="95%" stopColor={salesColor} stopOpacity={0.01} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
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
                        tick={{ fill: tokens.textMuted, fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        width={45}
                    />
                    <Tooltip
                        contentStyle={{
                            background: tokens.isDark ? "rgba(20, 27, 54, 0.95)" : "rgba(255, 255, 255, 0.95)",
                            border: `1px solid ${tokens.borderDefault}`,
                            borderRadius: "12px",
                            backdropFilter: "blur(16px)",
                            boxShadow: tokens.glassShadow,
                            padding: "12px 16px",
                        }}
                        labelStyle={{ color: tokens.textSecondary, fontSize: 12, marginBottom: 4 }}
                        labelFormatter={formatDate}
                    />
                    <Area
                        type="monotone"
                        dataKey="views"
                        stroke={viewsColor}
                        strokeWidth={2}
                        fill="url(#viewsGradient)"
                        dot={false}
                        name="Views"
                        activeDot={{ r: 4, fill: viewsColor, stroke: tokens.isDark ? "#0f1428" : "#fff", strokeWidth: 2 }}
                    />
                    <Area
                        type="monotone"
                        dataKey="sales"
                        stroke={salesColor}
                        strokeWidth={2}
                        fill="url(#salesGradient)"
                        dot={false}
                        name="Sales"
                        activeDot={{ r: 4, fill: salesColor, stroke: tokens.isDark ? "#0f1428" : "#fff", strokeWidth: 2 }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
