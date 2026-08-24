import * as React from "react";

import { cn } from "@/lib/utils/cn";

export interface DashboardProgressProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "children"
> {
  label: string;
  max?: number;
  showValue?: boolean;
  value?: number;
}

export const DashboardProgress = React.forwardRef<
  HTMLDivElement,
  DashboardProgressProps
>(({ className, label, max = 100, showValue = true, value, ...props }, ref) => {
  const safeMax = Number.isFinite(max) && max > 0 ? max : 100;
  const safeValue =
    value === undefined || !Number.isFinite(value)
      ? undefined
      : Math.min(Math.max(0, value), safeMax);
  const percentage =
    safeValue === undefined
      ? undefined
      : Math.round((safeValue / safeMax) * 100);

  return (
    <div ref={ref} className={cn("grid gap-2", className)} {...props}>
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-foreground">{label}</span>
        {showValue ? (
          <span className="text-muted-foreground">
            {percentage === undefined ? "In progress" : `${percentage}%`}
          </span>
        ) : null}
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-valuenow={safeValue}
        aria-valuetext={safeValue === undefined ? "In progress" : undefined}
        className="h-2 w-full overflow-hidden rounded-full bg-muted"
      >
        <div
          className={cn(
            "h-full rounded-full bg-[var(--dashboard-indicator)] transition-[width] duration-200 motion-reduce:transition-none",
            safeValue === undefined &&
              "w-1/3 animate-pulse motion-reduce:animate-none"
          )}
          style={
            safeValue === undefined ? undefined : { width: `${percentage}%` }
          }
        />
      </div>
    </div>
  );
});

DashboardProgress.displayName = "DashboardProgress";
