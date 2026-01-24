'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/shared';
import { useSupplierTokens } from '@/hooks/useSupplierTokens';
import { getDatasetDetails } from '@/lib/api/datasets';
import { 
  PublishConfirmDialog,
  ChangeVisibilityDialog,
  PricingChangeRequestDialog,
  ArchiveConfirmDialog,
  DownloadButton,
} from './actions';
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
  Loader2,
  MessageCircle,
} from 'lucide-react';
import type { DatasetDetailsResponse } from '@/types/dataset.types';

interface MyDatasetDetailProps {
  datasetId: string;
  isDark?: boolean;
}

type VerificationStatusType = 'PENDING' | 'SUBMITTED' | 'CHANGES_REQUESTED' | 'RESUBMITTED' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED';

const VERIFICATION_STATUS_CONFIG: Record<VerificationStatusType, {
  label: string;
  description: string;
  color: string;
  icon: any;
}> = {
  PENDING: {
    label: 'Pending Submission',
    description: 'This dataset is still in draft mode and has not been submitted for review.',
    color: '#f59e0b',
    icon: Clock,
  },
  SUBMITTED: {
    label: 'Submitted for Review',
    description: 'Your dataset has been submitted and is waiting for the review process to begin.',
    color: '#3b82f6',
    icon: FileText,
  },
  CHANGES_REQUESTED: {
    label: 'Changes Requested',
    description: 'The reviewer has requested changes to your dataset. Please review the feedback below.',
    color: '#ef4444',
    icon: AlertCircle,
  },
  RESUBMITTED: {
    label: 'Resubmitted for Review',
    description: 'Your revised dataset has been resubmitted and is awaiting review.',
    color: '#8b5cf6',
    icon: Clock,
  },
  UNDER_REVIEW: {
    label: 'Under Review',
    description: 'Your dataset is currently being reviewed by our verification team.',
    color: '#f59e0b',
    icon: Clock,
  },
  VERIFIED: {
    label: 'Verified',
    description: 'Your dataset has been verified and approved. It is ready for publication.',
    color: '#22c55e',
    icon: CheckCircle,
  },
  REJECTED: {
    label: 'Rejected',
    description: 'Your dataset submission has been rejected. Please review the feedback below.',
    color: '#ef4444',
    icon: XCircle,
  },
};

const DATASET_STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  VERIFIED: { label: 'Verified', color: '#22c55e', bgColor: 'rgba(34, 197, 94, 0.15)' },
  PUBLISHED: { label: 'Published', color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.15)' },
  ARCHIVED: { label: 'Archived', color: '#6b7280', bgColor: 'rgba(107, 114, 128, 0.15)' },
  REJECTED: { label: 'Rejected', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.15)' },
};

const VISIBILITY_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  PUBLIC: { label: 'Public', icon: Eye, color: '#22c55e' },
  PRIVATE: { label: 'Private', icon: Lock, color: '#ef4444' },
  UNLISTED: { label: 'Unlisted', icon: EyeOff, color: '#f59e0b' },
};

// Helper component for info items
function InfoItem({ 
  icon: Icon, 
  label, 
  value, 
  tokens,
  valueColor,
}: { 
  icon: any; 
  label: string; 
  value: React.ReactNode; 
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
        <p className="text-xs mb-0.5" style={{ color: tokens.textMuted }}>{label}</p>
        <p className="text-sm font-medium" style={{ color: valueColor || tokens.textPrimary }}>
          {value || 'N/A'}
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
  icon: any; 
  title: string; 
  badge?: React.ReactNode;
  tokens: ReturnType<typeof useSupplierTokens>;
}) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-2">
        <Icon className="w-5 h-5" style={{ color: tokens.textSecondary }} />
        <h3 className="text-base font-semibold" style={{ color: tokens.textPrimary }}>{title}</h3>
      </div>
      {badge}
    </div>
  );
}

