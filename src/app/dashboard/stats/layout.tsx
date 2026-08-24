"use client";

import { Suspense, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  DashboardLoadingState,
  DashboardPage,
  DashboardPageHeader,
} from "@/components/dashboard";
import { StatsTabNav } from "@/components/dashboard/stats/StatsTabNav";
import { TimeRangeSelector } from "@/components/dashboard/stats/TimeRangeSelector";
import type { StatsTimeRange } from "@/types/supplier-stats.types";

const VALID_RANGES: StatsTimeRange[] = ["7d", "30d", "90d", "1y", "lifetime"];

function getTimeRange(value: string | null): StatsTimeRange {
  return VALID_RANGES.includes(value as StatsTimeRange)
    ? (value as StatsTimeRange)
    : "30d";
}

function StatsLayoutInner({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname() ?? "/dashboard/stats";
  const range = getTimeRange(searchParams.get("range"));
  const isDetailPage = /\/dashboard\/stats\/datasets\/[^/]+/.test(pathname);

  const handleRangeChange = (newRange: StatsTimeRange) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", newRange);
    router.push(`${pathname}?${params.toString()}`);
  };

  if (isDetailPage) return children;

  return (
    <DashboardPage width="wide">
      <DashboardPageHeader
        title="Analytics"
        description="Track marketplace performance, revenue, dataset conversion, and buyer activity."
        actions={
          <TimeRangeSelector value={range} onChange={handleRangeChange} />
        }
      />
      <StatsTabNav />
      {children}
    </DashboardPage>
  );
}

export default function StatsLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <DashboardPage width="wide">
          <DashboardLoadingState
            label="Loading analytics workspace"
            variant="skeleton"
            rows={4}
          />
        </DashboardPage>
      }
    >
      <StatsLayoutInner>{children}</StatsLayoutInner>
    </Suspense>
  );
}
