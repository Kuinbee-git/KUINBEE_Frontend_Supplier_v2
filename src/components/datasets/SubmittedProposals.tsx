"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Database,
  Eye,
  FileText,
  MessageSquareWarning,
  Send,
} from "lucide-react";

import { DashboardButton, DashboardPagination } from "@/components/dashboard";
import { listMyProposals } from "@/lib/api";
import type {
  ListProposalsResponse,
  VerificationStatus,
} from "@/types/dataset-proposal.types";
import { DatasetStatusBadge } from "./shared";
import {
  DatasetEmptyState,
  DatasetErrorBanner,
  DatasetFilterToolbar,
  DatasetInventoryHeader,
  DatasetListSkeleton,
  DatasetMetricStrip,
  DatasetMobileRecordCard,
  DatasetPageHeader,
  DatasetRecordIdentity,
  DatasetRecordList,
  DatasetWorkspace,
  formatDatasetDate,
  getProposalActionLabel,
  type DatasetMetric,
  type DatasetRecordColumn,
} from "./workspace";

interface SubmittedProposalsProps {
  isDark?: boolean;
}

type FilterStatus =
  | "ALL"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "CHANGES_REQUESTED"
  | "RESUBMITTED"
  | "REJECTED"
  | "VERIFIED";

const PAGE_SIZE = 10;
const FETCH_PAGE_SIZE = 100;
const EMPTY_SUMMARY: NonNullable<ListProposalsResponse["summary"]> = {
  total: 0,
  draftsWithCurrentUpload: 0,
  draftsWithoutCurrentUpload: 0,
  byVerificationStatus: {
    PENDING: 0,
    SUBMITTED: 0,
    CHANGES_REQUESTED: 0,
    RESUBMITTED: 0,
    UNDER_REVIEW: 0,
    VERIFIED: 0,
    REJECTED: 0,
  },
};
const STATUS_OPTIONS = [
  { label: "All statuses", value: "ALL" },
  { label: "Submitted", value: "SUBMITTED" },
  { label: "Under review", value: "UNDER_REVIEW" },
  { label: "Changes requested", value: "CHANGES_REQUESTED" },
  { label: "Resubmitted", value: "RESUBMITTED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Verified", value: "VERIFIED" },
];

interface ProposalItem {
  id: string;
  datasetUniqueId: string;
  title: string;
  verificationStatus: VerificationStatus;
  updatedAt: string;
}

