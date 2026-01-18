'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DatasetDetail } from '@/components/datasets';
import { useThemeStore } from '@/store';
import { getProposalDetails } from '@/lib/api';
import type { ProposalDetailsResponse } from '@/types/dataset-proposal.types';
import { AlertCircle } from 'lucide-react';

export default function DatasetDetailPage() {
  const { theme } = useThemeStore();
  const params = useParams();
  const router = useRouter();
  const isDark = theme === 'dark';
  const datasetId = params.id as string;

  const [proposal, setProposal] = useState<ProposalDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProposal = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getProposalDetails(datasetId);
      setProposal(data);
    } catch (err: any) {
      console.error('Failed to fetch proposal:', err);
      setError(err.message || 'Failed to load proposal');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProposal();
  }, [datasetId]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ background: isDark ? '#0f172a' : '#f8fafc' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: isDark ? '#fff' : '#1a2240' }}></div>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ background: isDark ? '#0f172a' : '#f8fafc' }}>
        <div className="text-center space-y-4 max-w-md">
          <AlertCircle className="w-12 h-12 mx-auto text-red-500" />
          <h2 className="text-xl font-semibold" style={{ color: isDark ? '#fff' : '#1a2240' }}>
            Failed to load proposal
          </h2>
          <p className="text-sm" style={{ color: isDark ? '#94a3b8' : '#64748b' }}>
            {error || 'Proposal not found'}
          </p>
          <button
            onClick={() => router.push('/dashboard/datasets')}
            className="px-4 py-2 rounded-lg text-white"
            style={{ background: '#1a2240' }}
          >
            Back to proposals
          </button>
        </div>
      </div>
    );
  }

  return <DatasetDetail proposal={proposal} isDark={isDark} onRefresh={fetchProposal} />;
}
