"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Archive,
  ArrowRight,
  BadgeCheck,
  CircleOff,
  Database,
  Globe2,
  Plus,
} from "lucide-react";

import { DashboardButton, DashboardPagination } from "@/components/dashboard";
import { listMyDatasets } from "@/lib/api";
import type {
  DatasetStatus,
  DatasetVisibility,
  ListDatasetsResponse,
} from "@/types/dataset.types";
import { PublishStatusBadge } from "./shared";
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
  DatasetVisibilityBadge,
  DatasetWorkspace,
  formatDatasetDate,
  getDatasetActionLabel,
  type DatasetMetric,
  type DatasetRecordColumn,
} from "./workspace";

interface MyDatasetsProps {
  isDark?: boolean;
}

type FilterStatus = "ALL" | "VERIFIED" | "PUBLISHED" | "DELISTED" | "ARCHIVED";
type FilterVisibility = "ALL" | "PUBLIC" | "PRIVATE" | "UNLISTED";

const PAGE_SIZE = 10;
const STATUS_OPTIONS = [
  { label: "All statuses", value: "ALL" },
  { label: "Verified", value: "VERIFIED" },
  { label: "Published", value: "PUBLISHED" },
  { label: "Delisted", value: "DELISTED" },
  { label: "Archived", value: "ARCHIVED" },
];
const VISIBILITY_OPTIONS = [
  { label: "All visibility", value: "ALL" },
  { label: "Public", value: "PUBLIC" },
  { label: "Private", value: "PRIVATE" },
  { label: "Unlisted", value: "UNLISTED" },
];

const EMPTY_DATASET_SUMMARY: ListDatasetsResponse["summary"] = {
  total: 0,
  byStatus: {
    SUBMITTED: 0,
    UNDER_REVIEW: 0,
    VERIFIED: 0,
    PUBLISHED: 0,
    DELISTED: 0,
    ARCHIVED: 0,
  },
  byVisibility: {
    PUBLIC: 0,
    PRIVATE: 0,
    UNLISTED: 0,
  },
};

interface DatasetItem {
  id: string;
  datasetUniqueId: string;
  title: string;
  status: DatasetStatus;
  visibility: DatasetVisibility;
  publishedAt: string | null;
  updatedAt: string;
}

