"use client";

import { useOnboardingStatus } from "@/hooks";
import { useSupplierTokens } from "@/hooks/useSupplierTokens";
import { useRouter } from "next/navigation";
import { Database, Upload, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard, StatCard } from "@/components/shared";

export default function DashboardPage() {
  const router = useRouter();
  const tokens = useSupplierTokens();
  const { isComplete } = useOnboardingStatus();
  
  const isRestricted = !isComplete;

  return (
    <div className="max-w-[1400px] mx-auto p-8">
      {/* Header */}
      <h1 
        className="text-3xl font-semibold mb-2"
        style={{ color: tokens.textPrimary }}
      >
        Dashboard Overview
      </h1>
      <p 
        className="mb-6"
        style={{ color: tokens.textSecondary }}
      >
        Welcome back! Here's an overview of your marketplace activity.
      </p>

      {/* Restricted Mode Banner */}
      {isRestricted && (
        <div 
          className="mb-6 p-4 rounded-xl flex items-center gap-4"
          style={{ 
            background: tokens.warningBg,
            border: `1px solid ${tokens.warningBorder}`
          }}
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: tokens.warningText }} />
          <div className="flex-1">
            <p className="font-medium" style={{ color: tokens.warningText }}>
              Complete your profile setup
            </p>
            <p className="text-sm" style={{ color: tokens.textSecondary }}>
              You're in restricted mode. Complete verification to unlock all features.
            </p>
          </div>
          <Button 
            variant="outline"
            size="sm"
            onClick={() => router.push('/dashboard/blocked')}
            style={{ 
              borderColor: tokens.warningBorder,
              color: tokens.warningText,
            }}
          >
            Complete Setup
          </Button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <StatCard 
          label="TOTAL PROPOSALS" 
          value="0" 
        />
        <StatCard 
          label="ONBOARDING STATUS" 
          value={isComplete ? 'Complete' : 'Pending'} 
        />
      </div>

      {/* Create Proposal Section */}
      <GlassCard className="mb-8">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Upload className="w-5 h-5" style={{ color: tokens.textPrimary }} />
            <h2 className="text-lg font-semibold" style={{ color: tokens.textPrimary }}>
              Create Dataset Proposal
            </h2>
          </div>
          <p className="mb-4" style={{ color: tokens.textSecondary }}>
            {isRestricted 
              ? 'Complete your onboarding to submit dataset proposals.'
              : 'Start sharing your data with the marketplace by creating a proposal.'
            }
          </p>
          <Button
            disabled={isRestricted}
            onClick={() => router.push('/dashboard/datasets/create')}
            style={{
              background: isRestricted 
                ? tokens.inputBg 
                : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              opacity: isRestricted ? 0.5 : 1,
            }}
          >
            <Upload className="w-4 h-4 mr-2" />
            Create Proposal
          </Button>
        </div>
      </GlassCard>

      {/* Your Proposals Section */}
      <GlassCard>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
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
              style={{
                borderColor: tokens.borderDefault,
                color: tokens.textPrimary,
              }}
            >
              View All
            </Button>
          </div>
          
          {/* Empty State */}
          <div 
            className="text-center py-12 rounded-xl"
            style={{ 
              background: tokens.inputBg,
              border: `1px solid ${tokens.borderDefault}`
            }}
          >
            <Database 
              className="w-12 h-12 mx-auto mb-4" 
              style={{ color: tokens.textMuted }} 
            />
            <p className="font-medium mb-1" style={{ color: tokens.textPrimary }}>
              No proposals yet
            </p>
            <p className="text-sm" style={{ color: tokens.textSecondary }}>
              {isRestricted 
                ? 'Complete onboarding to start creating proposals'
                : 'Create your first proposal to get started'
              }
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
