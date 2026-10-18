"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Database, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

import {
  DashboardButton,
  DashboardDataTable,
  DashboardMobileRecordCard,
  type DashboardTableColumn,
} from "@/components/dashboard";

export interface DatasetRecordColumn<TItem> {
  header: string;
  render: (item: TItem) => ReactNode;
  className?: string;
  headerClassName?: string;
}

export function DatasetRecordList<TItem>({
  items,
  columns,
  getKey,
  renderMobile,
  busy = false,
  caption = "Datasets",
  framed = true,
  mobileBreakpoint = "md",
  fixedLayout = false,
}: {
  items: TItem[];
  columns: DatasetRecordColumn<TItem>[];
  getKey: (item: TItem) => string;
  renderMobile: (item: TItem) => ReactNode;
  busy?: boolean;
  caption?: string;
  framed?: boolean;
  mobileBreakpoint?: "md" | "xl";
  fixedLayout?: boolean;
}) {
  const dashboardColumns: DashboardTableColumn<TItem>[] = columns.map(
    (column, index) => ({
      id: `${column.header}-${index}`,
      header: column.header,
      cell: column.render,
      className: column.className,
      headerClassName: column.headerClassName,
      rowHeader: index === 0,
    })
  );

  return (
    <DashboardDataTable
      className={
        !framed
          ? "[&_tr>:first-child]:pl-4 [&_tr>:last-child]:pr-4 md:[&_tr>:first-child]:pl-6 md:[&_tr>:last-child]:pr-6"
          : undefined
      }
      caption={caption}
      busy={busy}
      items={items}
      columns={dashboardColumns}
      getRowId={getKey}
      renderMobileItem={renderMobile}
      framed={framed}
      mobileBreakpoint={mobileBreakpoint}
      fixedLayout={fixedLayout}
    />
  );
}

export function DatasetRecordIdentity({
  href,
  title,
  identifier,
  icon: Icon = Database,
}: {
  href: string;
  title: string;
  identifier: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <Link
          href={href}
          className="block truncate text-sm font-semibold text-foreground underline-offset-4 hover:text-primary hover:underline"
        >
          {title}
        </Link>
        <p className="mt-1 truncate font-mono text-[11px] text-muted-foreground">
          {identifier}
        </p>
      </div>
    </div>
  );
}

export function DatasetMobileRecordCard({
  href,
  title,
  identifier,
  icon: Icon = Database,
  badges,
  supportingText,
  actionLabel,
  framed = true,
}: {
  href: string;
  title: string;
  identifier: string;
  icon?: LucideIcon;
  badges?: ReactNode;
  supportingText: string;
  actionLabel: string;
  framed?: boolean;
}) {
  return (
    <DashboardMobileRecordCard
      framed={framed}
      className={!framed ? "px-4 md:px-6" : undefined}
    >
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-foreground">
            <Link
              href={href}
              className="underline-offset-4 hover:text-primary hover:underline"
            >
              {title}
            </Link>
          </h3>
          <p className="mt-1 truncate font-mono text-[11px] text-muted-foreground">
            {identifier}
          </p>
        </div>
      </div>

      {badges && <div className="mt-4 flex flex-wrap gap-2">{badges}</div>}

      <div
        className={cn(
          "mt-4 flex items-center justify-between gap-3",
          framed ? "border-t border-border/70 pt-3" : "pt-1"
        )}
      >
        <span className="min-w-0 truncate text-xs text-muted-foreground">
          {supportingText}
        </span>
        <DashboardButton
          asChild
          variant="ghost"
          size="compact"
          className={cn("shrink-0", framed && "-mr-2")}
        >
          <Link href={href}>
            {actionLabel} <ArrowRight />
          </Link>
        </DashboardButton>
      </div>
    </DashboardMobileRecordCard>
  );
}
