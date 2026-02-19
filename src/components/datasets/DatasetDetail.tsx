'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { PageBackground } from '@/components/shared';
import { DatasetStatusBadge, EditableSection } from './shared';
import { AboutDatasetForm, DataFormatForm, FeaturesForm, MetadataEditForm, SecondaryCategoriesForm } from './forms';
import { DatasetUploadFlow } from './DatasetUploadFlow';
import { PricingEditDialog } from './actions';
import { getDatasetThemeTokens, PRICING_STATUS_CONFIG } from '@/constants/dataset.constants';
import { submitProposal, getProposalPricing, submitProposalPricing } from '@/lib/api/dataset-proposals';
import { toast } from 'sonner';
import { 
  FileText, 
  Upload, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  ArrowLeft,
  ChevronUp,
  ChevronDown,
  Database,
  FileCode,
  Settings,
  DollarSign
} from 'lucide-react';
import type { ProposalDetailsResponse, AboutDatasetInfo, DataFormatInfo, DatasetPricingVersion } from '@/types/dataset-proposal.types';

interface DatasetDetailProps {
  proposal: ProposalDetailsResponse;
  isDark?: boolean;
  onRefresh?: () => void;
}

// Helper: Render metadata display content
const renderMetadataDisplay = (proposal: ProposalDetailsResponse, tokens: any) => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label style={{ color: tokens.textSecondary }}>Dataset Type</Label>
        <p className="text-sm" style={{ color: tokens.textPrimary }}>
          {proposal.dataset.superType.replace(/_/g, ' ')}
        </p>
      </div>
      <div className="space-y-2">
        <Label style={{ color: tokens.textSecondary }}>Primary Category ID</Label>
        <p className="text-sm font-mono" style={{ color: tokens.textPrimary }}>
          {proposal.dataset.primaryCategoryId}
        </p>
      </div>
      <div className="space-y-2">
        <Label style={{ color: tokens.textSecondary }}>Source ID</Label>
        <p className="text-sm font-mono" style={{ color: tokens.textPrimary }}>
          {proposal.dataset.sourceId}
        </p>
      </div>
      <div className="space-y-2">
        <Label style={{ color: tokens.textSecondary }}>License</Label>
        <p className="text-sm" style={{ color: tokens.textPrimary }}>
          {proposal.dataset.license}
        </p>
      </div>
      {proposal.dataset.visibility && (
        <div className="space-y-2">
          <Label style={{ color: tokens.textSecondary }}>Visibility</Label>
          <p className="text-sm" style={{ color: tokens.textPrimary }}>
            {proposal.dataset.visibility}
          </p>
        </div>
      )}
    </div>
    <div className="space-y-2">
      <Label style={{ color: tokens.textSecondary }}>Dataset Status</Label>
      <p className="text-sm" style={{ color: tokens.textPrimary }}>
        {proposal.dataset.status}
      </p>
    </div>
    <div className="space-y-2">
      <Label style={{ color: tokens.textSecondary }}>Last Updated</Label>
      <p className="text-sm" style={{ color: tokens.textPrimary }}>
        {new Date(proposal.dataset.updatedAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}
      </p>
    </div>
    {proposal.verification.notes && (
      <div className="space-y-2">
        <Label style={{ color: tokens.textSecondary }}>Verification Notes</Label>
        <div
          className="p-3 rounded-lg text-sm"
          style={{
            background: 'rgba(59, 130, 246, 0.1)',
            borderLeft: '3px solid #3b82f6',
            color: tokens.textPrimary,
          }}
        >
          {proposal.verification.notes}
        </div>
      </div>
    )}
  </div>
);

// Helper: Render about dataset display content
const renderAboutDisplay = (about: AboutDatasetInfo, tokens: any, formatDate: (date: string) => string) => (
  <div className="space-y-4">
    <div>
      <Label style={{ color: tokens.textSecondary }}>Overview</Label>
      <p className="text-sm leading-relaxed mt-1" style={{ color: tokens.textPrimary }}>
        {about.overview}
      </p>
    </div>
    <div>
      <Label style={{ color: tokens.textSecondary }}>Description</Label>
      <p className="text-sm leading-relaxed mt-1" style={{ color: tokens.textPrimary }}>
        {about.description}
      </p>
    </div>
    <div>
      <Label style={{ color: tokens.textSecondary }}>Data Quality</Label>
      <p className="text-sm leading-relaxed mt-1" style={{ color: tokens.textPrimary }}>
        {about.dataQuality}
      </p>
    </div>
    {about.useCases && (
      <div>
        <Label style={{ color: tokens.textSecondary }}>Use Cases</Label>
        <p className="text-sm leading-relaxed mt-1" style={{ color: tokens.textPrimary }}>
          {about.useCases}
        </p>
      </div>
    )}
    {about.limitations && (
      <div>
        <Label style={{ color: tokens.textSecondary }}>Limitations</Label>
        <p className="text-sm leading-relaxed mt-1" style={{ color: tokens.textPrimary }}>
          {about.limitations}
        </p>
      </div>
    )}
    {about.methodology && (
      <div>
        <Label style={{ color: tokens.textSecondary }}>Methodology</Label>
        <p className="text-sm leading-relaxed mt-1" style={{ color: tokens.textPrimary }}>
          {about.methodology}
        </p>
      </div>
    )}
    {about.updatedAt && (
      <div className="pt-3 border-t" style={{ borderColor: tokens.borderSubtle }}>
        <p className="text-xs" style={{ color: tokens.textMuted }}>
          Last updated: {formatDate(about.updatedAt)}
        </p>
      </div>
    )}
  </div>
);

