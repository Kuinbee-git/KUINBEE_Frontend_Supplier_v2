"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { GlassCard, PageBackground } from "@/components/shared";
import {
  canArchiveDataset,
  canChangeDatasetVisibility,
  canDelistDataset,
  canPublishDataset,
  DatasetEntityHeader,
  DatasetVisibilityBadge,
  DatasetWorkspace,
} from "./workspace";
import { PublishStatusBadge } from "./shared";
import { useSupplierTokens } from "@/hooks/useSupplierTokens";
import { getDatasetDetails, getDatasetPricing } from "@/lib/api/datasets";
import {
  PublishConfirmDialog,
  ChangeVisibilityDialog,
  PricingEditDialog,
  ArchiveConfirmDialog,
  DelistConfirmDialog,
  DownloadButton,
} from "./actions";
import { PRICING_STATUS_CONFIG } from "@/constants/dataset.constants";
import { KdtsScoreCard } from "./shared/KdtsScoreCard";
import type {
  DatasetPricingVersion,
  DatasetStatus,
  VerificationStatus,
} from "@/types/dataset-proposal.types";
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  Calendar,
  Upload,
  Eye,
  EyeOff,
  Lock,
  DollarSign,
  Archive,
  Database,
  Table2,
  Info,
  Tag,
  Globe,
  MapPin,
  Link2,
  Shield,
  FileCode,
  HardDrive,
  Rows3,
  Columns3,
  FileArchive,
  FileType2,
  Layers,
  BadgeCheck,
  RefreshCw,
  Download,
  History,
  type LucideIcon,
} from "lucide-react";
import type { DatasetDetailsResponse } from "@/types/dataset.types";

interface MyDatasetDetailProps {
  datasetId: string;
  isDark?: boolean;
}

type VerificationDisplayStatus = VerificationStatus | "UNKNOWN";

const VERIFICATION_STATUS_CONFIG: Record<
  VerificationDisplayStatus,
  {
    label: string;
    description: string;
    color: string;
    icon: LucideIcon;
  }
> = {
  PENDING: {
    label: "Pending Submission",
    description:
      "This dataset is still in draft mode and has not been submitted for review.",
    color: "#f59e0b",
    icon: Clock,
  },
  SUBMITTED: {
    label: "Submitted for Review",
    description:
      "Your dataset has been submitted and is waiting for the review process to begin.",
    color: "#3b82f6",
    icon: FileText,
  },
  CHANGES_REQUESTED: {
    label: "Changes Requested",
    description:
      "The reviewer has requested changes to your dataset. Please review the feedback below.",
    color: "#ef4444",
    icon: AlertCircle,
  },
  RESUBMITTED: {
    label: "Resubmitted for Review",
    description:
      "Your revised dataset has been resubmitted and is awaiting review.",
    color: "#8b5cf6",
    icon: Clock,
  },
  UNDER_REVIEW: {
    label: "Under Review",
    description:
      "Your dataset is currently being reviewed by our verification team.",
    color: "#f59e0b",
    icon: Clock,
  },
  VERIFIED: {
    label: "Verified",
    description:
      "Your dataset has been verified and approved. It is ready for publication.",
    color: "#22c55e",
    icon: CheckCircle,
  },
  REJECTED: {
    label: "Rejected",
    description:
      "Your dataset submission has been rejected. Please review the feedback below.",
    color: "#ef4444",
    icon: XCircle,
  },
  UNKNOWN: {
    label: "Verification unavailable",
    description: "Verification information is not available for this dataset.",
    color: "#6b7280",
    icon: AlertCircle,
  },
};

const DATASET_STATUS_CONFIG: Record<
  DatasetStatus,
  { label: string; color: string; bgColor: string }
> = {
  SUBMITTED: {
    label: "Submitted",
    color: "#3b82f6",
    bgColor: "rgba(59, 130, 246, 0.15)",
  },
  UNDER_REVIEW: {
    label: "Under Review",
    color: "#8b5cf6",
    bgColor: "rgba(139, 92, 246, 0.15)",
  },
  VERIFIED: {
    label: "Verified",
    color: "#22c55e",
    bgColor: "rgba(34, 197, 94, 0.15)",
  },
  PUBLISHED: {
    label: "Published",
    color: "#3b82f6",
    bgColor: "rgba(59, 130, 246, 0.15)",
  },
  DELISTED: {
    label: "Delisted",
    color: "#f59e0b",
    bgColor: "rgba(245, 158, 11, 0.15)",
  },
  ARCHIVED: {
    label: "Archived",
    color: "#6b7280",
    bgColor: "rgba(107, 114, 128, 0.15)",
  },
  REJECTED: {
    label: "Rejected",
    color: "#ef4444",
    bgColor: "rgba(239, 68, 68, 0.15)",
  },
};

const VISIBILITY_CONFIG: Record<
  string,
  { label: string; icon: LucideIcon; color: string }
> = {
  PUBLIC: { label: "Public", icon: Eye, color: "#22c55e" },
  PRIVATE: { label: "Private", icon: Lock, color: "#ef4444" },
  UNLISTED: { label: "Unlisted", icon: EyeOff, color: "#f59e0b" },
};

// Helper component for info items
function InfoItem({
  icon: Icon,
  label,
  value,
  tokens,
  valueColor,
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  tokens: ReturnType<typeof useSupplierTokens>;
  valueColor?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: tokens.infoBg }}
      >
        <Icon className="w-4 h-4" style={{ color: tokens.textSecondary }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs mb-0.5" style={{ color: tokens.textMuted }}>
          {label}
        </p>
        <p
          className="text-sm font-medium"
          style={{ color: valueColor || tokens.textPrimary }}
        >
          {value || "N/A"}
        </p>
      </div>
    </div>
  );
}