export function MyDatasets({ isDark = false }: MyDatasetsProps) {
  const searchParams = useSearchParams();
  const [datasets, setDatasets] = useState<DatasetItem[]>([]);
  const [totalDatasets, setTotalDatasets] = useState(0);
  const [summary, setSummary] = useState<ListDatasetsResponse["summary"]>(
    EMPTY_DATASET_SUMMARY
  );
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("ALL");
  const [visibilityFilter, setVisibilityFilter] =
    useState<FilterVisibility>("ALL");
  const fetchRequestIdRef = useRef(0);

  useEffect(() => {
    const statusFromQuery = searchParams.get("status");
    if (
      statusFromQuery === "VERIFIED" ||
      statusFromQuery === "PUBLISHED" ||
      statusFromQuery === "DELISTED" ||
      statusFromQuery === "ARCHIVED"
    ) {
      setStatusFilter(statusFromQuery);
      return;
    }
    setStatusFilter("ALL");
  }, [searchParams]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timeoutId);
  }, [searchQuery]);

  const fetchDatasets = useCallback(async () => {
    const requestId = ++fetchRequestIdRef.current;
    try {
      setLoading(true);
      setError(null);
      const response = await listMyDatasets({
        q: debouncedSearchQuery || undefined,
        status: statusFilter === "ALL" ? undefined : statusFilter,
        visibility: visibilityFilter === "ALL" ? undefined : visibilityFilter,
        page,
        pageSize: PAGE_SIZE,
      });

      if (requestId !== fetchRequestIdRef.current) return;
      setDatasets(response.items);
      setTotalDatasets(response.total || 0);
      setSummary(
        response.summary ?? {
          ...EMPTY_DATASET_SUMMARY,
          total: response.total || 0,
        }
      );
    } catch (loadError: unknown) {
      if (requestId !== fetchRequestIdRef.current) return;
      console.error("Failed to fetch datasets:", loadError);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Your datasets could not be loaded."
      );
    } finally {
      if (requestId === fetchRequestIdRef.current) setLoading(false);
    }
  }, [debouncedSearchQuery, page, statusFilter, visibilityFilter]);

  useEffect(() => {
    void fetchDatasets();
  }, [fetchDatasets]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, visibilityFilter]);

  const datasetSummary = summary ?? EMPTY_DATASET_SUMMARY;
  const metrics: DatasetMetric<FilterStatus>[] = [
    {
      label: "All datasets",
      supportingText: "Complete inventory",
      value: datasetSummary.total,
      filterValue: "ALL",
      icon: Database,
      tone: "neutral",
    },
    {
      label: "Ready to publish",
      supportingText: "Verified by Kuinbee",
      value: datasetSummary.byStatus.VERIFIED,
      filterValue: "VERIFIED",
      icon: BadgeCheck,
      tone: "blue",
    },
    {
      label: "Live",
      supportingText: "Visible to buyers",
      value: datasetSummary.byStatus.PUBLISHED,
      filterValue: "PUBLISHED",
      icon: Globe2,
      tone: "green",
    },
    {
      label: "Needs attention",
      supportingText: "Currently delisted",
      value: datasetSummary.byStatus.DELISTED,
      filterValue: "DELISTED",
      icon: CircleOff,
      tone: "amber",
    },
    {
      label: "Archived",
      supportingText: "Kept for reference",
      value: datasetSummary.byStatus.ARCHIVED,
      filterValue: "ARCHIVED",
      icon: Archive,
      tone: "slate",
    },
  ];

  const hasFilters =
    Boolean(searchQuery.trim()) ||
    statusFilter !== "ALL" ||
    visibilityFilter !== "ALL";

  const clearFilters = () => {
    setSearchQuery("");
    setDebouncedSearchQuery("");
    setStatusFilter("ALL");
    setVisibilityFilter("ALL");
    setPage(1);
  };

  const columns: DatasetRecordColumn<DatasetItem>[] = [
    {
      header: "Dataset",
      headerClassName: "w-[42%]",
      render: (dataset) => (
        <DatasetRecordIdentity
          href={`/dashboard/my-datasets/${dataset.id}`}
          title={dataset.title}
          identifier={dataset.datasetUniqueId}
        />
      ),
    },
    {
      header: "Status",
      render: (dataset) => <PublishStatusBadge status={dataset.status} />,
    },
    {
      header: "Visibility",
      render: (dataset) => (
        <DatasetVisibilityBadge visibility={dataset.visibility} />
      ),
    },
    {
      header: "Last updated",
      className: "whitespace-nowrap text-sm text-muted-foreground",
      render: (dataset) => formatDatasetDate(dataset.updatedAt),
    },
    {
      header: "Action",
      headerClassName: "text-right",
      className: "text-right",
      render: (dataset) => (
        <DashboardButton asChild variant="outline" size="compact">
          <Link href={`/dashboard/my-datasets/${dataset.id}`}>
            {getDatasetActionLabel(dataset.status)} <ArrowRight />
          </Link>
        </DashboardButton>
      ),
    },
  ];

  return (
    <DatasetWorkspace>
      <DatasetPageHeader
        title="My Datasets"
        description="Manage verified datasets, control marketplace visibility, and keep published listings current."
        action={
          <DashboardButton asChild className="w-full sm:w-auto">
            <Link href="/dashboard/datasets/create">
              <Plus /> Create dataset
            </Link>
          </DashboardButton>
        }
      />

      <section aria-label="Dataset lifecycle overview">
        <DatasetMetricStrip
          metrics={metrics}
          activeValue={statusFilter}
          onSelect={setStatusFilter}
          loading={loading && datasetSummary.total === 0}
        />
      </section>

      <DatasetFilterToolbar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search title or dataset ID"
        searchAriaLabel="Search datasets by title or dataset ID"
        filters={[
          {
            value: statusFilter,
            onValueChange: (value) => setStatusFilter(value as FilterStatus),
            options: STATUS_OPTIONS,
            ariaLabel: "Filter datasets by status",
          },
          {
            value: visibilityFilter,
            onValueChange: (value) =>
              setVisibilityFilter(value as FilterVisibility),
            options: VISIBILITY_OPTIONS,
            ariaLabel: "Filter datasets by visibility",
          },
        ]}
        activeFilterCount={
          (statusFilter !== "ALL" ? 1 : 0) +
          (visibilityFilter !== "ALL" ? 1 : 0)
        }
        onClear={clearFilters}
        isDark={isDark}
      />

      {error && (
        <DatasetErrorBanner
          title="We could not load your datasets"
          message={error}
          onRetry={fetchDatasets}
        />
      )}

      <section aria-labelledby="dataset-inventory-title">
        <DatasetInventoryHeader
          id="dataset-inventory-title"
          title="Dataset inventory"
          loading={loading}
          total={totalDatasets}
          singularLabel="dataset"
          pluralLabel="datasets"
        />

        {loading && datasets.length === 0 ? (
          <DatasetListSkeleton />
        ) : !error && datasets.length === 0 ? (
          <DatasetEmptyState
            filtered={hasFilters}
            onClear={clearFilters}
            title="No verified datasets yet"
            description="Create a dataset proposal and submit it for verification. Approved datasets will appear here."
            filteredTitle="No datasets match this view"
            filteredDescription="Try another title, dataset ID, status, or visibility setting."
            action={
              <DashboardButton asChild>
                <Link href="/dashboard/datasets/create">
                  <Plus /> Create dataset
                </Link>
              </DashboardButton>
            }
          />
        ) : datasets.length > 0 ? (
          <>
            <DatasetRecordList
              items={datasets}
              busy={loading}
              caption="Supplier datasets"
              columns={columns}
              getKey={(dataset) => dataset.id}
              renderMobile={(dataset) => (
                <DatasetMobileRecordCard
                  href={`/dashboard/my-datasets/${dataset.id}`}
                  title={dataset.title}
                  identifier={dataset.datasetUniqueId}
                  badges={
                    <>
                      <PublishStatusBadge status={dataset.status} />
                      <DatasetVisibilityBadge visibility={dataset.visibility} />
                    </>
                  }
                  supportingText={`Updated ${formatDatasetDate(dataset.updatedAt)}`}
                  actionLabel={getDatasetActionLabel(dataset.status)}
                />
              )}
            />
            <DashboardPagination
              page={page}
              pageSize={PAGE_SIZE}
              totalItems={totalDatasets}
              itemLabel="datasets"
              onPageChange={setPage}
              className="pt-4"
            />
          </>
        ) : null}
      </section>
    </DatasetWorkspace>
  );
}
