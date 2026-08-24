import * as React from "react";

import { cn } from "@/lib/utils/cn";
import {
  DashboardCard,
  DashboardCardContent,
  DashboardCardHeader,
} from "../ui/dashboard-card";

export type DashboardPageWidth = "wide" | "standard" | "narrow";

const pageWidthClasses: Record<DashboardPageWidth, string> = {
  wide: "max-w-[var(--dashboard-content-max-width)]",
  standard: "max-w-[70rem]",
  narrow: "max-w-[47.5rem]",
};

export interface DashboardPageProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: DashboardPageWidth;
}

export const DashboardPage = React.forwardRef<
  HTMLDivElement,
  DashboardPageProps
>(({ className, width = "wide", ...props }, ref) => (
  <div
    ref={ref}
    data-dashboard-page-width={width}
    className={cn(
      "mx-auto flex min-h-full w-full flex-col gap-[var(--dashboard-section-gap)] px-[var(--dashboard-page-padding-inline)] py-[var(--dashboard-page-padding-block)]",
      pageWidthClasses[width],
      className
    )}
    {...props}
  />
));

DashboardPage.displayName = "DashboardPage";

export interface DashboardPageHeaderProps extends Omit<
  React.HTMLAttributes<HTMLElement>,
  "title"
> {
  actions?: React.ReactNode;
  breadcrumbs?: React.ReactNode;
  description?: React.ReactNode;
  meta?: React.ReactNode;
  title: React.ReactNode;
}

export const DashboardPageHeader = React.forwardRef<
  HTMLElement,
  DashboardPageHeaderProps
>(
  (
    { actions, breadcrumbs, className, description, meta, title, ...props },
    ref
  ) => (
    <header
      ref={ref}
      className={cn(
        "flex min-w-0 flex-col gap-5 sm:flex-row sm:items-start sm:justify-between",
        className
      )}
      {...props}
    >
      <div className="min-w-0 flex-1">
        {breadcrumbs ? (
          <nav
            aria-label="Breadcrumb"
            className="mb-4 text-sm text-muted-foreground"
          >
            {breadcrumbs}
          </nav>
        ) : null}

        <h1 className="text-2xl font-semibold leading-8 tracking-tight text-foreground lg:text-[1.875rem] lg:leading-9">
          {title}
        </h1>

        {description ? (
          <div className="mt-2 max-w-2xl text-sm leading-[1.375rem] text-muted-foreground sm:text-base sm:leading-6">
            {description}
          </div>
        ) : null}

        {meta ? (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {meta}
          </div>
        ) : null}
      </div>

      {actions ? (
        <div className="flex w-full shrink-0 flex-wrap items-center gap-2 sm:w-auto sm:justify-end sm:pt-0.5">
          {actions}
        </div>
      ) : null}
    </header>
  )
);

DashboardPageHeader.displayName = "DashboardPageHeader";

export interface DashboardSplitLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  aside?: React.ReactNode;
  asideAriaLabel?: string;
  asideClassName?: string;
  mainClassName?: string;
  stickyAside?: boolean;
}

function DashboardSplitLayout({
  aside,
  asideAriaLabel,
  asideClassName,
  children,
  className,
  mainClassName,
  stickyAside = false,
  ...props
}: DashboardSplitLayoutProps) {
  return (
    <div
      className={cn(
        "grid min-w-0 gap-[var(--dashboard-grid-gap)]",
        aside && "xl:grid-cols-[minmax(0,1fr)_20rem]",
        className
      )}
      {...props}
    >
      <div className={cn("min-w-0 space-y-6", mainClassName)}>{children}</div>
      {aside ? (
        <aside
          aria-label={asideAriaLabel}
          className={cn(
            "min-w-0 space-y-6",
            stickyAside && "xl:sticky xl:top-6 xl:self-start",
            asideClassName
          )}
        >
          {aside}
        </aside>
      ) : null}
    </div>
  );
}

export type DashboardDetailLayoutProps = DashboardSplitLayoutProps;

export function DashboardDetailLayout({
  asideAriaLabel = "Supporting information",
  ...props
}: DashboardDetailLayoutProps) {
  return <DashboardSplitLayout asideAriaLabel={asideAriaLabel} {...props} />;
}

export type DashboardFormLayoutProps = DashboardSplitLayoutProps;

export function DashboardFormLayout({
  asideAriaLabel = "Form guidance",
  ...props
}: DashboardFormLayoutProps) {
  return <DashboardSplitLayout asideAriaLabel={asideAriaLabel} {...props} />;
}

export interface DashboardFormActionsProps extends React.HTMLAttributes<HTMLDivElement> {
  status?: React.ReactNode;
  sticky?: boolean;
}

export const DashboardFormActions = React.forwardRef<
  HTMLDivElement,
  DashboardFormActionsProps
>(({ children, className, status, sticky = false, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "dashboard-form-actions flex flex-col gap-3 border-t border-border py-4 sm:flex-row sm:items-center",
      status ? "sm:justify-between" : "sm:justify-end",
      sticky && "sticky bottom-0 z-20",
      className
    )}
    {...props}
  >
    {status ? (
      <div
        className="min-w-0 text-sm text-muted-foreground"
        role="status"
        aria-live="polite"
      >
        {status}
      </div>
    ) : null}
    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
      {children}
    </div>
  </div>
));

DashboardFormActions.displayName = "DashboardFormActions";

export interface DashboardSectionProps extends Omit<
  React.HTMLAttributes<HTMLElement>,
  "title"
> {
  actions?: React.ReactNode;
  description?: React.ReactNode;
  surface?: "card" | "plain";
  title: React.ReactNode;
}

export const DashboardSection = React.forwardRef<
  HTMLElement,
  DashboardSectionProps
>(
  (
    {
      actions,
      children,
      className,
      description,
      surface = "card",
      title,
      ...props
    },
    ref
  ) => {
    const heading = (
      <div className="min-w-0 flex-1">
        <h2 className="text-xl font-semibold leading-7 tracking-tight text-foreground">
          {title}
        </h2>
        {description ? (
          <div className="mt-1 text-sm leading-[1.375rem] text-muted-foreground">
            {description}
          </div>
        ) : null}
      </div>
    );

    if (surface === "plain") {
      return (
        <section
          ref={ref}
          className={cn("min-w-0 space-y-4", className)}
          {...props}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            {heading}
            {actions ? (
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                {actions}
              </div>
            ) : null}
          </div>
          {children}
        </section>
      );
    }

    return (
      <section ref={ref} className={cn("min-w-0", className)} {...props}>
        <DashboardCard>
          <DashboardCardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
            {heading}
            {actions ? (
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                {actions}
              </div>
            ) : null}
          </DashboardCardHeader>
          <DashboardCardContent>{children}</DashboardCardContent>
        </DashboardCard>
      </section>
    );
  }
);

DashboardSection.displayName = "DashboardSection";
