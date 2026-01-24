'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { DatasetStatusBadge } from './shared';
import { getDatasetThemeTokens } from '@/constants/dataset.constants';
import { Plus, FileText, ChevronRight, AlertCircle } from 'lucide-react';
import { listMyProposals } from '@/lib/api';
import type { VerificationStatus } from '@/types/dataset-proposal.types';

interface ProposalListItem {
  id: string;
  datasetUniqueId: string;
  title: string;
  verificationStatus: VerificationStatus | null;
  updatedAt: string;
  currentUploadId?: string | null;
}

interface DatasetListProps {
  isDark?: boolean;
}

export function DatasetList({
  isDark = false,
}: DatasetListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokens = getDatasetThemeTokens(isDark);
  
  const [proposals, setProposals] = useState<ProposalListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get status filter from URL
  const statusFilter = searchParams.get('status');

  useEffect(() => {
    async function fetchProposals() {
      try {
        setLoading(true);
        setError(null);
        
        const response = await listMyProposals({});
        let filteredProposals = response.items || [];
        
        // Filter based on verification status
        // Default to 'draft' if no status is specified (this is the /dashboard/datasets page)
        const currentStatus = statusFilter || 'draft';
        
        if (currentStatus === 'draft') {
          // Drafts: only show PENDING verification status
          filteredProposals = filteredProposals.filter(p => p.verificationStatus === 'PENDING');
        } else {
          // My Proposals: show everything except PENDING
          filteredProposals = filteredProposals.filter(p => p.verificationStatus !== 'PENDING');
        }
        
        setProposals(filteredProposals);
      } catch (err: any) {
        console.error('Failed to fetch proposals:', err);
        setError(err.message || 'Failed to load proposals');
        setProposals([]); // Ensure proposals is always an array
      } finally {
        setLoading(false);
      }
    }

    fetchProposals();
  }, [statusFilter]);

  const handleRowClick = (datasetId: string) => {
    router.push(`/dashboard/datasets/${datasetId}`);
  };

  const handleCreateDataset = () => {
    router.push('/dashboard/datasets/create');
  };

  // Show loading state
  if (loading) {
    return (
      <div className="h-full overflow-auto">
        <div className="max-w-[1400px] mx-auto p-8">
          <div className="mb-6">
            <h1
              className="mb-1"
              style={{
                color: tokens.textPrimary,
                fontWeight: '600',
                fontSize: '24px',
                lineHeight: '1.3',
              }}
            >
              {statusFilter === 'draft' ? 'Drafts' : 'My Proposals'}
            </h1>
            <p className="text-sm" style={{ color: tokens.textMuted }}>
              Loading...
            </p>
          </div>
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: tokens.textPrimary }}></div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="h-full overflow-auto">
        <div className="max-w-[1400px] mx-auto p-8">
          <div className="mb-6">
            <h1
              className="mb-1"
              style={{
                color: tokens.textPrimary,
                fontWeight: '600',
                fontSize: '24px',
                lineHeight: '1.3',
              }}
            >
              {statusFilter === 'draft' ? 'Drafts' : 'My Proposals'}
            </h1>
          </div>
          <div
            className="rounded-xl border p-8 flex items-center gap-4"
            style={{
              background: tokens.surfaceCard,
              borderColor: '#ef4444',
            }}
          >
            <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
            <div>
              <p className="font-medium text-red-500 mb-1">Failed to load proposals</p>
              <p className="text-sm" style={{ color: tokens.textMuted }}>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-auto flex flex-col">
      <div className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Page Header */}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-start justify-between gap-4 sm:gap-6">
          <div>
            <h1
              className="mb-1"
              style={{
                color: tokens.textPrimary,
                fontWeight: '600',
                fontSize: 'clamp(20px, 5vw, 28px)',
                lineHeight: '1.3',
              }}
            >
              {statusFilter === 'draft' ? 'Drafts' : 'My Proposals'}
            </h1>
            <p
              className="text-xs sm:text-sm"
              style={{
                color: tokens.textMuted,
                lineHeight: '1.5',
              }}
            >
              {statusFilter === 'draft' 
                ? 'Work on your draft proposals before submitting them for review.'
                : 'Manage and track your dataset proposals.'
              }
            </p>
          </div>

          <Button
            onClick={handleCreateDataset}
            className="w-full sm:w-auto h-9 sm:h-10 px-4 sm:px-5 text-white transition-all duration-300 active:scale-[0.98] flex items-center justify-center sm:justify-start gap-2 text-sm flex-shrink-0"
            style={{
              background: '#1a2240',
              fontWeight: '600',
              boxShadow: '0 4px 12px rgba(42,53,88,0.12)',
              transform: 'translateZ(0)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(42,53,88,0.24)';
              e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(42,53,88,0.12)';
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
            }}
          >
            <Plus className="w-4 h-4" />
            Create proposal
          </Button>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-h-0">
          {!proposals || proposals.length === 0 ? (
          // Empty State
          <div
            className="rounded-lg sm:rounded-xl border p-8 sm:p-16 text-center h-full flex flex-col items-center justify-center"
            style={{
              background: tokens.surfaceCard,
              borderColor: tokens.borderDefault,
            }}
          >
            <div
              className="w-12 h-12 sm:w-16 sm:h-16 rounded-full mx-auto mb-4 sm:mb-6 flex items-center justify-center flex-shrink-0"
              style={{
                background: isDark
                  ? 'rgba(255, 255, 255, 0.05)'
                  : 'rgba(26, 34, 64, 0.05)',
              }}
            >
              <FileText
                className="w-6 h-6 sm:w-8 sm:h-8"
                style={{ color: tokens.textMuted }}
              />
            </div>

            <h3
              className="mb-2"
              style={{
                color: tokens.textPrimary,
                fontWeight: '600',
                fontSize: 'clamp(16px, 4vw, 20px)',
                lineHeight: '1.4',
              }}
            >
              You haven't created any proposals yet.
            </h3>

            <p
              className="text-xs sm:text-sm mb-6 sm:mb-8 max-w-sm mx-auto"
              style={{
                color: tokens.textMuted,
                lineHeight: '1.6',
              }}
            >
              Create your first dataset proposal to start sharing your data with the marketplace.
            </p>

            <Button
              onClick={handleCreateDataset}
              className="h-10 sm:h-12 px-6 sm:px-8 text-white transition-all duration-300 flex items-center gap-2 text-sm"
              style={{
                background: '#2a3558',
                fontWeight: '600',
                boxShadow: '0 4px 12px rgba(42,53,88,0.12)',
                transform: 'translateZ(0)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(42,53,88,0.24)';
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(42,53,88,0.12)';
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
              }}
            >
              <Plus className="w-4 h-4" />
              Create proposal
            </Button>
          </div>
        ) : (
          // Dataset Table
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
                      Proposal
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
                      className="px-3 sm:px-6 py-3 sm:py-4 text-left"
                      style={{
                        color: tokens.textSecondary,
                        fontWeight: '600',
                        fontSize: '11px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        minWidth: 'clamp(100px, 12vw, 160px)',
                      }}
                    >
                      Submission Status
                    </th>
                    <th
                      className="px-3 sm:px-6 py-3 sm:py-4 text-left hidden lg:table-cell"
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
                  {proposals?.map((proposal, index) => {
                    const isLastRow = index === proposals.length - 1;
                    const formattedDate = new Date(proposal.updatedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    });

                    return (
                      <tr
                        key={proposal.id}
                        onClick={() => handleRowClick(proposal.id)}
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

                        {/* Proposal Title */}
                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText
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
                              {proposal.title}
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
                            {proposal.datasetUniqueId}
                          </span>
                        </td>

                        {/* Verification Status */}
                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                          <DatasetStatusBadge status={proposal.verificationStatus} isDark={isDark} />
                        </td>

                        {/* Last Updated */}
                        <td className="px-3 sm:px-6 py-3 sm:py-4 hidden lg:table-cell">
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
                            className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded text-xs transition-all duration-150 hover:shadow-md"
                            style={{
                              color: tokens.textPrimary,
                              fontWeight: '500',
                              background: tokens.glassBg,
                              border: `1px solid ${tokens.glassBorder || tokens.borderDefault}`,
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = isDark
                                ? 'rgba(255, 255, 255, 0.12)'
                                : 'rgba(26, 34, 64, 0.08)';
                              e.currentTarget.style.borderColor = tokens.inputBorder;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = tokens.glassBg;
                              e.currentTarget.style.borderColor = tokens.glassBorder || tokens.borderDefault;
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRowClick(proposal.id);
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
    </div>
  );
}
