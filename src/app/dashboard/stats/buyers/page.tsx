"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useSupplierTokens } from "@/hooks/useSupplierTokens";
import { getMockSupplierStats } from "@/lib/api/stats";
import { GlassCard } from "@/components/shared";
import { BuyerInsightsPanel } from "@/components/dashboard/stats/BuyerInsightsPanel";
import type { StatsTimeRange, BuyerInsights } from "@/types/supplier-stats.types";
import { Users } from "lucide-react";

function BuyersContent() {
    const tokens = useSupplierTokens();
    const searchParams = useSearchParams();
    const range = (searchParams.get("range") as StatsTimeRange) || "30d";
    const [insights, setInsights] = useState<BuyerInsights | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async (selectedRange: StatsTimeRange) => {
        setLoading(true);
        try {
            const data = getMockSupplierStats(selectedRange);
            await new Promise((resolve) => setTimeout(resolve, 400));
            setInsights(data.buyerInsights);
        } catch (error) {
            console.error("Failed to fetch buyer insights:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData(range);
    }, [range, fetchData]);

    return (
        <div style={{ animation: "fadeIn 0.5s ease-out" }}>
            <GlassCard>
                <div className="p-5">
                    <div className="flex items-center gap-3 mb-4">
                        <Users className="w-5 h-5" style={{ color: tokens.textPrimary }} />
                        <h2 className="text-lg font-semibold" style={{ color: tokens.textPrimary }}>
                            Buyer Insights
                        </h2>
                    </div>
                    <BuyerInsightsPanel
                        insights={
                            insights || {
                                totalBuyers: 0,
                                totalNonBuyingUsers: 0,
                                topBuyers: [],
                                highIntentNonBuyers: [],
                            }
                        }
                        loading={loading}
                    />
                </div>
            </GlassCard>
        </div>
    );
}

export default function BuyersPage() {
    return (
        <Suspense
            fallback={
                <div className="rounded-xl animate-pulse h-96" style={{ background: "var(--muted)" }} />
            }
        >
            <BuyersContent />
        </Suspense>
    );
}
