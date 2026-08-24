import { EyeOff, Globe2, LockKeyhole, type LucideIcon } from "lucide-react";

import {
  DashboardStatusBadge,
  type DashboardTone,
} from "@/components/dashboard";
import type { DatasetVisibility } from "@/types/dataset.types";

const VISIBILITY_CONFIG: Record<
  DatasetVisibility,
  { label: string; icon: LucideIcon; tone: DashboardTone }
> = {
  PUBLIC: {
    label: "Public",
    icon: Globe2,
    tone: "success",
  },
  PRIVATE: {
    label: "Private",
    icon: LockKeyhole,
    tone: "neutral",
  },
  UNLISTED: {
    label: "Unlisted",
    icon: EyeOff,
    tone: "warning",
  },
};

export function DatasetVisibilityBadge({
  visibility,
}: {
  visibility: DatasetVisibility;
}) {
  const config = VISIBILITY_CONFIG[visibility];
  return (
    <DashboardStatusBadge
      icon={config.icon}
      tone={config.tone}
      status={visibility}
    >
      {config.label}
    </DashboardStatusBadge>
  );
}
