'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageBackground } from '@/components/shared';
import { DatasetStatusBadge } from './shared';
import { DatasetDetail } from './DatasetDetail';
import { getDatasetThemeTokens } from '@/constants/dataset.constants';
import { getProposalDetails } from '@/lib/api';
import { 
  ArrowLeft, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  XCircle,
  FileText,
  Calendar,
  User
} from 'lucide-react';
import type { ProposalDetailsResponse, VerificationStatus } from '@/types/dataset-proposal.types';

interface MyDatasetDetailProps {
  datasetId: string;
  isDark?: boolean;
}

const VERIFICATION_STATUS_INFO: Record<VerificationStatus, {
  label: string;
  description: string;
  color: string;
  icon: any;
  bgColor: string;
}> = {
  PENDING: {
    label: 'Pending Submission',
    description: 'This dataset is still in draft mode and has not been submitted for review.',
    color: '#f59e0b',
    icon: Clock,
    bgColor: 'rgba(245, 158, 11, 0.1)',
  },
  SUBMITTED: {
    label: 'Submitted for Review',
    description: 'Your dataset has been submitted and is waiting for the review process to begin.',
    color: '#3b82f6',
    icon: FileText,
    bgColor: 'rgba(59, 130, 246, 0.1)',
  },
  CHANGES_REQUESTED: {
    label: 'Changes Requested',
    description: 'The reviewer has requested changes to your dataset. Please review the feedback below.',
    color: '#ef4444',
    icon: AlertCircle,
    bgColor: 'rgba(239, 68, 68, 0.1)',
  },
  RESUBMITTED: {
    label: 'Resubmitted for Review',
    description: 'Your revised dataset has been resubmitted and is awaiting review.',
    color: '#8b5cf6',
    icon: Clock,
    bgColor: 'rgba(139, 92, 246, 0.1)',
  },
  UNDER_REVIEW: {
    label: 'Under Review',
    description: 'Your dataset is currently being reviewed by our verification team.',
    color: '#f59e0b',
    icon: Clock,
    bgColor: 'rgba(245, 158, 11, 0.1)',
  },
  VERIFIED: {
    label: 'Verified',
    description: 'Your dataset has been verified and approved. It is ready for publication.',
    color: '#22c55e',
    icon: CheckCircle,
    bgColor: 'rgba(34, 197, 94, 0.1)',
  },
  REJECTED: {
    label: 'Rejected',
    description: 'Your dataset submission has been rejected. Please review the feedback below.',
    color: '#ef4444',
    icon: XCircle,
    bgColor: 'rgba(239, 68, 68, 0.1)',
  },
};

export function MyDatasetDetail({ datasetId, isDark = false }: MyDatasetDetailProps) {
  const router = useRouter();
  const tokens = getDatasetThemeTokens(isDark);

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
      console.error('Failed to fetch dataset:', err);
      setError(err.message || 'Failed to load dataset');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProposal();
  }, [datasetId]);

  if (loading) {
    return (
      <PageBackground>
        <div className="max-w-[1400px] mx-auto p-8">
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: tokens.textPrimary }}></div>
          </div>
        </div>
      </PageBackground>
    );
  }

  if (error || !proposal) {
    return (
      <PageBackground>
        <div className="max-w-[1400px] mx-auto p-8">
          <div className="text-center py-20">
            <AlertCircle className="w-16 h-16 mx-auto mb-4" style={{ color: tokens.warningText }} />
            <h3 className="text-xl font-semibold mb-2" style={{ color: tokens.textPrimary }}>
              Failed to load dataset
            </h3>
            <p className="mb-6" style={{ color: tokens.textSecondary }}>
              {error || 'Dataset not found'}
            </p>
            <Button onClick={() => router.push('/dashboard/my-datasets')}>
              Back to My Datasets
            </Button>
          </div>
        </div>
      </PageBackground>
    );
  }

  const verificationInfo = VERIFICATION_STATUS_INFO[proposal.verification.status];
  const VerificationIcon = verificationInfo.icon;

  // Check if dataset is editable (only PENDING or CHANGES_REQUESTED)
  const isEditable = proposal.verification.status === 'PENDING' || 
                     proposal.verification.status === 'CHANGES_REQUESTED';

  return (
    <PageBackground>
      <div className="max-w-[1400px] mx-auto p-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard/my-datasets')}
          className="mb-6 gap-2"
          style={{ color: tokens.textSecondary }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to My Datasets
        </Button>

        {/* Verification Status Card */}
        <Card
          className="p-6 mb-6"
          style={{
            background: verificationInfo.bgColor,
            borderColor: `${verificationInfo.color}40`,
            borderWidth: '2px',
          }}
        >
          <div className="flex items-start gap-4">
            <div
              className="p-3 rounded-lg"
              style={{
                background: `${verificationInfo.color}20`,
              }}
            >
              <VerificationIcon className="w-6 h-6" style={{ color: verificationInfo.color }} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-semibold" style={{ color: tokens.textPrimary }}>
                  {verificationInfo.label}
                </h3>
                <DatasetStatusBadge status={proposal.verification.status} isDark={isDark} />
              </div>
              <p className="text-sm mb-3" style={{ color: tokens.textSecondary }}>
                {verificationInfo.description}
              </p>

              {/* Verification Timeline */}
              <div className="flex flex-wrap gap-6 text-sm" style={{ color: tokens.textMuted }}>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Last Updated: {new Date(proposal.verification.updatedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>

              {/* Reviewer Notes/Feedback */}
              {proposal.verification.notes && (
                <div
                  className="mt-4 p-4 rounded-lg"
                  style={{
                    background: tokens.surfaceCard,
                    borderLeft: `4px solid ${verificationInfo.color}`,
                  }}
                >
                  <p className="text-sm font-medium mb-1" style={{ color: tokens.textPrimary }}>
                    Reviewer Feedback:
                  </p>
                  <p className="text-sm" style={{ color: tokens.textSecondary }}>
                    {proposal.verification.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Edit Restriction Notice */}
        {!isEditable && (
          <Card
            className="p-4 mb-6"
            style={{
              background: tokens.infoBg,
              borderColor: tokens.infoBorder,
            }}
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5" style={{ color: tokens.infoText }} />
              <p className="text-sm" style={{ color: tokens.textSecondary }}>
                This dataset is currently {proposal.verification.status.toLowerCase().replace('_', ' ')} and cannot be edited.
                {proposal.verification.status === 'VERIFIED' && ' You can view all details below.'}
                {proposal.verification.status === 'REJECTED' && ' Please contact support if you believe this is an error.'}
              </p>
            </div>
          </Card>
        )}

        {/* Dataset Detail Component (Reused) */}
        <DatasetDetail 
          proposal={proposal} 
          isDark={isDark} 
          onRefresh={fetchProposal}
        />
      </div>
    </PageBackground>
  );
}