export function SubmittedProposals({
  isDark = false,
}: SubmittedProposalsProps) {
  const [proposals, setProposals] = useState<ProposalItem[]>([]);
  const [totalProposals, setTotalProposals] = useState(0);
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("ALL");
  const requestIdRef = useRef(0);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timeoutId);
  }, [searchQuery]);

  const fetchProposals = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    try {
      setLoading(true);
      setError(null);
      const response = await listMyProposals({
        q: debouncedSearchQuery || undefined,
        scope: "SUBMITTED",
        verificationStatus: statusFilter === "ALL" ? undefined : statusFilter,
        page,
        pageSize: PAGE_SIZE,
      });
      if (requestId !== requestIdRef.current) return;

      if (response.summary) {
        setProposals(toSubmittedItems(response.items || []));
        setTotalProposals(response.total || 0);
        setSummary(response.summary);
        return;
      }

      // A locally running pre-Part-3 API ignores q/scope and has no summary.
      // Fall back to the previous exhaustive client filter until it is restarted.
      const allItems: ProposalItem[] = [];
      let legacyPage = 1;
      let fetched = 0;
      let legacyTotal = 0;
      do {
        const legacyResponse = await listMyProposals({
          page: legacyPage,
          pageSize: FETCH_PAGE_SIZE,
        });
        const items = legacyResponse.items || [];
        allItems.push(...toSubmittedItems(items));
        fetched += items.length;
        legacyTotal = legacyResponse.total || 0;
        legacyPage += 1;
        if (items.length === 0) break;
      } while (fetched < legacyTotal);

      const query = debouncedSearchQuery.toLowerCase();
      const filteredItems = allItems.filter((item) => {
        const matchesStatus =
          statusFilter === "ALL" || item.verificationStatus === statusFilter;
        const matchesQuery =
          !query ||
          item.title.toLowerCase().includes(query) ||
          item.datasetUniqueId.toLowerCase().includes(query);
        return matchesStatus && matchesQuery;
      });
      setProposals(
        filteredItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
      );
      setTotalProposals(filteredItems.length);
      setSummary(buildLegacySummary(allItems));
    } catch (loadError: unknown) {
      console.error("Failed to fetch submitted proposals:", loadError);
      if (requestId !== requestIdRef.current) return;
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Your submitted proposals could not be loaded."
      );
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [debouncedSearchQuery, page, statusFilter]);

  useEffect(() => {
    void fetchProposals();
  }, [fetchProposals]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const metrics: DatasetMetric<FilterStatus>[] = [
    {
      label: "All proposals",
      supportingText: "Complete review history",
      value: summary.total - summary.byVerificationStatus.PENDING,
      filterValue: "ALL",
      icon: Database,
      tone: "neutral",
    },
    {
      label: "Submitted",
      supportingText: "Waiting for review",
      value: summary.byVerificationStatus.SUBMITTED,
      filterValue: "SUBMITTED",
      icon: Send,
      tone: "blue",
    },
    {
      label: "Under review",
      supportingText: "Being assessed",
      value: summary.byVerificationStatus.UNDER_REVIEW,
      filterValue: "UNDER_REVIEW",
      icon: Eye,
      tone: "purple",
    },
    {
      label: "Needs attention",
      supportingText: "Changes requested",
      value: summary.byVerificationStatus.CHANGES_REQUESTED,
      filterValue: "CHANGES_REQUESTED",
      icon: MessageSquareWarning,
      tone: "amber",
    },
    {
      label: "Verified",
      supportingText: "Review completed",
      value: summary.byVerificationStatus.VERIFIED,
      filterValue: "VERIFIED",
      icon: BadgeCheck,
      tone: "green",
    },
  ];

  const hasFilters = Boolean(searchQuery.trim()) || statusFilter !== "ALL";
  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("ALL");
    setPage(1);
  };

  const columns: DatasetRecordColumn<ProposalItem>[] = [
    {
      header: "Proposal",
      headerClassName: "w-[38%]",
      render: (proposal) => (
        <DatasetRecordIdentity
          href={`/dashboard/datasets/${proposal.id}`}
          title={proposal.title}
          identifier={proposal.datasetUniqueId}
          icon={FileText}
        />
      ),
    },
    {
      header: "Status",
      render: (proposal) => (
        <DatasetStatusBadge
          status={proposal.verificationStatus}
          isDark={isDark}
        />
      ),
    },
    {
      header: "What happens next",
      className: "max-w-[220px] text-sm text-muted-foreground",
      render: (proposal) => getProposalNextStep(proposal.verificationStatus),
    },
    {
      header: "Last updated",
      className: "whitespace-nowrap text-sm text-muted-foreground",
      render: (proposal) => formatDatasetDate(proposal.updatedAt),
    },
    {
      header: "Action",
      headerClassName: "text-right",
      className: "text-right",
      render: (proposal) => (
        <DashboardButton asChild variant="outline" size="compact">
          <Link href={`/dashboard/datasets/${proposal.id}`}>
            {getProposalActionLabel(proposal.verificationStatus)} <ArrowRight />
          </Link>
        </DashboardButton>
      ),
    },
  ];

  return (
    <DatasetWorkspace>
      <DatasetPageHeader
        title="Submitted Proposals"
        description="Track each proposal through review, respond to requested changes, and see completed decisions."
      />

      <section aria-label="Proposal review overview">
        <DatasetMetricStrip
          metrics={metrics}
          activeValue={statusFilter}
          onSelect={setStatusFilter}
          loading={loading && proposals.length === 0}
        />
      </section>

      <DatasetFilterToolbar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search proposal title or dataset ID"
        searchAriaLabel="Search submitted proposals"
        filters={[
          {
            value: statusFilter,
            onValueChange: (value) => setStatusFilter(value as FilterStatus),
            options: STATUS_OPTIONS,
            ariaLabel: "Filter proposals by review status",
          },
        ]}
        activeFilterCount={statusFilter !== "ALL" ? 1 : 0}
        onClear={clearFilters}
        isDark={isDark}
      />

      {error && (
        <DatasetErrorBanner
          title="We could not load your proposals"
          message={error}
          onRetry={fetchProposals}
        />
      )}

      <section aria-labelledby="proposal-inventory-title">
        <DatasetInventoryHeader
          id="proposal-inventory-title"
          title="Review queue"
          loading={loading}
          total={totalProposals}
          singularLabel="proposal"
          pluralLabel="proposals"
        />

        {loading && proposals.length === 0 ? (
          <DatasetListSkeleton />
        ) : !error && proposals.length === 0 ? (
          <DatasetEmptyState
            filtered={hasFilters}
            onClear={clearFilters}
            title="No submitted proposals yet"
            description="Submit a completed draft for review and its progress will appear here."
            filteredTitle="No proposals match this view"
            filteredDescription="Try another title, dataset ID, or review status."
          />
        ) : proposals.length > 0 ? (
          <>
            <DatasetRecordList
              items={proposals}
              busy={loading}
              caption="Submitted dataset proposals"
              columns={columns}
              getKey={(proposal) => proposal.id}
              renderMobile={(proposal) => (
                <DatasetMobileRecordCard
                  href={`/dashboard/datasets/${proposal.id}`}
                  title={proposal.title}
                  identifier={proposal.datasetUniqueId}
                  icon={FileText}
                  badges={
                    <DatasetStatusBadge
                      status={proposal.verificationStatus}
                      isDark={isDark}
                    />
                  }
                  supportingText={`Updated ${formatDatasetDate(proposal.updatedAt)}`}
                  actionLabel={getProposalActionLabel(
                    proposal.verificationStatus
                  )}
                />
              )}
            />
            <DashboardPagination
              page={page}
              pageSize={PAGE_SIZE}
              totalItems={totalProposals}
              itemLabel="proposals"
              onPageChange={setPage}
              className="pt-4"
            />
          </>
        ) : null}
      </section>
    </DatasetWorkspace>
  );
}

