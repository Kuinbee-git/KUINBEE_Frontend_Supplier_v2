import * as React from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils/cn";
import { DashboardCard } from "../ui/dashboard-card";
import { DashboardSkeleton } from "../ui/dashboard-state";
import {
  DashboardStatusBadge,
  type DashboardTone,
} from "../ui/dashboard-status-badge";

export interface DashboardMetricCardProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "children"
> {
  icon?: LucideIcon;
  label: React.ReactNode;
  loading?: boolean;
  loadingLabel?: string;
  status?: React.ReactNode;
  statusTone?: DashboardTone;
  supportingText?: React.ReactNode;
  value: React.ReactNode;
}

/**
 * A compact summary metric for overview and analytics grids.
 *
 * `status` may contain either a trend (for example, "+12%") or a short state
 * (for example, "On track"). Semantic colour is intentionally limited to the
 * status badge; the metric value and surface stay neutral.
 */
export const DashboardMetricCard = React.forwardRef<
  HTMLDivElement,
  DashboardMetricCardProps
>(
  (
    {
      className,
      icon: Icon,
      label,
      loading = false,
      loadingLabel = "Loading metric",
      status,
      statusTone = "neutral",
      supportingText,
      value,
      ...props
    },
    ref
  ) => (
    <DashboardCard
      ref={ref}
      className={cn("h-full min-h-36 p-4 md:p-6", className)}
      {...props}
    >
      {loading ? (
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="flex h-full flex-col"
        >
          <span className="sr-only">{loadingLabel}</span>
          <div
            className="flex items-start justify-between gap-4"
            aria-hidden="true"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium leading-5 text-muted-foreground">
                {label}
              </p>
              <DashboardSkeleton className="mt-3 h-8 w-28 max-w-full" />
            </div>
            {Icon ? <DashboardSkeleton className="size-9 shrink-0" /> : null}
          </div>
          {supportingText || status ? (
            <div
              className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-2 pt-4"
              aria-hidden="true"
            >
              {supportingText ? (
                <DashboardSkeleton className="h-3.5 w-32 max-w-full" />
              ) : null}
              {status ? (
                <DashboardSkeleton className="h-6 w-16 rounded-full" />
              ) : null}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="flex h-full flex-col">
          <div className="flex items-start justify-between gap-4">
            <dl className="min-w-0 flex-1">
              <dt className="text-sm font-medium leading-5 text-muted-foreground">
                {label}
              </dt>
              <dd className="mt-2 break-words text-2xl font-semibold leading-8 tracking-tight text-foreground tabular-nums">
                {value}
              </dd>
            </dl>
            {Icon ? (
              <span
                className="dashboard-tone-neutral flex size-9 shrink-0 items-center justify-center rounded-lg border"
                aria-hidden="true"
              >
                <Icon className="size-4" />
              </span>
            ) : null}
          </div>

          {supportingText || status ? (
            <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-2 pt-4">
              {supportingText ? (
                <p className="min-w-0 flex-1 text-xs leading-[1.125rem] text-muted-foreground">
                  {supportingText}
                </p>
              ) : null}
              {status ? (
                <DashboardStatusBadge tone={statusTone}>
                  {status}
                </DashboardStatusBadge>
              ) : null}
            </div>
          ) : null}
        </div>
      )}
    </DashboardCard>
  )
);

DashboardMetricCard.displayName = "DashboardMetricCard";
