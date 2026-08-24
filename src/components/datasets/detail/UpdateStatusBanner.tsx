"use client";

import { CheckCircle, Clock, Eye, Send, XCircle } from "lucide-react";

import {
  DashboardInlineAlert,
  type DashboardTone,
} from "@/components/dashboard";
import type { DatasetStatus } from "@/types/dataset.types";
import type { VerificationStatus } from "@/types/dataset-proposal.types";
import type { DatasetDetailTokens } from "./detailTokens";

interface UpdateStatusBannerProps {
  datasetStatus: DatasetStatus;
  verificationStatus: VerificationStatus | string;
  rejectionReason?: string | null;
  isDark?: boolean;
  tokens: DatasetDetailTokens;
}

const STATUS_CONFIGS: Record<
  string,
  {
    icon: typeof Clock;
    title: string;
    description: string;
    tone: DashboardTone;
  }
> = {
  "SUBMITTED:SUBMITTED": {
    icon: Send,
    title: "Update submitted",
    description:
      "Your update has been submitted and is waiting for an administrator to begin review.",
    tone: "info",
  },
  "SUBMITTED:RESUBMITTED": {
    icon: Send,
    title: "Changes resubmitted",
    description:
      "Your updated changes have been resubmitted and are waiting for administrator review.",
    tone: "info",
  },
  "UNDER_REVIEW:UNDER_REVIEW": {
    icon: Eye,
    title: "Under administrator review",
    description:
      "Your update is being reviewed. You will be notified when the review is complete.",
    tone: "warning",
  },
  "DELISTED:PENDING": {
    icon: Clock,
    title: "Update draft in progress",
    description:
      "Your dataset changes are in draft. Submit them for review before republishing.",
    tone: "neutral",
  },
  "DELISTED:VERIFIED": {
    icon: CheckCircle,
    title: "Updates approved",
    description:
      "Your updates have been approved. You can now republish the dataset.",
    tone: "success",
  },
  "DELISTED:REJECTED": {
    icon: XCircle,
    title: "Update rejected",
    description:
      "Your update request was rejected. Review the reason before starting a new update cycle.",
    tone: "danger",
  },
};

export function UpdateStatusBanner({
  datasetStatus,
  verificationStatus,
  rejectionReason,
}: UpdateStatusBannerProps) {
  const config = STATUS_CONFIGS[`${datasetStatus}:${verificationStatus}`];
  if (!config) return null;

  return (
    <DashboardInlineAlert
      className="mb-6"
      tone={config.tone}
      icon={config.icon}
      title={config.title}
    >
      <p>{config.description}</p>
      {rejectionReason && verificationStatus === "REJECTED" ? (
        <div className="mt-3 rounded-lg border border-current/20 bg-background/30 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em]">
            Rejection reason
          </p>
          <p className="mt-1 leading-5">{rejectionReason}</p>
        </div>
      ) : null}
    </DashboardInlineAlert>
  );
}
