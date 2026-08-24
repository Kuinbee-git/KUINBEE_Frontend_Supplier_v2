"use client";

import * as React from "react";
import { ShieldCheck } from "lucide-react";

import {
  DashboardCard,
  DashboardCardContent,
  DashboardCardDescription,
  DashboardCardHeader,
  DashboardCardTitle,
  DashboardEmptyState,
  DashboardErrorState,
  DashboardLoadingState,
  DashboardPagination,
  DashboardStatusBadge,
  type DashboardTone,
} from "@/components/dashboard";
import { getPanAttempts } from "@/lib/api/supplier";
import type {
  PanAttemptListItem,
  VerificationStatus,
} from "@/types/onboarding.types";

const PAGE_SIZE = 10;

const STATUS_TONES: Record<VerificationStatus, DashboardTone> = {
  NOT_STARTED: "neutral",
  PENDING: "warning",
  FAILED: "danger",
  VERIFIED: "success",
};

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Failed to load PAN verification history.";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function PanVerificationHistory() {
  const [attempts, setAttempts] = React.useState<PanAttemptListItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(1);
  const [totalAttempts, setTotalAttempts] = React.useState(0);

  const fetchAttempts = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getPanAttempts({ page, pageSize: PAGE_SIZE });
      setAttempts(response.items ?? []);
      setTotalAttempts(response.total ?? 0);
    } catch (requestError) {
      console.error("Failed to fetch PAN attempts:", requestError);
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [page]);

  React.useEffect(() => {
    void fetchAttempts();
  }, [fetchAttempts]);

  return (
    <DashboardCard>
      <DashboardCardHeader>
        <DashboardCardTitle>PAN verification history</DashboardCardTitle>
        <DashboardCardDescription>
          Review the verification attempts recorded for this individual account.
        </DashboardCardDescription>
      </DashboardCardHeader>
      <DashboardCardContent>
        {loading ? (
          <DashboardLoadingState
            surface="plain"
            variant="skeleton"
            rows={3}
            label="Loading PAN verification history"
          />
        ) : error ? (
          <DashboardErrorState
            title="Verification history unavailable"
            message={error}
            onRetry={() => void fetchAttempts()}
          />
        ) : attempts.length === 0 ? (
          <DashboardEmptyState
            surface="plain"
            icon={ShieldCheck}
            title="No verification attempts"
            description="PAN verification attempts will appear here after they are submitted."
          />
        ) : (
          <div className="space-y-5">
            <div className="divide-y divide-border overflow-hidden rounded-xl border border-border">
              {attempts.map((attempt) => (
                <div
                  key={attempt.id}
                  className="grid gap-3 bg-card/35 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <DashboardStatusBadge
                        tone={STATUS_TONES[attempt.status]}
                        status={attempt.status}
                      >
                        {attempt.status.replaceAll("_", " ")}
                      </DashboardStatusBadge>
                      <span className="font-mono text-xs text-muted-foreground">
                        {attempt.id.slice(0, 8)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-foreground">
                      Provider: {attempt.provider}
                    </p>
                    {attempt.errorCode ? (
                      <p className="mt-1 break-words font-mono text-xs text-[var(--dashboard-danger-foreground)]">
                        Error: {attempt.errorCode}
                      </p>
                    ) : null}
                  </div>
                  <time
                    dateTime={attempt.createdAt}
                    className="text-sm text-muted-foreground"
                  >
                    {formatDate(attempt.createdAt)}
                  </time>
                </div>
              ))}
            </div>

            <DashboardPagination
              page={page}
              pageSize={PAGE_SIZE}
              totalItems={totalAttempts}
              itemLabel="verification attempts"
              onPageChange={setPage}
              disabled={loading}
            />
          </div>
        )}
      </DashboardCardContent>
    </DashboardCard>
  );
}
