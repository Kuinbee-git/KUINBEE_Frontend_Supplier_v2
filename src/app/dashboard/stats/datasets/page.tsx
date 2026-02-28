"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSupplierTokens } from "@/hooks/useSupplierTokens";
import { getMockSupplierStats } from "@/lib/api/stats";
import { GlassCard } from "@/components/shared";
import { DatasetPerformanceTable } from "@/components/dashboard/stats/DatasetPerformanceTable";
import type { StatsTimeRange, DatasetPerformanceItem } from "@/types/supplier-stats.types";
import { Database, ExternalLink } from "lucide-react";

function DatasetsContent() {
    const tokens = useSupplierTokens();
    const router = useRouter();
    const searchParams = useSearchParams();
    const range = (searchParams.get("range") as StatsTimeRange) || "30d";
    const [datasets, setDatasets] = useState<DatasetPerformanceItem[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async (selectedRange: StatsTimeRange) => {
        setLoading(true);
        try {
            const data = getMockSupplierStats(selectedRange);
            await new Promise((resolve) => setTimeout(resolve, 400));
            setDatasets(data.datasetPerformance);
        } catch (error) {
            console.error("Failed to fetch datasets:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData(range);
    }, [range, fetchData]);

    const handleDatasetClick = (datasetId: string) => {
        const params = new URLSearchParams(searchParams.toString());
        router.push(`/dashboard/stats/datasets/${datasetId}?${params.toString()}`);
    };

    return (
        <div style={{ animation: "fadeIn 0.5s ease-out" }}>
            <GlassCard>
                <div className="p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <Database className="w-5 h-5" style={{ color: tokens.textPrimary }} />
                            <h2 className="text-lg font-semibold" style={{ color: tokens.textPrimary }}>
                                Dataset Performance
                            </h2>
                        </div>
                        <p className="text-xs" style={{ color: tokens.textMuted }}>
                            Click a row to view detailed analytics
                        </p>
                    </div>
                    <DatasetPerformanceTable
                        data={datasets}
                        loading={loading}
                        onRowClick={handleDatasetClick}
                    />
                </div>
            </GlassCard>
        </div>
    );
}

export default function DatasetsPage() {
    return (
        <Suspense
            fallback={
                <div className="rounded-xl animate-pulse h-96" style={{ background: "var(--muted)" }} />
            }
        >
            <DatasetsContent />
        </Suspense>
    );
}
