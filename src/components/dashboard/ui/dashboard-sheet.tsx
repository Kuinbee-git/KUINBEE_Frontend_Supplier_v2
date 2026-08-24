"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { cn } from "@/lib/utils/cn";
import { DashboardPortalLayerProvider } from "./dashboard-portal-layer";

const DashboardSheet = DialogPrimitive.Root;
const DashboardSheetTrigger = DialogPrimitive.Trigger;
const DashboardSheetClose = DialogPrimitive.Close;

type DashboardSheetContentProps = Omit<
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>,
  "title"
> & {
  closeLabel?: string;
  description: React.ReactNode;
  footer?: React.ReactNode;
  side?: "left" | "right";
  title: React.ReactNode;
};

const sheetSideClasses = {
  left: [
    "left-0 border-r",
    "data-[state=closed]:-translate-x-full data-[state=open]:translate-x-0",
  ],
  right: [
    "right-0 border-l",
    "data-[state=closed]:translate-x-full data-[state=open]:translate-x-0",
  ],
} as const;

const DashboardSheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DashboardSheetContentProps
>(
  (
    {
      children,
      className,
      closeLabel = "Close panel",
      description,
      footer,
      side = "right",
      title,
      ...props
    },
    ref
  ) => (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        className={cn(
          "supplier-dashboard-portal fixed inset-0 z-[var(--dashboard-layer-dialog-overlay)] bg-[var(--dashboard-overlay)] backdrop-blur-sm",
          "transition-opacity duration-150 data-[state=closed]:opacity-0 data-[state=open]:opacity-100 motion-reduce:transition-none"
        )}
      />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "supplier-dashboard-portal dashboard-glass-popover fixed inset-y-0 z-[var(--dashboard-layer-dialog)] flex w-[min(24rem,calc(100%-1rem))] flex-col border-border text-popover-foreground outline-none",
          "transition-transform duration-200 motion-reduce:transition-none",
          sheetSideClasses[side],
          className
        )}
        {...props}
      >
        <DashboardPortalLayerProvider value="modal">
          <div className="shrink-0 border-b border-border px-5 pb-4 pt-5 pr-12 sm:px-6 sm:pb-5 sm:pt-6 sm:pr-12">
            <DialogPrimitive.Title className="text-lg font-semibold leading-6 tracking-tight">
              {title}
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="mt-1.5 text-sm leading-5 text-muted-foreground">
              {description}
            </DialogPrimitive.Description>
          </div>
          <div className="dashboard-scroll-region min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
            {children}
          </div>
          {footer ? (
            <div className="shrink-0 border-t border-border px-5 py-4 sm:px-6">
              {footer}
            </div>
          ) : null}
          <DialogPrimitive.Close className="absolute right-4 top-4 inline-flex size-8 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-[var(--dashboard-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-popover motion-reduce:transition-none">
            <X className="size-4" aria-hidden="true" />
            <span className="sr-only">{closeLabel}</span>
          </DialogPrimitive.Close>
        </DashboardPortalLayerProvider>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
);

DashboardSheetContent.displayName = "DashboardSheetContent";

export {
  DashboardSheet,
  DashboardSheetClose,
  DashboardSheetContent,
  DashboardSheetTrigger,
};
