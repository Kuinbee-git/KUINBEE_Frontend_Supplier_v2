"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Database,
  FileCode,
  FileText,
  MapPin,
  Settings,
  Tag,
} from "lucide-react";
import {
  DashboardButton,
  DashboardCard,
  DashboardErrorState,
  DashboardInlineAlert,
  DashboardLoadingState,
  DashboardPageHeader,
} from "@/components/dashboard";
import { getDatasetThemeTokens } from "@/constants/dataset.constants";
import {
  getDatasetDetails,
  getDatasetPricing,
  replaceDatasetFeatures,
  setDatasetSecondaryCategories,
  setDatasetTags,
  submitDatasetUpdate,
  upsertDatasetAboutInfo,
  upsertDatasetDataFormatInfo,
  upsertDatasetLocationInfo,
} from "@/lib/api";
import { PricingEditDialog } from "./actions";
import {
  AboutDatasetForm,
  DataFormatForm,
  FeaturesForm,
  LocationTagsEditForm,
  SecondaryCategoriesForm,
} from "./forms";
import {
  DatasetStatusBadge,
  EditableSection,
  PublishStatusBadge,
} from "./shared";
import {
  ChangesRequestedBanner,
  PricingSection,
  SubmitForReviewSection,
  UpdateStatusBanner,
} from "./detail";
import {
  canEditDatasetUpdate,
  canSubmitDatasetUpdate,
  DatasetEntityHeader,
  DatasetWorkspace,
} from "./workspace";
import {
  AboutDisplay,
  LocationTagsDisplay,
  DataFormatDisplay,
  FeaturesDisplay,
  CategoriesDisplay,
} from "./detail/displays";
import type {
  DatasetPricingVersion,
  VerificationStatus,
} from "@/types/dataset-proposal.types";
import type { DatasetDetailsResponse } from "@/types/dataset.types";

interface DelistedDatasetEditProps {
  datasetId: string;
}

