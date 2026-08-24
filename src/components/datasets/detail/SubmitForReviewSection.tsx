"use client";

import { DashboardButton } from "@/components/dashboard";
import { Send, CheckCircle2, AlertTriangle } from "lucide-react";
import type { VerificationStatus } from "@/types/dataset-proposal.types";
import type { DatasetDetailTokens } from "./detailTokens";

interface SubmitForReviewSectionProps {
  verificationStatus: VerificationStatus;
  missingPrerequisites: string[];
  submitting: boolean;
  onSubmit: () => void;
  isDark: boolean;
  tokens: DatasetDetailTokens;
  eyebrow?: string;
  title?: string;
  description?: string;
  actionLabel?: string;
}

export function SubmitForReviewSection({
  verificationStatus,
  missingPrerequisites,
  submitting,
  onSubmit,
  eyebrow = "Readiness",
  title,
  description,
  actionLabel,
}: SubmitForReviewSectionProps) {
  const isInitialSubmission = verificationStatus === "PENDING";

  return (
    <section className="dashboard-glass-card overflow-hidden rounded-xl border p-5">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
          {eyebrow}
        </p>
        <h3 className="mt-2 text-lg font-semibold text-foreground">
          {title ??
            (isInitialSubmission ? "Ready to Submit?" : "Resubmit for Review")}
        </h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {description ??
            (isInitialSubmission
              ? "Once submitted, your proposal will be reviewed by an admin. Make sure all required sections are complete."
              : "Admin has requested changes. Review the feedback and resubmit when ready.")}
        </p>

        {missingPrerequisites.length > 0 ? (
          <div className="mt-4 rounded-xl border dashboard-tone-warning p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[var(--dashboard-warning-foreground)]" />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Complete before submitting
                </p>
                <ul className="mt-2 space-y-1.5 text-xs leading-5 text-muted-foreground">
                  {missingPrerequisites.map((item, i) => (
                    <li key={i} className="flex gap-2">
                      <span aria-hidden="true">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded-xl border dashboard-tone-success p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="size-4 shrink-0 text-[var(--dashboard-success-foreground)]" />
              <p className="text-sm font-semibold text-foreground">
                All required information is complete.
              </p>
            </div>
          </div>
        )}

        <DashboardButton
          onClick={onSubmit}
          disabled={submitting || missingPrerequisites.length > 0}
          className="mt-4 h-11 w-full gap-2"
        >
          <Send className="size-4" />
          {submitting
            ? "Submitting..."
            : (actionLabel ??
              (isInitialSubmission
                ? "Submit for Review"
                : "Resubmit for Review"))}
        </DashboardButton>
      </div>
    </section>
  );
}
