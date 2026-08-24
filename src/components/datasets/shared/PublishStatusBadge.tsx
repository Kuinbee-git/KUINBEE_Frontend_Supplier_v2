import {
  Archive,
  BadgeCheck,
  CircleOff,
  CircleX,
  Eye,
  Globe2,
  Send,
  type LucideIcon,
} from "lucide-react";

import {
  DashboardStatusBadge,
  type DashboardTone,
} from "@/components/dashboard";
import type { DatasetStatus } from "@/types/dataset-proposal.types";

interface PublishStatusBadgeProps {
  status: DatasetStatus | null;
  isDark?: boolean;
  className?: string;
}

const STATUS_CONFIG: Record<
  DatasetStatus,
  { label: string; icon: LucideIcon; tone: DashboardTone }
> = {
  SUBMITTED: {
    label: "Submitted",
    icon: Send,
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
    tone: "info",
  },
  PUBLISHED: {
    label: "Published",
    icon: Globe2,
    tone: "success",
  },
  REJECTED: {
    label: "Rejected",
    icon: CircleX,
    tone: "danger",
  },
  ARCHIVED: {
    label: "Archived",
    icon: Archive,
    tone: "neutral",
  },
  DELISTED: {
    label: "Delisted",
    icon: CircleOff,
    tone: "warning",
  },
};

export function PublishStatusBadge({
  status,
  className = "",
}: PublishStatusBadgeProps) {
  if (!status) return null;
  const config = STATUS_CONFIG[status];
  if (!config) return null;
  return (
    <DashboardStatusBadge
      icon={config.icon}
      tone={config.tone}
      status={status}
      className={className}
    >
      {config.label}
    </DashboardStatusBadge>
  );
}
