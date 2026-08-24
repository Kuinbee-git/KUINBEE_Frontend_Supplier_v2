import * as React from "react";

import { cn } from "@/lib/utils/cn";

export const DashboardCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "dashboard-glass-card rounded-xl border text-card-foreground",
      className
    )}
    {...props}
  />
));

DashboardCard.displayName = "DashboardCard";

export const DashboardCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col gap-1.5 border-b border-border px-4 py-4 md:px-6 md:py-5",
      className
    )}
    {...props}
  />
));

DashboardCardHeader.displayName = "DashboardCardHeader";

export interface DashboardCardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  headingLevel?: "h2" | "h3" | "h4";
}

export const DashboardCardTitle = React.forwardRef<
  HTMLHeadingElement,
  DashboardCardTitleProps
>(({ className, headingLevel = "h3", ...props }, ref) => {
  const Heading = headingLevel;

  return (
    <Heading
      ref={ref}
      className={cn(
        "text-base font-semibold leading-6 tracking-tight text-foreground",
        className
      )}
      {...props}
    />
  );
});

DashboardCardTitle.displayName = "DashboardCardTitle";

export const DashboardCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      "text-sm leading-[1.375rem] text-muted-foreground",
      className
    )}
    {...props}
  />
));

DashboardCardDescription.displayName = "DashboardCardDescription";

export const DashboardCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("px-4 py-5 md:px-6 md:py-6", className)}
    {...props}
  />
));

DashboardCardContent.displayName = "DashboardCardContent";

export const DashboardCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col-reverse gap-3 border-t border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-end md:px-6",
      className
    )}
    {...props}
  />
));

DashboardCardFooter.displayName = "DashboardCardFooter";
