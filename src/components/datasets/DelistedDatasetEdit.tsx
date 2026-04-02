'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Database,
  FileCode,
  FileText,
  Loader2,
  MapPin,
  Send,
  Settings,
  Tag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageBackground } from '@/components/shared';
import { useSupplierTokens } from '@/hooks/useSupplierTokens';
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
} from '@/lib/api';
import { PricingEditDialog } from './actions';
import {
  AboutDatasetForm,
  DataFormatForm,
  FeaturesForm,
  LocationTagsEditForm,
  SecondaryCategoriesForm,
} from './forms';
import { DatasetStatusBadge, EditableSection, PublishStatusBadge } from './shared';
import {
  ChangesRequestedBanner,
  PricingSection,
  UpdateStatusBanner,
} from './detail';
import {
  AboutDisplay,
  LocationTagsDisplay,
  DataFormatDisplay,
  FeaturesDisplay,
  CategoriesDisplay,
} from './detail/displays';
import type { DatasetPricingVersion, VerificationStatus } from '@/types/dataset-proposal.types';
import type { DatasetDetailsResponse } from '@/types/dataset.types';

interface DelistedDatasetEditProps {
  datasetId: string;
}

export function DelistedDatasetEdit({ datasetId }: DelistedDatasetEditProps) {
  const router = useRouter();
  const tokens = useSupplierTokens();

  const [datasetData, setDatasetData] = useState<DatasetDetailsResponse | null>(null);
  const [pricingData, setPricingData] = useState<DatasetPricingVersion | null>(null);
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

  const fetchData = async () => {
    try {
      setLoading(true);
      const [details, pricing] = await Promise.all([
        getDatasetDetails(datasetId),
        getDatasetPricing(datasetId),
      ]);
      setDatasetData(details);
      setPricingData(pricing.pricing ?? null);
    } catch (error: any) {
      toast.error('Failed to load dataset', {
        description: error?.message ?? 'Please try again.',
      });
      router.push(`/dashboard/my-datasets/${datasetId}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [datasetId]);

  // --- Derived state ---
  const canEdit = useMemo(() => {
    if (!datasetData?.verification) return false;
    const ds = datasetData.dataset.status;
    const vs = datasetData.verification.status as VerificationStatus;
    return (
      (ds === 'DELISTED' && (vs === 'PENDING' || vs === 'VERIFIED')) ||
      (ds === 'SUBMITTED' && vs === 'CHANGES_REQUESTED')
    );
  }, [datasetData]);

  const missingPrerequisites = useMemo(() => {
    if (!datasetData) return [];
    const missing: string[] = [];
    if (!datasetData.aboutDatasetInfo) missing.push('About Dataset information');
    if (!datasetData.dataFormatInfo) missing.push('Data Format information');
    if (!datasetData.features || datasetData.features.length === 0) missing.push('At least one feature/column');
    if (!pricingData) missing.push('Pricing configuration');
    if (pricingData?.isPaid && !['SUBMITTED', 'RESUBMITTED', 'UNDER_REVIEW', 'ACTIVE'].includes(pricingData.status)) {
      missing.push('Pricing must be submitted (currently in draft)');
    }
    return missing;
  }, [datasetData, pricingData]);

  const handleSubmitUpdate = async () => {
    if (missingPrerequisites.length > 0) {
      toast.error('Cannot submit', {
        description: `Please complete: ${missingPrerequisites.join(', ')}`,
        duration: 5000,
      });
      return;
    }

    setSubmittingUpdate(true);
    try {
      await submitDatasetUpdate(datasetId);
      toast.success('Update submitted', {
        description: 'Your dataset update request is now in the admin review queue.',
      });
      await fetchData();
    } catch (error: any) {
      toast.error('Failed to submit update', {
        description: error?.message ?? 'Please review required sections and try again.',
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
    fetchData();
  };

  const handleEditCancel = () => {
    setEditingSection(null);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // --- Loading ---
  if (loading || !datasetData) {
    return (
      <PageBackground withGrid>
        <div className="max-w-[1100px] mx-auto p-8">
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: tokens.textSecondary }} />
          </div>
        </div>
      </PageBackground>
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
  const verificationStatus = verification?.status ?? 'PENDING';

  const sectionTokens = {
    surfaceCard: isDark ? 'rgba(26, 34, 64, 0.68)' : '#ffffff',
    borderDefault: tokens.borderDefault,
    borderSubtle: tokens.borderSubtle,
    textPrimary: tokens.textPrimary,
    textSecondary: tokens.textSecondary,
    textMuted: tokens.textMuted,
    glassBg: tokens.glassBg,
    glassBorder: tokens.glassBorder,
  };

  return (
    <PageBackground withGrid>
      <div className="relative z-10 max-w-[1100px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.push(`/dashboard/my-datasets/${datasetId}`)}
          className="mb-6 flex items-center gap-2 -ml-2 transition-all duration-200 hover:translate-x-[-2px] group"
          style={{
            background: tokens.glassBg || 'transparent',
            border: `1px solid ${tokens.glassBorder || tokens.borderSubtle}`,
            color: tokens.textPrimary,
          }}
        >
          <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" />
          Back to Dataset
        </Button>

        {/* Title Card */}
        <Card
          className="border overflow-hidden mb-6"
          style={{
            background: sectionTokens.surfaceCard,
            borderColor: tokens.borderDefault,
            boxShadow: isDark
              ? '0 8px 24px rgba(0, 0, 0, 0.2)'
              : '0 8px 24px rgba(26, 34, 64, 0.06)',
          }}
        >
          <div className="p-6">
            <div className="flex items-center gap-4 mb-3">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{
                  background: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(26, 34, 64, 0.08)',
                }}
              >
                <FileText className="w-6 h-6" style={{ color: tokens.textSecondary }} />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-semibold mb-1" style={{ color: tokens.textPrimary }}>
                  {dataset.title}
                </h1>
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="text-xs font-mono px-2.5 py-1 rounded-md"
                    style={{ background: tokens.infoBg, color: tokens.textSecondary }}
                  >
                    {dataset.datasetUniqueId}
                  </span>
                  <PublishStatusBadge status={dataset.status} />
                  <DatasetStatusBadge status={verificationStatus} isDark={isDark} />
                </div>
              </div>
            </div>
            <p className="text-sm" style={{ color: tokens.textSecondary }}>
              Update metadata and pricing, then submit changes for admin review.
            </p>
          </div>
        </Card>

        {/* Status Banner */}
        <UpdateStatusBanner
          datasetStatus={dataset.status as any}
          verificationStatus={verificationStatus}
          rejectionReason={verification?.rejectionReason}
          isDark={isDark}
          tokens={tokens}
        />

        {/* Changes Requested Banner */}
        {verificationStatus === 'CHANGES_REQUESTED' && verification?.notes && (
          <ChangesRequestedBanner
            notes={verification.notes}
            isDark={isDark}
            tokens={tokens}
          />
        )}

        {/* Editing Locked Banner */}
        {!canEdit && !['DELISTED', 'SUBMITTED'].includes(dataset.status) && (
          <div
            className="mb-6 rounded-xl border px-6 py-4"
            style={{
              background: isDark ? 'rgba(234, 179, 8, 0.08)' : 'rgba(234, 179, 8, 0.1)',
              borderColor: isDark ? 'rgba(234, 179, 8, 0.3)' : 'rgba(234, 179, 8, 0.35)',
            }}
          >
            <p className="text-sm" style={{ color: isDark ? '#fbbf24' : '#b45309' }}>
              Editing is currently locked. You can edit when status is DELISTED + PENDING/VERIFIED or SUBMITTED + CHANGES_REQUESTED.
            </p>
          </div>
        )}

        {/* Submit for Review Section */}
        {canEdit && (
          <Card
            className="border overflow-hidden mb-6 transition-shadow duration-200 hover:shadow-md"
            style={{
              background: isDark
                ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(16, 185, 129, 0.05) 100%)'
                : 'linear-gradient(135deg, rgba(59, 130, 246, 0.03) 0%, rgba(16, 185, 129, 0.03) 100%)',
              borderColor: tokens.borderDefault,
            }}
          >
            <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold mb-1" style={{ color: tokens.textPrimary }}>
                  {verificationStatus === 'CHANGES_REQUESTED' ? 'Resubmit for Review' : 'Submit Update for Review'}
                </h3>
                <p className="text-sm" style={{ color: tokens.textSecondary }}>
                  {verificationStatus === 'CHANGES_REQUESTED'
                    ? 'Address the admin feedback and resubmit when ready.'
                    : 'Review your changes, then submit for admin review.'}
                </p>
                {missingPrerequisites.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-medium" style={{ color: isDark ? '#eab308' : '#b45309' }}>
                      Missing: {missingPrerequisites.join(', ')}
                    </p>
                  </div>
                )}
              </div>
              <Button
                onClick={handleSubmitUpdate}
                disabled={submittingUpdate || missingPrerequisites.length > 0}
                className="h-11 px-7 font-semibold transition-all duration-200 hover:shadow-md hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 gap-2"
                style={{
                  background: submittingUpdate || missingPrerequisites.length > 0
                    ? 'rgba(156, 163, 175, 0.2)'
                    : tokens.glassBg || 'transparent',
                  border: `1.5px solid ${submittingUpdate || missingPrerequisites.length > 0
                    ? 'rgba(156, 163, 175, 0.3)'
                    : tokens.glassBorder || tokens.borderSubtle
                    }`,
                  color: tokens.textPrimary,
                }}
              >
                {submittingUpdate ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {submittingUpdate
                  ? 'Submitting...'
                  : verificationStatus === 'CHANGES_REQUESTED'
                    ? 'Resubmit for Review'
                    : 'Submit for Review'}
              </Button>
            </div>
          </Card>
        )}

        {/* Editable Sections */}
        <div className="space-y-6">
          {/* Section 1: Basic Metadata */}
          <EditableSection
            title="Basic Metadata"
            icon={<Settings className="w-5 h-5" />}
            subtitle="Title, source, category and license (read-only in update flow)"
            isExpanded={expandedSections.metadata}
            onToggle={() => toggleSection('metadata')}
            isEditable={false}
            isEditing={editingSection === 'metadata'}
            onEditClick={() => setEditingSection('metadata')}
            isEmpty={false}
            emptyIcon={<Settings className="w-12 h-12" />}
            emptyMessage=""
            isDark={isDark}
            tokens={sectionTokens}
            displayContent={
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-medium" style={{ color: tokens.textSecondary }}>Title</p>
                    <p className="text-sm" style={{ color: tokens.textPrimary }}>{dataset.title}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium" style={{ color: tokens.textSecondary }}>License</p>
                    <p className="text-sm" style={{ color: tokens.textPrimary }}>{dataset.license}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium" style={{ color: tokens.textSecondary }}>Primary Category</p>
                    <p className="text-sm" style={{ color: tokens.textPrimary }}>{datasetData.primaryCategory?.name ?? 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium" style={{ color: tokens.textSecondary }}>Source</p>
                    <p className="text-sm" style={{ color: tokens.textPrimary }}>{datasetData.source?.name ?? 'N/A'}</p>
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
            onToggle={() => toggleSection('about')}
            isEditable={canEdit}
            isEditing={editingSection === 'about'}
            onEditClick={() => setEditingSection('about')}
            isEmpty={!aboutDatasetInfo}
            emptyIcon={<FileText className="w-12 h-12" />}
            emptyMessage="No about information yet"
            emptyActionLabel="Add About Info"
            isDark={isDark}
            tokens={sectionTokens}
            displayContent={
              aboutDatasetInfo ? (
                <AboutDisplay
                  about={aboutDatasetInfo as any}
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
              />
            }
          />

          {/* Section 3: Location & Tags */}
          <EditableSection
            title="Location & Tags"
            icon={<MapPin className="w-5 h-5" />}
            subtitle="Manage location details and discovery tags"
            isExpanded={expandedSections.locationTags}
            onToggle={() => toggleSection('locationTags')}
            isEditable={canEdit}
            isEditing={editingSection === 'locationTags'}
            onEditClick={() => setEditingSection('locationTags')}
            isEmpty={!locationInfo && tags.length === 0}
            emptyIcon={<Tag className="w-12 h-12" />}
            emptyMessage="No location or tags added"
            emptyActionLabel="Add Location & Tags"
            isDark={isDark}
            tokens={sectionTokens}
            displayContent={
              <LocationTagsDisplay
                proposal={{ locationInfo, tags } as any}
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
              />
            }
          />

          {/* Section 4: Data Format */}
          <EditableSection
            title="Data Format & Structure"
            icon={<FileCode className="w-5 h-5" />}
            isExpanded={expandedSections.dataFormat}
            onToggle={() => toggleSection('dataFormat')}
            isEditable={canEdit}
            isEditing={editingSection === 'dataFormat'}
            onEditClick={() => setEditingSection('dataFormat')}
            isEmpty={!dataFormatInfo}
            emptyIcon={<Database className="w-12 h-12" />}
            emptyMessage="No data format information"
            emptyActionLabel="Add Data Format"
            isDark={isDark}
            tokens={sectionTokens}
            displayContent={
              dataFormatInfo ? (
                <DataFormatDisplay
                  dataFormat={dataFormatInfo as any}
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
              />
            }
          />

          {/* Section 5: Features */}
          <EditableSection
            title="Features / Columns"
            subtitle={`${features.length} features defined`}
            icon={<Database className="w-5 h-5" />}
            isExpanded={expandedSections.features}
            onToggle={() => toggleSection('features')}
            isEditable={canEdit}
            isEditing={editingSection === 'features'}
            onEditClick={() => setEditingSection('features')}
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
              />
            }
          />

          {/* Section 6: Secondary Categories */}
          <EditableSection
            title="Secondary Categories"
            icon={<Tag className="w-5 h-5" />}
            isExpanded={expandedSections.categories}
            onToggle={() => toggleSection('categories')}
            isEditable={canEdit}
            isEditing={editingSection === 'categories'}
            onEditClick={() => setEditingSection('categories')}
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
        </div>
      </div>

      {/* Pricing Edit Dialog */}
      <PricingEditDialog
        isOpen={showPricingDialog}
        onClose={() => setShowPricingDialog(false)}
        datasetId={datasetId}
        currentPricing={pricingData}
        isDark={isDark}
        feedbackMessage={pricingData?.notes ?? undefined}
        pricingStatus={pricingData?.status}
        mode="dataset"
        onSuccess={() => {
          setShowPricingDialog(false);
          fetchData();
        }}
      />
    </PageBackground>
  );
}
