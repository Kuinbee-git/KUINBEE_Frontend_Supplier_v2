import type { ReactNode } from "react";

import { DashboardPageHeader } from "@/components/dashboard";

export function DatasetEntityHeader({
  eyebrow,
  title,
  identifier,
  description,
  metadata,
  badges,
  actions,
}: {
  eyebrow: string;
  title: string;
  identifier: string;
  description?: string;
  metadata?: ReactNode;
  badges?: ReactNode;
  actions?: ReactNode;
}) {
  const displayTitle = title?.trim() || "Untitled dataset";

  return (
    <DashboardPageHeader
      title={displayTitle}
      description={description}
      meta={
        <>
          <span className="text-xs font-medium text-muted-foreground">
            {eyebrow}
          </span>
          {badges}
          <span className="font-mono text-xs">{identifier}</span>
          {metadata}
        </>
      }
      actions={actions}
    />
  );
}
