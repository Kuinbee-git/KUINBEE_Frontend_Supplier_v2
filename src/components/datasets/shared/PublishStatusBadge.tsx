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

import type { DatasetStatus } from "@/types/dataset-proposal.types";

interface PublishStatusBadgeProps {
  status: DatasetStatus | null;
  isDark?: boolean;
  className?: string;
}

const STATUS_CONFIG: Record<
  DatasetStatus,
  { label: string; icon: LucideIcon; className: string }
> = {
  SUBMITTED: {
    label: "Submitted",
    icon: Send,
    className: "border-blue-500/25 bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  UNDER_REVIEW: {
    label: "Under review",
    icon: Eye,
    className: "border-violet-500/25 bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
  VERIFIED: {
    label: "Verified",
    icon: BadgeCheck,
    className: "border-blue-500/25 bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  PUBLISHED: {
    label: "Published",
    icon: Globe2,
    className: "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  REJECTED: {
    label: "Rejected",
    icon: CircleX,
    className: "border-red-500/25 bg-red-500/10 text-red-600 dark:text-red-400",
  },
  ARCHIVED: {
    label: "Archived",
    icon: Archive,
    className: "border-slate-500/25 bg-slate-500/10 text-slate-500 dark:text-slate-300",
  },
  DELISTED: {
    label: "Delisted",
    icon: CircleOff,
    className: "border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
};

export function PublishStatusBadge({
  status,
  className = "",
}: PublishStatusBadgeProps) {
  if (!status) return null;
  const config = STATUS_CONFIG[status];
  if (!config) return null;
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
