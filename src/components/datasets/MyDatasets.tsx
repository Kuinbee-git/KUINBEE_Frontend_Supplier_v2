'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DatasetStatusBadge, PublishStatusBadge, StyledSelect } from './shared';
import { getDatasetThemeTokens } from '@/constants/dataset.constants';
import { listMyProposals, listMyDatasets } from '@/lib/api';
import { 
  Database, 
  Search, 
  Filter, 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertCircle,
  Eye,
  Calendar,
  ChevronRight
} from 'lucide-react';
import type { VerificationStatus } from '@/types/dataset-proposal.types';
import type { DatasetStatus, DatasetVisibility } from '@/types/dataset.types';

interface MyDatasetsProps {
  isDark?: boolean;
}

type FilterStatus = 'ALL' | 'SUBMITTED' | 'UNDER_REVIEW' | 'VERIFIED' | 'PUBLISHED' | 'ARCHIVED' | 'REJECTED';
type FilterVisibility = 'ALL' | 'PUBLIC' | 'PRIVATE' | 'UNLISTED';

// Unified dataset item that can come from either API
interface UnifiedDatasetItem {
  id: string;
  datasetUniqueId: string;
  title: string;
  status: DatasetStatus | string;
  verificationStatus?: VerificationStatus | null;
  visibility?: DatasetVisibility | null;
  publishedAt?: string | null;
  updatedAt: string;
  source: 'proposals' | 'datasets'; // Track which API it came from
}

const VERIFICATION_STATUS_DISPLAY: Record<VerificationStatus, { label: string; color: string; icon: any }> = {
  PENDING: { label: 'Pending Review', color: '#f59e0b', icon: Clock },
  SUBMITTED: { label: 'Submitted', color: '#3b82f6', icon: CheckCircle },
  CHANGES_REQUESTED: { label: 'Changes Requested', color: '#ef4444', icon: AlertCircle },
  RESUBMITTED: { label: 'Resubmitted', color: '#8b5cf6', icon: Clock },
  UNDER_REVIEW: { label: 'Under Review', color: '#f59e0b', icon: Clock },
  VERIFIED: { label: 'Verified', color: '#22c55e', icon: CheckCircle },
  REJECTED: { label: 'Rejected', color: '#ef4444', icon: XCircle },
};

