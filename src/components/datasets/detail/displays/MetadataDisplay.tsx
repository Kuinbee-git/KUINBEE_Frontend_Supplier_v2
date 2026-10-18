"use client";

import { Label } from "@/components/ui/label";
import { DATASET_TYPES } from "@/constants/dataset.constants";
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
          <Label style={{ color: tokens.textSecondary }}>Study structure</Label>
          <p className="text-sm" style={{ color: tokens.textPrimary }}>
            {DATASET_TYPES.find(
              (item) => item.value === proposal.dataset.superType
            )?.label ?? proposal.dataset.superType.replace(/_/g, " ")}
          </p>
        </div>
        <div className="space-y-2">
          <Label style={{ color: tokens.textSecondary }}>
            Primary category
          </Label>
          <p
            className="break-words text-sm"
            style={{ color: tokens.textPrimary }}
          >
            {proposal.primaryCategory?.id === proposal.dataset.primaryCategoryId
              ? proposal.primaryCategory.name
              : "Current category label unavailable"}
          </p>
        </div>
        <div className="space-y-2">
          <Label style={{ color: tokens.textSecondary }}>Data source</Label>
          <p
            className="break-words text-sm"
            style={{ color: tokens.textPrimary }}
          >
            {proposal.source?.id === proposal.dataset.sourceId
              ? proposal.source.name
              : "Current source label unavailable"}
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
