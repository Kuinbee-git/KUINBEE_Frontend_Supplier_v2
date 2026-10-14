"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { FileText } from "lucide-react";
import {
  DATASET_UPLOAD_CHOICES,
  type DatasetPreparationsListResponse,
} from "@kuinbee/dataset-preparation-contracts";
import { useComponentRequest } from "@/hooks/useComponentRequest";
import { preparationApi } from "@/lib/api/dataset-preparations";
import { DashboardButton, DashboardStatusBadge } from "@/components/dashboard";
import {
  DatasetEmptyState,
  DatasetErrorBanner,
  DatasetFilterToolbar,
  DatasetInventoryHeader,
  DatasetListSkeleton,
  DatasetMobileRecordCard,
  DatasetRecordIdentity,
  DatasetRecordList,
  formatDatasetDate,
} from "@/components/datasets/workspace";

/** The new draft inventory lives inside the existing proposal workspace. */
export function DatasetPreparationList() {
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<DatasetPreparationsListResponse | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const requestIdRef = useRef(0);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
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
    try {
      const next = await preparationApi.list(page, query);
      if (requestId === requestIdRef.current) setResult(next);
    } catch (failure) {
      if (requestId === requestIdRef.current)
        setError(
          failure instanceof Error
            ? failure.message
            : "Draft proposals could not be loaded."
        );
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [page, query]);
  useComponentRequest(load, [page, query]);
  const uploadLabel = (value: string | null | undefined) =>
    DATASET_UPLOAD_CHOICES.find((choice) => choice.value === value)?.label ??
    "Upload choice not selected";
  return (
    <section aria-labelledby="new-draft-inventory-title" className="space-y-4">
      <DatasetInventoryHeader
        id="new-draft-inventory-title"
        title="Draft proposals"
        loading={loading}
        total={result?.total ?? 0}
        singularLabel="draft"
        pluralLabel="drafts"
      />
      <p className="border-y border-border bg-muted/20 px-4 py-3 text-sm">
        Continue saving your proposal step by step. File upload and admin
        submission are not yet enabled for these drafts in staging.
      </p>
      <DatasetFilterToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search draft proposal title"
        searchAriaLabel="Search draft proposals"
        onClear={() => setSearch("")}
      />
      {error && (
        <DatasetErrorBanner
          title="We could not load your draft proposals"
          message={error}
          onRetry={load}
        />
      )}
      {loading && !result ? (
        <DatasetListSkeleton />
      ) : !error && result?.items.length === 0 ? (
        <DatasetEmptyState
          filtered={Boolean(search.trim())}
          onClear={() => setSearch("")}
          title="No draft proposals yet"
          description="Use Create proposal to start with a title and save the rest step by step."
          filteredTitle="No draft proposals match this search"
          filteredDescription="Try another draft title."
        />
      ) : result && result.items.length > 0 ? (
        <DatasetRecordList
          items={result.items}
          busy={loading}
          caption="Draft proposals in the new editor"
          getKey={(item) => item.id}
          columns={[
            {
              header: "Draft",
              render: (item) => (
                <DatasetRecordIdentity
                  href={`/dashboard/datasets/drafts/${item.id}`}
                  title={item.metadata.title}
                  identifier={item.id}
                  icon={FileText}
                />
              ),
            },
            {
              header: "Material",
              render: (item) => (
                <span className="text-sm">
                  {uploadLabel(item.metadata.uploadChoice)}
                </span>
              ),
            },
            {
              header: "Status",
              render: () => (
                <DashboardStatusBadge tone="neutral">
                  Draft
                </DashboardStatusBadge>
              ),
            },
            {
              header: "Last updated",
              className: "whitespace-nowrap text-sm text-muted-foreground",
              render: (item) => formatDatasetDate(item.updatedAt),
            },
            {
              header: "Action",
              className: "text-right",
              headerClassName: "text-right",
              render: (item) => (
                <DashboardButton asChild variant="outline" size="compact">
                  <Link href={`/dashboard/datasets/drafts/${item.id}`}>
                    Continue
                  </Link>
                </DashboardButton>
              ),
            },
          ]}
          renderMobile={(item) => (
            <DatasetMobileRecordCard
              href={`/dashboard/datasets/drafts/${item.id}`}
              title={item.metadata.title}
              identifier={item.id}
              icon={FileText}
              badges={
                <DashboardStatusBadge tone="neutral">
                  Draft
                </DashboardStatusBadge>
              }
              supportingText={`${uploadLabel(item.metadata.uploadChoice)} · Updated ${formatDatasetDate(item.updatedAt)}`}
              actionLabel="Continue"
            />
          )}
        />
      ) : null}
      {result && result.total > 20 && (
        <nav
          aria-label="Draft proposal pages"
          className="flex flex-wrap items-center gap-3"
        >
          <DashboardButton
            variant="outline"
            type="button"
            disabled={loading || page <= 1}
            onClick={() => setPage((value) => value - 1)}
          >
            Previous draft page
          </DashboardButton>
          <span>
            Page {page} of {Math.ceil(result.total / 20)}
          </span>
          <DashboardButton
            variant="outline"
            type="button"
            disabled={loading || page * 20 >= result.total}
            onClick={() => setPage((value) => value + 1)}
          >
            Next draft page
          </DashboardButton>
        </nav>
      )}
    </section>
  );
}
