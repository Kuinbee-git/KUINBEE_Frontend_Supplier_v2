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

import type { VerificationStatus } from "@/types/dataset-proposal.types";

interface DatasetStatusBadgeProps {
  status: VerificationStatus | null;
  isDark?: boolean;
  className?: string;
}

const STATUS_CONFIG: Record<
  VerificationStatus,
  { label: string; icon: LucideIcon; className: string }
> = {
  PENDING: {
    label: "Draft",
    icon: Clock3,
    className: "border-slate-500/25 bg-slate-500/10 text-slate-500 dark:text-slate-300",
  },
  SUBMITTED: {
    label: "Submitted",
    icon: Send,
    className: "border-blue-500/25 bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  CHANGES_REQUESTED: {
    label: "Changes requested",
    icon: MessageSquareWarning,
    className: "border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  RESUBMITTED: {
    label: "Resubmitted",
    icon: RefreshCw,
    className: "border-violet-500/25 bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
  UNDER_REVIEW: {
    label: "Under review",
    icon: Eye,
    className: "border-violet-500/25 bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
  VERIFIED: {
    label: "Verified",
    icon: BadgeCheck,
    className: "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  REJECTED: {
    label: "Rejected",
    icon: CircleX,
    className: "border-red-500/25 bg-red-500/10 text-red-600 dark:text-red-400",
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
        className:
          "border-slate-500/25 bg-slate-500/10 text-slate-500 dark:text-slate-300",
      };
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium ${config.className} ${className}`}
    >
      <Icon className="size-3" aria-hidden="true" />
      {config.label}
    </span>
  );
}
