"use client";

import * as React from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CircleX,
  Inbox,
  Info,
  Loader2,
  SearchX,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils/cn";

import { DashboardButton } from "./dashboard-button";
import type { DashboardTone } from "./dashboard-status-badge";

const toneIcons: Record<DashboardTone, LucideIcon> = {
  neutral: Info,
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: CircleX,
};

export const DashboardSkeleton = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    aria-hidden="true"
    className={cn(
      "animate-pulse rounded-lg bg-muted motion-reduce:animate-none",
      className
    )}
    {...props}
  />
));

DashboardSkeleton.displayName = "DashboardSkeleton";

export interface DashboardLoadingStateProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "children"
> {
  label: string;
  rows?: number;
  surface?: "card" | "plain";
  variant?: "spinner" | "skeleton";
}

export const DashboardLoadingState = React.forwardRef<
  HTMLDivElement,
  DashboardLoadingStateProps
>(
  (
    {
      className,
      label,
      rows = 4,
      surface = "card",
      variant = "spinner",
      ...props
    },
    ref
  ) => (
    <div
      ref={ref}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={cn(
        "text-card-foreground",
        surface === "plain"
          ? "rounded-none"
          : "dashboard-glass-card rounded-xl border border-border",
        variant === "spinner"
          ? "flex min-h-56 flex-col items-center justify-center gap-3 px-6 py-10 text-center"
          : "grid gap-3 p-4 sm:p-6",
        className
      )}
      {...props}
    >
      {variant === "spinner" ? (
        <>
          <Loader2
            className="size-6 animate-spin text-muted-foreground motion-reduce:animate-none"
            aria-hidden="true"
          />
          <p className="text-sm text-muted-foreground">{label}</p>
        </>
      ) : (
        <>
          <span className="sr-only">{label}</span>
          <div aria-hidden="true" className="grid gap-3">
            {Array.from({ length: Math.max(1, rows) }, (_, index) => (
              <div
                key={index}
                className="flex items-center gap-3 border-b border-border/70 pb-3 last:border-b-0 last:pb-0"
              >
                <DashboardSkeleton className="size-9 shrink-0" />
                <div className="min-w-0 flex-1 space-y-2">
                  <DashboardSkeleton className="h-3.5 w-2/5 min-w-28" />
                  <DashboardSkeleton className="h-3 w-3/5 min-w-36" />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
);

DashboardLoadingState.displayName = "DashboardLoadingState";

export interface DashboardEmptyStateProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "title"
> {
  action?: React.ReactNode;
  description: React.ReactNode;
  filtered?: boolean;
  headingLevel?: "h2" | "h3" | "h4";
  icon?: LucideIcon;
  onClear?: () => void;
  surface?: "card" | "plain";
  title: React.ReactNode;
}

export const DashboardEmptyState = React.forwardRef<
  HTMLDivElement,
  DashboardEmptyStateProps
>(
  (
    {
      action,
      className,
      description,
      filtered = false,
      headingLevel = "h3",
      icon,
      onClear,
      surface = "card",
      title,
      ...props
    },
    ref
  ) => {
    const Icon = icon ?? (filtered ? SearchX : Inbox);
    const Heading = headingLevel;

    return (
      <div
        ref={ref}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className={cn(
          "flex min-h-56 flex-col items-center justify-center px-6 py-10 text-center text-card-foreground",
          surface === "card"
            ? "dashboard-glass-card rounded-xl border border-dashed border-border"
            : "rounded-none",
          className
        )}
        {...props}
      >
        <span
          className="dashboard-tone-neutral flex size-12 items-center justify-center rounded-xl border"
          aria-hidden="true"
        >
          <Icon className="size-6" />
        </span>
        <Heading className="mt-4 text-base font-semibold leading-6 text-foreground">
          {title}
        </Heading>
        <p className="mt-1.5 max-w-md text-sm leading-6 text-muted-foreground">
          {description}
        </p>
        {filtered && onClear ? (
          <DashboardButton variant="outline" className="mt-5" onClick={onClear}>
            Clear filters
          </DashboardButton>
        ) : action ? (
          <div className="mt-5">{action}</div>
        ) : null}
      </div>
    );
  }
);

DashboardEmptyState.displayName = "DashboardEmptyState";

export interface DashboardErrorStateProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "title"
> {
  message: React.ReactNode;
  headingLevel?: "h2" | "h3" | "h4";
  onRetry?: () => void;
  retryLabel?: string;
  title?: React.ReactNode;
}

export const DashboardErrorState = React.forwardRef<
  HTMLDivElement,
  DashboardErrorStateProps
>(
  (
    {
      className,
      headingLevel = "h3",
      message,
      onRetry,
      retryLabel = "Try again",
      title = "Something went wrong",
      ...props
    },
    ref
  ) => {
    const Heading = headingLevel;

    return (
      <div
        ref={ref}
        role="alert"
        aria-atomic="true"
        className={cn(
          "dashboard-tone-danger flex min-h-56 flex-col items-center justify-center rounded-xl border px-6 py-10 text-center",
          className
        )}
        {...props}
      >
        <CircleX className="size-7" aria-hidden="true" />
        <Heading className="mt-4 text-base font-semibold leading-6">
          {title}
        </Heading>
        <p className="mt-1.5 max-w-md text-sm leading-6">{message}</p>
        {onRetry ? (
          <DashboardButton variant="outline" className="mt-5" onClick={onRetry}>
            {retryLabel}
          </DashboardButton>
        ) : null}
      </div>
    );
  }
);

DashboardErrorState.displayName = "DashboardErrorState";

export interface DashboardSuccessStateProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "title"
> {
  action?: React.ReactNode;
  focusOnMount?: boolean;
  headingLevel?: "h2" | "h3" | "h4";
  icon?: LucideIcon;
  message: React.ReactNode;
  title: React.ReactNode;
}

export const DashboardSuccessState = React.forwardRef<
  HTMLDivElement,
  DashboardSuccessStateProps
>(
  (
    {
      action,
      className,
      focusOnMount = false,
      headingLevel = "h3",
      icon: Icon = CheckCircle2,
      message,
      title,
      ...props
    },
    forwardedRef
  ) => {
    const localRef = React.useRef<HTMLDivElement>(null);
    const Heading = headingLevel;

    React.useImperativeHandle(
      forwardedRef,
      () => localRef.current as HTMLDivElement
    );

    React.useEffect(() => {
      if (focusOnMount) localRef.current?.focus();
    }, [focusOnMount]);

    return (
      <div
        ref={localRef}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        tabIndex={focusOnMount ? -1 : undefined}
        className={cn(
          "dashboard-tone-success flex min-h-56 flex-col items-center justify-center rounded-xl border px-6 py-10 text-center outline-none focus-visible:ring-2 focus-visible:ring-[var(--dashboard-focus-ring)]",
          className
        )}
        {...props}
      >
        <Icon className="size-8" aria-hidden="true" />
        <Heading className="mt-4 text-lg font-semibold leading-7">
          {title}
        </Heading>
        <div className="mt-1.5 max-w-md text-sm leading-6">{message}</div>
        {action ? <div className="mt-5">{action}</div> : null}
      </div>
    );
  }
);

DashboardSuccessState.displayName = "DashboardSuccessState";

export interface DashboardInlineAlertProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "title"
> {
  action?: React.ReactNode;
  icon?: LucideIcon;
  live?: "off" | "polite" | "assertive";
  message?: React.ReactNode;
  title?: React.ReactNode;
  tone?: DashboardTone;
}

export const DashboardInlineAlert = React.forwardRef<
  HTMLDivElement,
  DashboardInlineAlertProps
>(
  (
    {
      action,
      children,
      className,
      icon,
      live,
      message,
      title,
      tone = "info",
      ...props
    },
    ref
  ) => {
    const Icon = icon ?? toneIcons[tone];
    const effectiveLive =
      live ??
      (tone === "danger" ? "assertive" : tone === "success" ? "polite" : "off");
    const role =
      effectiveLive === "assertive"
        ? "alert"
        : effectiveLive === "polite"
          ? "status"
          : undefined;

    return (
      <div
        ref={ref}
        role={role}
        aria-live={effectiveLive === "off" ? undefined : effectiveLive}
        aria-atomic={effectiveLive === "off" ? undefined : "true"}
        className={cn(
          "flex flex-col gap-3 rounded-xl border px-4 py-3 text-sm sm:flex-row sm:items-start",
          `dashboard-tone-${tone}`,
          className
        )}
        {...props}
      >
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            {title ? <p className="font-semibold leading-5">{title}</p> : null}
            {message || children ? (
              <div className={cn("leading-5", title && "mt-0.5")}>
                {message ?? children}
              </div>
            ) : null}
          </div>
        </div>
        {action ? (
          <div className="w-full shrink-0 [&>*]:w-full sm:w-auto sm:[&>*]:w-auto">
            {action}
          </div>
        ) : null}
      </div>
    );
  }
);

DashboardInlineAlert.displayName = "DashboardInlineAlert";
