import { EyeOff, Globe2, LockKeyhole, type LucideIcon } from "lucide-react";

import type { DatasetVisibility } from "@/types/dataset.types";

const VISIBILITY_CONFIG: Record<
  DatasetVisibility,
  { label: string; icon: LucideIcon; className: string }
> = {
  PUBLIC: {
    label: "Public",
    icon: Globe2,
    className: "border-emerald-500/25 bg-emerald-500/10 text-emerald-500",
  },
  PRIVATE: {
    label: "Private",
    icon: LockKeyhole,
    className:
      "border-slate-500/25 bg-slate-500/10 text-slate-500 dark:text-slate-300",
  },
  UNLISTED: {
    label: "Unlisted",
    icon: EyeOff,
    className: "border-amber-500/25 bg-amber-500/10 text-amber-500",
  },
};

export function DatasetVisibilityBadge({
  visibility,
}: {
  visibility: DatasetVisibility;
}) {
  const config = VISIBILITY_CONFIG[visibility];
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium ${config.className}`}
    >
      <Icon className="size-3" aria-hidden="true" />
      {config.label}
    </span>
  );
}