export function DelistedDatasetEdit({ datasetId }: DelistedDatasetEditProps) {
  const router = useRouter();
  const tokens = getDatasetThemeTokens(false);

  const [datasetData, setDatasetData] = useState<DatasetDetailsResponse | null>(
    null
  );
  const [pricingData, setPricingData] = useState<DatasetPricingVersion | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [submittingUpdate, setSubmittingUpdate] = useState(false);
  const [showPricingDialog, setShowPricingDialog] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    metadata: true,
    about: true,
    locationTags: true,
    dataFormat: false,
    features: false,
    categories: false,
  });
  const [editingSection, setEditingSection] = useState<string | null>(null);

  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const [details, pricing] = await Promise.all([
        getDatasetDetails(datasetId),
        getDatasetPricing(datasetId),
      ]);
      setDatasetData(details);
      setPricingData(pricing.pricing ?? null);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Please try again.";
      setLoadError(message);
      toast.error("Failed to load dataset", {
        description: message,
      });
    } finally {
      setLoading(false);
    }
  }, [datasetId]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  // --- Derived state ---
  const canEdit = useMemo(() => {
    if (!datasetData?.verification) return false;
    const ds = datasetData.dataset.status;
    const vs = datasetData.verification.status as VerificationStatus;
    return canEditDatasetUpdate(ds, vs);
  }, [datasetData]);

  const activeEditingSection = canEdit ? editingSection : null;

  const missingPrerequisites = useMemo(() => {
    if (!datasetData) return [];
    const missing: string[] = [];
    if (!datasetData.aboutDatasetInfo)
      missing.push("About Dataset information");
    if (!datasetData.dataFormatInfo) missing.push("Data Format information");
    if (!datasetData.features || datasetData.features.length === 0)
      missing.push("At least one feature/column");
    if (!pricingData) missing.push("Pricing configuration");
    if (
      pricingData?.isPaid &&
      !["SUBMITTED", "RESUBMITTED", "UNDER_REVIEW", "ACTIVE"].includes(
        pricingData.status
      )
    ) {
      missing.push("Pricing must be submitted (currently in draft)");
    }
    return missing;
  }, [datasetData, pricingData]);

  const handleSubmitUpdate = async () => {
    if (
      !datasetData?.verification ||
      !canSubmitDatasetUpdate(
        datasetData.dataset.status,
        datasetData.verification.status as VerificationStatus
      )
    ) {
      toast.error("This update is locked", {
        description:
          "Its review state changed. Refresh the page before trying again.",
      });
      return;
    }

    if (missingPrerequisites.length > 0) {
      toast.error("Cannot submit", {
        description: `Please complete: ${missingPrerequisites.join(", ")}`,
        duration: 5000,
      });
      return;
    }

    setSubmittingUpdate(true);
    try {
      await submitDatasetUpdate(datasetId);
      toast.success("Update submitted", {
        description:
          "Your dataset update request is now in the admin review queue.",
      });
      await fetchData();
    } catch (error: unknown) {
      toast.error("Failed to submit update", {
        description:
          error instanceof Error
            ? error.message
            : "Please review required sections and try again.",
      });
    } finally {
      setSubmittingUpdate(false);
    }
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleEditSuccess = () => {
    setEditingSection(null);
    void fetchData();
  };

  const handleEditCancel = () => {
    setEditingSection(null);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // --- Loading ---
  if (loading) {
    return (
      <DatasetWorkspace>
        <DashboardPageHeader
          title="Dataset update"
          description="Loading the editable update workspace for this dataset."
        />
        <DashboardLoadingState
          label="Loading dataset update"
          variant="skeleton"
          rows={6}
        />
      </DatasetWorkspace>
    );
  }

  if (loadError || !datasetData) {
    return (
      <DatasetWorkspace className="max-w-3xl">
        <DashboardPageHeader
          title="Dataset update"
          description="Prepare and submit changes to this dataset."
        />
        <DashboardErrorState
          title="Dataset update could not be loaded"
          message={loadError ?? "The dataset is unavailable."}
          onRetry={() => void fetchData()}
        />
        <div className="flex justify-center">
          <DashboardButton
            variant="ghost"
            onClick={() => router.push(`/dashboard/my-datasets/${datasetId}`)}
          >
            Back to dataset
          </DashboardButton>
        </div>
      </DatasetWorkspace>
    );
  }

  const {
    dataset,
    verification,
    aboutDatasetInfo,
    dataFormatInfo,
    features,
    locationInfo,
    tags,
    secondaryCategories,
  } = datasetData;

  const isDark = tokens.isDark;
  const verificationStatus = verification?.status ?? "PENDING";

  const sectionTokens = {
    surfaceCard: isDark
      ? "var(--dashboard-glass-background)"
      : "var(--dashboard-glass-background)",
    borderDefault: tokens.borderDefault,
    borderSubtle: tokens.borderSubtle,
    textPrimary: tokens.textPrimary,
    textSecondary: tokens.textSecondary,
    textMuted: tokens.textMuted,
    glassBg: tokens.glassBg,
    glassBorder: tokens.glassBorder,
  };

  return (
    <>
      <DatasetWorkspace>
        <DashboardButton
          variant="ghost"
          onClick={() => router.push(`/dashboard/my-datasets/${datasetId}`)}
          className="-ml-3 mb-5 gap-2"
        >
          <ArrowLeft className="size-4" />
          Back to dataset
        </DashboardButton>

        <DatasetEntityHeader
          eyebrow="Dataset update workspace"
          title={dataset.title}
          identifier={dataset.datasetUniqueId}
          description="Update the editable metadata and pricing below. Your current marketplace version remains unchanged until this update is approved and republished."
          metadata={<>Last updated {formatDate(dataset.updatedAt)}</>}
          badges={
            <>
              <PublishStatusBadge status={dataset.status} />
              <DatasetStatusBadge status={verificationStatus} isDark={isDark} />
            </>
          }
        />

        <div className="mt-6">
          <UpdateStatusBanner
            datasetStatus={dataset.status}
            verificationStatus={verificationStatus}
            rejectionReason={verification?.rejectionReason}
            isDark={isDark}
            tokens={tokens}
          />

          {verificationStatus === "CHANGES_REQUESTED" &&
            verification?.notes && (
              <ChangesRequestedBanner
                notes={verification.notes}
                isDark={isDark}
                tokens={tokens}
              />
            )}

          {!canEdit && !["DELISTED", "SUBMITTED"].includes(dataset.status) && (
            <DashboardInlineAlert
              className="mb-6"
              tone="warning"
              title="Editing is locked"
              message="This update is outside an editable review state. You can still review the saved information below."
            />
          )}
        </div>

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
          <main className="min-w-0 space-y-6">
            {/* Section 1: Basic Metadata */}
            <EditableSection
              title="Basic Metadata"
              icon={<Settings className="w-5 h-5" />}
              subtitle="Title, source, category and license (read-only in update flow)"
              isExpanded={expandedSections.metadata}
              onToggle={() => toggleSection("metadata")}
              isEditable={false}
              isEditing={activeEditingSection === "metadata"}
              onEditClick={() => setEditingSection("metadata")}
              isEmpty={false}
              emptyIcon={<Settings className="w-12 h-12" />}
              emptyMessage=""
              isDark={isDark}
              tokens={sectionTokens}
              displayContent={
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <p
                        className="text-xs font-medium"
                        style={{ color: tokens.textSecondary }}
                      >
                        Title
                      </p>
                      <p
                        className="text-sm"
                        style={{ color: tokens.textPrimary }}
                      >
                        {dataset.title}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p
                        className="text-xs font-medium"
                        style={{ color: tokens.textSecondary }}
                      >
                        License
                      </p>
                      <p
                        className="text-sm"
                        style={{ color: tokens.textPrimary }}
                      >
                        {dataset.license}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p
                        className="text-xs font-medium"
                        style={{ color: tokens.textSecondary }}
                      >
                        Primary Category
                      </p>
                      <p
                        className="text-sm"
                        style={{ color: tokens.textPrimary }}
                      >
                        {datasetData.primaryCategory?.name ?? "N/A"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p
                        className="text-xs font-medium"
                        style={{ color: tokens.textSecondary }}
                      >
                        Source
                      </p>
                      <p
                        className="text-sm"
                        style={{ color: tokens.textPrimary }}
                      >
                        {datasetData.source?.name ?? "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              }
            />

            {/* Section 2: About Dataset */}
            <EditableSection
              title="About Dataset"
              icon={<FileText className="w-5 h-5" />}
              isExpanded={expandedSections.about}
              onToggle={() => toggleSection("about")}
              isEditable={canEdit}
              isEditing={activeEditingSection === "about"}
              onEditClick={() => setEditingSection("about")}
              isEmpty={!aboutDatasetInfo}
              emptyIcon={<FileText className="w-12 h-12" />}
              emptyMessage="No about information yet"
              emptyActionLabel="Add About Info"
              isDark={isDark}
              tokens={sectionTokens}
              displayContent={
                aboutDatasetInfo ? (
                  <AboutDisplay
                    about={aboutDatasetInfo}
                    tokens={tokens}
                    formatDate={formatDate}
                  />
                ) : null
              }
              editContent={
                <AboutDatasetForm
                  datasetId={datasetId}
                  initialData={aboutDatasetInfo ?? undefined}
                  isDark={isDark}
                  onSubmitData={upsertDatasetAboutInfo}
                  onSuccess={handleEditSuccess}
                  onCancel={handleEditCancel}
                />
              }
            />

            {/* Section 3: Location & Tags */}
            <EditableSection
              title="Location & Tags"
              icon={<MapPin className="w-5 h-5" />}
              subtitle="Manage location details and discovery tags"
              isExpanded={expandedSections.locationTags}
              onToggle={() => toggleSection("locationTags")}
              isEditable={canEdit}
              isEditing={activeEditingSection === "locationTags"}
              onEditClick={() => setEditingSection("locationTags")}
              isEmpty={!locationInfo && tags.length === 0}
              emptyIcon={<Tag className="w-12 h-12" />}
              emptyMessage="No location or tags added"
              emptyActionLabel="Add Location & Tags"
              isDark={isDark}
              tokens={sectionTokens}
              displayContent={
                <LocationTagsDisplay
                  proposal={{ locationInfo, tags }}
                  tokens={tokens}
                />
              }
              editContent={
                <LocationTagsEditForm
                  datasetId={datasetId}
                  initialData={{ locationInfo, tags }}
                  isDark={isDark}
                  onUpsertLocation={upsertDatasetLocationInfo}
                  onSetTags={setDatasetTags}
                  onSuccess={handleEditSuccess}
                  onCancel={handleEditCancel}
                />
              }
            />

            {/* Section 4: Data Format */}
            <EditableSection
              title="Data Format & Structure"
              icon={<FileCode className="w-5 h-5" />}
              isExpanded={expandedSections.dataFormat}
              onToggle={() => toggleSection("dataFormat")}
              isEditable={canEdit}
              isEditing={activeEditingSection === "dataFormat"}
              onEditClick={() => setEditingSection("dataFormat")}
              isEmpty={!dataFormatInfo}
              emptyIcon={<Database className="w-12 h-12" />}
              emptyMessage="No data format information"
              emptyActionLabel="Add Data Format"
              isDark={isDark}
              tokens={sectionTokens}
              displayContent={
                dataFormatInfo ? (
                  <DataFormatDisplay
                    dataFormat={dataFormatInfo}
                    tokens={tokens}
                    formatDate={formatDate}
                  />
                ) : null
              }
              editContent={
                <DataFormatForm
                  datasetId={datasetId}
                  initialData={dataFormatInfo ?? undefined}
                  isDark={isDark}
                  onSubmitData={upsertDatasetDataFormatInfo}
                  onSuccess={handleEditSuccess}
                  onCancel={handleEditCancel}
                />
              }
            />

            {/* Section 5: Features */}
            <EditableSection
              title="Features / Columns"
              subtitle={`${features.length} features defined`}
              icon={<Database className="w-5 h-5" />}
              isExpanded={expandedSections.features}
              onToggle={() => toggleSection("features")}
              isEditable={canEdit}
              isEditing={activeEditingSection === "features"}
              onEditClick={() => setEditingSection("features")}
              isEmpty={features.length === 0}
              emptyIcon={<Database className="w-12 h-12" />}
              emptyMessage="No features added"
              emptyActionLabel="Add Features"
              isDark={isDark}
              tokens={sectionTokens}
              displayContent={
                features.length > 0 ? (
                  <FeaturesDisplay
                    features={features}
                    tokens={tokens}
                    isDark={isDark}
                  />
                ) : null
              }
              editContent={
                <FeaturesForm
                  datasetId={datasetId}
                  initialData={features}
                  isDark={isDark}
                  onSubmitData={replaceDatasetFeatures}
                  onSuccess={handleEditSuccess}
                  onCancel={handleEditCancel}
                />
              }
            />

            {/* Section 6: Secondary Categories */}
            <EditableSection
              title="Secondary Categories"
              icon={<Tag className="w-5 h-5" />}
              isExpanded={expandedSections.categories}
              onToggle={() => toggleSection("categories")}
              isEditable={canEdit}
              isEditing={activeEditingSection === "categories"}
              onEditClick={() => setEditingSection("categories")}
              isEmpty={secondaryCategories.length === 0}
              emptyIcon={<Tag className="w-12 h-12" />}
              emptyMessage="No secondary categories"
              emptyActionLabel="Add Categories"
              isDark={isDark}
              tokens={sectionTokens}
              displayContent={
                secondaryCategories.length > 0 ? (
                  <CategoriesDisplay
                    categoryIds={secondaryCategories.map((c) => c.id)}
                    tokens={tokens}
                    isDark={isDark}
                  />
                ) : null
              }
              editContent={
                <SecondaryCategoriesForm
                  datasetId={datasetId}
                  initialCategories={secondaryCategories.map((c) => c.id)}
                  isDark={isDark}
                  onSubmitData={setDatasetSecondaryCategories}
                  onSuccess={handleEditSuccess}
                  onCancel={handleEditCancel}
                />
              }
            />

            {/* Section 7: Pricing */}
            {pricingData && (
              <PricingSection
                pricingData={pricingData}
                isSampleProposal={dataset.isSample === true}
                onEditPricing={() => setShowPricingDialog(true)}
                isDark={isDark}
                tokens={tokens}
              />
            )}
          </main>

          <aside className="space-y-4 xl:sticky xl:top-6">
            {canEdit ? (
              <SubmitForReviewSection
                verificationStatus={verificationStatus}
                missingPrerequisites={missingPrerequisites}
                submitting={submittingUpdate}
                onSubmit={() => void handleSubmitUpdate()}
                isDark={isDark}
                tokens={tokens}
                eyebrow="Update readiness"
                title={
                  verificationStatus === "CHANGES_REQUESTED"
                    ? "Ready to resubmit?"
                    : "Ready for review?"
                }
                description={
                  verificationStatus === "CHANGES_REQUESTED"
                    ? "Address the reviewer feedback, confirm every required section, and return the update to the review queue."
                    : "Complete the required information before sending this update to the admin review queue."
                }
                actionLabel={
                  verificationStatus === "CHANGES_REQUESTED"
                    ? "Resubmit update"
                    : "Submit update"
                }
              />
            ) : (
              <DashboardCard className="p-5">
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                  Review state
                </p>
                <h2 className="mt-2 text-lg font-semibold text-foreground">
                  Editing is unavailable
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  This update is currently locked by its lifecycle state. The
                  editable sections remain visible for reference.
                </p>
              </DashboardCard>
            )}

            <DashboardCard className="p-5">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                What this changes
              </p>
              <h2 className="mt-2 text-base font-semibold text-foreground">
                A reviewed replacement version
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Submitting this form starts an admin review. It does not
                immediately republish or replace the marketplace version.
              </p>
            </DashboardCard>
          </aside>
        </div>
      </DatasetWorkspace>

      {/* Pricing Edit Dialog */}
      <PricingEditDialog
        isOpen={showPricingDialog && canEdit}
        onClose={() => setShowPricingDialog(false)}
        datasetId={datasetId}
        currentPricing={pricingData}
        isDark={isDark}
        feedbackMessage={pricingData?.notes ?? undefined}
        pricingStatus={pricingData?.status}
        mode="dataset"
        onSuccess={() => {
          setShowPricingDialog(false);
          void fetchData();
        }}
      />
    </>
  );
}
