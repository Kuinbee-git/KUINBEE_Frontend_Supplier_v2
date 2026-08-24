"use client";

import { DashboardCard } from "@/components/dashboard";
import { DashboardButton } from "@/components/dashboard";
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
    <DashboardCard
      className={`dashboard-glass-card overflow-hidden rounded-xl border ${isSampleProposal ? "border-primary/40" : ""}`}
    >
      <div className="flex flex-col gap-4 p-5">
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: isSampleProposal
                ? isDark
                  ? "color-mix(in srgb, var(--dashboard-action) 20%, transparent)"
                  : "color-mix(in srgb, var(--dashboard-action) 12%, transparent)"
                : isDark
                  ? "color-mix(in srgb, var(--dashboard-text-muted) 20%, transparent)"
                  : "color-mix(in srgb, var(--dashboard-text-muted) 12%, transparent)",
            }}
          >
            <ArrowRightLeft
              className="w-4 h-4"
              style={{
                color: isSampleProposal
                  ? "var(--dashboard-info-foreground)"
                  : tokens.textSecondary,
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

        <DashboardButton
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
        </DashboardButton>
      </div>
    </DashboardCard>
  );
}
