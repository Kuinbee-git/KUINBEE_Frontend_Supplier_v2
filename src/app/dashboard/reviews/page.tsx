"use client";

import { useEffect, useMemo, useState } from "react";
import { GlassCard } from "@/components/shared";
import { useSupplierTokens } from "@/hooks/useSupplierTokens";
import { listMyDatasets, getDatasetReviews } from "@/lib/api/datasets";
import type { PublishedDatasetListItem, DatasetReview } from "@/types/dataset.types";
import { Star, MessageSquareText, Loader2, ChevronLeft, ChevronRight, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DatasetsTable, type TableColumn } from "@/components/datasets/shared/DatasetsTable";

type DatasetWithReviews = PublishedDatasetListItem & {
  reviews: DatasetReview[];
};

function StarRow({ rating, size = 14 }: { rating: number; size?: number }) {
  const tokens = useSupplierTokens();
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={size}
          fill={s <= Math.round(rating) ? "#eab308" : "transparent"}
          stroke={s <= Math.round(rating) ? "#eab308" : tokens.textMuted}
          strokeWidth={1.5}
        />
      ))}
    </div>
  );
}

export default function SupplierReviewsPage() {
  const tokens = useSupplierTokens();
  const [loading, setLoading] = useState(true);
  const [datasets, setDatasets] = useState<PublishedDatasetListItem[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<DatasetWithReviews | null>(null);
  const [loadingReviews, setLoadingReviews] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await listMyDatasets();
        setDatasets(data.items);
      } catch (error) {
        console.error("Failed to fetch datasets:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const sorted = useMemo(
    () =>
      [...datasets].sort((a, b) => {
        if ((b.reviewCount || 0) !== (a.reviewCount || 0)) return (b.reviewCount || 0) - (a.reviewCount || 0);
        return Number(b.rating || 0) - Number(a.rating || 0);
      }),
    [datasets]
  );

  // Overall stats
  const totalReviews = datasets.reduce((sum, d) => sum + (d.reviewCount || 0), 0);
  const datasetsWithReviews = datasets.filter((d) => (d.reviewCount || 0) > 0).length;
  const overallAvg = useMemo(() => {
    const withRatings = datasets.filter((d) => d.rating);
    if (withRatings.length === 0) return 0;
    return withRatings.reduce((sum, d) => sum + Number(d.rating || 0), 0) / withRatings.length;
  }, [datasets]);

  const handleSelectDataset = async (dataset: PublishedDatasetListItem) => {
    try {
      setLoadingReviews(true);
      
      const response = await getDatasetReviews(dataset.id);

      setSelectedDataset({
        ...dataset,
        reviews: response.items || [],
      });
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
      setSelectedDataset({
        ...dataset,
        reviews: [],
      });
    } finally {
      setLoadingReviews(false);
    }
  };

  // Rating distribution for selected dataset
  const distribution = useMemo(() => {
    if (!selectedDataset) return [];
    return [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: selectedDataset.reviews.filter((r) => r.rating === star).length,
    }));
  }, [selectedDataset]);
  const maxDistCount = Math.max(...(distribution.map((d) => d.count) || [1]), 1);

  // Table columns for the dataset list
  const datasetColumns: TableColumn<PublishedDatasetListItem>[] = useMemo(() => [
    {
      header: "Dataset",
      accessor: (item) => (
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: tokens.textPrimary }}>
            {item.title}
          </p>
          <p className="text-xs mt-0.5" style={{ color: tokens.textMuted }}>
            {item.datasetUniqueId}
          </p>
        </div>
      ),
      minWidth: "200px",
    },
    {
      header: "Rating",
      accessor: (item) => {
        const ratingVal = Number(item.rating || 0);
        return ratingVal > 0 ? (
          <div className="flex items-center gap-2">
            <StarRow rating={ratingVal} size={13} />
            <span className="text-sm font-semibold tabular-nums" style={{ color: tokens.textPrimary }}>
              {ratingVal.toFixed(1)}
            </span>
          </div>
        ) : (
          <span className="text-xs" style={{ color: tokens.textMuted }}>—</span>
        );
      },
      minWidth: "140px",
    },
    {
      header: "Reviews",
      accessor: (item) => {
        const count = item.reviewCount || 0;
        return count > 0 ? (
          <span
            className="text-xs font-medium px-2.5 py-1 rounded-full inline-block"
            style={{ background: tokens.infoBg, color: tokens.textSecondary, border: `1px solid ${tokens.infoBorder}` }}
          >
            {count} review{count === 1 ? "" : "s"}
          </span>
        ) : (
          <span className="text-xs" style={{ color: tokens.textMuted }}>No reviews</span>
        );
      },
      minWidth: "100px",
    },
    {
      header: "Status",
      accessor: (item) => {
        const count = item.reviewCount || 0;
        const ratingVal = Number(item.rating || 0);
        if (count === 0) {
          return (
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ background: tokens.infoBg, color: tokens.textMuted }}
            >
              Awaiting
            </span>
          );
        }
        const color = ratingVal >= 4 ? { bg: tokens.successBg, text: tokens.successText, border: tokens.successBorder } :
                      ratingVal >= 3 ? { bg: tokens.warningBg, text: tokens.warningText, border: tokens.warningBorder } :
                                       { bg: tokens.errorBg, text: tokens.errorText, border: tokens.errorBorder };
        const label = ratingVal >= 4 ? "Excellent" : ratingVal >= 3 ? "Good" : "Needs Improvement";
        return (
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{ background: color.bg, color: color.text, border: `1px solid ${color.border}` }}
          >
            {label}
          </span>
        );
      },
      hidden: "md" as const,
      minWidth: "120px",
    },
    {
      header: "",
      accessor: () => (
        <ChevronRight size={16} style={{ color: tokens.textMuted }} />
      ),
      className: "text-right pr-2",
      headerClassName: "text-right",
    },
  ], [tokens]);

  // Table columns for individual reviews in drill-down
  const reviewColumns: TableColumn<DatasetReview>[] = useMemo(() => [
    {
      header: "Rating",
      accessor: (review) => (
        <div className="flex items-center gap-2">
          <StarRow rating={review.rating} size={13} />
          <span className="text-xs font-semibold" style={{ color: tokens.textPrimary }}>
            {review.rating}/5
          </span>
        </div>
      ),
      minWidth: "130px",
    },
    {
      header: "Review",
      accessor: (review) =>
        review.comment ? (
          <p className="text-sm leading-relaxed" style={{ color: tokens.textSecondary }}>
            {review.comment}
          </p>
        ) : (
          <p className="text-sm italic" style={{ color: tokens.textMuted }}>
            Rating only — no written review
          </p>
        ),
      minWidth: "300px",
    },
    {
      header: "Date",
      accessor: (review) => (
        <span className="text-xs tabular-nums whitespace-nowrap" style={{ color: tokens.textMuted }}>
          {new Date(review.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
      ),
      headerClassName: "text-right",
      className: "text-right",
      minWidth: "100px",
    },
  ], [tokens]);

  return (
    <div className="max-w-[1400px] mx-auto px-8 py-7 h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {selectedDataset && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedDataset(null)}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft size={18} style={{ color: tokens.textSecondary }} />
            </Button>
          )}
          <div>
            <h1 className="text-3xl font-semibold mb-1" style={{ color: tokens.textPrimary }}>
              {selectedDataset ? selectedDataset.title : "Reviews"}
            </h1>
            <p className="text-sm" style={{ color: tokens.textSecondary }}>
              {selectedDataset
                ? `${selectedDataset.reviews.length} review${selectedDataset.reviews.length === 1 ? "" : "s"} for this dataset`
                : "Rating and review overview for your datasets"
              }
            </p>
          </div>
        </div>
        {!loading && !selectedDataset && datasets.length > 0 && (
          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-2 rounded-lg px-3 py-2"
              style={{ background: tokens.infoBg, border: `1px solid ${tokens.infoBorder}` }}
            >
              <MessageSquareText size={14} style={{ color: tokens.textMuted }} />
              <span className="text-xs font-medium" style={{ color: tokens.textSecondary }}>
                {totalReviews} total review{totalReviews === 1 ? "" : "s"}
              </span>
            </div>
            {overallAvg > 0 && (
              <div
                className="flex items-center gap-2 rounded-lg px-3 py-2"
                style={{ background: tokens.warningBg, border: `1px solid ${tokens.warningBorder}` }}
              >
                <Star size={14} fill="#eab308" stroke="#eab308" />
                <span className="text-xs font-medium" style={{ color: tokens.warningText }}>
                  {overallAvg.toFixed(1)} avg
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <GlassCard className="p-12 flex items-center justify-center">
          <Loader2 className="animate-spin mr-3" size={20} style={{ color: tokens.textMuted }} />
          <span style={{ color: tokens.textMuted }}>Loading reviews…</span>
        </GlassCard>
      ) : selectedDataset ? (
        /* ===== DRILL-DOWN VIEW ===== */
        <div className="space-y-6">
          {/* Rating Distribution Card */}
          {selectedDataset.reviews.length > 0 && (
            <GlassCard className="p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                {/* Average Score */}
                <div className="flex flex-col items-center gap-1 sm:pr-6" style={{ borderRight: `1px solid ${tokens.borderSubtle}` }}>
                  <span className="text-4xl font-bold leading-none" style={{ color: tokens.textPrimary }}>
                    {Number(selectedDataset.rating || 0).toFixed(1)}
                  </span>
                  <StarRow rating={Number(selectedDataset.rating || 0)} size={16} />
                  <span className="text-xs mt-1" style={{ color: tokens.textMuted }}>
                    {selectedDataset.reviews.length} review{selectedDataset.reviews.length === 1 ? "" : "s"}
                  </span>
                </div>
                {/* Bars */}
                <div className="flex-1 w-full space-y-1.5">
                  {distribution.map(({ star, count }) => (
                    <div key={star} className="flex items-center gap-2">
                      <span className="text-xs font-medium w-3 text-right" style={{ color: tokens.textMuted }}>
                        {star}
                      </span>
                      <Star size={12} fill="#eab308" stroke="#eab308" />
                      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: tokens.infoBg }}>
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${(count / maxDistCount) * 100}%`,
                            background: "#eab308",
                          }}
                        />
                      </div>
                      <span className="text-xs w-5 text-right tabular-nums" style={{ color: tokens.textMuted }}>
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </GlassCard>
          )}

          {/* Individual Reviews Table */}
          <DatasetsTable<DatasetReview>
            data={selectedDataset.reviews}
            columns={reviewColumns}
            tokens={{ ...tokens, surfaceCard: tokens.glassBg, rowHover: tokens.navItemHover }}
            isDark={tokens.isDark}
            getRowKey={(review) => review.id}
            emptyIcon={<Star size={40} className="mx-auto mb-4" style={{ color: tokens.textMuted, opacity: 0.4 }} />}
            emptyTitle="No reviews yet"
            emptyDescription="Buyer reviews will appear here once submitted"
          />
        </div>
      ) : sorted.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <BarChart3 size={40} className="mx-auto mb-4" style={{ color: tokens.textMuted, opacity: 0.4 }} />
          <p className="text-base font-medium mb-1" style={{ color: tokens.textPrimary }}>
            No datasets available
          </p>
          <p className="text-sm" style={{ color: tokens.textMuted }}>
            Publish datasets to start collecting buyer reviews
          </p>
        </GlassCard>
      ) : (
        /* ===== DATASET LIST TABLE VIEW ===== */
        <DatasetsTable<PublishedDatasetListItem>
          data={sorted}
          columns={datasetColumns}
          onRowClick={(dataset) => handleSelectDataset(dataset)}
          tokens={{ ...tokens, surfaceCard: tokens.glassBg, rowHover: tokens.navItemHover }}
          isDark={tokens.isDark}
          getRowKey={(item) => item.id}
          emptyIcon={<BarChart3 size={40} className="mx-auto mb-4" style={{ color: tokens.textMuted, opacity: 0.4 }} />}
          emptyTitle="No datasets available"
          emptyDescription="Publish datasets to start collecting buyer reviews"
        />
      )}

      {/* Loading overlay for drill-down */}
      {loadingReviews && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <GlassCard className="p-6 flex items-center gap-3">
            <Loader2 className="animate-spin" size={20} style={{ color: tokens.textPrimary }} />
            <span className="text-sm" style={{ color: tokens.textPrimary }}>Loading reviews…</span>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
