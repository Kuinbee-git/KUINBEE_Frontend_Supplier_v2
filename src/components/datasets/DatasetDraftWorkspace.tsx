"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { FileText, Plus } from "lucide-react";
import { useComponentRequest } from "@/hooks/useComponentRequest";
import { listDatasetDraftWorkspace } from "@/lib/api/dataset-draft-workspace";
import { DATASET_UPLOAD_CHOICES } from "@kuinbee/dataset-preparation-contracts";
import {
  DashboardButton,
  DashboardCard,
  DashboardPagination,
  DashboardSearchField,
  DashboardStatusBadge,
  DashboardSkeleton,
} from "@/components/dashboard";
import {
  DatasetEmptyState,
  DatasetErrorBanner,
  DatasetInventoryHeader,
  DatasetListSkeleton,
  DatasetMobileRecordCard,
  DatasetPageHeader,
  DatasetRecordIdentity,
  DatasetRecordList,
  DatasetWorkspace,
  formatDatasetDate,
  type DatasetRecordColumn,
} from "./workspace";

type WorkspaceResponse = Awaited<ReturnType<typeof listDatasetDraftWorkspace>>;
type DraftRow = WorkspaceResponse["items"][number];
const resumeUrl = (row: DraftRow) =>
  row.kind === "PREPARATION" || row.guidedEditorAvailable
    ? `/dashboard/datasets/drafts/${encodeURIComponent(row.id)}`
    : `/dashboard/datasets/${encodeURIComponent(row.id)}`;
const uploadLabel = (row: DraftRow) =>
  DATASET_UPLOAD_CHOICES.find((choice) => choice.value === row.uploadChoice)
    ?.label ?? "Not specified";