export function MyDatasetDetail({ datasetId }: MyDatasetDetailProps) {
  const router = useRouter();
  const tokens = useSupplierTokens();

  const [datasetData, setDatasetData] = useState<DatasetDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Dialog states
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [showVisibilityDialog, setShowVisibilityDialog] = useState(false);
  const [showPricingDialog, setShowPricingDialog] = useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);

  const fetchDataset = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDatasetDetails(datasetId);
      setDatasetData(data);
    } catch (err: any) {
      console.error('Failed to fetch dataset:', err);
      setError(err.message || 'Failed to load dataset');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDataset();
  }, [datasetId]);

  // Loading state
  if (loading) {
    return (
      <div className="h-full overflow-auto">
        <div className="max-w-[1200px] mx-auto px-8 py-7">
          <div className="flex items-center justify-center py-32">
            <div className="flex flex-col items-center gap-4">
              <Loader2 
                className="w-10 h-10 animate-spin" 
                style={{ color: tokens.textSecondary }} 
              />
              <p className="text-sm" style={{ color: tokens.textMuted }}>
                Loading dataset details...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !datasetData) {
    return (
      <div className="h-full overflow-auto">
        <div className="max-w-[1200px] mx-auto px-8 py-7">
          <div className="flex flex-col items-center justify-center py-32">
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: tokens.errorBg }}
            >
              <AlertCircle className="w-8 h-8" style={{ color: tokens.errorText }} />
            </div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: tokens.textPrimary }}>
              Failed to load dataset
            </h3>
            <p className="text-sm mb-6 text-center max-w-md" style={{ color: tokens.textSecondary }}>
              {error || 'Dataset not found or you may not have permission to view it.'}
            </p>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => fetchDataset()}
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </Button>
              <Button onClick={() => router.push('/dashboard/my-datasets')}>
                Back to My Datasets
              </Button>
            </div>
          </div>
        </div>
      </div>
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
    source 
  } = datasetData;
  
  // Status determination
  const verificationStatus = (verification?.status || 'VERIFIED') as VerificationStatusType;
  const verificationConfig = VERIFICATION_STATUS_CONFIG[verificationStatus];
  const datasetStatusConfig = DATASET_STATUS_CONFIG[dataset.status] || DATASET_STATUS_CONFIG.VERIFIED;
  const visibilityConfig = VISIBILITY_CONFIG[dataset.visibility || 'PUBLIC'];
  
  if (!verificationConfig) {
    return (
      <div className="h-full overflow-auto">
        <div className="max-w-[1200px] mx-auto px-8 py-7">
          <div className="text-center py-20">
            <p style={{ color: tokens.errorText }}>Error: Invalid verification status</p>
          </div>
        </div>
      </div>
    );
  }
  
  const VerificationIcon = verificationConfig.icon;
  const VisibilityIcon = visibilityConfig?.icon || Eye;

  // State flags
  const isVerified = dataset.status === 'VERIFIED';
  const isPublished = dataset.status === 'PUBLISHED';
  const isArchived = dataset.status === 'ARCHIVED';

  // Format helpers
  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const formatDateTime = (dateStr: string) => new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const formatFileSize = (bytes: string | null) => {
    if (!bytes) return 'N/A';
    const size = parseInt(bytes);
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(2)} MB`;
    return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-[1200px] mx-auto px-8 py-7">
        {/* Header Navigation */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard/my-datasets')}
            className="gap-2 -ml-3 mb-6 transition-all duration-300 hover:bg-transparent hover:translate-x-[-4px] text-sm"
            style={{ color: tokens.textSecondary }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to My Datasets
          </Button>
          
          {/* Page Title & Status Row */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 mb-3">
                <span 
                  className="text-xs font-mono px-2.5 py-1.5 rounded-md"
                  style={{ 
                    background: tokens.infoBg, 
                    color: tokens.textSecondary,
                    fontWeight: '500',
                  }}
                >
                  {dataset.datasetUniqueId}
                </span>
                {/* Status Badges */}
                <span 
                  className="text-xs font-medium px-3 py-1.5 rounded-full"
                  style={{ 
                    background: datasetStatusConfig.bgColor,
                    color: datasetStatusConfig.color,
                  }}
                >
                  {datasetStatusConfig.label}
                </span>
              </div>
              <h1 
                className="text-3xl font-bold mb-2 leading-tight"
                style={{ color: tokens.textPrimary }}
              >
                {dataset.title}
              </h1>
              <p className="text-sm" style={{ color: tokens.textMuted }}>
                Last updated {formatDateTime(dataset.updatedAt)}
              </p>
            </div>
            
            {/* Quick Actions */}
            {publishedUpload && (
              <div className="flex-shrink-0">
                <DownloadButton
                  datasetId={dataset.id}
                  fileName={publishedUpload.originalFileName}
                  variant="outline"
                  size="sm"
                />
              </div>
            )}
          </div>

          {/* Quick Actions Bar */}
          {(isVerified || isPublished || isArchived) && (
            <div className="mt-6 pt-6 border-t" style={{ borderColor: tokens.borderSubtle }}>
              <p className="text-xs mb-3 font-medium uppercase tracking-wide" style={{ color: tokens.textMuted }}>Quick Actions</p>
              <div className="flex flex-wrap gap-2">
                {/* Publish Button - only for verified but not published */}
                {isVerified && !isPublished && !isArchived && (
                  <Button
                    onClick={() => setShowPublishDialog(true)}
                    className="flex-1 min-w-[100px] gap-2 text-white transition-all duration-300 hover:shadow-lg hover:scale-[1.01] active:scale-[0.98] h-10 text-sm font-medium"
                    style={{
                      background: 'linear-gradient(135deg, #1a2240 0%, #2a3558 100%)',
                    }}
                  >
                    <Upload className="w-4 h-4" />
                    Publish Dataset
                  </Button>
                )}

                {/* Visibility Button */}
                <Button
                  onClick={() => setShowVisibilityDialog(true)}
                  disabled={!isVerified || isArchived}
                  variant="outline"
                  className="flex-1 min-w-[100px] gap-2 justify-center transition-all duration-300 hover:shadow-md hover:scale-[1.01] h-10 text-sm font-medium"
                  style={{
                    background: tokens.glassBg,
                    border: `1px solid ${tokens.glassBorder}`,
                    color: tokens.textPrimary,
                    opacity: (!isVerified || isArchived) ? 0.5 : 1,
                  }}
                >
                  <Eye className="w-4 h-4" />
                  <span className="hidden sm:inline">Visibility</span>
                </Button>

                {/* Pricing Button */}
                <Button
                  onClick={() => setShowPricingDialog(true)}
                  disabled={!isVerified || isArchived}
                  variant="outline"
                  className="flex-1 min-w-[100px] gap-2 justify-center transition-all duration-300 hover:shadow-md hover:scale-[1.01] h-10 text-sm font-medium"
                  style={{
                    background: tokens.glassBg,
                    border: `1px solid ${tokens.glassBorder}`,
                    color: tokens.textPrimary,
                    opacity: (!isVerified || isArchived) ? 0.5 : 1,
                  }}
                >
                  <DollarSign className="w-4 h-4" />
                  <span className="hidden sm:inline">Pricing</span>
                </Button>

                {/* Archive Button */}
                <Button
                  onClick={() => setShowArchiveDialog(true)}
                  disabled={!isPublished}
                  variant="outline"
                  className="flex-1 min-w-[100px] gap-2 justify-center transition-all duration-300 hover:shadow-md hover:scale-[1.01] h-10 text-sm font-medium"
                  style={{ 
                    background: tokens.glassBg,
                    border: `1px solid ${isArchived ? tokens.successBorder : tokens.errorBorder}`,
                    color: isArchived ? '#22c55e' : tokens.errorText,
                    opacity: !isPublished ? 0.5 : 1,
                    cursor: !isPublished ? 'not-allowed' : 'pointer',
                  }}
                  title={!isPublished ? "Archive is only available after publishing" : ""}
                >
                  <Archive className="w-4 h-4" />
                  <span className="hidden sm:inline">{isArchived ? 'Unarchive' : 'Archive'}</span>
                </Button>

                {/* Download Button */}
                {publishedUpload ? (
                  <DownloadButton
                    datasetId={dataset.id}
                    fileName={publishedUpload.originalFileName}
                    variant="outline"
                    size="sm"
                    className="flex-1 min-w-[100px] gap-2 justify-center h-10 text-sm font-medium"
                  />
                ) : (
                  <Button
                    disabled
                    variant="outline"
                    className="flex-1 min-w-[100px] gap-2 justify-center h-10 text-sm font-medium"
                    style={{
                      background: tokens.glassBg,
                      border: `1px solid ${tokens.glassBorder}`,
                      color: tokens.textMuted,
                      opacity: 0.5,
                      cursor: 'not-allowed',
                    }}
                    title="Download will be available once a file is published"
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Download</span>
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Archived Notice */}
            {isArchived && (
              <GlassCard className="p-5">
                <div
                  className="flex items-center gap-3 p-4 rounded-xl"
                  style={{
                    background: tokens.errorBg,
                    border: `1px solid ${tokens.errorBorder}`,
                  }}
                >
                  <Archive className="w-5 h-5 flex-shrink-0" style={{ color: tokens.errorText }} />
                  <div>
                    <p className="text-sm font-medium" style={{ color: tokens.textPrimary }}>
                      This dataset is archived
                    </p>
                    <p className="text-xs" style={{ color: tokens.textSecondary }}>
                      It is no longer visible on the marketplace.
                      {dataset.archivedAt && ` Archived on ${formatDate(dataset.archivedAt)}.`}
                    </p>
                  </div>
                </div>
              </GlassCard>
            )}

            {/* About Dataset */}
            {aboutDatasetInfo && (
              <GlassCard className="p-5">
                <SectionTitle icon={Info} title="About Dataset" tokens={tokens} />
                
                <div className="space-y-5">
                  {aboutDatasetInfo.overview && (
                    <div>
                      <h4 className="text-sm font-medium mb-2" style={{ color: tokens.textSecondary }}>
                        Overview
                      </h4>
                      <p className="text-sm leading-relaxed" style={{ color: tokens.textPrimary }}>
                        {aboutDatasetInfo.overview}
                      </p>
                    </div>
                  )}

                  {aboutDatasetInfo.description && (
                    <div>
                      <h4 className="text-sm font-medium mb-2" style={{ color: tokens.textSecondary }}>
                        Description
                      </h4>
                      <p className="text-sm leading-relaxed" style={{ color: tokens.textPrimary }}>
                        {aboutDatasetInfo.description}
                      </p>
                    </div>
                  )}

                  {aboutDatasetInfo.useCases && (
                    <div>
                      <h4 className="text-sm font-medium mb-2" style={{ color: tokens.textSecondary }}>
                        Use Cases
                      </h4>
                      <p className="text-sm leading-relaxed" style={{ color: tokens.textPrimary }}>
                        {aboutDatasetInfo.useCases}
                      </p>
                    </div>
                  )}

                  {aboutDatasetInfo.dataQuality && (
                    <div>
                      <h4 className="text-sm font-medium mb-2" style={{ color: tokens.textSecondary }}>
                        Data Quality
                      </h4>
                      <p className="text-sm leading-relaxed" style={{ color: tokens.textPrimary }}>
                        {aboutDatasetInfo.dataQuality}
                      </p>
                    </div>
                  )}

                  {aboutDatasetInfo.methodology && (
                    <div>
                      <h4 className="text-sm font-medium mb-2" style={{ color: tokens.textSecondary }}>
                        Methodology
                      </h4>
                      <p className="text-sm leading-relaxed" style={{ color: tokens.textPrimary }}>
                        {aboutDatasetInfo.methodology}
                      </p>
                    </div>
                  )}

                  {aboutDatasetInfo.limitations && (
                    <div>
                      <h4 className="text-sm font-medium mb-2" style={{ color: tokens.textSecondary }}>
                        Limitations
                      </h4>
                      <p className="text-sm leading-relaxed" style={{ color: tokens.textPrimary }}>
                        {aboutDatasetInfo.limitations}
                      </p>
                    </div>
                  )}

                  {/* Updated timestamp */}
                  {aboutDatasetInfo.updatedAt && (
                    <p className="text-xs pt-2 border-t" style={{ color: tokens.textMuted, borderColor: tokens.borderSubtle }}>
                      Last updated: {formatDateTime(aboutDatasetInfo.updatedAt)}
                    </p>
                  )}
                </div>
              </GlassCard>
            )}

            {/* Data Format Information */}
            {dataFormatInfo && (
              <GlassCard className="p-5">
                <SectionTitle icon={FileCode} title="Data Format" tokens={tokens} />
                
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
                    value={dataFormatInfo.compressionType || 'None'} 
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
              <GlassCard className="p-5">
                <SectionTitle 
                  icon={Table2} 
                  title="Features / Schema" 
                  badge={
                    <span 
                      className="text-xs px-2 py-1 rounded-full"
                      style={{ background: tokens.infoBg, color: tokens.textSecondary }}
                    >
                      {features.length} columns
                    </span>
                  }
                  tokens={tokens} 
                />
                
                <div className="overflow-x-auto -mx-5 px-5">
                  <table className="w-full min-w-[500px]">
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${tokens.borderDefault}` }}>
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
                            borderBottom: index < features.length - 1 ? `1px solid ${tokens.borderSubtle}` : 'none',
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
                                color: tokens.textSecondary 
                              }}
                            >
                              {feature.dataType}
                            </span>
                          </td>
                          <td 
                            className="text-sm py-3 px-3" 
                            style={{ color: tokens.textSecondary }}
                          >
                            {feature.description || '—'}
                          </td>
                          <td className="text-center py-3 px-3 last:pr-0">
                            {feature.isNullable ? (
                              <span 
                                className="text-xs px-2 py-0.5 rounded"
                                style={{ background: tokens.warningBg, color: '#f59e0b' }}
                              >
                                Yes
                              </span>
                            ) : (
                              <span 
                                className="text-xs px-2 py-0.5 rounded"
                                style={{ background: tokens.successBg, color: '#22c55e' }}
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
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Dataset Details Card */}
            <GlassCard className="p-4">
              <SectionTitle icon={Database} title="Dataset Details" tokens={tokens} />
              
              <div className="grid grid-cols-2 gap-4">
                <div className="min-w-0">
                  <p className="text-xs" style={{ color: tokens.textMuted }}>License</p>
                  <p className="text-sm font-medium mt-1" style={{ color: tokens.textPrimary }}>
                    {dataset.license || 'N/A'}
                  </p>
                </div>
                
                <div className="min-w-0">
                  <p className="text-xs" style={{ color: tokens.textMuted }}>Visibility</p>
                  <p className="text-sm font-medium mt-1" style={{ color: visibilityConfig?.color || tokens.textPrimary }}>
                    {visibilityConfig?.label || dataset.visibility}
                  </p>
                </div>
                
                <div className="min-w-0">
                  <p className="text-xs" style={{ color: tokens.textMuted }}>Pricing</p>
                  <p className="text-sm font-medium mt-1" style={{ color: dataset.isPaid ? '#f59e0b' : '#22c55e' }}>
                    {dataset.isPaid ? `${dataset.currency} ${dataset.price}` : 'Free'}
                  </p>
                </div>

                <div className="min-w-0">
                  <p className="text-xs" style={{ color: tokens.textMuted }}>Status</p>
                  <p className="text-sm font-medium mt-1" style={{ color: datasetStatusConfig.color }}>
                    {datasetStatusConfig.label}
                  </p>
                </div>
              </div>
            </GlassCard>

            {/* Categories Card */}
            {(primaryCategory || secondaryCategories.length > 0) && (
              <GlassCard className="p-4">
                <SectionTitle icon={Layers} title="Categories" tokens={tokens} />
                
                <div className="space-y-4">
                  {primaryCategory && (
                    <div>
                      <p className="text-xs mb-2" style={{ color: tokens.textMuted }}>Primary</p>
                      <span 
                        className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg"
                        style={{ 
                          background: tokens.successBg, 
                          color: tokens.textPrimary,
                          border: `1px solid ${tokens.successBorder}`,
                        }}
                      >
                        <BadgeCheck className="w-3.5 h-3.5" style={{ color: '#22c55e' }} />
                        {primaryCategory.name}
                      </span>
                    </div>
                  )}
                  
                  {secondaryCategories.length > 0 && (
                    <div>
                      <p className="text-xs mb-2" style={{ color: tokens.textMuted }}>Secondary</p>
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
              <GlassCard className="p-4">
                <SectionTitle icon={Globe} title="Data Source" tokens={tokens} />
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium" style={{ color: tokens.textPrimary }}>
                      {source.name}
                    </span>
                    {source.isVerified && (
                      <BadgeCheck className="w-4 h-4" style={{ color: '#22c55e' }} />
                    )}
                  </div>
                  
                  {source.description && (
                    <p className="text-xs" style={{ color: tokens.textSecondary }}>
                      {source.description}
                    </p>
                  )}
                  
                  {source.websiteUrl && (
                    <a 
                      href={source.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs hover:underline"
                      style={{ color: '#3b82f6' }}
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
              <GlassCard className="p-4">
                <SectionTitle icon={Shield} title="Verification" tokens={tokens} />
                
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
                    <div className="pt-2 border-t" style={{ borderColor: tokens.borderSubtle }}>
                      <p className="text-xs font-medium mb-2" style={{ color: tokens.textMuted }}>
                        Reviewer Notes
                      </p>
                      <p className="text-sm leading-relaxed" style={{ color: tokens.textPrimary }}>
                        {verification.notes}
                      </p>
                    </div>
                  )}

                  {/* Rejection Reason */}
                  {verification?.rejectionReason && (
                    <div className="pt-2 border-t" style={{ borderColor: tokens.errorBorder }}>
                      <p className="text-xs font-medium mb-2" style={{ color: tokens.errorText }}>
                        Rejection Reason
                      </p>
                      <p className="text-sm leading-relaxed" style={{ color: tokens.textPrimary }}>
                        {verification.rejectionReason}
                      </p>
                    </div>
                  )}
                </div>
              </GlassCard>
            )}

            {/* Published File Card */}
            {publishedUpload && (
              <GlassCard className="p-4">
                <SectionTitle icon={FileText} title="Published File" tokens={tokens} />
                
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
                
                <div className="mt-4 pt-4 border-t" style={{ borderColor: tokens.borderSubtle }}>
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

            {/* Timeline Card */}
            <GlassCard className="p-4">
              <SectionTitle icon={Calendar} title="Timeline" tokens={tokens} />
              
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span style={{ color: tokens.textMuted }}>Last Updated</span>
                  <span style={{ color: tokens.textPrimary }}>{formatDate(dataset.updatedAt)}</span>
                </div>
                
                {dataset.publishedAt && (
                  <div className="flex items-center justify-between text-sm">
                    <span style={{ color: tokens.textMuted }}>Published</span>
                    <span style={{ color: tokens.textPrimary }}>{formatDate(dataset.publishedAt)}</span>
                  </div>
                )}
                
                {dataset.archivedAt && (
                  <div className="flex items-center justify-between text-sm">
                    <span style={{ color: tokens.textMuted }}>Archived</span>
                    <span style={{ color: tokens.errorText }}>{formatDate(dataset.archivedAt)}</span>
                  </div>
                )}
              </div>
            </GlassCard>
          </div>
        </div>

        {/* Action Dialogs */}
        {isVerified && !isPublished && (
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

        {((isVerified || isPublished) && !isArchived) && (
          <>
            <ChangeVisibilityDialog
              isOpen={showVisibilityDialog}
              onClose={() => setShowVisibilityDialog(false)}
              datasetId={dataset.id}
              currentVisibility={dataset.visibility || 'PUBLIC'}
              onSuccess={fetchDataset}
              isDark={tokens.isDark}
            />

            <PricingChangeRequestDialog
              isOpen={showPricingDialog}
              onClose={() => setShowPricingDialog(false)}
              datasetId={dataset.id}
              datasetTitle={dataset.title}
              currentIsPaid={dataset.isPaid || false}
              currentPrice={dataset.price}
              currentCurrency={dataset.currency}
              onSuccess={fetchDataset}
              isDark={tokens.isDark}
            />
          </>
        )}

        {(isPublished && !isArchived) && (
          <ArchiveConfirmDialog
            isOpen={showArchiveDialog}
            onClose={() => setShowArchiveDialog(false)}
            datasetId={dataset.id}
            datasetTitle={dataset.title}
            onSuccess={fetchDataset}
            isDark={tokens.isDark}
          />
        )}
      </div>
    </div>
  );
}