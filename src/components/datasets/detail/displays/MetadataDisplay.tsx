"use client";

import { Label } from "@/components/ui/label";
import type { ProposalDetailsResponse } from "@/types/dataset-proposal.types";
import type { DatasetDetailTokens } from "../detailTokens";

interface MetadataDisplayProps {
  proposal: ProposalDetailsResponse;
  tokens: DatasetDetailTokens;
}

export function MetadataDisplay({ proposal, tokens }: MetadataDisplayProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label style={{ color: tokens.textSecondary }}>Dataset Type</Label>
          <p className="text-sm" style={{ color: tokens.textPrimary }}>
            {proposal.dataset.superType.replace(/_/g, " ")}
          </p>
        </div>
        <div className="space-y-2">
          <Label style={{ color: tokens.textSecondary }}>
            Primary Category ID
          </Label>
          <p
            className="text-sm font-mono"
            style={{ color: tokens.textPrimary }}
          >
            {proposal.dataset.primaryCategoryId}
          </p>
        </div>
        <div className="space-y-2">
          <Label style={{ color: tokens.textSecondary }}>Source ID</Label>
          <p
            className="text-sm font-mono"
            style={{ color: tokens.textPrimary }}
          >
            {proposal.dataset.sourceId}
          </p>
        </div>
        <div className="space-y-2">
          <Label style={{ color: tokens.textSecondary }}>License</Label>
          <p className="text-sm" style={{ color: tokens.textPrimary }}>
            {proposal.dataset.license}
          </p>
        </div>
        {proposal.dataset.visibility && (
          <div className="space-y-2">
            <Label style={{ color: tokens.textSecondary }}>Visibility</Label>
            <p className="text-sm" style={{ color: tokens.textPrimary }}>
              {proposal.dataset.visibility}
            </p>
          </div>
        )}
      </div>
      <div className="space-y-2">
        <Label style={{ color: tokens.textSecondary }}>Dataset Status</Label>
        <p className="text-sm" style={{ color: tokens.textPrimary }}>
          {proposal.dataset.status}
        </p>
      </div>
      <div className="space-y-2">
        <Label style={{ color: tokens.textSecondary }}>Last Updated</Label>
        <p className="text-sm" style={{ color: tokens.textPrimary }}>
          {new Date(proposal.dataset.updatedAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}
