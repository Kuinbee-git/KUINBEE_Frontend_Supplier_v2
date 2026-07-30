import type { ReactNode } from "react";

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
    <header className="supplier-glass-panel flex flex-col gap-5 rounded-2xl border p-5 sm:p-6 xl:flex-row xl:items-start xl:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground">
            Dataset details
          </span>
          {badges}
          <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            {eyebrow}
          </span>
        </div>
        <h1 className="mt-3 break-words text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {displayTitle}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="font-mono">{identifier}</span>
          {metadata}
        </div>
        {description && (
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex w-full shrink-0 flex-wrap gap-2 xl:w-auto xl:max-w-[560px] xl:justify-end">
          {actions}
        </div>
      )}
    </header>
  );
}
