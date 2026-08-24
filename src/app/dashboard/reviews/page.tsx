"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  ChevronRight,
  MessageSquareText,
  RefreshCw,
  Star,
} from "lucide-react";

import {
  DashboardButton,
  DashboardCard,
  DashboardCardContent,
  DashboardCardDescription,
  DashboardCardHeader,
  DashboardCardTitle,
  DashboardDataTable,
  DashboardEmptyState,
  DashboardErrorState,
  DashboardInlineAlert,
  DashboardLoadingState,
  DashboardMetricCard,
  DashboardMobileRecordCard,
  DashboardPage,
  DashboardPageHeader,
  DashboardPagination,
  DashboardProgress,
  DashboardSearchField,
  DashboardStatusBadge,
  DashboardToolbar,
  type DashboardTableColumn,
  type DashboardTone,
} from "@/components/dashboard";
import { getDatasetReviews, listMyDatasets } from "@/lib/api/datasets";
import { cn } from "@/lib/utils";
import type {
  DatasetReview,
  PublishedDatasetListItem,
} from "@/types/dataset.types";

const FETCH_PAGE_SIZE = 100;
const TABLE_PAGE_SIZE = 10;

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function getRatingTone(rating: number, count: number): DashboardTone {
  if (count === 0) return "neutral";
  if (rating >= 4) return "success";
  if (rating >= 3) return "warning";
  return "danger";
}

function getRatingLabel(rating: number, count: number) {
  if (count === 0) return "Awaiting reviews";
  if (rating >= 4) return "Excellent";
  if (rating >= 3) return "Good";
  return "Needs attention";
}

