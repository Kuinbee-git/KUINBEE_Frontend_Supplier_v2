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
  status: string;
  verificationStatus: VerificationStatus | null;
  updatedAt: string;
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
        
        const query: any = {};
        if (statusFilter === 'draft') {
          query.verificationStatus = 'PENDING';
        }
        
        const response = await listMyProposals(query);
        setProposals(response.items || []);
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
    <div className="h-full overflow-auto">
      <div className="max-w-[1400px] mx-auto p-8">
        {/* Page Header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
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
            <p
              className="text-sm"
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
            className="h-10 px-5 text-white transition-all duration-300 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
            style={{
              background: 'linear-gradient(135deg, #1a2240 0%, #2a3558 50%, #4e5a7e 100%)',
              fontWeight: '600',
              fontSize: '14px',
            }}
          >
            <Plus className="w-4 h-4" />
            Create proposal
          </Button>
        </div>

        {/* Main Content */}
        {!proposals || proposals.length === 0 ? (
          // Empty State
          <div
            className="rounded-xl border p-16 text-center"
            style={{
              background: tokens.surfaceCard,
              borderColor: tokens.borderDefault,
            }}
          >
            <div
              className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{
                background: isDark
                  ? 'rgba(255, 255, 255, 0.05)'
                  : 'rgba(26, 34, 64, 0.05)',
              }}
            >
              <FileText
                className="w-8 h-8"
                style={{ color: tokens.textMuted }}
              />
            </div>

            <h3
              className="mb-2"
              style={{
                color: tokens.textPrimary,
                fontWeight: '600',
                fontSize: '18px',
                lineHeight: '1.4',
              }}
            >
              You haven't created any proposals yet.
            </h3>

            <p
              className="text-sm mb-6 max-w-md mx-auto"
              style={{
                color: tokens.textMuted,
                lineHeight: '1.6',
              }}
            >
              Create your first dataset proposal to start sharing your data with the marketplace.
            </p>

            <Button
              onClick={handleCreateDataset}
              className="h-12 px-8 text-white transition-all duration-300 hover:shadow-lg hover:scale-[1.02] flex items-center gap-2 mx-auto"
              style={{
                background: 'linear-gradient(135deg, #1a2240 0%, #2a3558 50%, #4e5a7e 100%)',
                fontWeight: '600',
                fontSize: '14px',
              }}
            >
              <Plus className="w-4 h-4" />
              Create proposal
            </Button>
          </div>
        ) : (
          // Dataset Table
          <div
            className="rounded-xl border overflow-hidden"
            style={{
              background: tokens.surfaceCard,
              borderColor: tokens.borderDefault,
            }}
          >
            <div className="overflow-x-auto">
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
                      className="px-6 py-4 text-left"
                      style={{
                        color: tokens.textSecondary,
                        fontWeight: '600',
                        fontSize: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      Proposal
                    </th>
                    <th
                      className="px-6 py-4 text-left"
                      style={{
                        color: tokens.textSecondary,
                        fontWeight: '600',
                        fontSize: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        width: '140px',
                      }}
                    >
                      ID
                    </th>
                    <th
                      className="px-6 py-4 text-left"
                      style={{
                        color: tokens.textSecondary,
                        fontWeight: '600',
                        fontSize: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        width: '180px',
                      }}
                    >
                      Status
                    </th>
                    <th
                      className="px-6 py-4 text-left"
                      style={{
                        color: tokens.textSecondary,
                        fontWeight: '600',
                        fontSize: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        width: '200px',
                      }}
                    >
                      Last Updated
                    </th>
                    <th
                      className="px-6 py-4 text-right"
                      style={{
                        color: tokens.textSecondary,
                        fontWeight: '600',
                        fontSize: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        width: '100px',
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
                        className="cursor-pointer transition-colors duration-150"
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
                        {/* Proposal Title */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <FileText
                              className="w-4 h-4 flex-shrink-0"
                              style={{ color: tokens.textMuted }}
                            />
                            <span
                              className="text-sm"
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
                        <td className="px-6 py-4">
                          <span
                            className="text-xs font-mono"
                            style={{
                              color: tokens.textSecondary,
                              lineHeight: '1.4',
                            }}
                          >
                            {proposal.datasetUniqueId}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          <DatasetStatusBadge status={proposal.verificationStatus} isDark={isDark} />
                        </td>

                        {/* Last Updated */}
                        <td className="px-6 py-4">
                          <span
                            className="text-sm"
                            style={{
                              color: tokens.textSecondary,
                              lineHeight: '1.4',
                            }}
                          >
                            {formattedDate}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          <button
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md transition-all duration-150 text-xs"
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
                              handleRowClick(proposal.id);
                            }}
                          >
                            View
                            <ChevronRight className="w-3.5 h-3.5" />
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
