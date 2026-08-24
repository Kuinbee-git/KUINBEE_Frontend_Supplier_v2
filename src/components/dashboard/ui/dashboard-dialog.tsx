"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { cn } from "@/lib/utils/cn";
import { DashboardPortalLayerProvider } from "./dashboard-portal-layer";

const DashboardDialog = DialogPrimitive.Root;
const DashboardDialogTrigger = DialogPrimitive.Trigger;
const DashboardDialogClose = DialogPrimitive.Close;

const DashboardDialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "supplier-dashboard-portal fixed inset-0 z-[var(--dashboard-layer-dialog-overlay)] bg-[var(--dashboard-overlay)] backdrop-blur-sm",
      "data-[state=closed]:opacity-0 data-[state=open]:opacity-100",
      "transition-opacity duration-150 motion-reduce:transition-none",
      className
    )}
    {...props}
  />
));
DashboardDialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

type DashboardDialogContentProps = Omit<
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>,
  "title"
> & {
  closeLabel?: string;
  description: React.ReactNode;
  footer?: React.ReactNode;
  showCloseButton?: boolean;
  size?: "sm" | "md" | "lg";
  title: React.ReactNode;
};

const dashboardDialogSizeClasses = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
} as const;

const DashboardDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DashboardDialogContentProps
>(
  (
    {
      className,
      children,
      closeLabel = "Close dialog",
      description,
      footer,
      showCloseButton = true,
      size = "md",
      title,
      ...props
    },
    ref
  ) => (
    <DialogPrimitive.Portal>
      <DashboardDialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "supplier-dashboard-portal dashboard-glass-popover fixed left-1/2 top-1/2 z-[var(--dashboard-layer-dialog)] flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border border-border p-0 text-popover-foreground outline-none",
          "data-[state=closed]:opacity-0 data-[state=open]:opacity-100",
          "transition-opacity duration-150 motion-reduce:transition-none",
          dashboardDialogSizeClasses[size],
          className
        )}
        {...props}
      >
        <DashboardPortalLayerProvider value="modal">
          <DashboardDialogHeader>
            <DashboardDialogTitle>{title}</DashboardDialogTitle>
            <DashboardDialogDescription>
              {description}
            </DashboardDialogDescription>
          </DashboardDialogHeader>
          <DashboardDialogBody>{children}</DashboardDialogBody>
          {footer ? (
            <DashboardDialogFooter>{footer}</DashboardDialogFooter>
          ) : null}
          {showCloseButton && (
            <DialogPrimitive.Close
              className={cn(
                "absolute right-4 top-4 inline-flex size-8 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                "focus-visible:ring-2 focus-visible:ring-[var(--dashboard-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-popover",
                "disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none"
              )}
            >
              <X className="size-4" aria-hidden="true" />
              <span className="sr-only">{closeLabel}</span>
            </DialogPrimitive.Close>
          )}
        </DashboardPortalLayerProvider>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
);
DashboardDialogContent.displayName = DialogPrimitive.Content.displayName;

function DashboardDialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex shrink-0 flex-col gap-1.5 px-5 pb-4 pt-5 pr-12 text-left sm:px-6 sm:pb-5 sm:pt-6 sm:pr-12",
        className
      )}
      data-dashboard-dialog-region="header"
      {...props}
    />
  );
}
DashboardDialogHeader.displayName = "DashboardDialogHeader";

function DashboardDialogBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "dashboard-scroll-region min-h-0 flex-1 overflow-y-auto border-t border-border px-5 py-4 sm:px-6",
        className
      )}
      data-dashboard-dialog-region="body"
      {...props}
    />
  );
}
DashboardDialogBody.displayName = "DashboardDialogBody";

function DashboardDialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex shrink-0 flex-col-reverse gap-2 border-t border-border px-5 py-4 sm:flex-row sm:justify-end sm:px-6",
        className
      )}
      data-dashboard-dialog-region="footer"
      {...props}
    />
  );
}
DashboardDialogFooter.displayName = "DashboardDialogFooter";

const DashboardDialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-6 tracking-tight text-popover-foreground",
      className
    )}
    {...props}
  />
));
DashboardDialogTitle.displayName = DialogPrimitive.Title.displayName;

const DashboardDialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm leading-5 text-muted-foreground", className)}
    {...props}
  />
));
DashboardDialogDescription.displayName =
  DialogPrimitive.Description.displayName;

export {
  DashboardDialog,
  DashboardDialogBody,
  DashboardDialogClose,
  DashboardDialogContent,
  DashboardDialogDescription,
  DashboardDialogFooter,
  DashboardDialogHeader,
  DashboardDialogOverlay,
  DashboardDialogTitle,
  DashboardDialogTrigger,
};