// Helper: Render data format display content
const renderDataFormatDisplay = (dataFormat: DataFormatInfo, tokens: any, formatDate: (date: string) => string) => (
  <div className="grid grid-cols-2 gap-4">
    <div>
      <Label style={{ color: tokens.textSecondary }}>File Format</Label>
      <p className="text-sm font-medium" style={{ color: tokens.textPrimary }}>
        {dataFormat.fileFormat}
      </p>
    </div>
    <div>
      <Label style={{ color: tokens.textSecondary }}>File Size</Label>
      <p className="text-sm" style={{ color: tokens.textPrimary }}>
        {dataFormat.fileSize}
      </p>
    </div>
    <div>
      <Label style={{ color: tokens.textSecondary }}>Rows</Label>
      <p className="text-sm" style={{ color: tokens.textPrimary }}>
        {dataFormat.rows.toLocaleString()}
      </p>
    </div>
    <div>
      <Label style={{ color: tokens.textSecondary }}>Columns</Label>
      <p className="text-sm" style={{ color: tokens.textPrimary }}>
        {dataFormat.cols.toLocaleString()}
      </p>
    </div>
    {dataFormat.compressionType && (
      <div>
        <Label style={{ color: tokens.textSecondary }}>Compression</Label>
        <p className="text-sm" style={{ color: tokens.textPrimary }}>
          {dataFormat.compressionType}
        </p>
      </div>
    )}
    {dataFormat.encoding && (
      <div>
        <Label style={{ color: tokens.textSecondary }}>Encoding</Label>
        <p className="text-sm" style={{ color: tokens.textPrimary }}>
          {dataFormat.encoding}
        </p>
      </div>
    )}
    {dataFormat.updatedAt && (
      <div className="col-span-2 pt-3 border-t" style={{ borderColor: tokens.borderSubtle }}>
        <p className="text-xs" style={{ color: tokens.textMuted }}>
          Last updated: {formatDate(dataFormat.updatedAt)}
        </p>
      </div>
    )}
  </div>
);

// Helper: Render features display content  
const renderFeaturesDisplay = (features: any[], tokens: any, isDark: boolean) => (
  <div className="space-y-3">
    {features.map((feature, index) => (
      <div
        key={index}
        className="p-4 rounded-lg border"
        style={{
          background: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(26, 34, 64, 0.02)',
          borderColor: tokens.borderSubtle,
        }}
      >
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="text-sm font-medium" style={{ color: tokens.textPrimary }}>
              {feature.name}
            </p>
            <p className="text-xs font-mono mt-1" style={{ color: tokens.textSecondary }}>
              {feature.dataType}
            </p>
          </div>
          {feature.isNullable !== undefined && (
            <span
              className="px-2 py-0.5 text-xs rounded"
              style={{
                background: feature.isNullable 
                  ? 'rgba(234, 179, 8, 0.1)' 
                  : 'rgba(34, 197, 94, 0.1)',
                color: feature.isNullable ? '#eab308' : '#22c55e',
              }}
            >
              {feature.isNullable ? 'Nullable' : 'Required'}
            </span>
          )}
        </div>
        {feature.description && (
          <p className="text-xs leading-relaxed" style={{ color: tokens.textMuted }}>
            {feature.description}
          </p>
        )}
      </div>
    ))}
  </div>
);

// Helper: Render secondary categories display
const renderCategoriesDisplay = (categoryIds: string[], tokens: any, isDark: boolean) => (
  <div className="space-y-2">
    <Label style={{ color: tokens.textSecondary }}>Category IDs</Label>
    <div className="flex flex-wrap gap-2">
      {categoryIds.map((categoryId, index) => (
        <span
          key={index}
          className="px-3 py-1 text-xs font-mono rounded-full"
          style={{
            background: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)',
            color: '#3b82f6',
            border: '1px solid rgba(59, 130, 246, 0.3)',
          }}
        >
          {categoryId}
        </span>
      ))}
    </div>
  </div>
);

