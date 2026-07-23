"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRightLeft } from "lucide-react";
import type { DatasetDetailTokens } from "./detailTokens";

interface SampleProposalToggleCardProps {
  isSampleProposal: boolean;
  isEditable: boolean;
  sampleToggleSubmitting: boolean;
  onToggle: (nextValue: boolean) => void;
  isDark: boolean;
  tokens: DatasetDetailTokens;
}

export function SampleProposalToggleCard({
  isSampleProposal,
  isEditable,
  sampleToggleSubmitting,
  onToggle,
  isDark,
  tokens,
}: SampleProposalToggleCardProps) {
  return (
    <Card
      className={`supplier-glass-card overflow-hidden rounded-xl border ${isSampleProposal ? "border-primary/40" : ""}`}
    >
      <div className="flex flex-col gap-4 p-5">
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: isSampleProposal
                ? isDark
                  ? "rgba(59, 130, 246, 0.2)"
                  : "rgba(59, 130, 246, 0.12)"
                : isDark
                  ? "rgba(107, 114, 128, 0.2)"
                  : "rgba(107, 114, 128, 0.12)",
            }}
          >
            <ArrowRightLeft
              className="w-4 h-4"
              style={{
                color: isSampleProposal ? "#2563eb" : tokens.textSecondary,
              }}
            />
          </div>
          <div>
            <h3
              className="text-sm font-semibold"
              style={{ color: tokens.textPrimary }}
            >
              Sample Proposal Toggle
            </h3>
            <p className="text-xs mt-1" style={{ color: tokens.textMuted }}>
              Current mode: {isSampleProposal ? "Sample" : "Regular"}
            </p>
          </div>
        </div>

        <Button
          onClick={() => onToggle(!isSampleProposal)}
          disabled={!isEditable || sampleToggleSubmitting}
          className="h-10 w-full px-5"
          variant="outline"
        >
          {sampleToggleSubmitting
            ? "Updating..."
            : isSampleProposal
              ? "Switch to Regular"
              : "Switch to Sample"}
        </Button>
      </div>
    </Card>
  );
}
