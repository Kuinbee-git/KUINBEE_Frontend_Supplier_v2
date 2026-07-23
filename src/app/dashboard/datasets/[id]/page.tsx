"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { DatasetDetail } from "@/components/datasets";
import { useThemeStore } from "@/store";
import { getProposalDetails } from "@/lib/api";
import type { ProposalDetailsResponse } from "@/types/dataset-proposal.types";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageBackground } from "@/components/shared";
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
      <PageBackground withGrid>
        <DatasetWorkspace className="max-w-[1380px]">
          <div
            className="supplier-glass-panel min-h-72 animate-pulse rounded-2xl border p-6"
            aria-label="Loading proposal"
          >
            <div className="h-4 w-28 rounded bg-foreground/[0.07]" />
            <div className="mt-5 h-8 w-2/3 rounded bg-foreground/[0.08]" />
            <div className="mt-4 h-5 w-48 rounded bg-foreground/[0.06]" />
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-24 rounded-xl bg-foreground/[0.05]"
                />
              ))}
            </div>
          </div>
        </DatasetWorkspace>
      </PageBackground>
    );
  }

  if (error || !proposal) {
    return (
      <PageBackground withGrid>
        <DatasetWorkspace className="max-w-3xl">
          <div className="supplier-glass-panel rounded-2xl border px-6 py-12 text-center">
            <AlertCircle className="mx-auto size-11 text-destructive" />
            <h2 className="mt-4 text-xl font-semibold text-foreground">
              Failed to load proposal
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {error || "Proposal not found"}
            </p>
            <Button
              onClick={() => router.push("/dashboard/datasets")}
              className="mt-5"
            >
              Back to proposals
            </Button>
          </div>
        </DatasetWorkspace>
      </PageBackground>
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
