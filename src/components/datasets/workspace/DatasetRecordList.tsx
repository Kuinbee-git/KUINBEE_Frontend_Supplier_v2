"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Database, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
}: {
  items: TItem[];
  columns: DatasetRecordColumn<TItem>[];
  getKey: (item: TItem) => string;
  renderMobile: (item: TItem) => ReactNode;
}) {
  return (
    <>
      <div className="supplier-glass-panel hidden overflow-hidden rounded-2xl border md:block">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border bg-foreground/[0.025] text-left">
              {columns.map((column) => (
                <th
                  key={column.header}
                  scope="col"
                  className={cn(
                    "px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground",
                    column.headerClassName
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr
                key={getKey(item)}
                className="border-b border-border/70 transition-colors last:border-b-0 hover:bg-foreground/[0.025]"
              >
                {columns.map((column) => (
                  <td key={column.header} className={cn("px-5 py-4", column.className)}>
                    {column.render(item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid gap-3 md:hidden">
        {items.map((item) => (
          <div key={getKey(item)}>{renderMobile(item)}</div>
        ))}
      </div>
    </>
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
}: {
  href: string;
  title: string;
  identifier: string;
  icon?: LucideIcon;
  badges?: ReactNode;
  supportingText: string;
  actionLabel: string;
}) {
  return (
    <article className="supplier-glass-card overflow-hidden rounded-xl border p-4">
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-foreground">
            <Link href={href} className="underline-offset-4 hover:text-primary hover:underline">
              {title}
            </Link>
          </h3>
          <p className="mt-1 truncate font-mono text-[11px] text-muted-foreground">
            {identifier}
          </p>
        </div>
      </div>

      {badges && <div className="mt-4 flex flex-wrap gap-2">{badges}</div>}

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-border/70 pt-3">
        <span className="min-w-0 truncate text-xs text-muted-foreground">
          {supportingText}
        </span>
        <Button asChild variant="ghost" size="sm" className="-mr-2 shrink-0">
          <Link href={href}>
            {actionLabel} <ArrowRight />
          </Link>
        </Button>
      </div>
    </article>
  );
}
