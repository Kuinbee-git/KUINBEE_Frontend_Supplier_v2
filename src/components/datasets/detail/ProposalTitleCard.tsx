"use client";

import { DashboardPageHeader } from "@/components/dashboard";
import { DatasetStatusBadge } from "../shared";
import type { VerificationStatus } from "@/types/dataset-proposal.types";
import type { DatasetDetailTokens } from "./detailTokens";

interface ProposalTitleCardProps {
  title: string;
  datasetUniqueId: string;
  verificationStatus: VerificationStatus;
  isDark: boolean;
  tokens: DatasetDetailTokens;
}

export function ProposalTitleCard({
  title,
  datasetUniqueId,
  verificationStatus,
  isDark,
}: ProposalTitleCardProps) {
  return (
    <DashboardPageHeader
      title={title}
      description="Review the saved proposal information, files and admin feedback."
      meta={
        <>
          <DatasetStatusBadge status={verificationStatus} isDark={isDark} />
          <span className="font-mono text-xs text-muted-foreground">
            {datasetUniqueId}
          </span>
        </>
      }
    />
  );
}
