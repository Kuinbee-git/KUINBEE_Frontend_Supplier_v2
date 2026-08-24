"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardPenLine,
  Database,
  FileText,
  Plus,
} from "lucide-react";

import {
  DashboardButton,
  DashboardCard,
  DashboardCardContent,
  DashboardCardDescription,
  DashboardCardHeader,
  DashboardCardTitle,
  DashboardEmptyState,
  DashboardErrorState,
  DashboardInlineAlert,
  DashboardLoadingState,
  DashboardMetricCard,
  DashboardPage,
  DashboardPageHeader,
  DashboardStatusBadge,
  type DashboardTone,
} from "@/components/dashboard";
import { useOnboardingStatus } from "@/hooks";
import { getSupplierProfile } from "@/lib/api";
import { listMyProposals } from "@/lib/api/dataset-proposals";
import { listMyDatasets } from "@/lib/api/datasets";
import type {
  ListProposalsResponse,
  VerificationStatus,
} from "@/types/dataset-proposal.types";

type ProposalItem = ListProposalsResponse["items"][number];

interface OverviewSnapshot {
  datasetCount: number;
  isOfflineContractDone: boolean | null;
  proposalCount: number;
  proposals: ProposalItem[];
}

const initialOverview: OverviewSnapshot = {
  datasetCount: 0,
  isOfflineContractDone: null,
  proposalCount: 0,
  proposals: [],
};

const verificationTone: Record<VerificationStatus, DashboardTone> = {
  PENDING: "neutral",
  SUBMITTED: "info",
  CHANGES_REQUESTED: "warning",
  RESUBMITTED: "info",
  UNDER_REVIEW: "warning",
  VERIFIED: "success",
  REJECTED: "danger",
};

