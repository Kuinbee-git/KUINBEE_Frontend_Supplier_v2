import * as React from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils/cn";

export type DashboardTone =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "danger";

type DashboardStatusBadgeContent =
  | {
      children: React.ReactNode;
      label?: never;
    }
  | {
      children?: never;
      label: React.ReactNode;
    };

export type DashboardStatusBadgeProps = Omit<
  React.HTMLAttributes<HTMLSpanElement>,
  "children"
> &
  DashboardStatusBadgeContent & {
    icon?: LucideIcon;
    live?: "off" | "polite";
    status?: string;
    tone?: DashboardTone;
  };

/**
 * A compact, text-first status marker for dashboard records.
 *
 * Static badges intentionally do not create a live region. Set `live="polite"`
 * only when an existing badge changes after an asynchronous action.
 */
export const DashboardStatusBadge = React.forwardRef<
  HTMLSpanElement,
  DashboardStatusBadgeProps
>(
  (
    {
      children,
      className,
      icon: Icon,
      label,
      live = "off",
      status,
      tone = "neutral",
      ...props
    },
    ref
  ) => {
    const content = children ?? label;
    const isLive = live === "polite";

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex min-h-6 items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium leading-5",
          "motion-reduce:transition-none",
          `dashboard-tone-${tone}`,
          className
        )}
        data-status={status}
        data-tone={tone}
        role={isLive ? "status" : undefined}
        aria-live={isLive ? "polite" : undefined}
        aria-atomic={isLive ? "true" : undefined}
        {...props}
      >
        {Icon ? (
          <Icon className="size-3.5 shrink-0" aria-hidden="true" />
        ) : null}
        <span>{content}</span>
      </span>
    );
  }
);

DashboardStatusBadge.displayName = "DashboardStatusBadge";
