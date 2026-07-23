"use client";

import { Suspense, type ReactNode } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { StatsTabNav } from "@/components/dashboard/stats/StatsTabNav";
import { TimeRangeSelector } from "@/components/dashboard/stats/TimeRangeSelector";
import type { StatsTimeRange } from "@/types/supplier-stats.types";

const VALID_RANGES: StatsTimeRange[] = ["7d", "30d", "90d", "1y", "lifetime"];

function StatsLayoutInner({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const requestedRange = searchParams.get("range") as StatsTimeRange | null;
  const range =
    requestedRange && VALID_RANGES.includes(requestedRange)
      ? requestedRange
      : "30d";

  // Check if we're on a dataset detail page (hide tabs + range selector)
  const isDetailPage = /\/dashboard\/stats\/datasets\/[^/]+/.test(
    pathname || ""
  );

  const handleRangeChange = (newRange: StatsTimeRange) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", newRange);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="dataset-workspace-scope mx-auto w-full max-w-[1500px] px-4 py-5 pb-10 sm:px-6 sm:py-7 lg:px-8 lg:py-8">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Header */}
      {!isDetailPage && (
        <div style={{ animation: "fadeIn 0.4s ease-out" }}>
          <div className="mb-5 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                Stats & Analytics
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                Track your performance, revenue, and buyer activity.
              </p>
            </div>
            <div className="max-w-full overflow-x-auto pb-1">
              <TimeRangeSelector value={range} onChange={handleRangeChange} />
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mb-6 max-w-full overflow-x-auto pb-1">
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
        <div className="mx-auto w-full max-w-[1500px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
          <div className="animate-pulse space-y-4">
            <div
              className="h-10 w-64 rounded-lg"
              style={{ background: "var(--muted)" }}
            />
            <div
              className="h-8 w-96 rounded-lg"
              style={{ background: "var(--muted)" }}
            />
          </div>
        </div>
      }
    >
      <StatsLayoutInner>{children}</StatsLayoutInner>
    </Suspense>
  );
}
