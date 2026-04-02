'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { getDatasetThemeTokens } from '@/constants/dataset.constants';
import { listMyDatasets } from '@/lib/api';
import { StatsCards } from './shared/StatsCards';
import { SearchAndFilterBar } from './shared/SearchAndFilterBar';
import { DatasetsTable, TableColumn } from './shared/DatasetsTable';
import { PublishStatusBadge } from './shared';
import { 
  Database, 
  AlertCircle,
  Eye,
  ChevronRight
} from 'lucide-react';
import type { DatasetStatus, DatasetVisibility } from '@/types/dataset.types';

interface MyDatasetsProps {
  isDark?: boolean;
}

type FilterStatus = 'ALL' | 'VERIFIED' | 'PUBLISHED' | 'DELISTED' | 'ARCHIVED';
type FilterVisibility = 'ALL' | 'PUBLIC' | 'PRIVATE' | 'UNLISTED';

interface DatasetItem {
  id: string;
  datasetUniqueId: string;
  title: string;
  status: DatasetStatus;
  visibility: DatasetVisibility;
  publishedAt: string | null;
  updatedAt: string;
  _index?: number;
}

export function MyDatasets({ isDark = false }: MyDatasetsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokens = getDatasetThemeTokens(isDark);

  const [datasets, setDatasets] = useState<DatasetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('ALL');
  const [visibilityFilter, setVisibilityFilter] = useState<FilterVisibility>('ALL');
  const fetchRequestIdRef = useRef(0);

  useEffect(() => {
    const statusFromQuery = searchParams.get('status');
    if (statusFromQuery === 'VERIFIED' || statusFromQuery === 'PUBLISHED' || statusFromQuery === 'DELISTED' || statusFromQuery === 'ARCHIVED') {
      setStatusFilter(statusFromQuery as FilterStatus);
      return;
    }

    setStatusFilter('ALL');
  }, [searchParams]);

  const fetchDatasets = async () => {
    const requestId = ++fetchRequestIdRef.current;

    try {
      setLoading(true);
      setError(null);

      let apiStatus: 'VERIFIED' | 'PUBLISHED' | 'DELISTED' | 'ARCHIVED' | undefined = undefined;
      
      if (statusFilter === 'VERIFIED' || statusFilter === 'PUBLISHED' || statusFilter === 'DELISTED' || statusFilter === 'ARCHIVED') {
        apiStatus = statusFilter;
      }
      
      const response = await listMyDatasets({
        status: apiStatus,
        visibility: visibilityFilter !== 'ALL' ? visibilityFilter : undefined,
        page: 1,
        pageSize: 100,
      });

      if (requestId !== fetchRequestIdRef.current) {
        return;
      }

      setDatasets(response.items);
    } catch (err: any) {
      if (requestId !== fetchRequestIdRef.current) {
        return;
      }

      console.error('Failed to fetch datasets:', err);
      setError(err.message || 'Failed to load datasets');
    } finally {
      if (requestId !== fetchRequestIdRef.current) {
        return;
      }

      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, [statusFilter, visibilityFilter]);

  // Filter datasets based on search
  const filteredDatasets = datasets.filter(dataset =>
    dataset.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats for quick overview
  const stats = [
    { value: filteredDatasets.length, label: 'Total Datasets', color: tokens.textPrimary },
    { value: datasets.filter(d => d.status === 'VERIFIED').length, label: 'Verified', color: '#22c55e' },
    { value: datasets.filter(d => d.status === 'PUBLISHED').length, label: 'Published', color: '#10b981' },
    { value: datasets.filter(d => d.status === 'DELISTED').length, label: 'Delisted', color: '#f59e0b' },
    { value: datasets.filter(d => d.status === 'ARCHIVED').length, label: 'Archived', color: '#94a3b0' },
    { value: datasets.filter(d => d.visibility === 'PUBLIC').length, label: 'Public', color: '#3b82f6' },
    { value: datasets.filter(d => d.visibility === 'PRIVATE').length, label: 'Private', color: '#ef4444' },
  ];

  const handleViewDataset = (dataset: DatasetItem) => {
    router.push(`/dashboard/my-datasets/${dataset.id}`);
  };

  // Table columns configuration
  const columns: TableColumn<DatasetItem>[] = [
    {
      header: 'No.',
      accessor: (item) => (
        <span className="font-medium" style={{ color: tokens.textMuted }}>
          {(item._index || 0) + 1}
        </span>
      ),
      headerClassName: 'text-center',
      className: 'text-center',
      minWidth: 'clamp(40px, 5vw, 60px)',
    },
    {
      header: 'Dataset',
      accessor: (item) => (
        <div className="flex items-center gap-2 min-w-0">
          <Database className="w-4 h-4 flex-shrink-0" style={{ color: tokens.textMuted }} />
          <span
            className="text-xs sm:text-sm truncate"
            style={{
              color: tokens.textPrimary,
              fontWeight: '500',
              lineHeight: '1.4',
            }}
          >
            {item.title}
          </span>
        </div>
      ),
    },
    {
      header: 'ID',
      accessor: (item) => (
        <span
          className="text-xs font-mono truncate"
          style={{
            color: tokens.textSecondary,
            lineHeight: '1.4',
          }}
        >
          {item.datasetUniqueId}
        </span>
      ),
      hidden: 'sm',
      minWidth: 'clamp(100px, 12vw, 140px)',
    },
    {
      header: 'Status',
      accessor: (item) => (
        <PublishStatusBadge status={item.status} isDark={isDark} />
      ),
      hidden: 'md',
      minWidth: 'clamp(100px, 12vw, 160px)',
    },
    {
      header: 'Visibility',
      accessor: (item) => (
        <span
          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded"
          style={{
            background: item.visibility === 'PUBLIC' ? 'rgba(16, 185, 129, 0.1)' :
                       item.visibility === 'PRIVATE' ? 'rgba(239, 68, 68, 0.1)' :
                       'rgba(148, 163, 176, 0.1)',
            color: item.visibility === 'PUBLIC' ? '#10b981' :
                   item.visibility === 'PRIVATE' ? '#ef4444' :
                   '#94a3b0',
          }}
        >
          <Eye className="w-3 h-3" />
          {item.visibility}
        </span>
      ),
      hidden: 'lg',
      minWidth: 'clamp(80px, 10vw, 120px)',
    },
    {
      header: 'Last Updated',
      accessor: (item) => (
        <span
          className="text-xs sm:text-sm"
          style={{
            color: tokens.textSecondary,
            lineHeight: '1.4',
          }}
        >
          {new Date(item.updatedAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })}
        </span>
      ),
      hidden: 'xl',
      minWidth: 'clamp(140px, 18vw, 220px)',
    },
    {
      header: 'Actions',
      accessor: (item) => (
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
            handleViewDataset(item);
          }}
        >
          View
          <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        </button>
      ),
      headerClassName: 'text-right',
      className: 'text-right',
      minWidth: 'clamp(70px, 10vw, 110px)',
    },
  ];

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
              View and manage your published and verified datasets
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <StatsCards stats={stats} tokens={tokens} isDark={isDark} />
      </div>

      {/* Search & Filter Controls */}
      <SearchAndFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filters={[
          {
            label: 'Dataset Status',
            value: statusFilter,
            options: [
              { label: 'All Statuses', value: 'ALL' },
              { label: 'Verified', value: 'VERIFIED' },
              { label: 'Published', value: 'PUBLISHED' },
              { label: 'Delisted', value: 'DELISTED' },
              { label: 'Archived', value: 'ARCHIVED' },
            ],
            onChange: (value) => setStatusFilter(value as FilterStatus),
          },
          {
            label: 'Visibility',
            value: visibilityFilter,
            options: [
              { label: 'All Visibility', value: 'ALL' },
              { label: 'Public', value: 'PUBLIC' },
              { label: 'Private', value: 'PRIVATE' },
              { label: 'Unlisted', value: 'UNLISTED' },
            ],
            onChange: (value) => setVisibilityFilter(value as FilterVisibility),
          },
        ]}
        activeFilterCount={(statusFilter !== 'ALL' ? 1 : 0) + (visibilityFilter !== 'ALL' ? 1 : 0)}
        tokens={tokens}
        isDark={isDark}
      />

      {/* Datasets Table */}
      <div className="space-y-4 pt-2">
        <DatasetsTable
          data={filteredDatasets.map((d, i) => ({ ...d, _index: i }))}
          columns={columns}
          onRowClick={handleViewDataset}
          emptyIcon={<Database className="w-16 h-16 mx-auto mb-4" style={{ color: tokens.textMuted }} />}
          emptyTitle={searchQuery || statusFilter !== 'ALL' || visibilityFilter !== 'ALL' ? 'No datasets found' : 'No datasets yet'}
          emptyDescription={
            searchQuery || statusFilter !== 'ALL' || visibilityFilter !== 'ALL'
              ? 'Try adjusting your search or filters'
              : 'Your verified and published datasets will appear here'
          }
          tokens={tokens}
          isDark={isDark}
          getRowKey={(item) => item.id}
        />
      </div>
    </div>
  );
}
