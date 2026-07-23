"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PageBackground } from "@/components/shared";
import {
  DatasetWorkspace,
  isProposalEditable,
  isProposalSubmittable,
  isProposalTerminal,
} from "./workspace";
import { EditableSection } from "./shared";
import { KdtsScoreCard } from "./shared/KdtsScoreCard";
import {
  AboutDatasetForm,
  DataFormatForm,
  FeaturesForm,
  LocationTagsEditForm,
  MetadataEditForm,
  SecondaryCategoriesForm,
} from "./forms";
import { DatasetUploadFlow } from "./DatasetUploadFlow";
import { PricingEditDialog } from "./actions";
import { getDatasetThemeTokens } from "@/constants/dataset.constants";
import { getProposalPricing } from "@/lib/api/dataset-proposals";
import {
  ArrowLeft,
  FileText,
  FileCode,
  MapPin,
  Settings,
  Tag,
  Database,
  AlertCircle,
  BadgeDollarSign,
  ClipboardCheck,
  Layers3,
} from "lucide-react";
import type {
  ProposalDetailsResponse,
  DatasetPricingVersion,
} from "@/types/dataset-proposal.types";

// Hooks
import { useSampleToggle, useSubmitProposal } from "./hooks";

// Detail sub-components
import {
  TerminalStateBanner,
  ChangesRequestedBanner,
  ProposalTitleCard,
  SampleProposalToggleCard,
  SampleProposalDetailsCard,
  SubmitForReviewSection,
  CurrentUploadSection,
  SampleUploadSection,
  PricingSection,
  SubmitConfirmModal,
  SampleToggleModal,
} from "./detail";

// Display components
import {
  MetadataDisplay,
  LocationTagsDisplay,
  AboutDisplay,
  DataFormatDisplay,
  FeaturesDisplay,
  CategoriesDisplay,
} from "./detail/displays";

interface DatasetDetailProps {
  proposal: ProposalDetailsResponse;
  isDark?: boolean;
  onRefresh?: () => void;
}