// Helper component for section headers
function SectionTitle({
  icon: Icon,
  title,
  badge,
  tokens,
}: {
  icon: LucideIcon;
  title: string;
  badge?: ReactNode;
  tokens: ReturnType<typeof useSupplierTokens>;
}) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-2">
        <Icon className="w-5 h-5" style={{ color: tokens.textSecondary }} />
        <h3
          className="text-base font-semibold"
          style={{ color: tokens.textPrimary }}
        >
          {title}
        </h3>
      </div>
      {badge}
    </div>
  );
}

export function MyDatasetDetail({ datasetId }: MyDatasetDetailProps) {
  const router = useRouter();
  const tokens = useSupplierTokens();

  const [datasetData, setDatasetData] = useState<DatasetDetailsResponse | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pricing state
  const [pricingData, setPricingData] = useState<DatasetPricingVersion | null>(
    null
  );
  // Dialog states
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [showVisibilityDialog, setShowVisibilityDialog] = useState(false);
  const [showPricingDialog, setShowPricingDialog] = useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [showDelistDialog, setShowDelistDialog] = useState(false);

  const fetchPricing = useCallback(async () => {
    try {
      const response = await getDatasetPricing(datasetId);
      if (response.pricing) {
        setPricingData(response.pricing);
      }
    } catch (error: unknown) {
      console.error("Failed to fetch pricing:", error);
      // Pricing is supplementary to the dataset detail request.
    }
  }, [datasetId]);

  const fetchDataset = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDatasetDetails(datasetId);
      setDatasetData(data);

      // Also fetch pricing
      await fetchPricing();
    } catch (err: unknown) {
      console.error("Failed to fetch dataset:", err);
      setError(err instanceof Error ? err.message : "Failed to load dataset");
    } finally {
      setLoading(false);
    }
  }, [datasetId, fetchPricing]);

  useEffect(() => {
    void fetchDataset();
  }, [fetchDataset]);

  // Loading state
  if (loading) {
    return (
      <PageBackground withGrid>
        <DatasetWorkspace className="max-w-[1380px]">
          <div className="supplier-glass-panel min-h-80 animate-pulse rounded-2xl border p-6">
            <div className="h-4 w-32 rounded bg-foreground/[0.07]" />
            <div className="mt-5 h-9 w-2/3 rounded bg-foreground/[0.08]" />
            <div className="mt-4 h-5 w-52 rounded bg-foreground/[0.06]" />
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-28 rounded-xl bg-foreground/[0.05]"
                />
              ))}
            </div>
          </div>
        </DatasetWorkspace>
      </PageBackground>
    );
  }

  // Error state
  if (error || !datasetData) {
    return (
      <PageBackground withGrid>
        <DatasetWorkspace className="max-w-3xl">
          <div className="supplier-glass-panel rounded-2xl border px-6 py-12 text-center">
            <AlertCircle className="mx-auto size-11 text-destructive" />
            <h3 className="mt-4 text-xl font-semibold text-foreground">
              Failed to load dataset
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              {error ||
                "Dataset not found or you may not have permission to view it."}
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Button
                variant="outline"
                onClick={() => void fetchDataset()}
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </Button>
              <Button onClick={() => router.push("/dashboard/my-datasets")}>
                Back to My Datasets
              </Button>
            </div>
          </div>
        </DatasetWorkspace>
      </PageBackground>
    );
  }

  const {
    dataset,
    verification,
    publishedUpload,
    aboutDatasetInfo,
    dataFormatInfo,
    features,
    primaryCategory,
    secondaryCategories,
    source,
    locationInfo,
    tags,
  } = datasetData;

  // Status determination
  const verificationStatus: VerificationDisplayStatus =
    verification?.status ?? "UNKNOWN";
  const verificationConfig = VERIFICATION_STATUS_CONFIG[verificationStatus];
  const datasetStatusConfig = DATASET_STATUS_CONFIG[dataset.status];
  const visibilityConfig = VISIBILITY_CONFIG[dataset.visibility || "PUBLIC"];

  const VerificationIcon = verificationConfig.icon;

  // State flags
  const isVerified = dataset.status === "VERIFIED";
  const isPublished = dataset.status === "PUBLISHED";
  const isDelisted = dataset.status === "DELISTED";
  const isArchived = dataset.status === "ARCHIVED";
  const canPublish = canPublishDataset(dataset.status, verification?.status);
  const canChangeVisibility = canChangeDatasetVisibility(dataset.status);
  const canDelist = canDelistDataset(dataset.status);
  const canArchive = canArchiveDataset(dataset.status);

  // Format helpers
  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const formatDateTime = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatFileSize = (bytes: string | null) => {
    if (!bytes) return "N/A";
    const size = parseInt(bytes);
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    if (size < 1024 * 1024 * 1024)
      return `${(size / (1024 * 1024)).toFixed(2)} MB`;
    return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const lifecycleEvents: Array<{
    title: string;
    date: string;
    detail: string;
  }> = [];
  if (dataset.archivedAt) {
    lifecycleEvents.push({
      title: "Dataset archived",
      date: dataset.archivedAt,
      detail: "Removed from marketplace discovery.",
    });
  }
  if (dataset.publishedAt) {
    lifecycleEvents.push({
      title: "Dataset published",
      date: dataset.publishedAt,
      detail: `${dataset.visibility || "PUBLIC"} marketplace visibility.`,
    });
  }
  if (verification) {
    lifecycleEvents.push({
      title: verificationConfig.label,
      date: verification.updatedAt,
      detail: verification.notes || verificationConfig.description,
    });
  }
  lifecycleEvents.push({
    title: "Dataset updated",
    date: dataset.updatedAt,
    detail: "Latest saved dataset information.",
  });

  return (
    <PageBackground withGrid>
      <DatasetWorkspace className="max-w-[1380px]">
        <div className="space-y-6">
          <Button
            variant="ghost"
            onClick={() => router.push("/dashboard/my-datasets")}
            className="-ml-3 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to My Datasets
          </Button>

          <DatasetEntityHeader
            eyebrow="Dataset workspace"
            title={dataset.title}
            identifier={dataset.datasetUniqueId}
            description={
              isPublished
                ? "Manage marketplace visibility, pricing, files, and lifecycle actions for this published dataset."
                : isDelisted
                  ? "Review the delisted dataset and open the update workspace when you are ready to make changes."
                  : isArchived
                    ? "This dataset is retained for your records and is no longer available on the marketplace."
                    : "Review the verified dataset and complete the remaining publication setup."
            }
            metadata={<>Last updated {formatDateTime(dataset.updatedAt)}</>}
            badges={
              <>
                <PublishStatusBadge status={dataset.status} />
                <DatasetVisibilityBadge
                  visibility={dataset.visibility || "PUBLIC"}
                />
                {dataset.isSample && (
                  <span className="inline-flex items-center rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                    Sample dataset
                  </span>
                )}
              </>
            }
            actions={
              isVerified || isPublished || isDelisted || isArchived ? (
                <>
                  {canPublish && (
                    <Button
                      onClick={() => setShowPublishDialog(true)}
                      className="flex-1 gap-2 sm:flex-none"
                    >
                      <Upload className="size-4" />{" "}
                      {isDelisted ? "Republish dataset" : "Publish dataset"}
                    </Button>
                  )}
                  {isDelisted && (
                    <Button
                      onClick={() =>
                        router.push(`/dashboard/my-datasets/${dataset.id}/edit`)
                      }
                      variant="outline"
                      className="flex-1 gap-2 sm:flex-none"
                    >
                      <FileText className="size-4" /> Edit dataset
                    </Button>
                  )}
                  {canChangeVisibility && (
                    <Button
                      onClick={() => setShowVisibilityDialog(true)}
                      variant="outline"
                      className="flex-1 gap-2 sm:flex-none"
                    >
                      <Eye className="size-4" /> Visibility
                    </Button>
                  )}
                  {isVerified && !isArchived && !isDelisted && (
                    <Button
                      onClick={() => setShowPricingDialog(true)}
                      variant="outline"
                      className="flex-1 gap-2 sm:flex-none"
                    >
                      <DollarSign className="size-4" /> Pricing
                    </Button>
                  )}
                  {canDelist && (
                    <Button
                      onClick={() => setShowDelistDialog(true)}
                      variant="outline"
                      className="flex-1 gap-2 border-amber-500/35 text-amber-600 hover:bg-amber-500/10 dark:text-amber-400 sm:flex-none"
                    >
                      <Archive className="size-4" /> Delist
                    </Button>
                  )}
                  {canArchive && (
                    <Button
                      onClick={() => setShowArchiveDialog(true)}
                      variant="outline"
                      className="supplier-action-danger flex-1 gap-2 sm:flex-none"
                    >
                      <Archive className="size-4" /> Archive
                    </Button>
                  )}
                  {publishedUpload ? (
                    <DownloadButton
                      datasetId={dataset.id}
                      fileName={publishedUpload.originalFileName}
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-2 sm:flex-none"
                    />
                  ) : (
                    <Button
                      disabled
                      variant="outline"
                      className="flex-1 gap-2 sm:flex-none"
                      title="Download will be available once a file is published"
                    >
                      <Download className="size-4" /> Download
                    </Button>
                  )}
                </>
              ) : null
            }
          />
        </div>

        {/* Main Content Grid */}
        <div className="mt-7 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
          {/* Left Column - Main Content */}
          <main className="min-w-0 space-y-6">
            {/* Archived Notice */}
            {isArchived && (
              <GlassCard className="supplier-glass-card p-5">
                <div
                  className="flex items-center gap-3 p-4 rounded-xl"
                  style={{
                    background: tokens.errorBg,
                    border: `1px solid ${tokens.errorBorder}`,
                  }}
                >
                  <Archive
                    className="w-5 h-5 flex-shrink-0"
                    style={{ color: tokens.errorText }}
                  />
                  <div>
                    <p
                      className="text-sm font-medium"
                      style={{ color: tokens.textPrimary }}
                    >
                      This dataset is archived
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: tokens.textSecondary }}
                    >
                      It is no longer visible on the marketplace.
                      {dataset.archivedAt &&
                        ` Archived on ${formatDate(dataset.archivedAt)}.`}
                    </p>
                  </div>
                </div>
              </GlassCard>
            )}

            {isDelisted && (
              <GlassCard className="supplier-glass-card p-5">
                <div
                  className="flex items-center gap-3 p-4 rounded-xl"
                  style={{
                    background: tokens.warningBg,
                    border: `1px solid ${tokens.warningBorder}`,
                  }}
                >
                  <Archive
                    className="w-5 h-5 flex-shrink-0"
                    style={{ color: tokens.warningText }}
                  />
                  <div>
                    <p
                      className="text-sm font-medium"
                      style={{ color: tokens.textPrimary }}
                    >
                      This dataset is delisted for updates
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: tokens.textSecondary }}
                    >
                      Use the Edit Dataset action to update metadata and
                      pricing, then submit for admin review.
                    </p>
                  </div>
                </div>
              </GlassCard>
            )}

            {/* Sample, Location & Tags */}
            {(dataset.isSample ||
              dataset.sampleNotes ||
              dataset.actualPrice !== undefined ||
              dataset.isNegotiable !== undefined ||
              locationInfo ||
              (tags && tags.length > 0)) && (
              <GlassCard className="supplier-glass-card p-5">
                <SectionTitle
                  icon={Tag}
                  title="Sample, Location & Tags"
                  tokens={tokens}
                />

                <div className="space-y-6">
                  {(dataset.isSample ||
                    dataset.sampleNotes ||
                    dataset.actualPrice !== undefined ||
                    dataset.isNegotiable !== undefined) && (
                    <div>
                      <h4
                        className="text-sm font-medium mb-3"
                        style={{ color: tokens.textSecondary }}
                      >
                        Sample Information
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div
                          className="rounded-lg p-3"
                          style={{ background: tokens.infoBg }}
                        >
                          <p
                            className="text-xs"
                            style={{ color: tokens.textMuted }}
                          >
                            Dataset Type
                          </p>
                          <p
                            className="text-sm font-semibold mt-1"
                            style={{
                              color: dataset.isSample
                                ? tokens.warningText
                                : tokens.successText,
                            }}
                          >
                            {dataset.isSample
                              ? "Sample Dataset"
                              : "Full Dataset"}
                          </p>
                        </div>
                        <div
                          className="rounded-lg p-3"
                          style={{ background: tokens.infoBg }}
                        >
                          <p
                            className="text-xs"
                            style={{ color: tokens.textMuted }}
                          >
                            Negotiable
                          </p>
                          <p
                            className="text-sm font-semibold mt-1"
                            style={{ color: tokens.textPrimary }}
                          >
                            {dataset.isNegotiable === null ||
                            dataset.isNegotiable === undefined
                              ? "N/A"
                              : dataset.isNegotiable
                                ? "Yes"
                                : "No"}
                          </p>
                        </div>
                        <div>
                          <p
                            className="text-xs"
                            style={{ color: tokens.textMuted }}
                          >
                            Why Sample
                          </p>
                          <p
                            className="text-sm mt-1"
                            style={{ color: tokens.textPrimary }}
                          >
                            {dataset.sampleNotes?.whySample || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p
                            className="text-xs"
                            style={{ color: tokens.textMuted }}
                          >
                            Actual Data Size
                          </p>
                          <p
                            className="text-sm mt-1"
                            style={{ color: tokens.textPrimary }}
                          >
                            {dataset.sampleNotes?.actualDataSize || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p
                            className="text-xs"
                            style={{ color: tokens.textMuted }}
                          >
                            Completeness
                          </p>
                          <p
                            className="text-sm mt-1"
                            style={{ color: tokens.textPrimary }}
                          >
                            {dataset.sampleNotes?.completeness || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p
                            className="text-xs"
                            style={{ color: tokens.textMuted }}
                          >
                            Delivery Mechanism
                          </p>
                          <p
                            className="text-sm mt-1"
                            style={{ color: tokens.textPrimary }}
                          >
                            {dataset.sampleNotes?.deliveryMechanism || "N/A"}
                          </p>
                        </div>
                        <div className="sm:col-span-2">
                          <p
                            className="text-xs"
                            style={{ color: tokens.textMuted }}
                          >
                            Delivery Notes
                          </p>
                          <p
                            className="text-sm mt-1"
                            style={{ color: tokens.textPrimary }}
                          >
                            {dataset.sampleNotes?.deliveryMechanismNotes ||
                              "N/A"}
                          </p>
                        </div>
                        <div>
                          <p
                            className="text-xs"
                            style={{ color: tokens.textMuted }}
                          >
                            Actual Price
                          </p>
                          <p
                            className="text-sm mt-1"
                            style={{ color: tokens.textPrimary }}
                          >
                            {dataset.actualPrice !== null &&
                            dataset.actualPrice !== undefined
                              ? `${dataset.actualPrice} ${dataset.actualPriceCurrency || ""}`.trim()
                              : "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {tags && tags.length > 0 && (
                    <div>
                      <h4
                        className="text-sm font-medium mb-3"
                        style={{ color: tokens.textSecondary }}
                      >
                        Tags
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-xs px-2.5 py-1 rounded-lg"
                            style={{
                              background: tokens.infoBg,
                              color: tokens.textSecondary,
                              border: `1px solid ${tokens.borderSubtle}`,
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </GlassCard>
            )}

            {/* About Dataset */}
            {aboutDatasetInfo && (
              <GlassCard className="supplier-glass-card p-5">
                <SectionTitle
                  icon={Info}
                  title="Marketplace Content"
                  tokens={tokens}
                />

                <div className="space-y-5">
                  {aboutDatasetInfo.overview && (
                    <div>
                      <h4
                        className="text-sm font-medium mb-2"
                        style={{ color: tokens.textSecondary }}
                      >
                        Overview
                      </h4>
                      <p
                        className="text-sm leading-relaxed"
                        style={{ color: tokens.textPrimary }}
                      >
                        {aboutDatasetInfo.overview}
                      </p>
                    </div>
                  )}

                  {aboutDatasetInfo.description && (
                    <div>
                      <h4
                        className="text-sm font-medium mb-2"
                        style={{ color: tokens.textSecondary }}
                      >
                        Description
                      </h4>
                      <p
                        className="text-sm leading-relaxed"
                        style={{ color: tokens.textPrimary }}
                      >
                        {aboutDatasetInfo.description}
                      </p>
                    </div>
                  )}

                  {aboutDatasetInfo.useCases && (
                    <div>
                      <h4
                        className="text-sm font-medium mb-2"
                        style={{ color: tokens.textSecondary }}
                      >
                        Use Cases
                      </h4>
                      <p
                        className="text-sm leading-relaxed"
                        style={{ color: tokens.textPrimary }}
                      >
                        {aboutDatasetInfo.useCases}
                      </p>
                    </div>
                  )}

                  {aboutDatasetInfo.dataQuality && (
                    <div>
                      <h4
                        className="text-sm font-medium mb-2"
                        style={{ color: tokens.textSecondary }}
                      >
                        Data Quality
                      </h4>
                      <p
                        className="text-sm leading-relaxed"
                        style={{ color: tokens.textPrimary }}
                      >
                        {aboutDatasetInfo.dataQuality}
                      </p>
                    </div>
                  )}

                  {aboutDatasetInfo.methodology && (
                    <div>
                      <h4
                        className="text-sm font-medium mb-2"
                        style={{ color: tokens.textSecondary }}
                      >
                        Methodology
                      </h4>
                      <p
                        className="text-sm leading-relaxed"
                        style={{ color: tokens.textPrimary }}
                      >
                        {aboutDatasetInfo.methodology}
                      </p>
                    </div>
                  )}

                  {aboutDatasetInfo.limitations && (
                    <div>
                      <h4
                        className="text-sm font-medium mb-2"
                        style={{ color: tokens.textSecondary }}
                      >
                        Limitations
                      </h4>
                      <p
                        className="text-sm leading-relaxed"
                        style={{ color: tokens.textPrimary }}
                      >
                        {aboutDatasetInfo.limitations}
                      </p>
                    </div>
                  )}

                  {/* Updated timestamp */}
                  {aboutDatasetInfo.updatedAt && (
                    <p
                      className="text-xs pt-2 border-t"
                      style={{
                        color: tokens.textMuted,
                        borderColor: tokens.borderSubtle,
                      }}
                    >
                      Last updated: {formatDateTime(aboutDatasetInfo.updatedAt)}
                    </p>
                  )}
                </div>
              </GlassCard>
            )}

            {/* Location */}
            {locationInfo && (
              <GlassCard className="supplier-glass-card p-5">
                <SectionTitle icon={MapPin} title="Location" tokens={tokens} />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InfoItem
                    icon={Globe}
                    label="Country"
                    value={locationInfo.country}
                    tokens={tokens}
                  />
                  <InfoItem
                    icon={MapPin}
                    label="State"
                    value={locationInfo.state}
                    tokens={tokens}
                  />
                  <InfoItem
                    icon={MapPin}
                    label="City"
                    value={locationInfo.city}
                    tokens={tokens}
                  />
                  <InfoItem
                    icon={MapPin}
                    label="Region"
                    value={locationInfo.region}
                    tokens={tokens}
                  />
                  <InfoItem
                    icon={MapPin}
                    label="Coverage"
                    value={locationInfo.coverage}
                    tokens={tokens}
                  />
                  <InfoItem
                    icon={MapPin}
                    label="Coordinates"
                    value={locationInfo.coordinates}
                    tokens={tokens}
                  />
                </div>
              </GlassCard>
            )}

            {/* Data Format Information */}
            {dataFormatInfo && (
              <GlassCard className="supplier-glass-card p-5">
                <SectionTitle
                  icon={FileCode}
                  title="Data Format"
                  tokens={tokens}
                />

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <InfoItem
                    icon={FileType2}
                    label="File Format"
                    value={dataFormatInfo.fileFormat}
                    tokens={tokens}
                  />

                  {dataFormatInfo.rows !== null && (
                    <InfoItem
                      icon={Rows3}
                      label="Rows"
                      value={dataFormatInfo.rows.toLocaleString()}
                      tokens={tokens}
                    />
                  )}

                  {dataFormatInfo.cols !== null && (
                    <InfoItem
                      icon={Columns3}
                      label="Columns"
                      value={dataFormatInfo.cols.toLocaleString()}
                      tokens={tokens}
                    />
                  )}

                  {dataFormatInfo.fileSize && (
                    <InfoItem
                      icon={HardDrive}
                      label="File Size"
                      value={dataFormatInfo.fileSize}
                      tokens={tokens}
                    />
                  )}

                  <InfoItem
                    icon={FileArchive}
                    label="Compression"
                    value={dataFormatInfo.compressionType || "None"}
                    tokens={tokens}
                  />

                  <InfoItem
                    icon={FileText}
                    label="Encoding"
                    value={dataFormatInfo.encoding}
                    tokens={tokens}
                  />
                </div>
              </GlassCard>
            )}

            {/* Features / Schema */}
            {features && features.length > 0 && (
              <GlassCard className="supplier-glass-card p-5">
                <SectionTitle
                  icon={Table2}
                  title="Features / Schema"
                  badge={
                    <span
                      className="text-xs px-2 py-1 rounded-full"
                      style={{
                        background: tokens.infoBg,
                        color: tokens.textSecondary,
                      }}
                    >
                      {features.length} columns
                    </span>
                  }
                  tokens={tokens}
                />

                <div className="overflow-x-auto -mx-5 px-5">
                  <table className="w-full min-w-[500px]">
                    <thead>
                      <tr
                        style={{
                          borderBottom: `1px solid ${tokens.borderDefault}`,
                        }}
                      >
                        <th
                          className="text-left text-xs font-medium py-3 px-3 first:pl-0"
                          style={{ color: tokens.textMuted }}
                        >
                          Name
                        </th>
                        <th
                          className="text-left text-xs font-medium py-3 px-3"
                          style={{ color: tokens.textMuted }}
                        >
                          Type
                        </th>
                        <th
                          className="text-left text-xs font-medium py-3 px-3"
                          style={{ color: tokens.textMuted }}
                        >
                          Description
                        </th>
                        <th
                          className="text-center text-xs font-medium py-3 px-3 last:pr-0"
                          style={{ color: tokens.textMuted }}
                        >
                          Nullable
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {features.map((feature, index) => (
                        <tr
                          key={feature.id}
                          className="transition-colors"
                          style={{
                            borderBottom:
                              index < features.length - 1
                                ? `1px solid ${tokens.borderSubtle}`
                                : "none",
                          }}
                        >
                          <td
                            className="text-sm py-3 px-3 first:pl-0 font-mono"
                            style={{ color: tokens.textPrimary }}
                          >
                            {feature.name}
                          </td>
                          <td className="text-sm py-3 px-3">
                            <span
                              className="text-xs px-2 py-0.5 rounded font-mono"
                              style={{
                                background: tokens.infoBg,
                                color: tokens.textSecondary,
                              }}
                            >
                              {feature.dataType}
                            </span>
                          </td>
                          <td
                            className="text-sm py-3 px-3"
                            style={{ color: tokens.textSecondary }}
                          >
                            {feature.description || "—"}
                          </td>
                          <td className="text-center py-3 px-3 last:pr-0">
                            {feature.isNullable ? (
                              <span
                                className="text-xs px-2 py-0.5 rounded"
                                style={{
                                  background: tokens.warningBg,
                                  color: "#f59e0b",
                                }}
                              >
                                Yes
                              </span>
                            ) : (
                              <span
                                className="text-xs px-2 py-0.5 rounded"
                                style={{
                                  background: tokens.successBg,
                                  color: "#22c55e",
                                }}
                              >
                                No
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </GlassCard>
            )}
          </main>

          {/* Right Column - Sidebar */}
          <aside className="order-first space-y-5 xl:order-none xl:sticky xl:top-6">
            {/* Dataset Details Card */}
            <GlassCard className="supplier-glass-card p-4">
              <SectionTitle
                icon={Database}
                title="Dataset Details"
                tokens={tokens}
              />

              <div className="grid grid-cols-2 gap-4">
                <div className="min-w-0">
                  <p className="text-xs" style={{ color: tokens.textMuted }}>
                    License
                  </p>
                  <p
                    className="text-sm font-medium mt-1"
                    style={{ color: tokens.textPrimary }}
                  >
                    {dataset.license || "N/A"}
                  </p>
                </div>

                <div className="min-w-0">
                  <p className="text-xs" style={{ color: tokens.textMuted }}>
                    Visibility
                  </p>
                  <p
                    className="text-sm font-medium mt-1"
                    style={{
                      color: visibilityConfig?.color || tokens.textPrimary,
                    }}
                  >
                    {visibilityConfig?.label || dataset.visibility}
                  </p>
                </div>

                <div className="min-w-0">
                  <p className="text-xs" style={{ color: tokens.textMuted }}>
                    Status
                  </p>
                  <p
                    className="text-sm font-medium mt-1"
                    style={{ color: datasetStatusConfig.color }}
                  >
                    {datasetStatusConfig.label}
                  </p>
                </div>

                <div className="min-w-0">
                  <p className="text-xs" style={{ color: tokens.textMuted }}>
                    Rating
                  </p>
                  <p
                    className="text-sm font-medium mt-1"
                    style={{ color: tokens.textPrimary }}
                  >
                    {dataset.rating ? Number(dataset.rating).toFixed(1) : "N/A"}
                  </p>
                </div>

                <div className="min-w-0">
                  <p className="text-xs" style={{ color: tokens.textMuted }}>
                    Reviews
                  </p>
                  <p
                    className="text-sm font-medium mt-1"
                    style={{ color: tokens.textPrimary }}
                  >
                    {dataset.reviewCount ?? 0}
                  </p>
                </div>
              </div>
            </GlassCard>

            {/* Pricing Card */}
            {pricingData && isVerified && (
              <GlassCard className="supplier-glass-card p-4">
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <DollarSign
                      className="w-5 h-5"
                      style={{ color: tokens.textSecondary }}
                    />
                    <h3
                      className="text-base font-semibold"
                      style={{ color: tokens.textPrimary }}
                    >
                      Pricing
                    </h3>
                  </div>
                  <div
                    className="px-3 py-1.5 rounded-lg text-xs font-medium"
                    style={{
                      background:
                        PRICING_STATUS_CONFIG[pricingData.status].bgColor,
                      color: PRICING_STATUS_CONFIG[pricingData.status].color,
                      border: `1px solid ${PRICING_STATUS_CONFIG[pricingData.status].color}33`,
                    }}
                  >
                    {PRICING_STATUS_CONFIG[pricingData.status].label}
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Pricing Details */}
                  <div
                    className="rounded-lg p-3"
                    style={{ background: tokens.infoBg }}
                  >
                    <p className="text-xs" style={{ color: tokens.textMuted }}>
                      Current Price
                    </p>
                    <p
                      className="text-lg font-bold mt-1"
                      style={{ color: tokens.textPrimary }}
                    >
                      {pricingData.isPaid
                        ? `${pricingData.currency === "USD" ? "$" : pricingData.currency === "EUR" ? "€" : pricingData.currency === "GBP" ? "£" : "₹"}${pricingData.price}`
                        : "Free"}
                    </p>
                  </div>

                  {/* Feedback if changes requested */}
                  {pricingData.status === "CHANGES_REQUESTED" &&
                    pricingData.rejectionReason && (
                      <div
                        className="rounded-lg p-3 flex items-start gap-2"
                        style={{
                          background: tokens.warningBg,
                          border: `1px solid ${tokens.warningBorder}`,
                        }}
                      >
                        <AlertCircle
                          className="w-4 h-4 flex-shrink-0 mt-0.5"
                          style={{ color: tokens.warningText }}
                        />
                        <div>
                          <p
                            className="text-xs font-medium"
                            style={{ color: tokens.textPrimary }}
                          >
                            Admin Feedback
                          </p>
                          <p
                            className="text-xs mt-1"
                            style={{ color: tokens.textMuted }}
                          >
                            {pricingData.rejectionReason}
                          </p>
                        </div>
                      </div>
                    )}

                  {/* Status Messages */}
                  {pricingData.status === "DRAFT" && (
                    <p className="text-xs" style={{ color: tokens.textMuted }}>
                      💡 Your pricing is saved as draft. Submit it for admin
                      review.
                    </p>
                  )}
                  {pricingData.status === "SUBMITTED" && (
                    <p className="text-xs" style={{ color: tokens.textMuted }}>
                      ⏳ Your pricing is under review. Admin will make a
                      decision soon.
                    </p>
                  )}
                  {pricingData.status === "ACTIVE" && (
                    <p
                      className="text-xs"
                      style={{ color: tokens.successText }}
                    >
                      ✓ Your pricing is active and applied to the marketplace.
                    </p>
                  )}
                  {pricingData.status === "REJECTED" && (
                    <p
                      className="text-xs"
                      style={{ color: tokens.warningText }}
                    >
                      ✕ Your pricing was rejected. Edit and resubmit.
                    </p>
                  )}

                  {/* Edit Button */}
                  {(pricingData.status === "DRAFT" ||
                    pricingData.status === "CHANGES_REQUESTED" ||
                    pricingData.status === "REJECTED") && (
                    <Button
                      onClick={() => setShowPricingDialog(true)}
                      className="w-full text-sm"
                      style={{ background: "#3b82f6", color: "white" }}
                    >
                      Edit Pricing
                    </Button>
                  )}
                </div>
              </GlassCard>
            )}

            {/* Categories Card */}
            {(primaryCategory || secondaryCategories.length > 0) && (
              <GlassCard className="supplier-glass-card p-4">
                <SectionTitle
                  icon={Layers}
                  title="Categories"
                  tokens={tokens}
                />

                <div className="space-y-4">
                  {primaryCategory && (
                    <div>
                      <p
                        className="text-xs mb-2"
                        style={{ color: tokens.textMuted }}
                      >
                        Primary
                      </p>
                      <span
                        className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg"
                        style={{
                          background: tokens.successBg,
                          color: tokens.textPrimary,
                          border: `1px solid ${tokens.successBorder}`,
                        }}
                      >
                        <BadgeCheck
                          className="w-3.5 h-3.5"
                          style={{ color: "#22c55e" }}
                        />
                        {primaryCategory.name}
                      </span>
                    </div>
                  )}

                  {secondaryCategories.length > 0 && (
                    <div>
                      <p
                        className="text-xs mb-2"
                        style={{ color: tokens.textMuted }}
                      >
                        Secondary
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {secondaryCategories.map((cat) => (
                          <span
                            key={cat.id}
                            className="text-xs px-2.5 py-1 rounded-lg"
                            style={{
                              background: tokens.infoBg,
                              color: tokens.textSecondary,
                            }}
                          >
                            {cat.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </GlassCard>
            )}

            {/* Source Card */}
            {source && (
              <GlassCard className="supplier-glass-card p-4">
                <SectionTitle
                  icon={Globe}
                  title="Data Source"
                  tokens={tokens}
                />

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-sm font-medium"
                      style={{ color: tokens.textPrimary }}
                    >
                      {source.name}
                    </span>
                    {source.isVerified && (
                      <BadgeCheck
                        className="w-4 h-4"
                        style={{ color: "#22c55e" }}
                      />
                    )}
                  </div>

                  {source.description && (
                    <p
                      className="text-xs"
                      style={{ color: tokens.textSecondary }}
                    >
                      {source.description}
                    </p>
                  )}

                  {source.websiteUrl && (
                    <a
                      href={source.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs hover:underline"
                      style={{ color: "#3b82f6" }}
                    >
                      <Link2 className="w-3 h-3" />
                      Visit Website
                    </a>
                  )}
                </div>
              </GlassCard>
            )}

            {/* Verification Info Card */}
            {verification && (
              <GlassCard className="supplier-glass-card p-4">
                <SectionTitle
                  icon={Shield}
                  title="Verification"
                  tokens={tokens}
                />

                <div className="space-y-4">
                  <InfoItem
                    icon={VerificationIcon}
                    label="Status"
                    value={verificationConfig.label}
                    valueColor={verificationConfig.color}
                    tokens={tokens}
                  />

                  <InfoItem
                    icon={Calendar}
                    label="Last Updated"
                    value={formatDate(verification.updatedAt)}
                    tokens={tokens}
                  />

                  {/* Notes */}
                  {verification?.notes && (
                    <div
                      className="pt-2 border-t"
                      style={{ borderColor: tokens.borderSubtle }}
                    >
                      <p
                        className="text-xs font-medium mb-2"
                        style={{ color: tokens.textMuted }}
                      >
                        Reviewer Notes
                      </p>
                      <p
                        className="text-sm leading-relaxed"
                        style={{ color: tokens.textPrimary }}
                      >
                        {verification.notes}
                      </p>
                    </div>
                  )}

                  {/* Rejection Reason */}
                  {verification?.rejectionReason && (
                    <div
                      className="pt-2 border-t"
                      style={{ borderColor: tokens.errorBorder }}
                    >
                      <p
                        className="text-xs font-medium mb-2"
                        style={{ color: tokens.errorText }}
                      >
                        Rejection Reason
                      </p>
                      <p
                        className="text-sm leading-relaxed"
                        style={{ color: tokens.textPrimary }}
                      >
                        {verification.rejectionReason}
                      </p>
                    </div>
                  )}
                </div>
              </GlassCard>
            )}

            {/* KDTS Score Card */}
            <KdtsScoreCard datasetId={datasetId} />

            {/* Published File Card */}
            {publishedUpload && (
              <GlassCard className="supplier-glass-card p-4">
                <SectionTitle
                  icon={FileText}
                  title="Published File"
                  tokens={tokens}
                />

                <div className="space-y-4">
                  <InfoItem
                    icon={FileText}
                    label="Filename"
                    value={publishedUpload.originalFileName}
                    tokens={tokens}
                  />

                  <InfoItem
                    icon={HardDrive}
                    label="Size"
                    value={formatFileSize(publishedUpload.sizeBytes)}
                    tokens={tokens}
                  />

                  {publishedUpload.contentType && (
                    <InfoItem
                      icon={FileType2}
                      label="Type"
                      value={publishedUpload.contentType}
                      tokens={tokens}
                    />
                  )}
                </div>

                <div
                  className="mt-4 pt-4 border-t"
                  style={{ borderColor: tokens.borderSubtle }}
                >
                  <DownloadButton
                    datasetId={dataset.id}
                    fileName={publishedUpload.originalFileName}
                    variant="default"
                    size="sm"
                    className="w-full"
                  />
                </div>
              </GlassCard>
            )}

            {/* Lifecycle History Card */}
            <GlassCard className="supplier-glass-card p-4">
              <SectionTitle
                icon={History}
                title="Lifecycle History"
                tokens={tokens}
              />

              <ol>
                {lifecycleEvents.map((event, index) => (
                  <li
                    key={`${event.title}-${event.date}`}
                    className="relative flex gap-3 pb-5 last:pb-0"
                  >
                    {index < lifecycleEvents.length - 1 && (
                      <span className="absolute left-[7px] top-4 h-full w-px bg-border" />
                    )}
                    <span className="supplier-glass-input relative mt-1.5 size-4 shrink-0 rounded-full border-4 border-primary" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {event.title}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatDateTime(event.date)}
                      </p>
                      <p className="supplier-glass-input mt-2 rounded-lg p-2.5 text-xs leading-relaxed text-muted-foreground">
                        {event.detail}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </GlassCard>
          </aside>
        </div>

        {/* Action Dialogs */}
        {canPublish && (
          <PublishConfirmDialog
            isOpen={showPublishDialog}
            onClose={() => setShowPublishDialog(false)}
            datasetId={dataset.id}
            datasetTitle={dataset.title}
            uploadFileName={publishedUpload?.originalFileName}
            onSuccess={fetchDataset}
            isDark={tokens.isDark}
          />
        )}

        {canChangeVisibility && (
          <ChangeVisibilityDialog
            isOpen={showVisibilityDialog}
            onClose={() => setShowVisibilityDialog(false)}
            datasetId={dataset.id}
            currentVisibility={dataset.visibility || "PUBLIC"}
            onSuccess={fetchDataset}
            isDark={tokens.isDark}
          />
        )}

        {pricingData && isVerified && (
          <PricingEditDialog
            isOpen={showPricingDialog}
            onClose={() => setShowPricingDialog(false)}
            datasetId={dataset.id}
            currentPricing={pricingData}
            onSuccess={fetchPricing}
            isDark={tokens.isDark}
            feedbackMessage={pricingData.rejectionReason || undefined}
            pricingStatus={pricingData.status}
          />
        )}

        {canDelist && (
          <DelistConfirmDialog
            isOpen={showDelistDialog}
            onClose={() => setShowDelistDialog(false)}
            datasetId={dataset.id}
            datasetTitle={dataset.title}
            onSuccess={fetchDataset}
          />
        )}

        {canArchive && (
          <ArchiveConfirmDialog
            isOpen={showArchiveDialog}
            onClose={() => setShowArchiveDialog(false)}
            datasetId={dataset.id}
            datasetTitle={dataset.title}
            onSuccess={fetchDataset}
            isDark={tokens.isDark}
          />
        )}
      </DatasetWorkspace>
    </PageBackground>
  );
}
