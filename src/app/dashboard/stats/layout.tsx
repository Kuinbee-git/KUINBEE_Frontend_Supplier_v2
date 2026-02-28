"use client";

import { Suspense, type ReactNode } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useSupplierTokens } from "@/hooks/useSupplierTokens";
import { StatsTabNav } from "@/components/dashboard/stats/StatsTabNav";
import { TimeRangeSelector } from "@/components/dashboard/stats/TimeRangeSelector";
import type { StatsTimeRange } from "@/types/supplier-stats.types";

function StatsLayoutInner({ children }: { children: ReactNode }) {
    const tokens = useSupplierTokens();
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const range = (searchParams.get("range") as StatsTimeRange) || "30d";

    // Check if we're on a dataset detail page (hide tabs + range selector)
    const isDetailPage = /\/dashboard\/stats\/datasets\/[^/]+/.test(pathname || "");

    const handleRangeChange = (newRange: StatsTimeRange) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("range", newRange);
        router.push(`${pathname}?${params.toString()}`);
    };

    return (
        <div className="max-w-[1400px] mx-auto px-8 py-7 pb-10">
            <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

            {/* Header */}
            {!isDetailPage && (
                <div style={{ animation: "fadeIn 0.4s ease-out" }}>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
                        <div>
                            <h1
                                className="text-3xl font-semibold mb-1"
                                style={{ color: tokens.textPrimary }}
                            >
                                Stats & Analytics
                            </h1>
                            <p className="text-sm" style={{ color: tokens.textSecondary }}>
                                Track your performance, revenue, and buyer activity.
                            </p>
                        </div>
                        <TimeRangeSelector value={range} onChange={handleRangeChange} />
                    </div>

                    {/* Tab Navigation */}
                    <div className="mb-6">
                        <StatsTabNav />
                    </div>
                </div>
            )}

            {/* Page Content */}
            {children}
        </div>
    );
}

export default function StatsLayout({ children }: { children: ReactNode }) {
    return (
        <Suspense
            fallback={
                <div className="max-w-[1400px] mx-auto px-8 py-7">
                    <div className="animate-pulse space-y-4">
                        <div className="h-10 w-64 rounded-lg" style={{ background: "var(--muted)" }} />
                        <div className="h-8 w-96 rounded-lg" style={{ background: "var(--muted)" }} />
                    </div>
                </div>
            }
        >
            <StatsLayoutInner>{children}</StatsLayoutInner>
        </Suspense>
    );
}
