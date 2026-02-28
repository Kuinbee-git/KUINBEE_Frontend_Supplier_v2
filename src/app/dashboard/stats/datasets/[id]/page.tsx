"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useSupplierTokens } from "@/hooks/useSupplierTokens";
import { getMockDatasetDetail } from "@/lib/api/stats";
import { GlassCard } from "@/components/shared";
import { DatasetDetailHeader } from "@/components/dashboard/stats/DatasetDetailHeader";
import { DatasetViewsSalesChart } from "@/components/dashboard/stats/DatasetViewsSalesChart";
import { DatasetConversionFunnel } from "@/components/dashboard/stats/DatasetConversionFunnel";
import { RevenueTrendChart } from "@/components/dashboard/stats/RevenueTrendChart";
import { TimeRangeSelector } from "@/components/dashboard/stats/TimeRangeSelector";
import type { StatsTimeRange, DatasetDetailStats } from "@/types/supplier-stats.types";
import { TrendingUp, BarChart3, Users, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

function DatasetDetailContent() {
    const tokens = useSupplierTokens();
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const datasetId = params.id as string;
    const range = (searchParams.get("range") as StatsTimeRange) || "30d";
    const [detail, setDetail] = useState<DatasetDetailStats | null>(null);
    const [loading, setLoading] = useState(true);

    const handleRangeChange = (newRange: StatsTimeRange) => {
        const p = new URLSearchParams(searchParams.toString());
        p.set("range", newRange);
        router.push(`/dashboard/stats/datasets/${datasetId}?${p.toString()}`);
    };

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const data = getMockDatasetDetail(datasetId, range);
            await new Promise((resolve) => setTimeout(resolve, 400));
            setDetail(data);
        } catch (error) {
            console.error("Failed to fetch dataset detail:", error);
        } finally {
            setLoading(false);
        }
    }, [datasetId, range]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (!loading && !detail) {
        return (
            <div className="max-w-[1400px] mx-auto px-8 py-7">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 mb-5 text-sm font-medium transition-all duration-200 hover:gap-3"
                    style={{ color: tokens.textSecondary }}
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Datasets
                </button>
                <GlassCard>
                    <div className="p-10 text-center">
                        <p className="text-lg font-medium" style={{ color: tokens.textPrimary }}>
                            Dataset not found
                        </p>
                        <p className="text-sm mt-2" style={{ color: tokens.textSecondary }}>
                            The dataset you're looking for doesn't exist or has been removed.
                        </p>
                    </div>
                </GlassCard>
            </div>
        );
    }

    // Build revenue trend from time series data
    const revenueTrend = detail?.timeSeries.map((t) => ({
        date: t.date,
        revenue: t.revenue,
    })) || [];

    return (
        <div>
            {/* Header + Range Selector */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-2">
                <div className="flex-1">
                    {detail && (
                        <div style={{ animation: "fadeIn 0.4s ease-out" }}>
                            <DatasetDetailHeader dataset={detail.dataset} />
                        </div>
                    )}
                    {loading && (
                        <div className="space-y-3">
                            <div className="h-6 w-48 rounded-lg animate-pulse" style={{ background: "var(--muted)" }} />
                            <div className="h-10 w-96 rounded-lg animate-pulse" style={{ background: "var(--muted)" }} />
                            <div className="grid grid-cols-4 gap-3">
                                {[0, 1, 2, 3].map((i) => (
                                    <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: "var(--muted)" }} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex-shrink-0">
                    <TimeRangeSelector value={range} onChange={handleRangeChange} />
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Revenue Trend */}
                <div style={{ animation: "fadeIn 0.5s ease-out 0.1s backwards" }}>
                    <GlassCard>
                        <div className="p-5">
                            <div className="flex items-center gap-3 mb-4">
                                <TrendingUp className="w-5 h-5" style={{ color: tokens.textPrimary }} />
                                <h2 className="text-base font-semibold" style={{ color: tokens.textPrimary }}>
                                    Revenue Over Time
                                </h2>
                            </div>
                            <RevenueTrendChart data={revenueTrend} loading={loading} />
                        </div>
                    </GlassCard>
                </div>

                {/* Views vs Sales */}
                <div style={{ animation: "fadeIn 0.5s ease-out 0.2s backwards" }}>
                    <GlassCard>
                        <div className="p-5">
                            <div className="flex items-center gap-3 mb-4">
                                <BarChart3 className="w-5 h-5" style={{ color: tokens.textPrimary }} />
                                <h2 className="text-base font-semibold" style={{ color: tokens.textPrimary }}>
                                    Views vs Sales
                                </h2>
                            </div>
                            <DatasetViewsSalesChart data={detail?.timeSeries || []} loading={loading} />
                        </div>
                    </GlassCard>
                </div>

                {/* Conversion Funnel */}
                <div style={{ animation: "fadeIn 0.5s ease-out 0.3s backwards" }}>
                    <GlassCard>
                        <div className="p-5">
                            <div className="flex items-center gap-3 mb-4">
                                <TrendingUp className="w-5 h-5" style={{ color: tokens.textPrimary }} />
                                <h2 className="text-base font-semibold" style={{ color: tokens.textPrimary }}>
                                    Conversion Funnel
                                </h2>
                            </div>
                            {detail && <DatasetConversionFunnel dataset={detail.dataset} loading={loading} />}
                            {loading && (
                                <div className="rounded-xl animate-pulse" style={{ background: "var(--muted)", height: "180px" }} />
                            )}
                        </div>
                    </GlassCard>
                </div>

                {/* Recent Buyers */}
                <div style={{ animation: "fadeIn 0.5s ease-out 0.4s backwards" }}>
                    <GlassCard>
                        <div className="p-5">
                            <div className="flex items-center gap-3 mb-4">
                                <Users className="w-5 h-5" style={{ color: tokens.textPrimary }} />
                                <h2 className="text-base font-semibold" style={{ color: tokens.textPrimary }}>
                                    Recent Buyers
                                </h2>
                            </div>
                            {loading ? (
                                <div className="rounded-xl animate-pulse" style={{ background: "var(--muted)", height: "200px" }} />
                            ) : detail && detail.recentBuyers.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr style={{ borderBottom: `1px solid ${tokens.borderDefault}` }}>
                                                {["Buyer", "Company", "Date", "Amount"].map((h) => (
                                                    <th
                                                        key={h}
                                                        className={`px-3 py-2.5 text-xs font-semibold uppercase tracking-wider ${h === "Amount" ? "text-right" : "text-left"}`}
                                                        style={{ color: tokens.textMuted }}
                                                    >
                                                        {h}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {detail.recentBuyers.map((buyer, idx) => (
                                                <tr
                                                    key={buyer.userId}
                                                    className="transition-colors duration-200"
                                                    style={{
                                                        borderBottom:
                                                            idx < detail.recentBuyers.length - 1
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
                                                    <td className="px-3 py-3">
                                                        <p className="text-sm font-medium" style={{ color: tokens.textPrimary }}>
                                                            {buyer.name}
                                                        </p>
                                                    </td>
                                                    <td className="px-3 py-3">
                                                        <p className="text-sm" style={{ color: tokens.textSecondary }}>
                                                            {buyer.companyName}
                                                        </p>
                                                    </td>
                                                    <td className="px-3 py-3">
                                                        <p className="text-sm" style={{ color: tokens.textSecondary }}>
                                                            {new Date(buyer.purchaseDate).toLocaleDateString("en-IN", {
                                                                day: "numeric",
                                                                month: "short",
                                                                year: "numeric",
                                                            })}
                                                        </p>
                                                    </td>
                                                    <td className="px-3 py-3 text-right">
                                                        <p className="text-sm font-medium" style={{ color: tokens.textPrimary }}>
                                                            ₹{buyer.amount.toLocaleString("en-IN")}
                                                        </p>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-sm" style={{ color: tokens.textMuted }}>No buyers yet</p>
                                </div>
                            )}
                        </div>
                    </GlassCard>
                </div>
            </div>
        </div>
    );
}

export default function DatasetDetailPage() {
    return (
        <Suspense
            fallback={
                <div className="max-w-[1400px] mx-auto px-8 py-7 space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="rounded-xl animate-pulse h-40" style={{ background: "var(--muted)" }} />
                    ))}
                </div>
            }
        >
            <DatasetDetailContent />
        </Suspense>
    );
}
