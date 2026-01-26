"use client";

import { useState, useEffect } from "react";
import { useOnboardingStatus } from "@/hooks";
import { useSupplierTokens } from "@/hooks/useSupplierTokens";
import { useRouter } from "next/navigation";
import { Database, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard, StatCard } from "@/components/shared";
import { listMyProposals } from "@/lib/api/dataset-proposals";
import { listMyDatasets } from "@/lib/api/datasets";

export default function DashboardPage() {
  const router = useRouter();
  const tokens = useSupplierTokens();
  const { isComplete } = useOnboardingStatus();
  const [proposalCount, setProposalCount] = useState(0);
  const [datasetCount, setDatasetCount] = useState(0);
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        // Fetch proposals and datasets in parallel for faster loading
        const [proposalsData, datasetsData] = await Promise.all([
          listMyProposals({ pageSize: 4, page: 1 }),
          listMyDatasets({ pageSize: 1, page: 1 }),
        ]);

        setProposalCount(proposalsData.total || 0);
        setProposals(proposalsData.items || []);
        setDatasetCount(datasetsData.total || 0);
      } catch (error) {
        console.error("Failed to fetch counts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCounts();
  }, []);

  return (
    <div className="max-w-[1400px] mx-auto px-8 py-7 h-full">
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      {/* Header */}
      <h1 
        className="text-3xl font-semibold mb-2"
        style={{ color: tokens.textPrimary }}
      >
        Dashboard Overview
      </h1>
      <p 
        className="mb-6 text-sm"
        style={{ color: tokens.textSecondary }}
      >
        Welcome back! Here's an overview of your activity.
      </p>

      {/* Stats Grid */}
      <div style={{ animation: 'fadeIn 0.6s ease-out' }}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-7">
        <StatCard 
          label="TOTAL PROPOSALS" 
          value={loading ? "-" : proposalCount} 
          className="p-5"
        />
        <StatCard 
          label="TOTAL DATASETS" 
          value={loading ? "-" : datasetCount} 
          className="p-5"
        />
        <StatCard 
          label="ONBOARDING STATUS" 
          value={
            isComplete ? (
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-base font-semibold" style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="10" r="10" fill="#10b981"/><path d="M7.5 10.5L9.5 12.5L13 9" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Complete
              </span>
            ) : (
              'Pending'
            )
          }
          className="p-5"
        />
      </div>
      </div>

      {/* Create Proposal Section */}
      <div style={{ animation: 'fadeIn 0.6s ease-out 0.2s backwards' }}>
      <GlassCard className="mb-7">
        <div className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <Upload className="w-5 h-5" style={{ color: tokens.textPrimary }} />
            <h2 className="text-lg font-semibold" style={{ color: tokens.textPrimary }}>
              Create Dataset Proposal
            </h2>
          </div>
          <p className="mb-4 text-sm" style={{ color: tokens.textSecondary }}>
            Start sharing your data with the marketplace by creating a proposal.
          </p>
          <Button
            onClick={() => router.push('/dashboard/datasets/create')}
            variant="default"
            className="bg-primary text-primary-foreground shadow transition-all duration-300"
            style={{
              background: tokens.surfaceUnified,
              color: tokens.textPrimary,
              border: `1px solid ${tokens.borderDefault}`,
              boxShadow: '0 4px 12px rgba(42,53,88,0.12)'
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
            <Upload className="w-4 h-4 mr-2" />
            Create Proposal
          </Button>
        </div>
      </GlassCard>
      </div>

      {/* Your Proposals Section */}
      <div style={{ animation: 'fadeIn 0.6s ease-out 0.4s backwards' }}>
      <GlassCard>
        <div className="p-5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5" style={{ color: tokens.textPrimary }} />
              <h2 className="text-lg font-semibold" style={{ color: tokens.textPrimary }}>
                Your Proposals
              </h2>
            </div>
            <Button 
              variant="outline"
              size="sm"
              onClick={() => router.push('/dashboard/datasets')}
              className="border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground"
              style={{
                borderColor: tokens.borderDefault,
                color: tokens.textPrimary,
                background: tokens.glassBg,
              }}
            >
              View All
            </Button>
          </div>
          
          {/* Proposals List or Empty State */}
          {loading ? (
            <div className="text-center py-8">
              <p style={{ color: tokens.textSecondary }}>Loading proposals...</p>
            </div>
          ) : proposals.length > 0 ? (
            <div>
              <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
                {proposals.map((proposal) => (
                  <div
                    key={proposal.id}
                    className="p-4 rounded-lg border flex items-center justify-between cursor-pointer transition-all hover:shadow-md"
                    style={{
                      background: tokens.inputBg,
                      borderColor: tokens.borderDefault,
                    }}
                    onClick={() => router.push(`/dashboard/proposals`)}
                  >
                    <div className="flex-1">
                      <p className="font-medium" style={{ color: tokens.textPrimary }}>
                        {proposal.title}
                      </p>
                      <p className="text-xs mt-1" style={{ color: tokens.textSecondary }}>
                        Status: <span className="font-semibold">{proposal.status}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs" style={{ color: tokens.textSecondary }}>
                        {new Date(proposal.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-center mt-3 pt-2" style={{ borderTop: `1px solid ${tokens.borderDefault}` }}>
                <svg className="w-5 h-5 animate-bounce" style={{ color: tokens.textSecondary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
            </div>
          ) : (
            <div 
              className="text-center py-8 rounded-lg"
              style={{ 
                background: tokens.inputBg,
                border: `1px solid ${tokens.borderDefault}`
              }}
            >
              <Database 
                className="w-10 h-10 mx-auto mb-3" 
                style={{ color: tokens.textMuted }} 
              />
              <p className="text-sm font-medium mb-1" style={{ color: tokens.textPrimary }}>
                No proposals yet
              </p>
              <p className="text-xs" style={{ color: tokens.textSecondary }}>
                Create your first proposal to get started
              </p>
            </div>
          )}
        </div>
      </GlassCard>
      </div>
    </div>
  );
}