function toSubmittedItems(
  items: ListProposalsResponse["items"]
): ProposalItem[] {
  return items.filter(
    (item): item is typeof item & { verificationStatus: VerificationStatus } =>
      Boolean(item.verificationStatus) && item.verificationStatus !== "PENDING"
  );
}

function buildLegacySummary(
  items: ProposalItem[]
): NonNullable<ListProposalsResponse["summary"]> {
  const summary = {
    ...EMPTY_SUMMARY,
    total: items.length,
    byVerificationStatus: { ...EMPTY_SUMMARY.byVerificationStatus },
  };
  for (const item of items) {
    summary.byVerificationStatus[item.verificationStatus] += 1;
  }
  return summary;
}

function getProposalNextStep(status: VerificationStatus) {
  switch (status) {
    case "SUBMITTED":
      return "Kuinbee will pick up the proposal for review.";
    case "UNDER_REVIEW":
      return "The proposal is currently being assessed.";
    case "CHANGES_REQUESTED":
      return "Review the feedback, update the proposal, and resubmit.";
    case "RESUBMITTED":
      return "The revised proposal is waiting for another review.";
    case "REJECTED":
      return "Open the proposal to review the final decision.";
    case "VERIFIED":
      return "The dataset can now move into marketplace management.";
    default:
      return "Open the proposal for its current status.";
  }
}