function formatStatus(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getProposalStatus(proposal: ProposalItem) {
  const value = proposal.verificationStatus ?? proposal.status;
  const tone = proposal.verificationStatus
    ? verificationTone[proposal.verificationStatus]
    : proposal.status === "PUBLISHED" || proposal.status === "VERIFIED"
      ? "success"
      : proposal.status === "REJECTED"
        ? "danger"
        : proposal.status === "DELISTED"
          ? "warning"
          : "neutral";

  return { label: formatStatus(value), tone } as const;
}

function formatUpdatedDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default function SupplierDashboardOverviewPage() {
  const { isComplete, loading: onboardingLoading } = useOnboardingStatus();
  const [overview, setOverview] =
    React.useState<OverviewSnapshot>(initialOverview);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const requestIdRef = React.useRef(0);

  const loadOverview = React.useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    try {
      const [proposalsData, datasetsData, profileData] = await Promise.all([
        listMyProposals({ pageSize: 4, page: 1 }),
        listMyDatasets({ pageSize: 1, page: 1 }),
        getSupplierProfile(),
      ]);

      if (requestId !== requestIdRef.current) return;

      setOverview({
        proposalCount: proposalsData.total || 0,
        proposals: proposalsData.items || [],
        datasetCount: datasetsData.total || 0,
        isOfflineContractDone:
          profileData.profile?.isOfflineContractDone ?? null,
      });
    } catch (reason) {
      if (requestId !== requestIdRef.current) return;
      setError(
        reason instanceof Error
          ? reason.message
          : "The dashboard overview could not be loaded."
      );
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadOverview();
    return () => {
      requestIdRef.current += 1;
    };
  }, [loadOverview]);

  return (
    <DashboardPage width="wide">
      <DashboardPageHeader
        title="Overview"
        description="Review your supplier activity and continue the work that needs attention."
        actions={
          <DashboardButton asChild size="large" className="w-full sm:w-auto">
            <Link href="/dashboard/datasets/create">
              <Plus aria-hidden="true" />
              Create proposal
            </Link>
          </DashboardButton>
        }
      />

      {overview.isOfflineContractDone === false && !error ? (
        <DashboardInlineAlert
          tone="warning"
          title="Offline contract pending"
          message="Some supplier actions remain restricted until an administrator confirms your offline contract."
          action={
            <DashboardButton asChild variant="outline" size="compact">
              <Link href="/dashboard/support">Contact support</Link>
            </DashboardButton>
          }
        />
      ) : null}

      {error ? (
        <DashboardErrorState
          title="Dashboard data is unavailable"
          message={error}
          retryLabel="Reload overview"
          onRetry={() => void loadOverview()}
          headingLevel="h2"
        />
      ) : (
        <>
          <section aria-labelledby="overview-metrics-title">
            <h2 id="overview-metrics-title" className="sr-only">
              Supplier summary
            </h2>
            <div className="grid gap-4 md:grid-cols-3 md:gap-6">
              <DashboardMetricCard
                label="Total proposals"
                value={overview.proposalCount.toLocaleString()}
                supportingText="Draft and submitted proposals"
                icon={FileText}
                loading={loading}
                loadingLabel="Loading proposal count"
              />
              <DashboardMetricCard
                label="Marketplace datasets"
                value={overview.datasetCount.toLocaleString()}
                supportingText="Datasets in your supplier catalogue"
                icon={Database}
                loading={loading}
                loadingLabel="Loading dataset count"
              />
              <DashboardMetricCard
                label="Onboarding"
                value={isComplete ? "Complete" : "Pending"}
                supportingText="Supplier account readiness"
                status={isComplete ? "Ready" : "Action required"}
                statusTone={isComplete ? "success" : "warning"}
                icon={CheckCircle2}
                loading={loading || onboardingLoading}
                loadingLabel="Loading onboarding status"
              />
            </div>
          </section>

          <div className="grid min-w-0 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
            <section
              aria-labelledby="recent-proposal-activity-title"
              className="min-w-0"
            >
              <DashboardCard className="overflow-hidden">
                <DashboardCardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <DashboardCardTitle
                      id="recent-proposal-activity-title"
                      headingLevel="h2"
                      className="text-lg leading-7"
                    >
                      Recent proposal activity
                    </DashboardCardTitle>
                    <DashboardCardDescription className="mt-1">
                      Your four most recently updated proposals.
                    </DashboardCardDescription>
                  </div>
                  <div className="shrink-0">
                    <DashboardButton asChild variant="outline" size="compact">
                      <Link href="/dashboard/datasets">
                        Manage proposals
                        <ArrowRight aria-hidden="true" />
                      </Link>
                    </DashboardButton>
                  </div>
                </DashboardCardHeader>
                <DashboardCardContent className="p-0 md:p-0">
                  {loading ? (
                    <DashboardLoadingState
                      label="Loading recent proposals"
                      variant="skeleton"
                      rows={4}
                      surface="plain"
                    />
                  ) : overview.proposals.length === 0 ? (
                    <DashboardEmptyState
                      title="No proposals yet"
                      description="Create your first dataset proposal to begin supplying the marketplace."
                      action={
                        <DashboardButton asChild>
                          <Link href="/dashboard/datasets/create">
                            <Plus aria-hidden="true" />
                            Create proposal
                          </Link>
                        </DashboardButton>
                      }
                      headingLevel="h3"
                      surface="plain"
                    />
                  ) : (
                    <ul className="divide-y divide-border">
                      {overview.proposals.map((proposal) => {
                        const status = getProposalStatus(proposal);

                        return (
                          <li key={proposal.id}>
                            <Link
                              href={`/dashboard/datasets/${proposal.id}`}
                              className="dashboard-interactive-row group flex min-w-0 flex-col gap-3 px-4 py-4 outline-none transition-colors hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--dashboard-focus-ring)] sm:flex-row sm:items-center sm:justify-between md:px-6 motion-reduce:transition-none"
                            >
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-foreground">
                                  {proposal.title}
                                </p>
                                <p className="mt-1 truncate text-xs leading-[1.125rem] text-muted-foreground">
                                  {proposal.datasetUniqueId}
                                </p>
                              </div>
                              <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 sm:justify-end">
                                <DashboardStatusBadge tone={status.tone}>
                                  {status.label}
                                </DashboardStatusBadge>
                                <span className="text-xs text-muted-foreground sm:w-24 sm:text-right">
                                  {formatUpdatedDate(proposal.updatedAt)}
                                </span>
                                <ArrowRight
                                  className="size-4 text-muted-foreground transition-transform duration-150 group-hover:translate-x-1 motion-reduce:transition-none"
                                  aria-hidden="true"
                                />
                              </div>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </DashboardCardContent>
              </DashboardCard>
            </section>

            <aside aria-labelledby="quick-actions-title" className="min-w-0">
              <DashboardCard>
                <DashboardCardHeader>
                  <DashboardCardTitle
                    id="quick-actions-title"
                    headingLevel="h2"
                    className="text-lg leading-7"
                  >
                    Quick actions
                  </DashboardCardTitle>
                  <DashboardCardDescription>
                    Common supplier tasks.
                  </DashboardCardDescription>
                </DashboardCardHeader>
                <DashboardCardContent className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                  <DashboardButton
                    asChild
                    variant="secondary"
                    className="w-full justify-start"
                  >
                    <Link href="/dashboard/datasets/create">
                      <Plus aria-hidden="true" />
                      Create proposal
                    </Link>
                  </DashboardButton>
                  <DashboardButton
                    asChild
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <Link href="/dashboard/my-datasets">
                      <Database aria-hidden="true" />
                      View datasets
                    </Link>
                  </DashboardButton>
                  <DashboardButton
                    asChild
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <Link href="/dashboard/data-requirements/submit">
                      <ClipboardPenLine aria-hidden="true" />
                      Submit requirement
                    </Link>
                  </DashboardButton>
                </DashboardCardContent>
              </DashboardCard>
            </aside>
          </div>
        </>
      )}
    </DashboardPage>
  );
}
