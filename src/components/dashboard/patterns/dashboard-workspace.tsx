import * as React from "react";

import { cn } from "@/lib/utils/cn";

/** One glass surface for related sections; its children keep their semantics. */
export const DashboardWorkspace = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-dashboard-workspace="true"
    className={cn(
      "dashboard-workspace dashboard-glass-card min-w-0 divide-y divide-border overflow-clip rounded-xl border text-card-foreground",
      className
    )}
    {...props}
  />
));
DashboardWorkspace.displayName = "DashboardWorkspace";

export const DashboardRegion = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("min-w-0 px-4 py-5 md:px-6", className)}
    {...props}
  />
));
DashboardRegion.displayName = "DashboardRegion";

/** Connected content regions, including populated detail and analytics panels. */
export function DashboardPanelGrid({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const cells = React.Children.toArray(children);
  return (
    <div
      className={cn(
        "dashboard-panel-grid grid min-w-0 grid-cols-1 lg:grid-cols-2",
        className
      )}
      {...props}
    >
      {cells.map((cell, index) => (
        <div
          key={React.isValidElement(cell) ? (cell.key ?? index) : index}
          data-panel-cell="true"
          className={cn(
            "dashboard-panel-stack min-w-0",
            index === cells.length - 1 &&
              cells.length % 2 === 1 &&
              "lg:col-span-2"
          )}
        >
          {cell}
        </div>
      ))}
    </div>
  );
}

const columnClasses = {
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
  5: "lg:grid-cols-5",
} as const;
const spanClasses = {
  1: "lg:col-span-1",
  2: "lg:col-span-2",
  3: "lg:col-span-3",
  4: "lg:col-span-4",
  5: "lg:col-span-5",
} as const;

/** Summary values share a surface and dividers instead of separate cards. */
export function DashboardMetricGroup({
  children,
  columns,
  className,
  ...props
}: React.HTMLAttributes<HTMLElement> & { columns?: 2 | 3 | 4 | 5 }) {
  const cells = React.Children.toArray(children);
  const count = cells.length;
  const desktopColumns =
    columns ?? (Math.max(2, Math.min(count, 4)) as 2 | 3 | 4);
  const remainder = count % desktopColumns;
  const lastSpan = (
    remainder ? desktopColumns - remainder + 1 : 1
  ) as keyof typeof spanClasses;
  return (
    <section
      data-metric-columns={desktopColumns}
      className={cn(
        "dashboard-metric-group dashboard-glass-card grid min-w-0 grid-cols-2 overflow-hidden rounded-xl border",
        columnClasses[desktopColumns],
        className
      )}
      {...props}
    >
      {cells.map((cell, index) => (
        <div
          key={React.isValidElement(cell) ? (cell.key ?? index) : index}
          data-metric-cell="true"
          className={cn(
            "min-w-0",
            index === count - 1 && count % 2 === 1 && "col-span-2",
            index === count - 1 ? spanClasses[lastSpan] : "lg:col-span-1"
          )}
        >
          {cell}
        </div>
      ))}
    </section>
  );
}
