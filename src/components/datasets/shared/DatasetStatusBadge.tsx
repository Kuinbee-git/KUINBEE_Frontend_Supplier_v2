import {
  BadgeCheck,
  CircleHelp,
  CircleX,
  Clock3,
  Eye,
  MessageSquareWarning,
  RefreshCw,
  Send,
  type LucideIcon,
} from "lucide-react";

import {
  DashboardStatusBadge,
  type DashboardTone,
} from "@/components/dashboard";
import type { VerificationStatus } from "@/types/dataset-proposal.types";

interface DatasetStatusBadgeProps {
  status: VerificationStatus | null;
  isDark?: boolean;
  className?: string;
}

const STATUS_CONFIG: Record<
  VerificationStatus,
  { label: string; icon: LucideIcon; tone: DashboardTone }
> = {
  PENDING: {
    label: "Draft",
    icon: Clock3,
    tone: "neutral",
  },
  SUBMITTED: {
    label: "Submitted",
    icon: Send,
    tone: "info",
  },
  CHANGES_REQUESTED: {
    label: "Changes requested",
    icon: MessageSquareWarning,
    tone: "warning",
  },
  RESUBMITTED: {
    label: "Resubmitted",
    icon: RefreshCw,
    tone: "info",
  },
  UNDER_REVIEW: {
    label: "Under review",
    icon: Eye,
    tone: "info",
  },
  VERIFIED: {
    label: "Verified",
    icon: BadgeCheck,
    tone: "success",
  },
  REJECTED: {
    label: "Rejected",
    icon: CircleX,
    tone: "danger",
  },
};

export function DatasetStatusBadge({
  status,
  className = "",
}: DatasetStatusBadgeProps) {
  const config = status
    ? STATUS_CONFIG[status]
    : {
        label: "Unknown",
        icon: CircleHelp,
        tone: "neutral" as DashboardTone,
      };

  return (
    <DashboardStatusBadge
      icon={config.icon}
      tone={config.tone}
      status={status ?? "UNKNOWN"}
      className={className}
    >
      {config.label}
    </DashboardStatusBadge>
  );
}
