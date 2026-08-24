import * as React from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils/cn";

export const DashboardTable = React.forwardRef<
  HTMLTableElement,
  React.TableHTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <table
    ref={ref}
    className={cn("w-full border-collapse text-sm", className)}
    {...props}
  />
));

DashboardTable.displayName = "DashboardTable";

export const DashboardTableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn(
      "border-b border-border bg-[var(--dashboard-glass-background-soft)]",
      className
    )}
    {...props}
  />
));

DashboardTableHeader.displayName = "DashboardTableHeader";

export const DashboardTableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("divide-y divide-border", className)}
    {...props}
  />
));

DashboardTableBody.displayName = "DashboardTableBody";

export const DashboardTableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "transition-colors hover:bg-[var(--dashboard-control-background)] focus-within:bg-[var(--dashboard-control-background)] motion-reduce:transition-none",
      className
    )}
    {...props}
  />
));

DashboardTableRow.displayName = "DashboardTableRow";

export const DashboardTableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, scope = "col", ...props }, ref) => (
  <th
    ref={ref}
    scope={scope}
    className={cn(
      "h-10 px-4 text-left align-middle text-xs font-medium text-muted-foreground first:pl-5 last:pr-5",
      className
    )}
    {...props}
  />
));

DashboardTableHead.displayName = "DashboardTableHead";

export const DashboardTableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      "h-[3.25rem] px-4 py-3.5 align-middle text-foreground first:pl-5 last:pr-5",
      className
    )}
    {...props}
  />
));

DashboardTableCell.displayName = "DashboardTableCell";

export const DashboardTableRowHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, scope = "row", ...props }, ref) => (
  <th
    ref={ref}
    scope={scope}
    className={cn(
      "h-[3.25rem] px-4 py-3.5 text-left align-middle font-medium text-foreground first:pl-5 last:pr-5",
      className
    )}
    {...props}
  />
));

DashboardTableRowHead.displayName = "DashboardTableRowHead";

export type DashboardSortDirection = "ascending" | "descending" | "none";

export interface DashboardTableColumn<TItem> {
  align?: "start" | "center" | "end";
  cell: (item: TItem) => React.ReactNode;
  className?: string;
  header: React.ReactNode;
  headerClassName?: string;
  id: string;
  rowHeader?: boolean;
  sort?: {
    direction: DashboardSortDirection;
    onToggle: () => void;
    sortLabel: string;
  };
}

const alignmentClasses = {
  start: "text-left",
  center: "text-center",
  end: "text-right",
} as const;

function SortIcon({ direction }: { direction: DashboardSortDirection }) {
  if (direction === "ascending") {
    return <ArrowUp className="size-3.5" aria-hidden="true" />;
  }

  if (direction === "descending") {
    return <ArrowDown className="size-3.5" aria-hidden="true" />;
  }

  return <ChevronsUpDown className="size-3.5" aria-hidden="true" />;
}

function getSortButtonLabel(label: string, direction: DashboardSortDirection) {
  if (direction === "ascending") {
    return `${label}, sorted ascending. Activate to sort descending.`;
  }

  if (direction === "descending") {
    return `${label}, sorted descending. Activate to sort ascending.`;
  }

  return `${label}, not sorted. Activate to sort ascending.`;
}

export interface DashboardDataTableProps<TItem> {
  busy?: boolean;
  caption: string;
  className?: string;
  columns: readonly DashboardTableColumn<TItem>[];
  emptyMessage?: string;
  getRowId: (item: TItem) => React.Key;
  items: readonly TItem[];
  renderMobileItem?: (item: TItem) => React.ReactNode;
}

export function DashboardDataTable<TItem>({
  busy = false,
  caption,
  className,
  columns,
  emptyMessage = "No records are available.",
  getRowId,
  items,
  renderMobileItem,
}: DashboardDataTableProps<TItem>) {
  const hasMobileLayout = Boolean(renderMobileItem);

  return (
    <div className={cn("grid gap-3", className)}>
      <span className="sr-only" role="status" aria-live="polite">
        {busy
          ? `Loading ${caption}`
          : `${items.length} ${items.length === 1 ? "result" : "results"} in ${caption}`}
      </span>
      <div
        className={cn(
          "dashboard-glass-card dashboard-scroll-region overflow-x-auto rounded-xl border outline-none focus-visible:ring-2 focus-visible:ring-[var(--dashboard-focus-ring)]",
          hasMobileLayout && "hidden md:block"
        )}
        tabIndex={0}
        role="region"
        aria-label={caption}
        aria-busy={busy || undefined}
      >
        <DashboardTable>
          <caption className="sr-only">{caption}</caption>
          <DashboardTableHeader>
            <DashboardTableRow className="hover:bg-transparent">
              {columns.map((column) => (
                <DashboardTableHead
                  key={column.id}
                  aria-sort={
                    column.sort && column.sort.direction !== "none"
                      ? column.sort.direction
                      : undefined
                  }
                  className={cn(
                    alignmentClasses[column.align ?? "start"],
                    column.headerClassName
                  )}
                >
                  {column.sort ? (
                    <button
                      type="button"
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-md py-1 font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-[var(--dashboard-focus-ring)]",
                        column.align === "center" && "justify-center",
                        column.align === "end" && "ml-auto justify-end"
                      )}
                      onClick={column.sort.onToggle}
                      aria-label={getSortButtonLabel(
                        column.sort.sortLabel,
                        column.sort.direction
                      )}
                    >
                      {column.header}
                      <SortIcon direction={column.sort.direction} />
                    </button>
                  ) : (
                    column.header
                  )}
                </DashboardTableHead>
              ))}
            </DashboardTableRow>
          </DashboardTableHeader>
          <DashboardTableBody>
            {items.length ? (
              items.map((item) => (
                <DashboardTableRow key={getRowId(item)}>
                  {columns.map((column) => (
                    <React.Fragment key={column.id}>
                      {column.rowHeader ? (
                        <DashboardTableRowHead
                          className={cn(
                            alignmentClasses[column.align ?? "start"],
                            column.className
                          )}
                        >
                          {column.cell(item)}
                        </DashboardTableRowHead>
                      ) : (
                        <DashboardTableCell
                          className={cn(
                            alignmentClasses[column.align ?? "start"],
                            column.className
                          )}
                        >
                          {column.cell(item)}
                        </DashboardTableCell>
                      )}
                    </React.Fragment>
                  ))}
                </DashboardTableRow>
              ))
            ) : (
              <DashboardTableRow className="hover:bg-transparent">
                <DashboardTableCell
                  colSpan={columns.length}
                  className="h-32 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </DashboardTableCell>
              </DashboardTableRow>
            )}
          </DashboardTableBody>
        </DashboardTable>
      </div>

      {renderMobileItem ? (
        <div
          className="grid gap-3 md:hidden"
          role="list"
          aria-label={caption}
          aria-busy={busy || undefined}
        >
          {items.length ? (
            items.map((item) => (
              <div key={getRowId(item)} role="listitem">
                {renderMobileItem(item)}
              </div>
            ))
          ) : (
            <div
              className="dashboard-glass-card rounded-xl border px-4 py-10 text-center text-sm text-muted-foreground"
              role="listitem"
            >
              {emptyMessage}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

export const DashboardMobileRecordCard = React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement>
>(({ className, ...props }, ref) => (
  <article
    ref={ref}
    className={cn(
      "dashboard-glass-card rounded-xl border p-4 text-card-foreground",
      className
    )}
    {...props}
  />
));

DashboardMobileRecordCard.displayName = "DashboardMobileRecordCard";
