'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { getDatasetThemeTokens } from '@/constants/dataset.constants';
import { listMyProposals } from '@/lib/api';
import { StatsCards } from './shared/StatsCards';
import { SearchAndFilterBar } from './shared/SearchAndFilterBar';
import { DatasetsTable, TableColumn } from './shared/DatasetsTable';
import { DatasetStatusBadge } from './shared';
import { 
  AlertCircle,
  Database,
  ChevronRight,
} from 'lucide-react';
import type { VerificationStatus } from '@/types/dataset-proposal.types';

interface SubmittedProposalsProps {
  isDark?: boolean;
}

type FilterStatus = 'ALL' | 'SUBMITTED' | 'UNDER_REVIEW' | 'CHANGES_REQUESTED' | 'RESUBMITTED' | 'REJECTED';

interface ProposalItem {
  id: string;
  datasetUniqueId: string;
  title: string;
  verificationStatus: VerificationStatus;
  updatedAt: string;
  _index?: number;
}

export function SubmittedProposals({ isDark = false }: SubmittedProposalsProps) {
  const router = useRouter();
  const tokens = getDatasetThemeTokens(isDark);

  const [proposals, setProposals] = useState<ProposalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('ALL');

  const fetchProposals = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await listMyProposals({
        verificationStatus: statusFilter !== 'ALL' ? statusFilter : undefined,
        page: 1,
        pageSize: 100,
      });

      // Filter to only show submitted proposals (exclude PENDING and VERIFIED)
      const submittedOnly = response.items.filter(item => 
        item.verificationStatus && 
        item.verificationStatus !== 'PENDING' &&
        item.verificationStatus !== 'VERIFIED'
      ) as ProposalItem[];

      setProposals(submittedOnly);
    } catch (err: any) {
      console.error('Failed to fetch proposals:', err);
      setError(err.message || 'Failed to load proposals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, [statusFilter]);

  // Filter proposals based on search
  const filteredProposals = proposals.filter(proposal =>
    proposal.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats for quick overview
  const stats = [
    { value: filteredProposals.length, label: 'Total Proposals', color: tokens.textPrimary },
    { value: proposals.filter(p => p.verificationStatus === 'SUBMITTED').length, label: 'Submitted', color: '#3b82f6' },
    { value: proposals.filter(p => p.verificationStatus === 'UNDER_REVIEW').length, label: 'Under Review', color: '#f59e0b' },
    { value: proposals.filter(p => p.verificationStatus === 'CHANGES_REQUESTED').length, label: 'Changes Requested', color: '#ef4444' },
    { value: proposals.filter(p => p.verificationStatus === 'RESUBMITTED').length, label: 'Resubmitted', color: '#8b5cf6' },
    { value: proposals.filter(p => p.verificationStatus === 'REJECTED').length, label: 'Rejected', color: '#94a3b0' },
  ];

  const handleViewProposal = (proposal: ProposalItem) => {
    router.push(`/dashboard/datasets/${proposal.id}`);
  };

  // Table columns configuration
  const columns: TableColumn<ProposalItem>[] = [
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
      header: 'Proposal',
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
        <DatasetStatusBadge status={item.verificationStatus} isDark={isDark} />
      ),
      hidden: 'md',
      minWidth: 'clamp(100px, 12vw, 160px)',
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
            handleViewProposal(item);
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
            Failed to load proposals
          </h3>
          <p className="mb-6" style={{ color: tokens.textSecondary }}>
            {error}
          </p>
          <Button onClick={fetchProposals}>Retry</Button>
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
              Submitted Proposals
            </h1>
            <p style={{ color: tokens.textSecondary }}>
              Track your proposals that are under review or awaiting action
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
            label: 'Proposal Status',
            value: statusFilter,
            options: [
              { label: 'All Statuses', value: 'ALL' },
              { label: 'Submitted', value: 'SUBMITTED' },
              { label: 'Under Review', value: 'UNDER_REVIEW' },
              { label: 'Changes Requested', value: 'CHANGES_REQUESTED' },
              { label: 'Resubmitted', value: 'RESUBMITTED' },
              { label: 'Rejected', value: 'REJECTED' },
            ],
            onChange: (value) => setStatusFilter(value as FilterStatus),
          },
        ]}
        activeFilterCount={statusFilter !== 'ALL' ? 1 : 0}
        tokens={tokens}
        isDark={isDark}
      />

      {/* Proposals Table */}
      <div className="space-y-4 pt-2">
        <DatasetsTable
          data={filteredProposals.map((p, i) => ({ ...p, _index: i }))}
          columns={columns}
          onRowClick={handleViewProposal}
          emptyIcon={<Database className="w-16 h-16 mx-auto mb-4" style={{ color: tokens.textMuted }} />}
          emptyTitle={searchQuery || statusFilter !== 'ALL' ? 'No proposals found' : 'No submitted proposals yet'}
          emptyDescription={
            searchQuery || statusFilter !== 'ALL'
              ? 'Try adjusting your search or filters'
              : 'Submit a draft proposal to see it here'
          }
          tokens={tokens}
          isDark={isDark}
          getRowKey={(item) => item.id}
        />
      </div>
    </div>
  );
}
