"use client";

import { useSupplierTokens } from "@/hooks/useSupplierTokens";
import type { RevenueTrendPoint, Currency } from "@/types/supplier-stats.types";
import { getCurrencySymbol } from "@/lib/utils/currency.utils";
import {
    LineChart,
    Line,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    Legend,
} from "recharts";
import { useMemo } from "react";

interface RevenueTrendChartProps {
    data: RevenueTrendPoint[];
    loading?: boolean;
}

/** Distinct colors for each currency line */
const CURRENCY_COLORS: Record<string, string> = {
    INR: "#6366f1", // indigo
    USD: "#10b981", // emerald
    EUR: "#f59e0b", // amber
    GBP: "#ec4899", // pink
};

function formatDate(dateStr: string): string {
    if (dateStr.length === 7) {
        const [year, month] = dateStr.split("-");
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return `${months[parseInt(month) - 1]} '${year.slice(2)}`;
    }
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function RevenueTrendChart({ data, loading }: RevenueTrendChartProps) {
    const tokens = useSupplierTokens();

    // Discover all unique currencies in the data
    const currencies = useMemo(() => {
        const set = new Set<string>();
        data.forEach((p) => {
            if (p.currency) set.add(p.currency);
        });
        return Array.from(set).sort();
    }, [data]);

    // Transform data: pivot so each date has a column per currency
    // e.g. { date: "2026-03-02", INR: 7, USD: 0 }
    const chartData = useMemo(() => {
        // Group by date
        const dateMap = new Map<string, Record<string, number | string>>();

        // First pass: collect all unique dates in order
        const dateOrder: string[] = [];
        data.forEach((p) => {
            if (!dateMap.has(p.date)) {
                dateOrder.push(p.date);
                const row: Record<string, number | string> = { date: p.date };
                // Initialize all currencies to 0
                currencies.forEach((c) => { row[c] = 0; });
                dateMap.set(p.date, row);
            }
            const row = dateMap.get(p.date)!;
            if (p.currency) {
                row[p.currency] = Number(p.revenue);
            }
        });

        return dateOrder.map((d) => dateMap.get(d)!);
    }, [data, currencies]);

    if (loading) {
        return (
            <div
                className="rounded-xl animate-pulse"
                style={{ background: "var(--muted)", height: "320px" }}
            />
        );
    }

    if (data.length === 0) {
        return (
            <div
                className="flex items-center justify-center rounded-xl"
                style={{
                    height: 320,
                    background: tokens.isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
                    color: tokens.textMuted,
                }}
            >
                <p className="text-sm">No revenue data for this period</p>
            </div>
        );
    }

    const gridColor = tokens.isDark ? "rgba(255,255,255,0.06)" : "rgba(26,34,64,0.08)";

    return (
        <div>
            {/* Legend pills */}
            {currencies.length > 1 && (
                <div className="flex items-center gap-4 mb-4">
                    {currencies.map((c) => (
                        <div key={c} className="flex items-center gap-2">
                            <span
                                className="w-3 h-3 rounded-full"
                                style={{ background: CURRENCY_COLORS[c] || "#888" }}
                            />
                            <span
                                className="text-xs font-medium"
                                style={{ color: tokens.textSecondary }}
                            >
                                {c} ({getCurrencySymbol(c as Currency)})
                            </span>
                        </div>
                    ))}
                </div>
            )}

            <div style={{ width: "100%", height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        data={chartData}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
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
                            tick={{ fill: tokens.textMuted, fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                            width={50}
                            allowDecimals={false}
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
                                marginBottom: 6,
                            }}
                            labelFormatter={formatDate}
                            formatter={(value: number, name: string) => {
                                const symbol = getCurrencySymbol(name as Currency);
                                const locale = name === "INR" ? "en-IN" : "en-US";
                                return [`${symbol}${value.toLocaleString(locale)}`, name];
                            }}
                            itemStyle={{
                                fontSize: 13,
                                fontWeight: 600,
                            }}
                        />
                        {currencies.map((currency) => {
                            const color = CURRENCY_COLORS[currency] || "#888";
                            return (
                                <Line
                                    key={currency}
                                    type="monotone"
                                    dataKey={currency}
                                    name={currency}
                                    stroke={color}
                                    strokeWidth={2.5}
                                    dot={{ r: 4, fill: color, stroke: tokens.isDark ? "#0f1428" : "#ffffff", strokeWidth: 2 }}
                                    activeDot={{
                                        r: 6,
                                        fill: color,
                                        stroke: tokens.isDark ? "#0f1428" : "#ffffff",
                                        strokeWidth: 2.5,
                                    }}
                                    connectNulls={false}
                                />
                            );
                        })}
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
