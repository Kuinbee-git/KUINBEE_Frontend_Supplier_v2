"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Database,
  FileCheck2,
  FileText,
  Paperclip,
  Plus,
  UploadCloud,
} from "lucide-react";

import {
  DashboardButton,
  DashboardPagination,
  DashboardStatusBadge,
} from "@/components/dashboard";
import { listMyProposals } from "@/lib/api";
import type {
  ListProposalsResponse,
  VerificationStatus,
} from "@/types/dataset-proposal.types";
import { DatasetStatusBadge } from "./shared";
import { SubmittedProposals } from "./SubmittedProposals";
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
  type DatasetMetric,
  type DatasetRecordColumn,
} from "./workspace";

interface ProposalListItem {
  id: string;
  datasetUniqueId: string;
  title: string;
  verificationStatus: VerificationStatus | null;
  updatedAt: string;
  currentUploadId?: string | null;
}

interface DatasetListProps {
  isDark?: boolean;
}

const PAGE_SIZE = 10;
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

export function DatasetList({ isDark = false }: DatasetListProps) {
  const searchParams = useSearchParams();
  const legacySubmittedView =
    Boolean(searchParams.get("status")) &&
    searchParams.get("status") !== "draft";
  const [drafts, setDrafts] = useState<ProposalListItem[]>([]);
  const [totalDrafts, setTotalDrafts] = useState(0);
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const requestIdRef = useRef(0);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timeoutId);
  }, [searchQuery]);

  const fetchDrafts = useCallback(async () => {
    if (legacySubmittedView) return;
    const requestId = ++requestIdRef.current;

    try {
      setLoading(true);
      setError(null);
      const response = await listMyProposals({
        q: debouncedSearchQuery || undefined,
        scope: "DRAFTS",
        // Keep this exact filter for compatibility with an older running API.
        verificationStatus: "PENDING",
        page,
        pageSize: PAGE_SIZE,
      });
      if (requestId !== requestIdRef.current) return;

      const items = (response.items || []).filter(
        (item) => item.verificationStatus === "PENDING"
      );
      setDrafts(items);
      setTotalDrafts(response.total || 0);
      setSummary(
        response.summary ?? {
          ...EMPTY_SUMMARY,
          total: response.total || 0,
          draftsWithCurrentUpload: items.filter((item) => item.currentUploadId)
            .length,
          draftsWithoutCurrentUpload: items.filter(
            (item) => !item.currentUploadId
          ).length,
          byVerificationStatus: {
            ...EMPTY_SUMMARY.byVerificationStatus,
            PENDING: response.total || 0,
          },
        }
      );
    } catch (loadError: unknown) {
      console.error("Failed to fetch draft proposals:", loadError);
      if (requestId !== requestIdRef.current) return;
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Your drafts could not be loaded."
      );
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [debouncedSearchQuery, legacySubmittedView, page]);

  useEffect(() => {
    void fetchDrafts();
  }, [fetchDrafts]);

  if (legacySubmittedView) {
    return <SubmittedProposals isDark={isDark} />;
  }

  const metrics: DatasetMetric[] = [
    {
      label: "All drafts",
      supportingText: "Work still in progress",
      value: summary.byVerificationStatus.PENDING,
      icon: Database,
      tone: "neutral",
    },
    {
      label: "File attached",
      supportingText: "Ready for final checks",
      value: summary.draftsWithCurrentUpload,
      icon: FileCheck2,
      tone: "green",
    },
    {
      label: "Needs a file",
      supportingText: "Upload still required",
      value: summary.draftsWithoutCurrentUpload,
      icon: UploadCloud,
      tone: "amber",
    },
  ];

  const columns: DatasetRecordColumn<ProposalListItem>[] = [
    {
      header: "Draft",
      headerClassName: "w-[48%]",
      render: (draft) => (
        <DatasetRecordIdentity
          href={`/dashboard/datasets/${draft.id}`}
          title={draft.title}
          identifier={draft.datasetUniqueId}
          icon={FileText}
        />
      ),
    },
    {
      header: "Status",
      render: (draft) => (
        <DatasetStatusBadge status={draft.verificationStatus} isDark={isDark} />
      ),
    },
    {
      header: "File",
      render: (draft) => (
        <DraftFileState attached={Boolean(draft.currentUploadId)} />
      ),
    },
    {
      header: "Last updated",
      className: "whitespace-nowrap text-sm text-muted-foreground",
      render: (draft) => formatDatasetDate(draft.updatedAt),
    },
    {
      header: "Action",
      headerClassName: "text-right",
      className: "text-right",
      render: (draft) => (
        <DashboardButton asChild variant="outline" size="compact">
          <Link href={`/dashboard/datasets/${draft.id}`}>
            Continue <ArrowRight />
          </Link>
        </DashboardButton>
      ),
    },
  ];

  return (
    <DatasetWorkspace>
      <DatasetPageHeader
        title="My Drafts"
        description="Continue incomplete proposals, attach the required files, and review everything before submission."
        action={
          <DashboardButton asChild className="w-full sm:w-auto">
            <Link href="/dashboard/datasets/create">
              <Plus /> Create proposal
            </Link>
          </DashboardButton>
        }
      />

      <section aria-label="Draft overview">
        <DatasetMetricStrip
          metrics={metrics}
          loading={loading && drafts.length === 0}
        />
      </section>

      <DatasetFilterToolbar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search draft title or dataset ID"
        searchAriaLabel="Search draft proposals"
        onClear={() => setSearchQuery("")}
        isDark={isDark}
      />

      {error && (
        <DatasetErrorBanner
          title="We could not load your drafts"
          message={error}
          onRetry={fetchDrafts}
        />
      )}

      <section aria-labelledby="draft-inventory-title">
        <DatasetInventoryHeader
          id="draft-inventory-title"
          title="Draft inventory"
          loading={loading}
          total={totalDrafts}
          singularLabel="draft"
          pluralLabel="drafts"
        />

        {loading && drafts.length === 0 ? (
          <DatasetListSkeleton />
        ) : !error && drafts.length === 0 ? (
          <DatasetEmptyState
            filtered={Boolean(searchQuery.trim())}
            onClear={() => setSearchQuery("")}
            title="No draft proposals"
            description="Start a dataset proposal and save it as a draft while you prepare the details and files."
            filteredTitle="No drafts match this search"
            filteredDescription="Try another title or dataset ID."
            action={
              <DashboardButton asChild>
                <Link href="/dashboard/datasets/create">
                  <Plus /> Create proposal
                </Link>
              </DashboardButton>
            }
          />
        ) : drafts.length > 0 ? (
          <>
            <DatasetRecordList
              items={drafts}
              busy={loading}
              caption="Draft dataset proposals"
              columns={columns}
              getKey={(draft) => draft.id}
              renderMobile={(draft) => (
                <DatasetMobileRecordCard
                  href={`/dashboard/datasets/${draft.id}`}
                  title={draft.title}
                  identifier={draft.datasetUniqueId}
                  icon={FileText}
                  badges={
                    <>
                      <DatasetStatusBadge
                        status={draft.verificationStatus}
                        isDark={isDark}
                      />
                      <DraftFileState
                        attached={Boolean(draft.currentUploadId)}
                      />
                    </>
                  }
                  supportingText={`Updated ${formatDatasetDate(draft.updatedAt)}`}
                  actionLabel="Continue"
                />
              )}
            />
            <DashboardPagination
              page={page}
              pageSize={PAGE_SIZE}
              totalItems={totalDrafts}
              itemLabel="drafts"
              onPageChange={setPage}
              className="pt-4"
            />
          </>
        ) : null}
      </section>
    </DatasetWorkspace>
  );
}

function DraftFileState({ attached }: { attached: boolean }) {
  return (
    <DashboardStatusBadge
      tone={attached ? "success" : "warning"}
      icon={attached ? Paperclip : UploadCloud}
    >
      {attached ? "Attached" : "Required"}
    </DashboardStatusBadge>
  );
}
