"use client";

import { useSupplierTokens } from "@/hooks/useSupplierTokens";
import type { BuyerInsights, TopBuyer } from "@/types/supplier-stats.types";
import { Users, UserX, Crown } from "lucide-react";
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
}

const barColors = ["#4a90e2", "#10b981", "#8b5cf6", "#f59e0b", "#ec4899"];

export function BuyerInsightsPanel({ insights, loading }: BuyerInsightsPanelProps) {
    const tokens = useSupplierTokens();

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
        name: b.name ? b.name.split(" ")[0] : "Unknown", // first name for brevity
        fullName: b.name ?? "Unknown",
        company: b.companyName,
        spent: b.totalSpent,
    }));

    return (
        <div className="space-y-6">
            {/* Summary Stats Row */}
            <div className="grid grid-cols-2 gap-4">
                <div
                    className="rounded-xl p-4 flex items-center gap-4"
                    style={{
                        background: tokens.isDark
                            ? "rgba(74, 144, 226, 0.08)"
                            : "rgba(74, 144, 226, 0.06)",
                        border: `1px solid ${tokens.isDark ? "rgba(74, 144, 226, 0.2)" : "rgba(74, 144, 226, 0.12)"}`,
                    }}
                >
                    <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ background: "rgba(74, 144, 226, 0.2)", color: "#4a90e2" }}
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

            {/* Top Buyers Chart */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <Crown className="w-4 h-4" style={{ color: "#f59e0b" }} />
                    <h4 className="text-sm font-semibold" style={{ color: tokens.textPrimary }}>
                        Top Buyers by Spend
                    </h4>
                </div>
                <div style={{ width: "100%", height: 220 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={chartData}
                            layout="vertical"
                            margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
                        >
                            <XAxis
                                type="number"
                                tickFormatter={(v: number) =>
                                    v >= 1000 ? `₹${(v / 1000).toFixed(0)}K` : `₹${v}`
                                }
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
                                width={70}
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
                                formatter={(value: number) => [`₹${value.toLocaleString("en-IN")}`, "Total Spent"]}
                                labelFormatter={(_: string, payload: any[]) => {
                                    if (payload?.[0]?.payload) {
                                        return `${payload[0].payload.fullName} — ${payload[0].payload.company}`;
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
            </div>

            {/* High Intent Non-Buyers Table */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <UserX className="w-4 h-4" style={{ color: "#f59e0b" }} />
                    <h4 className="text-sm font-semibold" style={{ color: tokens.textPrimary }}>
                        High-Intent Non-Buyers
                    </h4>
                </div>
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
                                    className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider"
                                    style={{ color: tokens.textMuted }}
                                >
                                    Company
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
                                            {user.name}
                                        </p>
                                    </td>
                                    <td className="px-4 py-3">
                                        <p className="text-sm" style={{ color: tokens.textSecondary }}>
                                            {user.companyName}
                                        </p>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <p className="text-sm font-medium" style={{ color: tokens.textPrimary }}>
                                            {user.totalViews}
                                        </p>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-wrap gap-1.5">
                                            {user.viewedDatasets.slice(0, 2).map((ds) => (
                                                <span
                                                    key={ds}
                                                    className="inline-flex px-2 py-0.5 rounded-md text-xs"
                                                    style={{
                                                        background: tokens.isDark
                                                            ? "rgba(255,255,255,0.06)"
                                                            : "rgba(26,34,64,0.06)",
                                                        color: tokens.textSecondary,
                                                    }}
                                                >
                                                    {ds.length > 20 ? `${ds.slice(0, 18)}…` : ds}
                                                </span>
                                            ))}
                                            {user.viewedDatasets.length > 2 && (
                                                <span
                                                    className="inline-flex px-2 py-0.5 rounded-md text-xs"
                                                    style={{ color: tokens.textMuted }}
                                                >
                                                    +{user.viewedDatasets.length - 2}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
