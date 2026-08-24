"use client";

import { useState, useEffect } from "react";
import { Award, Loader2 } from "lucide-react";
import { DashboardCard } from "@/components/dashboard";
import { getDatasetKdts, type DatasetKdtsResponse } from "@/lib/api/kdts";

interface KdtsScoreCardProps {
  datasetId: string;
  /** Controls the compact padding used by the shared dashboard card. */
  variant?: "glass" | "flat";
}

const KDTS_DIMS: Array<{
  key: keyof NonNullable<DatasetKdtsResponse["breakdown"]>;
  label: string;
}> = [
  { key: "Q", label: "Completeness" },
  { key: "L", label: "Legitimacy" },
  { key: "P", label: "Precision" },
  { key: "U", label: "Usefulness" },
  { key: "F", label: "Freshness" },
];

export function KdtsScoreCard({
  datasetId,
  variant = "glass",
}: KdtsScoreCardProps) {
  const [result, setResult] = useState<{
    datasetId: string;
    data: DatasetKdtsResponse | null;
  } | null>(null);
  const loading = result?.datasetId !== datasetId;
  const data = result?.datasetId === datasetId ? result.data : null;

  useEffect(() => {
    let cancelled = false;
    getDatasetKdts(datasetId)
      .then((res) => {
        if (!cancelled) setResult({ datasetId, data: res });
      })
      .catch(() => {
        if (!cancelled) setResult({ datasetId, data: null });
      });
    return () => {
      cancelled = true;
    };
  }, [datasetId]);

  const inner = (
    <>
      {/* Section header */}
      <div className="flex items-center gap-2 mb-5">
        <Award className="size-5 text-muted-foreground" />
        <h3 className="text-base font-semibold text-foreground">KDTS Score</h3>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-4">
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Loading…</span>
        </div>
      ) : !data?.currentScore ? (
        <p className="py-2 text-center text-sm text-muted-foreground">
          Not yet scored by Kuinbee
        </p>
      ) : (
        <>
          {/* Overall score */}
          <div className="flex items-baseline gap-1 mb-4">
            <span className="text-4xl font-bold text-foreground">
              {parseFloat(data.currentScore).toFixed(1)}
            </span>
            <span className="text-sm text-muted-foreground">/&nbsp;100</span>
          </div>

          {/* Dimension grid */}
          <div className="grid grid-cols-2 gap-2">
            {KDTS_DIMS.map(({ key, label }) => (
              <div
                key={key}
                className="rounded-lg border border-border bg-muted/35 p-2.5"
              >
                <p className="mb-1 text-xs text-muted-foreground">
                  {key} — {label}
                </p>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${data.breakdown?.[key] ?? 0}%`,
                        background: "var(--dashboard-indicator)",
                      }}
                    />
                  </div>
                  <span className="w-7 text-right text-xs font-semibold tabular-nums text-foreground">
                    {data.breakdown?.[key] ?? 0}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {data.updatedAt && (
            <p className="mt-3 text-xs text-muted-foreground">
              Last assessed {new Date(data.updatedAt).toLocaleDateString()}
            </p>
          )}
        </>
      )}
    </>
  );

  return (
    <DashboardCard className={variant === "flat" ? "px-6 py-5" : "p-4"}>
      {inner}
    </DashboardCard>
  );
}