export function DatasetDraftWorkspace() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<WorkspaceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [readGeneration, setReadGeneration] = useState(0);
  const requestIdRef = useRef(0);
  useEffect(() => {
    if (search.trim() === query) return;
    const timeout = window.setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [search, query]);
  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError("");
    setResult(null);
    let clamped = false;
    try {
      const next = await listDatasetDraftWorkspace(page, query);
      if (requestId !== requestIdRef.current) return;
      const lastPage = Math.max(1, Math.ceil(next.total / next.limit));
      if (next.page > lastPage) {
        clamped = true;
        setPage(lastPage);
        // Revisit the page with a fresh query generation rather than accepting
        // a cached completion from before the draft inventory changed.
        setReadGeneration((value) => value + 1);
        return;
      }
      setResult(next);
    } catch (failure) {
      if (requestId === requestIdRef.current)
        setError(
          failure instanceof Error
            ? failure.message
            : "Draft proposals could not be loaded."
        );
    } finally {
      if (requestId === requestIdRef.current && !clamped) setLoading(false);
    }
  }, [page, query]);
  useComponentRequest(load, [page, query, readGeneration]);
  const metrics = [
    {
      label: query ? "Matching drafts" : "All drafts",
      supportingText: "Work still in progress",
      value: result?.summary.total ?? 0,
    },
    {
      label: "File attached",
      supportingText: "Current file recorded",
      value: result?.summary.withCurrentUpload ?? 0,
    },
    {
      label: "Needs a file",
      supportingText: "No current file attached",
      value: result?.summary.withoutCurrentUpload ?? 0,
    },
  ];
  const columns: DatasetRecordColumn<DraftRow>[] = [
    {
      header: "Draft",
      headerClassName: "w-[32%]",
      render: (row) => (
        <DatasetRecordIdentity
          href={resumeUrl(row)}
          title={row.title}
          identifier={row.datasetUniqueId ?? row.id}
          icon={FileText}
        />
      ),
    },
    {
      header: "Material",
      headerClassName: "w-40",
      className: "min-w-36",
      render: (row) => <span className="text-sm">{uploadLabel(row)}</span>,
    },
    {
      header: "File",
      render: (row) => (
        <DraftFileState attached={Boolean(row.currentUploadId)} />
      ),
    },
    {
      header: "Last updated",
      className: "whitespace-nowrap text-sm text-muted-foreground",
      render: (row) => formatDatasetDate(row.updatedAt),
    },
    {
      header: "Action",
      className: "text-right",
      headerClassName: "text-right",
      render: (row) => (
        <DashboardButton asChild variant="outline" size="compact">
          <Link href={resumeUrl(row)}>Continue</Link>
        </DashboardButton>
      ),
    },
  ];
  return (
    <DatasetWorkspace className="dataset-proposal-workspace">
      <DatasetPageHeader
        title="My Drafts"
        description="Continue your proposals step by step and review everything before submission."
        action={
          <DashboardButton asChild className="w-full sm:w-auto">
            <Link href="/dashboard/datasets/create">
              <Plus /> Create proposal
            </Link>
          </DashboardButton>
        }
      />
      <DashboardCard
        className="overflow-hidden p-4 sm:p-6"
        data-draft-workspace="true"
      >
        <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-12">
          {(loading || result) && (
            <section
              aria-label="Draft overview"
              className="col-span-full border-b border-border pb-5"
            >
              <dl className="grid grid-cols-3 divide-x divide-border">
                {metrics.map((metric) => (
                  <div
                    key={metric.label}
                    className="min-w-0 px-3 first:pl-0 sm:px-6"
                  >
                    <dt className="text-sm font-medium text-muted-foreground">
                      {metric.label}
                    </dt>
                    <dd className="mt-2 text-2xl font-semibold text-foreground">
                      {loading ? (
                        <DashboardSkeleton className="h-8 w-12" />
                      ) : (
                        metric.value
                      )}
                    </dd>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {metric.supportingText}
                    </p>
                  </div>
                ))}
              </dl>
            </section>
          )}
          <div
            role="search"
            aria-label="Draft search"
            className="flex min-w-0 items-start lg:col-span-8"
          >
            <DashboardSearchField
              value={search}
              onValueChange={setSearch}
              label="Search draft proposals"
              placeholder="Search draft title or ID"
              maxLength={200}
              clearLabel="Clear draft search"
              onClear={() => setSearch("")}
            />
          </div>
          <p className="min-w-0 text-sm text-muted-foreground lg:col-span-4">
            Open a draft to continue its information and files. Saving stays
            separate from submitting it for admin review.
          </p>
          {error && (
            <div className="col-span-full">
              <DatasetErrorBanner
                title="We could not load your drafts"
                message={error}
                onRetry={load}
              />
            </div>
          )}
          <section
            aria-labelledby="draft-inventory-title"
            className="col-span-full min-w-0 border-t border-border pt-5"
            data-proposal-tile="true"
          >
            {error && !result ? (
              <h2
                id="draft-inventory-title"
                className="text-base font-semibold"
              >
                Draft inventory
              </h2>
            ) : (
              <DatasetInventoryHeader
                id="draft-inventory-title"
                title="Draft inventory"
                loading={loading}
                total={result?.total ?? 0}
                singularLabel="draft"
                pluralLabel="drafts"
              />
            )}
            {loading ? (
              <DatasetListSkeleton />
            ) : result?.items.length === 0 ? (
              <DatasetEmptyState
                filtered={Boolean(query)}
                onClear={() => setSearch("")}
                title="No draft proposals yet"
                description="Use Create proposal to start with a title and save the rest step by step."
                filteredTitle="No draft proposals match this search"
                filteredDescription="Try another title or ID."
              />
            ) : result && result.items.length > 0 ? (
              <DatasetRecordList
                items={result.items}
                columns={columns}
                busy={false}
                framed={false}
                mobileBreakpoint="xl"
                fixedLayout
                getKey={(row) => row.id}
                caption="Draft dataset proposals"
                renderMobile={(row) => (
                  <DatasetMobileRecordCard
                    framed={false}
                    href={resumeUrl(row)}
                    title={row.title}
                    identifier={row.datasetUniqueId ?? row.id}
                    icon={FileText}
                    badges={
                      <>
                        <DashboardStatusBadge tone="neutral">
                          Draft
                        </DashboardStatusBadge>
                        <DraftFileState
                          attached={Boolean(row.currentUploadId)}
                        />
                      </>
                    }
                    supportingText={`${uploadLabel(row)} · Updated ${formatDatasetDate(row.updatedAt)}`}
                    actionLabel="Continue"
                  />
                )}
              />
            ) : null}
            {result && (
              <DashboardPagination
                ariaLabel="Draft proposal pages"
                page={result.page}
                pageSize={result.limit}
                totalItems={result.total}
                itemLabel="drafts"
                onPageChange={setPage}
                disabled={loading}
                className="border-t border-border pt-4"
              />
            )}
          </section>
        </div>
      </DashboardCard>
    </DatasetWorkspace>
  );
}

function DraftFileState({ attached }: { attached: boolean }) {
  return (
    <DashboardStatusBadge tone={attached ? "success" : "warning"}>
      {attached ? "Attached" : "Not attached"}
    </DashboardStatusBadge>
  );
}
