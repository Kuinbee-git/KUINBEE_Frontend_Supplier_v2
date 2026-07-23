"use client";

import { Card } from "@/components/ui/card";
import { DatasetStatusBadge } from "../shared";
import { FileText } from "lucide-react";
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
    <Card className="supplier-glass-card overflow-hidden rounded-2xl border">
      <div className="p-5 sm:p-7">
        <div className="flex items-start gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:size-12">
            <FileText className="size-5 sm:size-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Dataset proposal
            </p>
            <h1 className="mt-2 break-words text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {title}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-2.5">
              <DatasetStatusBadge status={verificationStatus} isDark={isDark} />
              <span className="rounded-full border border-border/80 bg-background/50 px-2.5 py-1 font-mono text-xs text-muted-foreground">
                {datasetUniqueId}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