function StarRating({
  rating,
  size = "default",
}: {
  rating: number;
  size?: "default" | "large";
}) {
  const roundedRating = Math.round(rating);

  return (
    <span
      className="inline-flex items-center gap-0.5"
      role="img"
      aria-label={`${rating.toFixed(1)} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            size === "large" ? "size-4" : "size-3.5",
            star <= roundedRating
              ? "fill-[var(--dashboard-warning)] text-[var(--dashboard-warning)]"
              : "text-muted-foreground/45"
          )}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

async function fetchAllSupplierDatasets() {
  const datasets: PublishedDatasetListItem[] = [];
  let page = 1;
  let fetched = 0;
  let total = 0;

  do {
    const response = await listMyDatasets({
      page,
      pageSize: FETCH_PAGE_SIZE,
      status: "PUBLISHED",
      visibility: "PUBLIC",
    });
    const items = response.items ?? [];
    datasets.push(...items);
    fetched += items.length;
    total = response.total ?? 0;
    if (items.length === 0) break;
    page += 1;
  } while (fetched < total);

  return datasets;
}

async function fetchAllDatasetReviews(datasetId: string) {
  const reviews: DatasetReview[] = [];
  let page = 1;
  let fetched = 0;
  let total = 0;

  do {
    const response = await getDatasetReviews(datasetId, {
      page,
      pageSize: FETCH_PAGE_SIZE,
    });
    const items = response.items ?? [];
    reviews.push(...items);
    fetched += items.length;
    total = response.total ?? 0;
    if (items.length === 0) break;
    page += 1;
  } while (fetched < total);

  return reviews;
}

export default function SupplierReviewsPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [datasets, setDatasets] = useState<PublishedDatasetListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [datasetPage, setDatasetPage] = useState(1);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(
    null
  );
  const [reviews, setReviews] = useState<DatasetReview[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewPage, setReviewPage] = useState(1);

  const loadDatasets = useCallback(async (mode: "initial" | "refresh") => {
    if (mode === "initial") {
      setLoading(true);
      setLoadError(null);
    } else {
      setRefreshing(true);
      setRefreshError(null);
    }

    try {
      const nextDatasets = await fetchAllSupplierDatasets();
      setDatasets(nextDatasets);
      setSelectedDatasetId((current) =>
        current && nextDatasets.some((dataset) => dataset.id === current)
          ? current
          : null
      );
    } catch (error: unknown) {
      const message = getErrorMessage(
        error,
        "Dataset reviews could not be loaded."
      );
      if (mode === "initial") setLoadError(message);
      else setRefreshError(message);
    } finally {
      if (mode === "initial") setLoading(false);
      else setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadDatasets("initial");
  }, [loadDatasets]);

  useEffect(() => {
    setDatasetPage(1);
  }, [searchQuery]);

  const sortedDatasets = useMemo(
    () =>
      [...datasets].sort((a, b) => {
        if ((b.reviewCount ?? 0) !== (a.reviewCount ?? 0)) {
          return (b.reviewCount ?? 0) - (a.reviewCount ?? 0);
        }
        return Number(b.rating ?? 0) - Number(a.rating ?? 0);
      }),
    [datasets]
  );

  const filteredDatasets = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return sortedDatasets;
    return sortedDatasets.filter(
      (dataset) =>
        dataset.title.toLowerCase().includes(query) ||
        dataset.datasetUniqueId.toLowerCase().includes(query)
    );
  }, [searchQuery, sortedDatasets]);

  const datasetPageCount = Math.max(
    1,
    Math.ceil(filteredDatasets.length / TABLE_PAGE_SIZE)
  );
  const safeDatasetPage = Math.min(datasetPage, datasetPageCount);
  const visibleDatasets = filteredDatasets.slice(
    (safeDatasetPage - 1) * TABLE_PAGE_SIZE,
    safeDatasetPage * TABLE_PAGE_SIZE
  );

  const selectedDataset = useMemo(
    () => datasets.find((dataset) => dataset.id === selectedDatasetId) ?? null,
    [datasets, selectedDatasetId]
  );

  const totalReviews = datasets.reduce(
    (sum, dataset) => sum + (dataset.reviewCount ?? 0),
    0
  );
  const datasetsWithReviews = datasets.filter(
    (dataset) => (dataset.reviewCount ?? 0) > 0
  ).length;
  const overallAverage = useMemo(() => {
    const ratedDatasets = datasets.filter(
      (dataset) => Number(dataset.rating ?? 0) > 0
    );
    if (ratedDatasets.length === 0) return 0;
    return (
      ratedDatasets.reduce(
        (sum, dataset) => sum + Number(dataset.rating ?? 0),
        0
      ) / ratedDatasets.length
    );
  }, [datasets]);

  const loadReviews = useCallback(async (datasetId: string) => {
    setLoadingReviews(true);
    setReviewError(null);
    setReviews([]);

    try {
      setReviews(await fetchAllDatasetReviews(datasetId));
    } catch (error: unknown) {
      setReviewError(
        getErrorMessage(error, "Reviews for this dataset could not be loaded.")
      );
    } finally {
      setLoadingReviews(false);
    }
  }, []);

  const openDataset = (dataset: PublishedDatasetListItem) => {
    setSelectedDatasetId(dataset.id);
    setReviewPage(1);
    void loadReviews(dataset.id);
  };

  const closeDataset = () => {
    setSelectedDatasetId(null);
    setReviews([]);
    setReviewError(null);
    setReviewPage(1);
  };

  const distribution = useMemo(
    () =>
      [5, 4, 3, 2, 1].map((star) => ({
        star,
        count: reviews.filter((review) => review.rating === star).length,
      })),
    [reviews]
  );

  const reviewPageCount = Math.max(
    1,
    Math.ceil(reviews.length / TABLE_PAGE_SIZE)
  );
  const safeReviewPage = Math.min(reviewPage, reviewPageCount);
  const visibleReviews = reviews.slice(
    (safeReviewPage - 1) * TABLE_PAGE_SIZE,
    safeReviewPage * TABLE_PAGE_SIZE
  );

  const datasetColumns: readonly DashboardTableColumn<PublishedDatasetListItem>[] =
    [
      {
        id: "dataset",
        header: "Dataset",
        rowHeader: true,
        className: "min-w-64",
        cell: (dataset) => (
          <div className="min-w-0">
            <p className="max-w-80 truncate text-sm font-semibold text-foreground">
              {dataset.title}
            </p>
            <p className="mt-1 truncate font-mono text-xs font-normal text-muted-foreground">
              {dataset.datasetUniqueId}
            </p>
          </div>
        ),
      },
      {
        id: "rating",
        header: "Rating",
        className: "min-w-40",
        cell: (dataset) => {
          const rating = Number(dataset.rating ?? 0);
          return rating > 0 ? (
            <div className="flex items-center gap-2">
              <StarRating rating={rating} />
              <span className="font-semibold tabular-nums">
                {rating.toFixed(1)}
              </span>
            </div>
          ) : (
            <span className="text-muted-foreground">Not rated</span>
          );
        },
      },
      {
        id: "reviews",
        header: "Reviews",
        cell: (dataset) => (
          <span className="tabular-nums text-muted-foreground">
            {dataset.reviewCount ?? 0}
          </span>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: (dataset) => {
          const count = dataset.reviewCount ?? 0;
          const rating = Number(dataset.rating ?? 0);
          return (
            <DashboardStatusBadge tone={getRatingTone(rating, count)}>
              {getRatingLabel(rating, count)}
            </DashboardStatusBadge>
          );
        },
      },
      {
        id: "action",
        header: <span className="sr-only">Action</span>,
        align: "end",
        cell: (dataset) => (
          <DashboardButton
            variant="outline"
            size="compact"
            onClick={() => openDataset(dataset)}
          >
            View reviews <ChevronRight aria-hidden="true" />
          </DashboardButton>
        ),
      },
    ];

  const reviewColumns: readonly DashboardTableColumn<DatasetReview>[] = [
    {
      id: "review",
      header: "Review",
      rowHeader: true,
      className: "min-w-72 max-w-2xl",
      cell: (review) =>
        review.comment ? (
          <p className="whitespace-pre-wrap text-sm font-normal leading-6 text-foreground">
            {review.comment}
          </p>
        ) : (
          <p className="text-sm font-normal italic text-muted-foreground">
            Rating only — no written review
          </p>
        ),
    },
    {
      id: "rating",
      header: "Rating",
      className: "min-w-40",
      cell: (review) => (
        <div className="flex items-center gap-2">
          <StarRating rating={review.rating} />
          <span className="font-semibold tabular-nums">{review.rating}/5</span>
        </div>
      ),
    },
    {
      id: "date",
      header: "Submitted",
      align: "end",
      className: "whitespace-nowrap text-muted-foreground",
      cell: (review) => (
        <time dateTime={review.createdAt}>{formatDate(review.createdAt)}</time>
      ),
    },
  ];

  return (
    <DashboardPage width="wide">
      {selectedDataset ? (
        <DashboardButton
          variant="ghost"
          onClick={closeDataset}
          className="self-start"
        >
          <ArrowLeft aria-hidden="true" /> Back to reviews
        </DashboardButton>
      ) : null}

      <DashboardPageHeader
        title={selectedDataset ? selectedDataset.title : "Reviews"}
        description={
          selectedDataset
            ? `Buyer ratings and feedback for ${selectedDataset.datasetUniqueId}.`
            : "Monitor buyer ratings and feedback across your marketplace datasets."
        }
        meta={
          selectedDataset ? (
            <DashboardStatusBadge
              tone={getRatingTone(
                Number(selectedDataset.rating ?? 0),
                selectedDataset.reviewCount ?? 0
              )}
            >
              {getRatingLabel(
                Number(selectedDataset.rating ?? 0),
                selectedDataset.reviewCount ?? 0
              )}
            </DashboardStatusBadge>
          ) : undefined
        }
        actions={
          <DashboardButton
            variant="outline"
            onClick={() => {
              if (selectedDataset) void loadReviews(selectedDataset.id);
              else void loadDatasets("refresh");
            }}
            disabled={loading || refreshing || loadingReviews}
          >
            <RefreshCw
              className={cn(
                (refreshing || loadingReviews) &&
                  "animate-spin motion-reduce:animate-none"
              )}
              aria-hidden="true"
            />
            Refresh
          </DashboardButton>
        }
      />

      {selectedDataset ? (
        loadingReviews ? (
          <DashboardLoadingState
            label={`Loading reviews for ${selectedDataset.title}`}
            variant="skeleton"
            rows={5}
          />
        ) : reviewError ? (
          <DashboardErrorState
            title="Reviews could not be loaded"
            message={reviewError}
            onRetry={() => void loadReviews(selectedDataset.id)}
          />
        ) : reviews.length === 0 ? (
          <DashboardEmptyState
            icon={Star}
            title="No reviews yet"
            description="Buyer reviews will appear here after they are submitted for this dataset."
          />
        ) : (
          <>
            <DashboardCard>
              <DashboardCardHeader>
                <DashboardCardTitle>Rating distribution</DashboardCardTitle>
                <DashboardCardDescription>
                  A breakdown of all ratings submitted for this dataset.
                </DashboardCardDescription>
              </DashboardCardHeader>
              <DashboardCardContent className="grid gap-6 md:grid-cols-[12rem_minmax(0,1fr)] md:items-center">
                <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-muted/35 px-5 py-6 text-center">
                  <p className="text-4xl font-semibold tracking-tight text-foreground tabular-nums">
                    {Number(selectedDataset.rating ?? 0).toFixed(1)}
                  </p>
                  <StarRating
                    rating={Number(selectedDataset.rating ?? 0)}
                    size="large"
                  />
                  <p className="mt-2 text-xs text-muted-foreground">
                    {reviews.length} review{reviews.length === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="grid gap-3">
                  {distribution.map(({ star, count }) => (
                    <div
                      key={star}
                      className="grid grid-cols-[minmax(0,1fr)_2rem] items-end gap-3"
                    >
                      <DashboardProgress
                        label={`${star} ${star === 1 ? "star" : "stars"}`}
                        value={count}
                        max={reviews.length}
                        showValue={false}
                      />
                      <span className="pb-0.5 text-right text-sm text-muted-foreground tabular-nums">
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              </DashboardCardContent>
            </DashboardCard>

            <section aria-label="Buyer reviews" className="space-y-4">
              <DashboardDataTable
                caption={`Buyer reviews for ${selectedDataset.title}`}
                items={visibleReviews}
                columns={reviewColumns}
                getRowId={(review) => review.id}
                renderMobileItem={(review) => (
                  <DashboardMobileRecordCard>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <StarRating rating={review.rating} />
                        <span className="text-sm font-semibold tabular-nums text-foreground">
                          {review.rating}/5
                        </span>
                      </div>
                      <time
                        className="text-xs text-muted-foreground"
                        dateTime={review.createdAt}
                      >
                        {formatDate(review.createdAt)}
                      </time>
                    </div>
                    <p
                      className={cn(
                        "mt-4 whitespace-pre-wrap border-t border-border pt-4 text-sm leading-6",
                        review.comment
                          ? "text-foreground"
                          : "italic text-muted-foreground"
                      )}
                    >
                      {review.comment ?? "Rating only — no written review"}
                    </p>
                  </DashboardMobileRecordCard>
                )}
              />
              <DashboardPagination
                page={safeReviewPage}
                pageSize={TABLE_PAGE_SIZE}
                totalItems={reviews.length}
                itemLabel="reviews"
                onPageChange={setReviewPage}
              />
            </section>
          </>
        )
      ) : loadError ? (
        <DashboardErrorState
          title="Reviews could not be loaded"
          message={loadError}
          onRetry={() => void loadDatasets("initial")}
        />
      ) : loading ? (
        <DashboardLoadingState
          label="Loading dataset reviews"
          variant="skeleton"
          rows={6}
        />
      ) : datasets.length === 0 ? (
        <DashboardEmptyState
          icon={BarChart3}
          title="No datasets available"
          description="Publish a dataset to begin collecting ratings and buyer reviews."
        />
      ) : (
        <>
          {refreshError ? (
            <DashboardInlineAlert
              tone="danger"
              title="Reviews could not be refreshed"
              message={refreshError}
              action={
                <DashboardButton
                  variant="outline"
                  size="compact"
                  onClick={() => void loadDatasets("refresh")}
                  disabled={refreshing}
                >
                  Try again
                </DashboardButton>
              }
            />
          ) : null}

          <section
            aria-label="Review summary"
            className="grid gap-4 sm:grid-cols-3"
          >
            <DashboardMetricCard
              label="Total reviews"
              value={totalReviews}
              supportingText="Buyer reviews across your datasets"
            />
            <DashboardMetricCard
              label="Average rating"
              value={overallAverage > 0 ? overallAverage.toFixed(1) : "—"}
              supportingText="Average of rated dataset scores"
              status={overallAverage > 0 ? "Out of 5" : "Not rated"}
              statusTone={
                overallAverage > 0
                  ? getRatingTone(overallAverage, totalReviews)
                  : "neutral"
              }
            />
            <DashboardMetricCard
              label="Datasets reviewed"
              value={datasetsWithReviews}
              supportingText={`Of ${datasets.length} total datasets`}
            />
          </section>

          <DashboardToolbar ariaLabel="Search dataset reviews">
            <DashboardSearchField
              value={searchQuery}
              onValueChange={setSearchQuery}
              label="Search dataset reviews"
              placeholder="Search by dataset title or ID"
            />
          </DashboardToolbar>

          {filteredDatasets.length === 0 ? (
            <DashboardEmptyState
              filtered
              icon={MessageSquareText}
              title="No datasets match this search"
              description="Try a different dataset title or reference."
              onClear={() => setSearchQuery("")}
            />
          ) : (
            <section aria-label="Dataset review overview" className="space-y-4">
              <DashboardDataTable
                caption="Dataset review overview"
                items={visibleDatasets}
                columns={datasetColumns}
                getRowId={(dataset) => dataset.id}
                renderMobileItem={(dataset) => {
                  const rating = Number(dataset.rating ?? 0);
                  const count = dataset.reviewCount ?? 0;
                  return (
                    <DashboardMobileRecordCard>
                      <h3 className="truncate text-sm font-semibold text-foreground">
                        {dataset.title}
                      </h3>
                      <p className="mt-1 truncate font-mono text-xs text-muted-foreground">
                        {dataset.datasetUniqueId}
                      </p>
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        {rating > 0 ? (
                          <>
                            <StarRating rating={rating} />
                            <span className="text-sm font-semibold tabular-nums text-foreground">
                              {rating.toFixed(1)}
                            </span>
                          </>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            Not rated
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          · {count} review{count === 1 ? "" : "s"}
                        </span>
                      </div>
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
                        <DashboardStatusBadge
                          tone={getRatingTone(rating, count)}
                        >
                          {getRatingLabel(rating, count)}
                        </DashboardStatusBadge>
                        <DashboardButton
                          variant="outline"
                          size="compact"
                          onClick={() => openDataset(dataset)}
                        >
                          View reviews <ChevronRight aria-hidden="true" />
                        </DashboardButton>
                      </div>
                    </DashboardMobileRecordCard>
                  );
                }}
              />
              <DashboardPagination
                page={safeDatasetPage}
                pageSize={TABLE_PAGE_SIZE}
                totalItems={filteredDatasets.length}
                itemLabel="datasets"
                onPageChange={setDatasetPage}
              />
            </section>
          )}
        </>
      )}
    </DashboardPage>
  );
}