export function DatasetDetail({ proposal, isDark = false, onRefresh }: DatasetDetailProps) {
  const router = useRouter();
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showPricingDialog, setShowPricingDialog] = useState(false);
  const [pricingData, setPricingData] = useState<DatasetPricingVersion | null>(null);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    metadata: true,
    upload: true,
    about: true,
    format: true,
    features: false,
    categories: false,
  });

  const tokens = getDatasetThemeTokens(isDark);

  // Fetch pricing data
  const fetchPricing = async () => {
    try {
      setPricingLoading(true);
      const response = await getProposalPricing(proposal.dataset.id);
      setPricingData(response.pricing);
    } catch (err) {
      console.error('Failed to fetch pricing', err);
    } finally {
      setPricingLoading(false);
    }
  };

  // Fetch pricing when component mounts or proposal changes
  useEffect(() => {
    fetchPricing();
  }, [proposal.dataset.id]);

  // Can edit when status is PENDING or CHANGES_REQUESTED
  const verificationStatus = proposal.verification?.status;
  const isEditable = verificationStatus === 'PENDING' || verificationStatus === 'CHANGES_REQUESTED';
  const isTerminalState = verificationStatus === 'VERIFIED' || verificationStatus === 'REJECTED';
  
  // Can submit when status is PENDING or CHANGES_REQUESTED
  const canSubmit = proposal.verification.status === 'PENDING' || proposal.verification.status === 'CHANGES_REQUESTED';

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes: string | null) => {
    if (!bytes) return 'N/A';
    const size = parseInt(bytes, 10);
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
    if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(2)} MB`;
    return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };
  
  // Check if proposal meets all prerequisites for submission
  const checkPrerequisites = () => {
    const missing = [];
    
    // Must have uploaded file
    if (!proposal.currentUpload || proposal.currentUpload.status !== 'UPLOADED') {
      missing.push('File upload');
    }
    
    // Must have About info
    if (!proposal.aboutDatasetInfo) {
      missing.push('About Dataset information');
    }
    
    // Must have Data Format info
    if (!proposal.dataFormatInfo) {
      missing.push('Data Format information');
    }
    
    // Must have at least 1 feature
    if (!proposal.features || proposal.features.length === 0) {
      missing.push('At least one feature/column');
    }
    
    return missing;
  };
  
  const getErrorMessage = (error: any): string => {
    // Check for specific error codes from API
    const errorCode = error?.data?.code || error?.code;
    
    const errorMessages: Record<string, string> = {
      'NO_UPLOAD': 'No file has been uploaded. Please upload a dataset file before submitting.',
      'UPLOAD_NOT_READY': 'The uploaded file is not ready. Please wait for the upload to complete.',
      'ABOUT_INFO_REQUIRED': 'About Dataset information is missing. Please fill in the About section.',
      'DATA_FORMAT_REQUIRED': 'Data Format information is missing. Please fill in the Data Format section.',
      'FEATURES_REQUIRED': 'At least one feature/column is required. Please define features in the Features section.',
      'INVALID_STATE': 'This proposal cannot be submitted in its current state. Please check the status.',
      'NOT_FOUND': 'Proposal not found. It may have been deleted.',
      'FORBIDDEN': 'You do not have permission to submit this proposal.',
      'NETWORK_ERROR': 'Unable to connect to the server. Please check your internet connection and try again.',
      'TIMEOUT': 'The request took too long. Please check your internet connection and try again.',
      'OFFLINE': 'You appear to be offline. Please check your internet connection.',
    };
    
    if (errorCode && errorMessages[errorCode]) {
      return errorMessages[errorCode];
    }
    
    // Check if it's a network error by message
    if (error?.message?.includes('Failed to fetch') || error?.message?.includes('Network')) {
      return 'Unable to connect to the server. Please verify your internet connection is working and try again.';
    }
    
    return error?.message || 'Failed to submit proposal. Please check your connection and try again.';
  };
  
  const handleSubmitForReview = () => {
    const missing = checkPrerequisites();
    
    if (missing.length > 0) {
      toast.error('Cannot submit', {
        description: `Please complete: ${missing.join(', ')}`,
        duration: 5000,
      });
      return;
    }
    
    // Show confirmation modal
    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = async () => {
    setShowConfirmModal(false);
    setSubmitting(true);
    try {
      // Check if pricing needs to be submitted first (DRAFT = first submission)
      const pricingNeedsSubmission = pricingData && pricingData.status === 'DRAFT';
      
      // If pricing is in DRAFT status, submit it first
      if (pricingNeedsSubmission) {
        await submitProposalPricing(proposal.dataset.id);
      }
      
      // Submit the proposal
      await submitProposal(proposal.dataset.id);
      
      const action = proposal.verification.status === 'PENDING' ? 'submitted' : 'resubmitted';
      const pricingMessage = pricingNeedsSubmission 
        ? ' along with your pricing' 
        : '';
      
      toast.success(`Proposal ${action} successfully${pricingMessage}`, {
        description: 'Your proposal has been sent to the admin review queue. You will receive a notification when the review is complete.',
      });
      
      // Refresh to get updated status
      onRefresh?.();
    } catch (error: any) {
      console.error('Failed to submit proposal:', error);
      toast.error('Failed to submit proposal', {
        description: getErrorMessage(error),
        duration: 6000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageBackground withGrid>
      <div className="relative z-10 max-w-[1100px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard/datasets')}
          className="mb-6 flex items-center gap-2 -ml-2 transition-all duration-200 hover:translate-x-[-2px] group"
          style={{
            background: tokens.glassBg || 'transparent',
            border: `1px solid ${tokens.glassBorder || tokens.borderSubtle}`,
            color: tokens.textPrimary,
          }}
        >
          <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" />
          Back to proposals
        </Button>


        {/* Terminal State Banner */}
        {isTerminalState && (
          <div
            className="mb-6 rounded-lg border px-6 py-4 flex items-center justify-between"
            style={{
              background: proposal.verification.status === 'VERIFIED' ? tokens.bannerBg : tokens.warningBg,
              borderColor: proposal.verification.status === 'VERIFIED' ? tokens.bannerBorder : tokens.warningBorder,
            }}
          >
            <div className="flex items-center gap-3">
              {proposal.verification.status === 'VERIFIED' ? (
                <CheckCircle className="w-5 h-5" style={{ color: tokens.bannerText }} />
              ) : (
                <XCircle className="w-5 h-5" style={{ color: tokens.warningText }} />
              )}
              <div>
                <p
                  className="text-sm font-semibold"
                  style={{ color: proposal.verification.status === 'VERIFIED' ? tokens.bannerText : tokens.warningText }}
                >
                  {proposal.verification.status === 'VERIFIED' ? 'Proposal Verified' : 'Proposal Rejected'}
                </p>
                <p className="text-xs" style={{ color: tokens.textMuted }}>
                  {proposal.verification.status === 'VERIFIED'
                    ? 'This proposal has been verified and is ready for publication'
                    : proposal.verification.rejectionReason || 'This proposal has been rejected and cannot be edited'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Title Card */}
        <Card
          className="border overflow-hidden mb-6"
          style={{
            background: tokens.surfaceCard,
            borderColor: tokens.borderDefault,
            boxShadow: isDark
              ? '0 8px 24px rgba(0, 0, 0, 0.2)'
              : '0 8px 24px rgba(26, 34, 64, 0.06)',
          }}
        >
          <div className="p-6">
            <div className="flex items-center justify-between gap-6 mb-4">
              <div className="flex items-center gap-4 flex-1">
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
                    {proposal.dataset.title}
                  </h1>
                  <div className="flex items-center gap-3">
                    <DatasetStatusBadge status={proposal.verification.status} isDark={isDark} />
                    <span className="text-sm" style={{ color: tokens.textMuted }}>
                      ID: {proposal.dataset.datasetUniqueId}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Submit for Review Section */}
        {canSubmit && (
          <Card
            className="border overflow-hidden mb-6 transition-shadow duration-200 hover:shadow-md"
            style={{
              background: isDark
                ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(16, 185, 129, 0.05) 100%)'
                : 'linear-gradient(135deg, rgba(59, 130, 246, 0.03) 0%, rgba(16, 185, 129, 0.03) 100%)',
              borderColor: tokens.borderDefault,
            }}
          >
            <div className="p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2" style={{ color: tokens.textPrimary }}>
                    {proposal.verification.status === 'PENDING' ? 'Ready to Submit?' : 'Resubmit for Review'}
                  </h3>
                  <p className="text-sm mb-4 leading-relaxed" style={{ color: tokens.textSecondary }}>
                    {proposal.verification.status === 'PENDING'
                      ? 'Once submitted, your proposal will be reviewed by an admin. Make sure all required sections are complete.'
                      : 'Admin has requested changes. Review the feedback and resubmit when ready.'}
                  </p>
                  
                  {(() => {
                    const missing = checkPrerequisites();
                    if (missing.length > 0) {
                      return (
                        <div
                          className="p-4 rounded-xl border mb-4"
                          style={{
                            background: isDark ? 'rgba(234, 179, 8, 0.1)' : 'rgba(234, 179, 8, 0.15)',
                            borderColor: isDark ? 'rgba(234, 179, 8, 0.3)' : 'rgba(234, 179, 8, 0.4)',
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: isDark ? 'rgba(234, 179, 8, 0.15)' : 'rgba(234, 179, 8, 0.25)' }}>
                              <AlertCircle className="w-4 h-4" style={{ color: '#d97706' }} />
                            </div>
                            <div>
                              <p className="text-sm font-semibold mb-2" style={{ color: isDark ? '#eab308' : '#b45309' }}>
                                Missing Required Information
                              </p>
                              <ul className="text-xs space-y-1" style={{ color: isDark ? tokens.textSecondary : tokens.textPrimary }}>
                                {missing.map((item, i) => (
                                  <li key={i}>• {item}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div
                        className="p-4 rounded-xl border mb-4"
                        style={{
                          background: isDark ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.15)',
                          borderColor: isDark ? 'rgba(34, 197, 94, 0.3)' : 'rgba(34, 197, 94, 0.4)',
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: isDark ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.25)' }}>
                            <CheckCircle className="w-4 h-4" style={{ color: isDark ? '#22c55e' : '#15803d' }} />
                          </div>
                          <p className="text-sm font-semibold" style={{ color: isDark ? '#22c55e' : '#15803d' }}>
                            All requirements met. Ready to submit!
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                  
                  <Button
                    onClick={handleSubmitForReview}
                    disabled={submitting || checkPrerequisites().length > 0}
                    className="h-11 px-7 font-semibold transition-all duration-200 hover:shadow-md hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed group"
                    style={{
                      background: submitting || checkPrerequisites().length > 0
                        ? 'rgba(156, 163, 175, 0.2)'
                        : tokens.glassBg || 'transparent',
                      border: `1.5px solid ${
                        submitting || checkPrerequisites().length > 0
                          ? 'rgba(156, 163, 175, 0.3)'
                          : tokens.glassBorder || tokens.borderSubtle
                      }`,
                      color: tokens.textPrimary,
                    }}
                  >
                    <Upload className="w-4 h-4 mr-2 transition-transform duration-200 group-hover:translate-y-[-2px] group-active:translate-y-0" />
                    {submitting
                      ? 'Submitting...'
                      : proposal.verification.status === 'PENDING'
                      ? 'Submit for Review'
                      : 'Resubmit for Review'}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        <div className="space-y-6">
          {/* Section 1: Basic Metadata */}
          <EditableSection
            title="Basic Metadata"
            icon={<Settings className="w-5 h-5" />}
            isExpanded={expandedSections.metadata}
            onToggle={() => toggleSection('metadata')}
            isEditable={isEditable}
            isEditing={editingSection === 'metadata'}
            onEditClick={() => setEditingSection('metadata')}
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
                }}
                isDark={isDark}
                onSuccess={() => {
                  setEditingSection(null);
                  onRefresh?.();
                }}
                onCancel={() => setEditingSection(null)}
              />
            }
            displayContent={renderMetadataDisplay(proposal, tokens)}
            isDark={isDark}
            tokens={tokens}
          />

          {/* Section 2: Current Upload */}
          <Card
            className="border overflow-hidden"
            style={{
              background: tokens.surfaceCard,
              borderColor: tokens.borderDefault,
            }}
          >
            <button
              onClick={() => toggleSection('upload')}
              className="w-full flex items-center justify-between px-6 py-4 border-b transition-colors duration-200"
              style={{ borderColor: tokens.borderSubtle }}
            >
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5" style={{ color: tokens.textSecondary }} />
                <div className="text-left">
                  <h3 className="text-sm font-semibold" style={{ color: tokens.textPrimary }}>
                    Current Upload
                  </h3>
                  <p className="text-xs" style={{ color: tokens.textMuted }}>
                    {proposal.currentUpload ? `Status: ${proposal.currentUpload.status}` : 'No upload yet'}
                  </p>
                </div>
              </div>
              {expandedSections.upload ? (
                <ChevronUp className="w-5 h-5" style={{ color: tokens.textMuted }} />
              ) : (
                <ChevronDown className="w-5 h-5" style={{ color: tokens.textMuted }} />
              )}
            </button>

            {expandedSections.upload && (
              <div className="p-6">
                {!proposal.currentUpload ? (
                  <div className="text-center py-8">
                    <Upload className="w-12 h-12 mx-auto mb-3" style={{ color: tokens.textMuted }} />
                    <p className="text-sm mb-4" style={{ color: tokens.textMuted }}>
                      No file uploaded yet
                    </p>
                    <Button
                      onClick={() => setUploadDialogOpen(true)}
                      className="text-white font-semibold transition-all duration-200 hover:shadow-lg hover:scale-[1.01] active:scale-[0.99]"
                      style={{
                        background: 'linear-gradient(135deg, #1a2240 0%, #2a3558 50%, #4e5a7e 100%)',
                      }}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload file
                    </Button>
                  </div>
                ) : (
                  <div
                    className="p-4 rounded-lg border"
                    style={{
                      background: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(26, 34, 64, 0.02)',
                      borderColor: tokens.borderSubtle,
                    }}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label style={{ color: tokens.textSecondary }}>File Name</Label>
                          <p className="text-sm font-medium" style={{ color: tokens.textPrimary }}>
                            {proposal.currentUpload.originalFileName || 'N/A'}
                          </p>
                        </div>
                        <span
                          className="px-3 py-1 text-xs font-medium rounded-full"
                          style={{
                            background: 
                              proposal.currentUpload.status === 'UPLOADED' ? 'rgba(34, 197, 94, 0.1)' :
                              proposal.currentUpload.status === 'UPLOADING' ? 'rgba(234, 179, 8, 0.1)' :
                              proposal.currentUpload.status === 'FAILED' ? 'rgba(239, 68, 68, 0.1)' :
                              'rgba(59, 130, 246, 0.1)',
                            color:
                              proposal.currentUpload.status === 'UPLOADED' ? '#22c55e' :
                              proposal.currentUpload.status === 'UPLOADING' ? '#eab308' :
                              proposal.currentUpload.status === 'FAILED' ? '#ef4444' :
                              '#3b82f6',
                          }}
                        >
                          {proposal.currentUpload.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label style={{ color: tokens.textSecondary }}>Content Type</Label>
                          <p className="text-sm" style={{ color: tokens.textPrimary }}>
                            {proposal.currentUpload.contentType || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <Label style={{ color: tokens.textSecondary }}>File Size</Label>
                          <p className="text-sm" style={{ color: tokens.textPrimary }}>
                            {formatFileSize(proposal.currentUpload.sizeBytes)}
                          </p>
                        </div>
                      </div>

                      <div>
                        <Label style={{ color: tokens.textSecondary }}>Last Updated</Label>
                        <p className="text-sm" style={{ color: tokens.textPrimary }}>
                          {formatDate(proposal.currentUpload.updatedAt)}
                        </p>
                      </div>

                      {isEditable && proposal.currentUpload.status !== 'UPLOADING' && (
                        <div className="pt-3 border-t" style={{ borderColor: tokens.borderSubtle }}>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setUploadDialogOpen(true)}
                            className="w-full font-semibold transition-all duration-200 hover:shadow-md hover:scale-[1.01] active:scale-[0.99]"
                            style={{
                              background: tokens.glassBg || 'transparent',
                              border: `1.5px solid ${tokens.glassBorder || tokens.borderSubtle}`,
                              color: tokens.textPrimary,
                            }}
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Replace file
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Section: Pricing */}
          {pricingData && (
            <Card
              className="border overflow-hidden transition-shadow duration-200 hover:shadow-md"
              style={{
                background: isDark
                  ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.04) 0%, rgba(16, 185, 129, 0.04) 100%)'
                  : 'linear-gradient(135deg, rgba(34, 197, 94, 0.02) 0%, rgba(16, 185, 129, 0.02) 100%)',
                borderColor: tokens.borderDefault,
              }}
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center transition-transform duration-200"
                      style={{
                        background: isDark 
                          ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(16, 185, 129, 0.15) 100%)'
                          : 'linear-gradient(135deg, rgba(34, 197, 94, 0.12) 0%, rgba(16, 185, 129, 0.12) 100%)',
                        border: `2px solid rgba(34, 197, 94, 0.2)`,
                      }}
                    >
                      <DollarSign className="w-6 h-6" style={{ color: '#22c55e' }} />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold" style={{ color: tokens.textPrimary }}>
                        Pricing Management
                      </h3>
                      <p className="text-xs mt-1" style={{ color: tokens.textMuted }}>
                        {pricingData.isPaid ? `${pricingData.price} ${pricingData.currency}` : 'Free Dataset'}
                      </p>
                    </div>
                  </div>
                  <span
                    className="px-4 py-2 rounded-full text-xs font-semibold transition-transform duration-200 hover:scale-105"
                    style={{
                      background: PRICING_STATUS_CONFIG[pricingData.status]?.bgColor || '#f3f4f6',
                      color: PRICING_STATUS_CONFIG[pricingData.status]?.color || '#6b7280',
                      border: `1.5px solid ${
                        PRICING_STATUS_CONFIG[pricingData.status]?.color 
                          ? PRICING_STATUS_CONFIG[pricingData.status]?.color + '4d'
                          : 'rgba(107, 114, 128, 0.3)'
                      }`,
                    }}
                  >
                    <span className="mr-1.5">{PRICING_STATUS_CONFIG[pricingData.status]?.icon}</span>
                    {PRICING_STATUS_CONFIG[pricingData.status]?.label || pricingData.status}
                  </span>
                </div>

                {/* Content */}
                <div className="space-y-4 sm:space-y-5">
                  {/* Price Information */}
                  <div
                    className="p-4 sm:p-5 rounded-xl border transition-all duration-200"
                    style={{
                      background: isDark 
                        ? 'rgba(255, 255, 255, 0.03)'
                        : 'rgba(26, 34, 64, 0.02)',
                      borderColor: tokens.borderSubtle,
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <Label style={{ color: tokens.textSecondary }} className="text-xs">
                          Price Type
                        </Label>
                        <p className="text-sm font-medium mt-2" style={{ color: tokens.textPrimary }}>
                          {pricingData.isPaid ? 'Paid Dataset' : 'Free Dataset'}
                        </p>
                      </div>
                      {pricingData.isPaid && (
                        <div className="text-right">
                          <Label style={{ color: tokens.textSecondary }} className="text-xs">
                            Amount
                          </Label>
                          <p 
                            className="text-2xl font-bold mt-2 tracking-tight"
                            style={{ color: '#22c55e' }}
                          >
                            {pricingData.currency === 'USD' && '$'}
                            {pricingData.currency === 'INR' && '₹'}
                            {pricingData.currency === 'EUR' && '€'}
                            {pricingData.currency === 'GBP' && '£'}
                            {pricingData.price}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Admin Feedback */}
                  {pricingData.status === 'CHANGES_REQUESTED' && (
                    <div
                      className="p-4 sm:p-5 rounded-xl border-l-4 transition-all duration-200"
                      style={{
                        background: isDark 
                          ? 'rgba(239, 68, 68, 0.08)'
                          : 'rgba(239, 68, 68, 0.12)',
                        borderColor: '#ef4444',
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <AlertCircle 
                          className="w-5 h-5 flex-shrink-0 mt-0.5" 
                          style={{ color: '#ef4444' }} 
                        />
                        <div>
                          <p className="text-sm font-semibold mb-1" style={{ color: '#ef4444' }}>
                            Admin Feedback Required
                          </p>
                          <p className="text-sm leading-relaxed" style={{ color: tokens.textSecondary }}>
                            {pricingData.rejectionReason || 'Please review and adjust the pricing based on admin feedback.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Status Message */}
                  <div
                    className="p-3 sm:p-4 rounded-lg border-l-4 transition-all duration-200"
                    style={{
                      background: isDark
                        ? 'rgba(59, 130, 246, 0.08)'
                        : 'rgba(59, 130, 246, 0.12)',
                      borderColor: '#3b82f6',
                    }}
                  >
                    <p className="text-xs sm:text-sm leading-relaxed" style={{ color: tokens.textSecondary }}>
                      {pricingData.status === 'DRAFT' && '💾 Your pricing is saved as draft. Review and submit it when ready.'}
                      {pricingData.status === 'SUBMITTED' && '📤 Your pricing is submitted and under admin review.'}
                      {pricingData.status === 'CHANGES_REQUESTED' && '✏️ Admin has requested changes. Make edits and resubmit.'}
                      {pricingData.status === 'RESUBMITTED' && '📤 Your updated pricing is under review.'}
                      {pricingData.status === 'UNDER_REVIEW' && '👀 Your pricing is being reviewed by admin.'}
                      {pricingData.status === 'ACTIVE' && '✅ Your pricing is active and live.'}
                      {pricingData.status === 'REJECTED' && '❌ Your pricing was rejected. Edit and resubmit.'}
                      {pricingData.status === 'INACTIVE' && '🔒 Your pricing is currently inactive.'}
                    </p>
                  </div>

                  {/* Action Button */}
                  {(pricingData.status === 'DRAFT' || pricingData.status === 'CHANGES_REQUESTED' || pricingData.status === 'REJECTED') && (
                    <div className="pt-2">
                      <Button
                        onClick={() => setShowPricingDialog(true)}
                        className="w-full font-semibold transition-all duration-200 hover:shadow-md hover:scale-[1.01] active:scale-[0.99]"
                        style={{ 
                          background: tokens.glassBg || 'transparent',
                          border: `1.5px solid ${
                            pricingData.status === 'CHANGES_REQUESTED'
                              ? 'rgba(239, 68, 68, 0.5)'
                              : tokens.glassBorder || tokens.borderSubtle
                          }`,
                          color: tokens.textPrimary,
                        }}
                      >
                        <DollarSign className="w-4 h-4 mr-2" />
                        {pricingData.status === 'CHANGES_REQUESTED' ? 'Update & Resubmit Pricing' : 'Edit Pricing'}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Section 3: About Dataset */}
          <EditableSection
            title="About Dataset"
            icon={<FileText className="w-5 h-5" />}
            isExpanded={expandedSections.about}
            onToggle={() => toggleSection('about')}
            isEditable={isEditable}
            isEditing={editingSection === 'about'}
            onEditClick={() => setEditingSection('about')}
            isEmpty={!proposal.aboutDatasetInfo}
            emptyIcon={<AlertCircle className="w-12 h-12" />}
            emptyMessage="About information not provided yet"
            emptyActionLabel="Add About Information"
            editContent={
              <AboutDatasetForm
                datasetId={proposal.dataset.id}
                initialData={proposal.aboutDatasetInfo || undefined}
                isDark={isDark}
                onSuccess={() => {
                  setEditingSection(null);
                  onRefresh?.();
                }}
                onCancel={() => setEditingSection(null)}
              />
            }
            displayContent={proposal.aboutDatasetInfo ? renderAboutDisplay(proposal.aboutDatasetInfo, tokens, formatDate) : null}
            isDark={isDark}
            tokens={tokens}
          />

          {/* Section 4: Data Format */}
          <EditableSection
            title="Data Format & Structure"
            icon={<FileCode className="w-5 h-5" />}
            isExpanded={expandedSections.format}
            onToggle={() => toggleSection('format')}
            isEditable={isEditable}
            isEditing={editingSection === 'format'}
            onEditClick={() => setEditingSection('format')}
            isEmpty={!proposal.dataFormatInfo}
            emptyIcon={<FileCode className="w-12 h-12" />}
            emptyMessage="Data format information not provided yet"
            emptyActionLabel="Add Format Information"
            editContent={
              <DataFormatForm
                datasetId={proposal.dataset.id}
                initialData={proposal.dataFormatInfo || undefined}
                isDark={isDark}
                onSuccess={() => {
                  setEditingSection(null);
                  onRefresh?.();
                }}
                onCancel={() => setEditingSection(null)}
              />
            }
            displayContent={proposal.dataFormatInfo ? renderDataFormatDisplay(proposal.dataFormatInfo, tokens, formatDate) : null}
            isDark={isDark}
            tokens={tokens}
          />

          {/* Section 5: Features */}
          <EditableSection
            title="Features / Columns"
            subtitle={`${proposal.features?.length || 0} features defined`}
            icon={<Database className="w-5 h-5" />}
            isExpanded={expandedSections.features}
            onToggle={() => toggleSection('features')}
            isEditable={isEditable}
            isEditing={editingSection === 'features'}
            onEditClick={() => setEditingSection('features')}
            isEmpty={!proposal.features || proposal.features.length === 0}
            emptyIcon={<Database className="w-12 h-12" />}
            emptyMessage="No features defined yet"
            emptyActionLabel="Define Features"
            editContent={
              <FeaturesForm
                datasetId={proposal.dataset.id}
                initialData={proposal.features || []}
                isDark={isDark}
                onSuccess={() => {
                  setEditingSection(null);
                  onRefresh?.();
                }}
                onCancel={() => setEditingSection(null)}
              />
            }
            displayContent={proposal.features && proposal.features.length > 0 ? renderFeaturesDisplay(proposal.features, tokens, isDark) : null}
            isDark={isDark}
            tokens={tokens}
          />

          {/* Section 6: Secondary Categories */}
          <EditableSection
            title="Secondary Categories"
            icon={<Settings className="w-5 h-5" />}
            isExpanded={expandedSections.categories}
            onToggle={() => toggleSection('categories')}
            isEditable={isEditable}
            isEditing={editingSection === 'categories'}
            onEditClick={() => setEditingSection('categories')}
            isEmpty={!proposal.secondaryCategories || proposal.secondaryCategories.length === 0}
            emptyIcon={<Settings className="w-12 h-12" />}
            emptyMessage="No secondary categories defined yet"
            emptyActionLabel="Add Categories"
            editContent={
              <SecondaryCategoriesForm
                datasetId={proposal.dataset.id}
                initialCategories={(proposal.secondaryCategories?.map(c => c.id)) || []}
                isDark={isDark}
                onSuccess={() => {
                  setEditingSection(null);
                  onRefresh?.();
                }}
                onCancel={() => setEditingSection(null)}
              />
            }
            displayContent={proposal.secondaryCategories && proposal.secondaryCategories.length > 0 ? renderCategoriesDisplay(proposal.secondaryCategories.map(c => c.id), tokens, isDark) : null}
            isDark={isDark}
            tokens={tokens}
          />
        </div>
      </div>

      {/* Upload Dialog */}
      <DatasetUploadFlow
        isOpen={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        datasetId={proposal.dataset.id}
        isDark={isDark}
        onUploadComplete={() => {
          setUploadDialogOpen(false);
          onRefresh?.();
        }}
      />

      {/* Submit Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <Card
            className="w-full max-w-md shadow-xl border rounded-lg"
            style={{
              background: isDark ? 'rgba(26, 34, 64, 0.95)' : 'rgba(255, 255, 255, 0.95)',
              borderColor: tokens.borderDefault,
              backdropFilter: isDark ? 'blur(12px)' : 'none',
              WebkitBackdropFilter: isDark ? 'blur(12px)' : 'none',
            }}
          >
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="w-5 h-5" style={{ color: '#f59e0b' }} />
                <h3 className="text-lg font-semibold" style={{ color: tokens.textPrimary }}>
                  {proposal.verification.status === 'PENDING' ? 'Submit Proposal for Review?' : 'Resubmit Proposal?'}
                </h3>
              </div>

              <div className="space-y-3 mb-6">
                <p style={{ color: tokens.textSecondary }}>
                  {proposal.verification.status === 'PENDING'
                    ? 'Once submitted, your proposal will be sent to the admin review queue. You can make edits if the admin requests changes.'
                    : 'You are resubmitting your proposal after addressing the admin\'s feedback.'}
                </p>

                <div
                  className="rounded-lg p-3 space-y-2"
                  style={{
                    background: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
                    borderLeft: '3px solid #3b82f6',
                  }}
                >
                  <p className="text-sm font-medium" style={{ color: tokens.textSecondary }}>
                    Your submission includes:
                  </p>
                  <ul className="text-xs space-y-1" style={{ color: tokens.textMuted }}>
                    <li>• Dataset Title: <span style={{ color: tokens.textPrimary }} className="font-medium">{proposal.dataset.title}</span></li>
                    <li>• File: <span style={{ color: tokens.textPrimary }} className="font-medium">{proposal.currentUpload?.originalFileName || 'Uploaded'}</span></li>
                    <li>• Format: <span style={{ color: tokens.textPrimary }} className="font-medium">{proposal.dataFormatInfo?.fileFormat || 'Defined'}</span></li>
                    <li>• Features: <span style={{ color: tokens.textPrimary }} className="font-medium">{proposal.features?.length || 0} column{proposal.features?.length !== 1 ? 's' : ''}</span></li>
                    {pricingData && pricingData.status === 'DRAFT' && (
                      <li>• Pricing: <span style={{ color: tokens.textPrimary }} className="font-medium">{pricingData.isPaid ? `${pricingData.price} ${pricingData.currency}` : 'Free'}</span></li>
                    )}
                  </ul>
                </div>

                {pricingData && pricingData.status === 'DRAFT' && (
                  <div
                    className="rounded-lg p-3 border-l-4"
                    style={{
                      background: isDark ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.08)',
                      borderColor: '#22c55e',
                    }}
                  >
                    <p className="text-xs font-semibold mb-1" style={{ color: '#22c55e' }}>
                      ✓ Pricing will also be submitted
                    </p>
                    <p className="text-xs leading-relaxed" style={{ color: tokens.textMuted }}>
                      Your pricing is in draft status. It will be submitted together with your proposal for admin review.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                    onClick={() => setShowConfirmModal(false)}
                    disabled={submitting}
                    className="flex-1 h-10 font-semibold transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
                    style={{
                      background: tokens.glassBg || 'transparent',
                      border: `1.5px solid ${tokens.inputBorder}`,
                      color: tokens.textPrimary,
                    }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmSubmit}
                  disabled={submitting}
                  className="flex-1 h-10 font-semibold transition-all duration-200 hover:shadow-md hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                  style={{
                    background: submitting
                      ? 'rgba(156, 163, 175, 0.2)'
                      : tokens.glassBg || 'transparent',
                    border: `1.5px solid ${
                      submitting
                        ? 'rgba(156, 163, 175, 0.3)'
                        : tokens.glassBorder || tokens.borderSubtle
                    }`,
                    color: tokens.textPrimary,
                  }}
                >
                  {submitting ? 'Submitting...' : 'Confirm & Submit'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Pricing Edit Dialog */}
      {pricingData && (
        <PricingEditDialog
          isOpen={showPricingDialog}
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

