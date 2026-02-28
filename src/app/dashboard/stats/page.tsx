"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useSupplierTokens } from "@/hooks/useSupplierTokens";
import { getMockSupplierStats } from "@/lib/api/stats";
import { GlassCard } from "@/components/shared";
import { StatsOverviewCards } from "@/components/dashboard/stats/StatsOverviewCards";
import { RevenueTrendChart } from "@/components/dashboard/stats/RevenueTrendChart";
import { TopLowPerformingDatasets } from "@/components/dashboard/stats/TopLowPerformingDatasets";
import type { StatsTimeRange, SupplierStatsResponse } from "@/types/supplier-stats.types";
import { TrendingUp } from "lucide-react";

function StatsOverviewContent() {
    const tokens = useSupplierTokens();
    const searchParams = useSearchParams();
    const range = (searchParams.get("range") as StatsTimeRange) || "30d";
    const [stats, setStats] = useState<SupplierStatsResponse | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchStats = useCallback(async (selectedRange: StatsTimeRange) => {
        setLoading(true);
        try {
            const data = getMockSupplierStats(selectedRange);
            await new Promise((resolve) => setTimeout(resolve, 400));
            setStats(data);
        } catch (error) {
            console.error("Failed to fetch stats:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats(range);
    }, [range, fetchStats]);

    return (
        <>
            {/* Overview Cards */}
            <div style={{ animation: "fadeIn 0.5s ease-out" }}>
                <StatsOverviewCards
                    overview={
                        stats?.overview || {
                            totalRevenue: 0, totalSales: 0, activeDatasets: 0,
                            totalViews: 0, averageQualityScore: 0,
                            pendingValidationCount: 0, conversionRate: 0,
                        }
                    }
                    loading={loading}
                />
            </div>

            {/* Revenue Trend */}
            <div style={{ animation: "fadeIn 0.5s ease-out 0.15s backwards" }}>
                <GlassCard className="mt-6">
                    <div className="p-5">
                        <div className="flex items-center gap-3 mb-4">
                            <TrendingUp className="w-5 h-5" style={{ color: tokens.textPrimary }} />
                            <h2 className="text-lg font-semibold" style={{ color: tokens.textPrimary }}>
                                Revenue Trend
                            </h2>
                        </div>
                        <RevenueTrendChart data={stats?.revenueTrend || []} loading={loading} />
                    </div>
                </GlassCard>
            </div>

            {/* Top & Low Performing */}
            <div style={{ animation: "fadeIn 0.5s ease-out 0.3s backwards" }}>
                <div className="mt-6">
                    <TopLowPerformingDatasets
                        topPerforming={stats?.topPerformingDataset || null}
                        lowPerforming={stats?.lowPerformingDataset || null}
                        loading={loading}
                    />
                </div>
            </div>
        </>
    );
}

export default function StatsOverviewPage() {
    return (
        <Suspense
            fallback={
                <div className="space-y-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="rounded-xl animate-pulse h-32" style={{ background: "var(--muted)" }} />
                    ))}
                </div>
            }
        >
            <StatsOverviewContent />
        </Suspense>
    );
}
