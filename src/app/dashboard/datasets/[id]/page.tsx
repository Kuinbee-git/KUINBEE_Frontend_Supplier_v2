"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { DatasetDetail } from "@/components/datasets";
import { useThemeStore } from "@/store";
import { getProposalDetails } from "@/lib/api";
import type { ProposalDetailsResponse } from "@/types/dataset-proposal.types";
import {
  DashboardButton,
  DashboardErrorState,
  DashboardLoadingState,
  DashboardPageHeader,
} from "@/components/dashboard";
import { DatasetWorkspace } from "@/components/datasets/workspace";

export default function DatasetDetailPage() {
  const { theme } = useThemeStore();
  const params = useParams();
  const router = useRouter();
  const isDark = theme === "dark";
  const datasetId = params.id as string;

  const [proposal, setProposal] = useState<ProposalDetailsResponse | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProposal = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getProposalDetails(datasetId);
      setProposal(data);
    } catch (err: unknown) {
      console.error("Failed to fetch proposal:", err);
      setError(err instanceof Error ? err.message : "Failed to load proposal");
    } finally {
      setLoading(false);
    }
  }, [datasetId]);

  useEffect(() => {
    void fetchProposal();
  }, [fetchProposal]);

  if (loading) {
    return (
      <DatasetWorkspace>
        <DashboardPageHeader
          title="Dataset proposal"
          description="Loading the proposal workspace and its latest review state."
        />
        <DashboardLoadingState
          label="Loading proposal"
          variant="skeleton"
          rows={6}
        />
      </DatasetWorkspace>
    );
  }

  if (error || !proposal) {
    return (
      <DatasetWorkspace className="max-w-3xl">
        <DashboardPageHeader
          title="Dataset proposal"
          description="Review and manage this dataset proposal."
        />
        <DashboardErrorState
          title="Failed to load proposal"
          message={error || "Proposal not found"}
          onRetry={() => void fetchProposal()}
        />
        <div className="flex justify-center">
          <DashboardButton
            variant="ghost"
            onClick={() => router.push("/dashboard/datasets")}
          >
            Back to proposals
          </DashboardButton>
        </div>
      </DatasetWorkspace>
    );
  }

  return (
    <DatasetDetail
      proposal={proposal}
      isDark={isDark}
      onRefresh={fetchProposal}
    />
  );
}
