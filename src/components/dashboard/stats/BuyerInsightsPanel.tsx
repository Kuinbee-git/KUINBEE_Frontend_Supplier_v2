"use client";

import { useMemo } from "react";
import { useSupplierTokens } from "@/hooks/useSupplierTokens";
import type { BuyerInsights, DatasetPerformanceItem } from "@/types/supplier-stats.types";
import { getCurrencySymbol, formatCurrencyShort } from "@/lib/utils/currency.utils";
import { Users, UserX, Crown, Calendar, ShoppingBag } from "lucide-react";
import {
    Bar,
    BarChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    Cell,
} from "recharts";

interface BuyerInsightsPanelProps {
    insights: BuyerInsights;
    loading?: boolean;
    /** Pass datasetPerformance to resolve IDs → titles for non-buyers */
    datasetPerformance?: DatasetPerformanceItem[];
}

const barColors = ["#6366f1", "#10b981", "#8b5cf6", "#f59e0b", "#ec4899"];

function formatRelativeDate(dateStr: string): string {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function BuyerInsightsPanel({ insights, loading, datasetPerformance = [] }: BuyerInsightsPanelProps) {
    const tokens = useSupplierTokens();

    // Build a lookup map for dataset IDs → titles
    const datasetTitleMap = useMemo(() => {
        const map = new Map<string, string>();
        datasetPerformance.forEach((d) => map.set(d.datasetId, d.title));
        return map;
    }, [datasetPerformance]);

    if (loading) {
        return (
            <div
                className="rounded-xl animate-pulse"
                style={{ background: "var(--muted)", height: "400px" }}
            />
        );
    }

    // Prep chart data for top buyers
    const chartData = insights.topBuyers.map((b) => ({
        name: b.name ? b.name.split(" ")[0] : "Anonymous",
        fullName: b.name ?? "Anonymous User",
        company: b.companyName ?? "—",
        spent: Number(b.totalSpent),
        currency: b.totalSpentCurrency,
        purchases: b.totalPurchases,
        lastPurchase: b.lastPurchaseDate,
    }));

    // Determine if all buyers share the same currency for axis formatting
    const currencies = new Set(insights.topBuyers.map((b) => b.totalSpentCurrency).filter(Boolean));
    const dominantCurrency = currencies.size === 1 ? [...currencies][0]! : null;

    return (
        <div className="space-y-6">
            {/* Summary Stats Row */}
            <div className="grid grid-cols-2 gap-4">
                <div
                    className="rounded-xl p-4 flex items-center gap-4"
                    style={{
                        background: tokens.isDark
                            ? "rgba(99, 102, 241, 0.08)"
                            : "rgba(99, 102, 241, 0.06)",
                        border: `1px solid ${tokens.isDark ? "rgba(99, 102, 241, 0.2)" : "rgba(99, 102, 241, 0.12)"}`,
                    }}
                >
                    <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ background: "rgba(99, 102, 241, 0.2)", color: "#6366f1" }}
                    >
                        <Users className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs" style={{ color: tokens.textMuted }}>Total Buyers</p>
                        <p className="text-xl font-bold" style={{ color: tokens.textPrimary }}>
                            {insights.totalBuyers}
                        </p>
                    </div>
                </div>
                <div
                    className="rounded-xl p-4 flex items-center gap-4"
                    style={{
                        background: tokens.isDark
                            ? "rgba(245, 158, 11, 0.08)"
                            : "rgba(245, 158, 11, 0.06)",
                        border: `1px solid ${tokens.isDark ? "rgba(245, 158, 11, 0.2)" : "rgba(245, 158, 11, 0.12)"}`,
                    }}
                >
                    <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ background: "rgba(245, 158, 11, 0.2)", color: "#f59e0b" }}
                    >
                        <UserX className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs" style={{ color: tokens.textMuted }}>Non-Buying Visitors</p>
                        <p className="text-xl font-bold" style={{ color: tokens.textPrimary }}>
                            {insights.totalNonBuyingUsers}
                        </p>
                    </div>
                </div>
            </div>

            {/* Top Buyers — Chart + Detail Table */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <Crown className="w-4 h-4" style={{ color: "#f59e0b" }} />
                    <h4 className="text-sm font-semibold" style={{ color: tokens.textPrimary }}>
                        Top Buyers by Spend
                    </h4>
                </div>

                {chartData.length > 0 ? (
                    <>
                        <div style={{ width: "100%", height: 200 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={chartData}
                                    layout="vertical"
                                    margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
                                >
                                    <XAxis
                                        type="number"
                                        tickFormatter={(v: number) => formatCurrencyShort(v, dominantCurrency)}
                                        tick={{ fill: tokens.textMuted, fontSize: 11 }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        type="category"
                                        dataKey="name"
                                        tick={{ fill: tokens.textSecondary, fontSize: 12 }}
                                        axisLine={false}
                                        tickLine={false}
                                        width={80}
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
                                        labelStyle={{ color: tokens.textSecondary, fontSize: 12 }}
                                        itemStyle={{ color: tokens.textPrimary, fontSize: 14, fontWeight: 600 }}
                                        formatter={(value: number, _name: string, props: any) => {
                                            const currency = props?.payload?.currency ?? dominantCurrency;
                                            const symbol = getCurrencySymbol(currency);
                                            const locale = currency === "INR" ? "en-IN" : "en-US";
                                            return [`${symbol}${value.toLocaleString(locale)}`, "Total Spent"];
                                        }}
                                        labelFormatter={(_: string, payload: any[]) => {
                                            if (payload?.[0]?.payload) {
                                                const p = payload[0].payload;
                                                return `${p.fullName}${p.company !== "—" ? ` — ${p.company}` : ""}`;
                                            }
                                            return "";
                                        }}
                                    />
                                    <Bar dataKey="spent" radius={[0, 6, 6, 0]} barSize={24}>
                                        {chartData.map((_, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={barColors[index % barColors.length]}
                                                fillOpacity={0.85}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Buyer detail cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                            {insights.topBuyers.map((buyer, idx) => (
                                <div
                                    key={buyer.userId}
                                    className="rounded-lg p-3"
                                    style={{
                                        background: tokens.isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                                        border: `1px solid ${tokens.borderSubtle}`,
                                    }}
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <div
                                            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                                            style={{ background: `${barColors[idx % barColors.length]}20`, color: barColors[idx % barColors.length] }}
                                        >
                                            {idx + 1}
                                        </div>
                                        <p className="text-sm font-medium truncate" style={{ color: tokens.textPrimary }}>
                                            {buyer.name ?? "Anonymous User"}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs" style={{ color: tokens.textMuted }}>
                                        <span className="flex items-center gap-1">
                                            <ShoppingBag className="w-3 h-3" />
                                            {buyer.totalPurchases} purchases
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {buyer.lastPurchaseDate ? formatRelativeDate(buyer.lastPurchaseDate) : "—"}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <p className="text-sm" style={{ color: tokens.textMuted }}>No buyer data available</p>
                )}
            </div>

            {/* High Intent Non-Buyers Table */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <UserX className="w-4 h-4" style={{ color: "#f59e0b" }} />
                    <h4 className="text-sm font-semibold" style={{ color: tokens.textPrimary }}>
                        High-Intent Non-Buyers
                    </h4>
                </div>
                {insights.highIntentNonBuyers.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr style={{ borderBottom: `1px solid ${tokens.borderDefault}` }}>
                                    <th
                                        className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider"
                                        style={{ color: tokens.textMuted }}
                                    >
                                        Name
                                    </th>
                                    <th
                                        className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider"
                                        style={{ color: tokens.textMuted }}
                                    >
                                        Views
                                    </th>
                                    <th
                                        className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider"
                                        style={{ color: tokens.textMuted }}
                                    >
                                        Viewed Datasets
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {insights.highIntentNonBuyers.map((user, idx) => (
                                    <tr
                                        key={user.userId}
                                        className="transition-colors duration-200"
                                        style={{
                                            borderBottom:
                                                idx < insights.highIntentNonBuyers.length - 1
                                                    ? `1px solid ${tokens.borderSubtle}`
                                                    : undefined,
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = tokens.isDark
                                                ? "rgba(255,255,255,0.03)"
                                                : "rgba(26,34,64,0.02)";
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = "transparent";
                                        }}
                                    >
                                        <td className="px-4 py-3">
                                            <p className="text-sm font-medium" style={{ color: tokens.textPrimary }}>
                                                {user.name ?? "Anonymous User"}
                                            </p>
                                            {user.companyName && (
                                                <p className="text-xs mt-0.5" style={{ color: tokens.textMuted }}>
                                                    {user.companyName}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <p className="text-sm font-semibold" style={{ color: tokens.textPrimary }}>
                                                {user.totalViews}
                                            </p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-1.5">
                                                {user.viewedDatasets.slice(0, 3).map((dsId) => {
                                                    const title = datasetTitleMap.get(dsId) || dsId;
                                                    const displayTitle = title.length > 22 ? `${title.slice(0, 20)}…` : title;
                                                    return (
                                                        <span
                                                            key={dsId}
                                                            className="inline-flex px-2 py-0.5 rounded-md text-xs"
                                                            style={{
                                                                background: tokens.isDark
                                                                    ? "rgba(255,255,255,0.06)"
                                                                    : "rgba(26,34,64,0.06)",
                                                                color: tokens.textSecondary,
                                                            }}
                                                            title={title}
                                                        >
                                                            {displayTitle}
                                                        </span>
                                                    );
                                                })}
                                                {user.viewedDatasets.length > 3 && (
                                                    <span
                                                        className="inline-flex px-2 py-0.5 rounded-md text-xs"
                                                        style={{ color: tokens.textMuted }}
                                                    >
                                                        +{user.viewedDatasets.length - 3}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-sm" style={{ color: tokens.textMuted }}>No high-intent visitors detected</p>
                )}
            </div>
        </div>
    );
}
