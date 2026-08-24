"use client";

import type { ReactNode } from "react";
import { AlertCircle, Database, RefreshCw, Search } from "lucide-react";

import {
  DashboardButton,
  DashboardEmptyState,
  DashboardInlineAlert,
  DashboardLoadingState,
  DashboardPage,
  DashboardPageHeader,
} from "@/components/dashboard";
import { cn } from "@/lib/utils";

export function DatasetWorkspace({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <DashboardPage className={cn("dataset-workspace-scope", className)}>
      {children}
    </DashboardPage>
  );
}

export function DatasetPageHeader({
  title,
  description,
  action,
  breadcrumbs,
  meta,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  breadcrumbs?: ReactNode;
  meta?: ReactNode;
}) {
  return (
    <DashboardPageHeader
      title={title}
      description={description}
      actions={action}
      breadcrumbs={breadcrumbs}
      meta={meta}
    />
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
      <p
        className="mt-1 text-xs text-muted-foreground sm:text-sm"
        aria-live="polite"
      >
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
    <DashboardInlineAlert
      tone="danger"
      icon={AlertCircle}
      title={title}
      message={message}
      action={
        <DashboardButton
          type="button"
          variant="outline"
          size="compact"
          onClick={onRetry}
        >
          <RefreshCw aria-hidden="true" /> Try again
        </DashboardButton>
      }
    />
  );
}

export function DatasetListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <DashboardLoadingState
      label="Loading records"
      rows={rows}
      variant="skeleton"
    />
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
    <DashboardEmptyState
      filtered={filtered}
      icon={filtered ? Search : Database}
      title={filtered ? filteredTitle : title}
      description={filtered ? filteredDescription : description}
      onClear={onClear}
      action={action}
    />
  );
}