export function DatasetDetail({
  proposal,
  isDark = false,
  onRefresh,
}: DatasetDetailProps) {
  const router = useRouter();
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadDialogKind, setUploadDialogKind] = useState<
    "current" | "sample"
  >("current");
  const [showPricingDialog, setShowPricingDialog] = useState(false);
  const [pricingData, setPricingData] = useState<DatasetPricingVersion | null>(
    null
  );
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    metadata: true,
    locationTags: true,
    upload: true,
    about: true,
    format: true,
    features: false,
    categories: false,
  });

  const tokens = getDatasetThemeTokens(isDark);

  // --- Derived state ---
  const verificationStatus = proposal.verification?.status;
  const isEditable = isProposalEditable(verificationStatus);
  const isSampleProposal = proposal.dataset.isSample === true;
  const isTerminalState = isProposalTerminal(verificationStatus);
  const canSubmit = isProposalSubmittable(verificationStatus);
  const shouldShowSampleUpload =
    (proposal.dataset.isPaid ?? pricingData?.isPaid ?? false) &&
    !proposal.dataset.isSample;

  const activeEditingSection = isEditable ? editingSection : null;

  // --- Custom hooks ---
  const sampleToggle = useSampleToggle({ proposal, isEditable, onRefresh });
  const submitProposal = useSubmitProposal({
    proposal,
    pricingData,
    onRefresh,
  });

  // --- Pricing fetch ---
  const fetchPricing = useCallback(async () => {
    try {
      const response = await getProposalPricing(proposal.dataset.id);
      setPricingData(response.pricing);
    } catch (err) {
      console.error("Failed to fetch pricing", err);
    }
  }, [proposal.dataset.id]);

  useEffect(() => {
    let active = true;

    getProposalPricing(proposal.dataset.id)
      .then((response) => {
        if (active) setPricingData(response.pricing);
      })
      .catch((err: unknown) => {
        console.error("Failed to fetch pricing", err);
      });

    return () => {
      active = false;
    };
  }, [proposal.dataset.id]);

  // --- Helpers ---
  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
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

  const formatFileSize = (bytes: string | null) => {
    if (!bytes) return "N/A";
    const size = parseInt(bytes, 10);
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
    if (size < 1024 * 1024 * 1024)
      return `${(size / (1024 * 1024)).toFixed(2)} MB`;
    return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const openCurrentUploadDialog = () => {
    if (!isEditable) return;
    setUploadDialogKind("current");
    setUploadDialogOpen(true);
  };

  const openSampleUploadDialog = () => {
    if (!isEditable) return;
    setUploadDialogKind("sample");
    setUploadDialogOpen(true);
  };

  const handleEditSuccess = () => {
    setEditingSection(null);
    onRefresh?.();
  };

  const handleEditCancel = () => {
    setEditingSection(null);
  };

  return (
    <PageBackground withGrid>
      <DatasetWorkspace className="relative z-10 max-w-[1380px]">
        <Button
          variant="outline"
          onClick={() => router.push("/dashboard/datasets")}
          className="group mb-5 gap-2"
        >
          <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" />
          Back to proposals
        </Button>

        <ProposalTitleCard
          title={proposal.dataset.title}
          datasetUniqueId={proposal.dataset.datasetUniqueId}
          verificationStatus={proposal.verification.status}
          isDark={isDark}
          tokens={tokens}
        />

        <div className="mt-5 space-y-4">
          {isTerminalState && (
            <TerminalStateBanner
              verificationStatus={verificationStatus}
              rejectionReason={proposal.verification.rejectionReason}
              tokens={tokens}
            />
          )}
          {proposal.verification.status === "CHANGES_REQUESTED" &&
            proposal.verification.notes && (
              <ChangesRequestedBanner
                notes={proposal.verification.notes}
                isDark={isDark}
                tokens={tokens}
              />
            )}
        </div>

        <div className="mt-6 grid items-start gap-7 xl:grid-cols-[minmax(0,1fr)_340px]">
          <main className="min-w-0 space-y-8">
            <section
              className="space-y-4"
              aria-labelledby="proposal-basics-heading"
            >
              <div className="flex items-start gap-3 px-1">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <ClipboardCheck className="size-4" />
                </span>
                <div>
                  <h2
                    id="proposal-basics-heading"
                    className="text-base font-semibold text-foreground"
                  >
                    Proposal basics
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Identity, positioning, coverage, and marketplace
                    classification.
                  </p>
                </div>
              </div>

              <EditableSection
                title="Basic Metadata"
                icon={<Settings className="w-5 h-5" />}
                isExpanded={expandedSections.metadata}
                onToggle={() => toggleSection("metadata")}
                isEditable={isEditable}
                isEditing={activeEditingSection === "metadata"}
                onEditClick={() => setEditingSection("metadata")}
                isEmpty={false}
                emptyIcon={<Settings className="w-12 h-12" />}
                emptyMessage=""
                editContent={
                  <MetadataEditForm
                    datasetId={proposal.dataset.id}
                    initialData={{
                      title: proposal.dataset.title,
                      primaryCategoryId: proposal.dataset.primaryCategoryId,
                      sourceId: proposal.dataset.sourceId,
                      license: proposal.dataset.license,
                      isSample: proposal.dataset.isSample ?? false,
                      sampleNotes: proposal.dataset.sampleNotes ?? null,
                      actualPrice: proposal.dataset.actualPrice ?? null,
                      actualPriceCurrency: proposal.dataset.actualPriceCurrency,
                      isNegotiable: proposal.dataset.isNegotiable ?? null,
                    }}
                    isDark={isDark}
                    onSuccess={handleEditSuccess}
                    onCancel={handleEditCancel}
                  />
                }
                displayContent={
                  <MetadataDisplay proposal={proposal} tokens={tokens} />
                }
                isDark={isDark}
                tokens={tokens}
              />

              <EditableSection
                title="Location & Tags"
                icon={<MapPin className="w-5 h-5" />}
                subtitle="Manage location details and discovery tags"
                isExpanded={expandedSections.locationTags}
                onToggle={() => toggleSection("locationTags")}
                isEditable={isEditable}
                isEditing={activeEditingSection === "locationTags"}
                onEditClick={() => setEditingSection("locationTags")}
                isEmpty={
                  !proposal.locationInfo &&
                  (!proposal.tags || proposal.tags.length === 0)
                }
                emptyIcon={<Tag className="w-12 h-12" />}
                emptyMessage="Location and tags not provided yet"
                emptyActionLabel="Add Location & Tags"
                editContent={
                  <LocationTagsEditForm
                    datasetId={proposal.dataset.id}
                    initialData={{
                      locationInfo: proposal.locationInfo ?? null,
                      tags: proposal.tags ?? [],
                    }}
                    isDark={isDark}
                    onSuccess={handleEditSuccess}
                    onCancel={handleEditCancel}
                  />
                }
                displayContent={
                  <LocationTagsDisplay proposal={proposal} tokens={tokens} />
                }
                isDark={isDark}
                tokens={tokens}
              />

              <EditableSection
                title="About Dataset"
                icon={<FileText className="w-5 h-5" />}
                isExpanded={expandedSections.about}
                onToggle={() => toggleSection("about")}
                isEditable={isEditable}
                isEditing={activeEditingSection === "about"}
                onEditClick={() => setEditingSection("about")}
                isEmpty={!proposal.aboutDatasetInfo}
                emptyIcon={<AlertCircle className="w-12 h-12" />}
                emptyMessage="About information not provided yet"
                emptyActionLabel="Add About Information"
                editContent={
                  <AboutDatasetForm
                    datasetId={proposal.dataset.id}
                    initialData={proposal.aboutDatasetInfo || undefined}
                    isDark={isDark}
                    onSuccess={handleEditSuccess}
                    onCancel={handleEditCancel}
                  />
                }
                displayContent={
                  proposal.aboutDatasetInfo ? (
                    <AboutDisplay
                      about={proposal.aboutDatasetInfo}
                      tokens={tokens}
                      formatDate={formatDate}
                    />
                  ) : null
                }
                isDark={isDark}
                tokens={tokens}
              />

              <EditableSection
                title="Secondary Categories"
                icon={<Settings className="w-5 h-5" />}
                isExpanded={expandedSections.categories}
                onToggle={() => toggleSection("categories")}
                isEditable={isEditable}
                isEditing={activeEditingSection === "categories"}
                onEditClick={() => setEditingSection("categories")}
                isEmpty={
                  !proposal.secondaryCategories ||
                  proposal.secondaryCategories.length === 0
                }
                emptyIcon={<Settings className="w-12 h-12" />}
                emptyMessage="No secondary categories defined yet"
                emptyActionLabel="Add Categories"
                editContent={
                  <SecondaryCategoriesForm
                    datasetId={proposal.dataset.id}
                    initialCategories={
                      proposal.secondaryCategories?.map((c) => c.id) || []
                    }
                    isDark={isDark}
                    onSuccess={handleEditSuccess}
                    onCancel={handleEditCancel}
                  />
                }
                displayContent={
                  proposal.secondaryCategories &&
                  proposal.secondaryCategories.length > 0 ? (
                    <CategoriesDisplay
                      categoryIds={proposal.secondaryCategories.map(
                        (c) => c.id
                      )}
                      tokens={tokens}
                      isDark={isDark}
                    />
                  ) : null
                }
                isDark={isDark}
                tokens={tokens}
              />

              {isSampleProposal && (
                <SampleProposalDetailsCard
                  actualPrice={proposal.dataset.actualPrice}
                  actualPriceCurrency={proposal.dataset.actualPriceCurrency}
                  isNegotiable={proposal.dataset.isNegotiable}
                  sampleNotes={proposal.dataset.sampleNotes}
                  isEditable={isEditable}
                  onEditClick={() => setEditingSection("metadata")}
                  isDark={isDark}
                  tokens={tokens}
                />
              )}
            </section>

            <section className="space-y-4" aria-labelledby="delivery-heading">
              <div className="flex items-start gap-3 px-1">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Layers3 className="size-4" />
                </span>
                <div>
                  <h2
                    id="delivery-heading"
                    className="text-base font-semibold text-foreground"
                  >
                    Files and structure
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Delivery assets, file format, and the schema buyers can
                    expect.
                  </p>
                </div>
              </div>

              <CurrentUploadSection
                currentUpload={proposal.currentUpload}
                isExpanded={expandedSections.upload}
                onToggle={() => toggleSection("upload")}
                isEditable={isEditable}
                onUploadClick={openCurrentUploadDialog}
                isDark={isDark}
                tokens={tokens}
                formatDate={formatDate}
                formatFileSize={formatFileSize}
              />
              {shouldShowSampleUpload && (
                <SampleUploadSection
                  sampleUpload={proposal.sampleUpload}
                  isEditable={isEditable}
                  onUploadClick={openSampleUploadDialog}
                  isDark={isDark}
                  tokens={tokens}
                  formatDate={formatDate}
                  formatFileSize={formatFileSize}
                />
              )}

              <EditableSection
                title="Data Format & Structure"
                icon={<FileCode className="w-5 h-5" />}
                isExpanded={expandedSections.format}
                onToggle={() => toggleSection("format")}
                isEditable={isEditable}
                isEditing={activeEditingSection === "format"}
                onEditClick={() => setEditingSection("format")}
                isEmpty={!proposal.dataFormatInfo}
                emptyIcon={<FileCode className="w-12 h-12" />}
                emptyMessage="Data format information not provided yet"
                emptyActionLabel="Add Format Information"
                editContent={
                  <DataFormatForm
                    datasetId={proposal.dataset.id}
                    initialData={proposal.dataFormatInfo || undefined}
                    isDark={isDark}
                    onSuccess={handleEditSuccess}
                    onCancel={handleEditCancel}
                  />
                }
                displayContent={
                  proposal.dataFormatInfo ? (
                    <DataFormatDisplay
                      dataFormat={proposal.dataFormatInfo}
                      tokens={tokens}
                      formatDate={formatDate}
                    />
                  ) : null
                }
                isDark={isDark}
                tokens={tokens}
              />

              <EditableSection
                title="Features / Columns"
                subtitle={`${proposal.features?.length || 0} features defined`}
                icon={<Database className="w-5 h-5" />}
                isExpanded={expandedSections.features}
                onToggle={() => toggleSection("features")}
                isEditable={isEditable}
                isEditing={activeEditingSection === "features"}
                onEditClick={() => setEditingSection("features")}
                isEmpty={!proposal.features || proposal.features.length === 0}
                emptyIcon={<Database className="w-12 h-12" />}
                emptyMessage="No features defined yet"
                emptyActionLabel="Define Features"
                editContent={
                  <FeaturesForm
                    datasetId={proposal.dataset.id}
                    initialData={proposal.features || []}
                    isDark={isDark}
                    onSuccess={handleEditSuccess}
                    onCancel={handleEditCancel}
                  />
                }
                displayContent={
                  proposal.features && proposal.features.length > 0 ? (
                    <FeaturesDisplay
                      features={proposal.features}
                      tokens={tokens}
                      isDark={isDark}
                    />
                  ) : null
                }
                isDark={isDark}
                tokens={tokens}
              />
            </section>

            {pricingData && (
              <section
                className="space-y-4"
                aria-labelledby="commercial-heading"
              >
                <div className="flex items-start gap-3 px-1">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <BadgeDollarSign className="size-4" />
                  </span>
                  <div>
                    <h2
                      id="commercial-heading"
                      className="text-base font-semibold text-foreground"
                    >
                      Commercial setup
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Pricing and approval state for this proposal.
                    </p>
                  </div>
                </div>
                <PricingSection
                  pricingData={pricingData}
                  isSampleProposal={isSampleProposal}
                  onEditPricing={() => setShowPricingDialog(true)}
                  isDark={isDark}
                  tokens={tokens}
                />
              </section>
            )}
          </main>

          <aside className="order-first space-y-4 xl:order-none xl:sticky xl:top-6">
            {canSubmit && (
              <SubmitForReviewSection
                verificationStatus={proposal.verification.status}
                missingPrerequisites={submitProposal.missingPrerequisites}
                submitting={submitProposal.submitting}
                onSubmit={submitProposal.handleSubmitForReview}
                isDark={isDark}
                tokens={tokens}
              />
            )}
            <SampleProposalToggleCard
              isSampleProposal={isSampleProposal}
              isEditable={isEditable}
              sampleToggleSubmitting={sampleToggle.sampleToggleSubmitting}
              onToggle={sampleToggle.handleOpenSampleToggle}
              isDark={isDark}
              tokens={tokens}
            />
            <KdtsScoreCard datasetId={proposal.dataset.id} variant="flat" />
            <div className="supplier-glass-panel rounded-xl border p-4">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                Workspace rules
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Section saves update the draft only. Submission is always a
                separate confirmed action from the readiness panel.
              </p>
            </div>
          </aside>
        </div>
      </DatasetWorkspace>

      {/* Upload Dialog */}
      <DatasetUploadFlow
        isOpen={uploadDialogOpen && isEditable}
        onClose={() => {
          setUploadDialogOpen(false);
          setUploadDialogKind("current");
        }}
        datasetId={proposal.dataset.id}
        isDark={isDark}
        isEditable={isEditable}
        uploadKind={uploadDialogKind}
        onUploadComplete={() => {
          setUploadDialogOpen(false);
          setUploadDialogKind("current");
          onRefresh?.();
        }}
      />

      {/* Submit Confirmation Modal */}
      {submitProposal.showConfirmModal && (
        <SubmitConfirmModal
          proposal={proposal}
          pricingData={pricingData}
          submitting={submitProposal.submitting}
          onConfirm={submitProposal.handleConfirmSubmit}
          onCancel={submitProposal.handleCancelSubmit}
          isDark={isDark}
          tokens={tokens}
        />
      )}

      {/* Sample Toggle Modal */}
      {sampleToggle.sampleConfirmOpen && (
        <SampleToggleModal
          pendingSampleValue={sampleToggle.pendingSampleValue}
          sampleToggleSubmitting={sampleToggle.sampleToggleSubmitting}
          sampleToggleError={sampleToggle.sampleToggleError}
          sampleWhy={sampleToggle.sampleWhy}
          onSampleWhyChange={sampleToggle.setSampleWhy}
          sampleSize={sampleToggle.sampleSize}
          onSampleSizeChange={sampleToggle.setSampleSize}
          sampleCompleteness={sampleToggle.sampleCompleteness}
          onSampleCompletenessChange={sampleToggle.setSampleCompleteness}
          sampleDelivery={sampleToggle.sampleDelivery}
          onSampleDeliveryChange={sampleToggle.setSampleDelivery}
          sampleDeliveryNotes={sampleToggle.sampleDeliveryNotes}
          onSampleDeliveryNotesChange={sampleToggle.setSampleDeliveryNotes}
          sampleActualPrice={sampleToggle.sampleActualPrice}
          onSampleActualPriceChange={sampleToggle.setSampleActualPrice}
          sampleActualPriceCurrency={sampleToggle.sampleActualPriceCurrency}
          onSampleActualPriceCurrencyChange={
            sampleToggle.setSampleActualPriceCurrency
          }
          sampleNegotiable={sampleToggle.sampleNegotiable}
          onSampleNegotiableChange={sampleToggle.setSampleNegotiable}
          onConfirm={sampleToggle.handleConfirmSampleToggle}
          onCancel={sampleToggle.handleCancelSampleToggle}
          isDark={isDark}
          tokens={tokens}
        />
      )}

      {/* Pricing Edit Dialog */}
      {pricingData && !isSampleProposal && (
        <PricingEditDialog
          isOpen={showPricingDialog && isEditable}
          onClose={() => setShowPricingDialog(false)}
          datasetId={proposal.dataset.id}
          currentPricing={pricingData}
          onSuccess={() => {
            setShowPricingDialog(false);
            fetchPricing();
            onRefresh?.();
          }}
          isDark={isDark}
          feedbackMessage={pricingData.rejectionReason || undefined}
          pricingStatus={pricingData.status}
        />
      )}
    </PageBackground>
  );
}
