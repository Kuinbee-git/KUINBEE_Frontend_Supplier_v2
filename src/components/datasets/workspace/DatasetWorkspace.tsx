"use client";

import type { ReactNode } from "react";
import {
  AlertCircle,
  Database,
  RefreshCw,
  Search,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function DatasetWorkspace({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "dataset-workspace-scope mx-auto w-full max-w-[1500px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8 lg:py-8",
        className
      )}
    >
      {children}
    </div>
  );
}

export function DatasetPageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
          {description}
        </p>
      </div>
      {action && <div className="w-full shrink-0 sm:w-auto">{action}</div>}
    </header>
  );
}

export function DatasetInventoryHeader({
  id,
  title,
  loading,
  total,
  singularLabel,
  pluralLabel,
}: {
  id: string;
  title: string;
  loading: boolean;
  total: number;
  singularLabel: string;
  pluralLabel: string;
}) {
  return (
    <div className="mb-3">
      <h2 id={id} className="text-base font-semibold text-foreground">
        {title}
      </h2>
      <p className="mt-1 text-xs text-muted-foreground sm:text-sm" aria-live="polite">
        {loading
          ? "Updating results…"
          : `${total} ${total === 1 ? singularLabel : pluralLabel} in this view`}
      </p>
    </div>
  );
}

export function DatasetErrorBanner({
  title,
  message,
  onRetry,
}: {
  title: string;
  message: string;
  onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className="mt-4 flex flex-col gap-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive" />
        <div>
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{message}</p>
        </div>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={onRetry}>
        <RefreshCw /> Try again
      </Button>
    </div>
  );
}

export function DatasetListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div
      className="supplier-glass-panel overflow-hidden rounded-2xl border"
      aria-label="Loading records"
      aria-busy="true"
    >
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="flex animate-pulse items-center gap-4 border-b border-border/70 px-4 py-5 last:border-b-0 sm:px-5"
        >
          <span className="size-9 shrink-0 rounded-lg bg-foreground/[0.07]" />
          <div className="flex-1">
            <div className="h-3.5 w-44 max-w-full rounded bg-foreground/[0.08]" />
            <div className="mt-2 h-2.5 w-28 rounded bg-foreground/[0.05]" />
          </div>
          <div className="hidden h-7 w-24 rounded-full bg-foreground/[0.06] sm:block" />
          <div className="hidden h-7 w-20 rounded-full bg-foreground/[0.06] md:block" />
        </div>
      ))}
    </div>
  );
}

export function DatasetEmptyState({
  filtered,
  title,
  description,
  filteredTitle = "No records match this view",
  filteredDescription = "Try changing your search or filters.",
  onClear,
  action,
}: {
  filtered: boolean;
  title: string;
  description: string;
  filteredTitle?: string;
  filteredDescription?: string;
  onClear?: () => void;
  action?: ReactNode;
}) {
  return (
    <div className="supplier-glass-panel flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-12 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        {filtered ? <Search className="size-7" /> : <Database className="size-7" />}
      </span>
      <h3 className="mt-4 text-lg font-semibold text-foreground">
        {filtered ? filteredTitle : title}
      </h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        {filtered ? filteredDescription : description}
      </p>
      {filtered && onClear ? (
        <Button type="button" variant="outline" className="mt-5" onClick={onClear}>
          Clear filters
        </Button>
      ) : action ? (
        <div className="mt-5">{action}</div>
      ) : null}
    </div>
  );
}
