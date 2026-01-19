'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DatasetStatusBadge } from './shared';
import { getDatasetThemeTokens } from '@/constants/dataset.constants';
import { listMyProposals } from '@/lib/api';
import { 
  Database, 
  Search, 
  Filter, 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertCircle,
  Eye,
  Calendar
} from 'lucide-react';
import type { ListProposalsResponse, DatasetStatus, VerificationStatus } from '@/types/dataset-proposal.types';

interface MyDatasetsProps {
  isDark?: boolean;
}

type FilterStatus = 'ALL' | 'SUBMITTED' | 'UNDER_REVIEW' | 'VERIFIED' | 'PUBLISHED' | 'REJECTED';

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

  const [datasets, setDatasets] = useState<ListProposalsResponse['items']>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('ALL');

  const fetchDatasets = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch datasets with final outcomes (exclude PENDING drafts)
      const response = await listMyProposals({
        page: 1,
        pageSize: 100,
      });

      // Filter only submitted datasets (not drafts)
      const submittedDatasets = response.items.filter(
        item => item.verificationStatus !== 'PENDING'
      );

      setDatasets(submittedDatasets);
    } catch (err: any) {
      console.error('Failed to fetch datasets:', err);
      setError(err.message || 'Failed to load datasets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, []);

  // Filter datasets based on search and status
  const filteredDatasets = datasets.filter(dataset => {
    const matchesSearch = dataset.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || dataset.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Stats for quick overview
  const stats = {
    total: datasets.length,
    submitted: datasets.filter(d => d.verificationStatus === 'SUBMITTED').length,
    underReview: datasets.filter(d => d.verificationStatus === 'UNDER_REVIEW').length,
    verified: datasets.filter(d => d.verificationStatus === 'VERIFIED').length,
    published: datasets.filter(d => d.status === 'PUBLISHED').length,
    rejected: datasets.filter(d => d.verificationStatus === 'REJECTED').length,
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
              <div className="text-2xl font-bold mb-1" style={{ color: '#ef4444' }}>
                {stats.rejected}
              </div>
              <div className="text-xs" style={{ color: tokens.textSecondary }}>Rejected</div>
            </Card>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: tokens.textMuted }} />
              <Input
                placeholder="Search datasets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                style={{
                  background: tokens.inputBg,
                  borderColor: tokens.inputBorder,
                  color: tokens.textPrimary,
                }}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {(['ALL', 'SUBMITTED', 'UNDER_REVIEW', 'VERIFIED', 'PUBLISHED', 'REJECTED'] as FilterStatus[]).map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                  style={statusFilter === status ? {
                    background: 'linear-gradient(135deg, #1a2240 0%, #2a3558 50%, #4e5a7e 100%)',
                    color: '#ffffff',
                  } : {}}
                >
                  {status.replace('_', ' ')}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Dataset List */}
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
                {searchQuery || statusFilter !== 'ALL' ? 'No datasets found' : 'No datasets yet'}
              </h3>
              <p className="mb-6" style={{ color: tokens.textSecondary }}>
                {searchQuery || statusFilter !== 'ALL'
                  ? 'Try adjusting your search or filters'
                  : 'Submit your first dataset proposal to see it here'}
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredDatasets.map((dataset) => {
              const verificationInfo = VERIFICATION_STATUS_DISPLAY[dataset.verificationStatus || 'PENDING'];
              const VerificationIcon = verificationInfo.icon;

              return (
                <Card
                  key={dataset.id}
                  className="p-6 transition-all duration-200 cursor-pointer hover:shadow-lg"
                  style={{
                    background: tokens.surfaceCard,
                    borderColor: tokens.borderDefault,
                  }}
                  onClick={() => handleViewDataset(dataset.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold truncate" style={{ color: tokens.textPrimary }}>
                          {dataset.title}
                        </h3>
                        <DatasetStatusBadge status={dataset.verificationStatus} isDark={isDark} />
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm mb-3" style={{ color: tokens.textSecondary }}>
                        <span className="flex items-center gap-1">
                          <Database className="w-4 h-4" />
                          Dataset
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Updated {new Date(dataset.updatedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>

                      {/* Verification Status Badge */}
                      <div
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium"
                        style={{
                          background: `${verificationInfo.color}15`,
                          border: `1px solid ${verificationInfo.color}40`,
                          color: verificationInfo.color,
                        }}
                      >
                        <VerificationIcon className="w-4 h-4" />
                        <span>{verificationInfo.label}</span>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDataset(dataset.id);
                      }}
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
    </div>
  );
}