export function MyDatasets({ isDark = false }: MyDatasetsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokens = getDatasetThemeTokens(isDark);

  const [datasets, setDatasets] = useState<UnifiedDatasetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('ALL');
  const [visibilityFilter, setVisibilityFilter] = useState<FilterVisibility>('ALL');
  const [showFilters, setShowFilters] = useState(false);

  const fetchDatasets = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const unifiedDatasets: UnifiedDatasetItem[] = [];

      // Determine which API(s) to call based on filters
      const needsProposalsAPI = statusFilter === 'ALL' || 
                                statusFilter === 'SUBMITTED' || 
                                statusFilter === 'UNDER_REVIEW';
      
      const needsDatasetsAPI = statusFilter === 'ALL' || 
                              statusFilter === 'VERIFIED' || 
                              statusFilter === 'PUBLISHED' || 
                              statusFilter === 'ARCHIVED' ||
                              visibilityFilter !== 'ALL';

      // Fetch from dataset-proposals API (SUBMITTED, UNDER_REVIEW)
      if (needsProposalsAPI) {
        const proposalsResponse = await listMyProposals({
          verificationStatus: statusFilter === 'SUBMITTED' ? 'SUBMITTED' : 
                            statusFilter === 'UNDER_REVIEW' ? 'UNDER_REVIEW' : undefined,
          page: 1,
          pageSize: 100,
        });

        // Only include SUBMITTED and UNDER_REVIEW from proposals
        const earlyStageDatasets = proposalsResponse.items
          .filter(item => 
            item.verificationStatus === 'SUBMITTED' || 
            item.verificationStatus === 'UNDER_REVIEW'
          )
          .map(item => ({
            id: item.id,
            datasetUniqueId: item.datasetUniqueId,
            title: item.title,
            status: item.verificationStatus as string,
            verificationStatus: item.verificationStatus,
            visibility: null,
            publishedAt: null,
            updatedAt: item.updatedAt,
            source: 'proposals' as const,
          }));

        unifiedDatasets.push(...earlyStageDatasets);
      }

      // Fetch from datasets API (VERIFIED, PUBLISHED, ARCHIVED)
      if (needsDatasetsAPI) {
        let apiStatus: 'VERIFIED' | 'PUBLISHED' | 'ARCHIVED' | 'REJECTED' | undefined = undefined;
        
        if (statusFilter === 'VERIFIED' || statusFilter === 'PUBLISHED' || 
            statusFilter === 'ARCHIVED' || statusFilter === 'REJECTED') {
          apiStatus = statusFilter;
        }
        
        const datasetsResponse = await listMyDatasets({
          status: apiStatus,
          visibility: visibilityFilter !== 'ALL' ? visibilityFilter : undefined,
          page: 1,
          pageSize: 100,
        });

        const managedDatasets = datasetsResponse.items.map(item => ({
          id: item.id,
          datasetUniqueId: item.datasetUniqueId,
          title: item.title,
          status: item.status,
          verificationStatus: null,
          visibility: item.visibility,
          publishedAt: item.publishedAt,
          updatedAt: item.updatedAt,
          source: 'datasets' as const,
        }));

        unifiedDatasets.push(...managedDatasets);
      }

      // Sort by updatedAt (most recent first)
      unifiedDatasets.sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );

      setDatasets(unifiedDatasets);
    } catch (err: any) {
      console.error('Failed to fetch datasets:', err);
      setError(err.message || 'Failed to load datasets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, [statusFilter, visibilityFilter]);

  // Filter datasets based on search and status
  const filteredDatasets = datasets.filter(dataset => {
    const matchesSearch = dataset.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || dataset.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Stats for quick overview
  const stats = {
    total: filteredDatasets.length,
    submitted: datasets.filter(d => d.verificationStatus === 'SUBMITTED').length,
    underReview: datasets.filter(d => d.verificationStatus === 'UNDER_REVIEW').length,
    verified: datasets.filter(d => d.status === 'VERIFIED').length,
    published: datasets.filter(d => d.status === 'PUBLISHED').length,
    archived: datasets.filter(d => d.status === 'ARCHIVED').length,
    rejected: datasets.filter(d => d.verificationStatus === 'REJECTED' || d.status === 'REJECTED').length,
  };

  const handleViewDataset = (id: string) => {
    router.push(`/dashboard/my-datasets/${id}`);
  };

  if (loading) {
    return (
      <div className="max-w-[1400px] mx-auto p-8">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: tokens.textPrimary }}></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-[1400px] mx-auto p-8">
        <div className="text-center py-20">
          <AlertCircle className="w-16 h-16 mx-auto mb-4" style={{ color: tokens.warningText }} />
          <h3 className="text-xl font-semibold mb-2" style={{ color: tokens.textPrimary }}>
            Failed to load datasets
          </h3>
          <p className="mb-6" style={{ color: tokens.textSecondary }}>
            {error}
          </p>
          <Button onClick={fetchDatasets}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto p-8">
      {/* Header */}
      <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-semibold mb-2" style={{ color: tokens.textPrimary }}>
                My Datasets
              </h1>
              <p style={{ color: tokens.textSecondary }}>
                View and manage your submitted datasets and their verification status
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <Card
              className="p-4"
              style={{
                background: tokens.surfaceCard,
                borderColor: tokens.borderDefault,
              }}
            >
              <div className="text-2xl font-bold mb-1" style={{ color: tokens.textPrimary }}>
                {stats.total}
              </div>
              <div className="text-xs" style={{ color: tokens.textSecondary }}>Total Datasets</div>
            </Card>
            <Card
              className="p-4"
              style={{
                background: tokens.surfaceCard,
                borderColor: tokens.borderDefault,
              }}
            >
              <div className="text-2xl font-bold mb-1" style={{ color: '#3b82f6' }}>
                {stats.submitted}
              </div>
              <div className="text-xs" style={{ color: tokens.textSecondary }}>Submitted</div>
            </Card>
            <Card
              className="p-4"
              style={{
                background: tokens.surfaceCard,
                borderColor: tokens.borderDefault,
              }}
            >
              <div className="text-2xl font-bold mb-1" style={{ color: '#f59e0b' }}>
                {stats.underReview}
              </div>
              <div className="text-xs" style={{ color: tokens.textSecondary }}>Under Review</div>
            </Card>
            <Card
              className="p-4"
              style={{
                background: tokens.surfaceCard,
                borderColor: tokens.borderDefault,
              }}
            >
              <div className="text-2xl font-bold mb-1" style={{ color: '#22c55e' }}>
                {stats.verified}
              </div>
              <div className="text-xs" style={{ color: tokens.textSecondary }}>Verified</div>
            </Card>
            <Card
              className="p-4"
              style={{
                background: tokens.surfaceCard,
                borderColor: tokens.borderDefault,
              }}
            >
              <div className="text-2xl font-bold mb-1" style={{ color: '#10b981' }}>
                {stats.published}
              </div>
              <div className="text-xs" style={{ color: tokens.textSecondary }}>Published</div>
            </Card>
            <Card
              className="p-4"
              style={{
                background: tokens.surfaceCard,
                borderColor: tokens.borderDefault,
              }}
            >
              <div className="text-2xl font-bold mb-1" style={{ color: '#94a3b0' }}>
                {stats.archived}
              </div>
              <div className="text-xs" style={{ color: tokens.textSecondary }}>Archived</div>
            </Card>
          </div>

{/* Search & Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="flex-1 relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200" style={{ color: tokens.textMuted }} />
                <Input
                  placeholder="Search datasets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 transition-all duration-200"
                  style={{
                    background: tokens.inputBg,
                    borderColor: tokens.inputBorder,
                    color: tokens.textPrimary,
                  }}
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2 transition-all duration-200 ease-out whitespace-nowrap"
                style={{
                  borderColor: showFilters ? '#3b82f6' : tokens.borderDefault,
                  color: showFilters ? '#3b82f6' : tokens.textPrimary,
                  background: showFilters ? 'rgba(59, 130, 246, 0.05)' : tokens.inputBg,
                }}
              >
                <Filter className="w-4 h-4" />
                Filters
                {(statusFilter !== 'ALL' || visibilityFilter !== 'ALL') && (
                  <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-blue-500 text-white font-medium">
                    {[statusFilter !== 'ALL' ? 1 : 0, visibilityFilter !== 'ALL' ? 1 : 0].reduce((a, b) => a + b)}
                  </span>
                )}
              </Button>
            </div>

            {/* Filter Panel */}
            {showFilters && (
              <Card
                className="p-4 animate-in fade-in slide-in-from-top-2 duration-300"
                style={{
                  background: tokens.surfaceCard,
                  borderColor: tokens.borderDefault,
                }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Status Filter */}
                  <StyledSelect
                    value={statusFilter}
                    onValueChange={(value) => setStatusFilter(value as FilterStatus)}
                    label="Dataset Status"
                    options={[
                      { label: 'All Statuses', value: 'ALL' },
                      { label: 'Submitted', value: 'SUBMITTED' },
                      { label: 'Under Review', value: 'UNDER_REVIEW' },
                      { label: 'Verified', value: 'VERIFIED' },
                      { label: 'Published', value: 'PUBLISHED' },
                      { label: 'Archived', value: 'ARCHIVED' },
                      { label: 'Rejected', value: 'REJECTED' },
                    ]}
                    isDark={isDark}
                    tokens={tokens}
                  />

                  {/* Visibility Filter */}
                  <StyledSelect
                    value={visibilityFilter}
                    onValueChange={(value) => setVisibilityFilter(value as FilterVisibility)}
                    label={`Visibility (Published only)`}
                    options={[
                      { label: 'All Visibility', value: 'ALL' },
                      { label: 'Public', value: 'PUBLIC' },
                      { label: 'Private', value: 'PRIVATE' },
                      { label: 'Unlisted', value: 'UNLISTED' },
                    ]}
                    isDark={isDark}
                    tokens={tokens}
                  />
                </div>

                {/* Clear Filters */}
                {(statusFilter !== 'ALL' || visibilityFilter !== 'ALL') && (
                  <div className="mt-4 pt-4 border-t" style={{ borderColor: tokens.borderDefault }}>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setStatusFilter('ALL');
                        setVisibilityFilter('ALL');
                      }}
                      className="text-sm transition-colors duration-200"
                      style={{ 
                        color: tokens.textSecondary,
                      }}
                    >
                      Clear all filters
                    </Button>
                  </div>
                )}
              </Card>
            )}
          </div>

      {/* Datasets List */}
      <div className="space-y-4">
        {filteredDatasets.length === 0 ? (
          <Card
            className="p-12"
            style={{
              background: tokens.surfaceCard,
              borderColor: tokens.borderDefault,
            }}
          >
            <div className="text-center">
              <Database className="w-16 h-16 mx-auto mb-4" style={{ color: tokens.textMuted }} />
              <h3 className="text-xl font-semibold mb-2" style={{ color: tokens.textPrimary }}>
                {searchQuery || statusFilter !== 'ALL' || visibilityFilter !== 'ALL' ? 'No datasets found' : 'No datasets yet'}
              </h3>
              <p className="mb-6" style={{ color: tokens.textSecondary }}>
                {searchQuery || statusFilter !== 'ALL' || visibilityFilter !== 'ALL'
                  ? 'Try adjusting your search or filters'
                  : 'Submit your first dataset proposal to see it here'}
              </p>
            </div>
          </Card>
        ) : (
          <div
            className="rounded-lg sm:rounded-xl border overflow-hidden flex flex-col h-full"
            style={{
              background: tokens.surfaceCard,
              borderColor: tokens.borderDefault,
            }}
          >
            <div className="overflow-x-auto flex-1">
              <table className="w-full">
                <thead
                  style={{
                    background: isDark
                      ? 'rgba(26, 34, 64, 0.4)'
                      : 'rgba(248, 249, 250, 0.8)',
                    borderBottom: `1px solid ${tokens.borderDefault}`,
                  }}
                >
                  <tr>
                    <th
                      className="px-3 sm:px-6 py-3 sm:py-4 text-center"
                      style={{
                        color: tokens.textSecondary,
                        fontWeight: '600',
                        fontSize: '11px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        minWidth: 'clamp(40px, 5vw, 60px)',
                      }}
                    >
                      No.
                    </th>
                    <th
                      className="px-3 sm:px-6 py-3 sm:py-4 text-left"
                      style={{
                        color: tokens.textSecondary,
                        fontWeight: '600',
                        fontSize: '11px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      Dataset
                    </th>
                    <th
                      className="px-3 sm:px-6 py-3 sm:py-4 text-left hidden sm:table-cell"
                      style={{
                        color: tokens.textSecondary,
                        fontWeight: '600',
                        fontSize: '11px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        minWidth: 'clamp(100px, 12vw, 140px)',
                      }}
                    >
                      ID
                    </th>
                    <th
                      className="px-3 sm:px-6 py-3 sm:py-4 text-left hidden md:table-cell"
                      style={{
                        color: tokens.textSecondary,
                        fontWeight: '600',
                        fontSize: '11px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        minWidth: 'clamp(100px, 12vw, 160px)',
                      }}
                    >
                      Status
                    </th>
                    <th
                      className="px-3 sm:px-6 py-3 sm:py-4 text-left hidden lg:table-cell"
                      style={{
                        color: tokens.textSecondary,
                        fontWeight: '600',
                        fontSize: '11px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        minWidth: 'clamp(80px, 10vw, 120px)',
                      }}
                    >
                      Visibility
                    </th>
                    <th
                      className="px-3 sm:px-6 py-3 sm:py-4 text-left hidden xl:table-cell"
                      style={{
                        color: tokens.textSecondary,
                        fontWeight: '600',
                        fontSize: '11px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        minWidth: 'clamp(140px, 18vw, 220px)',
                      }}
                    >
                      Last Updated
                    </th>
                    <th
                      className="px-3 sm:px-6 py-3 sm:py-4 text-right"
                      style={{
                        color: tokens.textSecondary,
                        fontWeight: '600',
                        fontSize: '11px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        minWidth: 'clamp(70px, 10vw, 110px)',
                      }}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDatasets.map((dataset, index) => {
                    const isLastRow = index === filteredDatasets.length - 1;
                    const formattedDate = new Date(dataset.updatedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    });

                    return (
                      <tr
                        key={dataset.id}
                        onClick={() => handleViewDataset(dataset.id)}
                        className="cursor-pointer transition-colors duration-150 text-sm"
                        style={{
                          borderBottom: isLastRow
                            ? 'none'
                            : `1px solid ${tokens.borderSubtle}`,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = tokens.rowHover;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        {/* Serial Number */}
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-center font-medium" style={{ color: tokens.textMuted }}>
                          {index + 1}
                        </td>

                        {/* Dataset Title */}
                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                          <div className="flex items-center gap-2 min-w-0">
                            <Database
                              className="w-4 h-4 flex-shrink-0"
                              style={{ color: tokens.textMuted }}
                            />
                            <span
                              className="text-xs sm:text-sm truncate"
                              style={{
                                color: tokens.textPrimary,
                                fontWeight: '500',
                                lineHeight: '1.4',
                              }}
                            >
                              {dataset.title}
                            </span>
                          </div>
                        </td>

                        {/* ID */}
                        <td className="px-3 sm:px-6 py-3 sm:py-4 hidden sm:table-cell">
                          <span
                            className="text-xs font-mono truncate"
                            style={{
                              color: tokens.textSecondary,
                              lineHeight: '1.4',
                            }}
                          >
                            {dataset.datasetUniqueId}
                          </span>
                        </td>

                        {/* Status - shows verification or publish status */}
                        <td className="px-3 sm:px-6 py-3 sm:py-4 hidden md:table-cell">
                          {dataset.verificationStatus && (
                            <DatasetStatusBadge status={dataset.verificationStatus} isDark={isDark} />
                          )}
                          {dataset.status && !dataset.verificationStatus && (
                            <PublishStatusBadge status={dataset.status as DatasetStatus} isDark={isDark} />
                          )}
                        </td>

                        {/* Visibility */}
                        <td className="px-3 sm:px-6 py-3 sm:py-4 hidden lg:table-cell">
                          {dataset.visibility && (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded"
                              style={{
                                background: dataset.visibility === 'PUBLIC' ? 'rgba(16, 185, 129, 0.1)' :
                                           dataset.visibility === 'PRIVATE' ? 'rgba(239, 68, 68, 0.1)' :
                                           'rgba(148, 163, 176, 0.1)',
                                color: dataset.visibility === 'PUBLIC' ? '#10b981' :
                                       dataset.visibility === 'PRIVATE' ? '#ef4444' :
                                       '#94a3b0',
                              }}
                            >
                              <Eye className="w-3 h-3" />
                              {dataset.visibility}
                            </span>
                          )}
                        </td>

                        {/* Last Updated */}
                        <td className="px-3 sm:px-6 py-3 sm:py-4 hidden xl:table-cell">
                          <span
                            className="text-xs sm:text-sm"
                            style={{
                              color: tokens.textSecondary,
                              lineHeight: '1.4',
                            }}
                          >
                            {formattedDate}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-right">
                          <button
                            className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded text-xs transition-all duration-150"
                            style={{
                              color: tokens.textSecondary,
                              fontWeight: '500',
                              background: 'transparent',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = isDark
                                ? 'rgba(255, 255, 255, 0.08)'
                                : 'rgba(26, 34, 64, 0.06)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent';
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewDataset(dataset.id);
                            }}
                          >
                            View
                            <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
