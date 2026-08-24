"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";

import { cn } from "@/lib/utils/cn";
import {
  getDashboardPopoverLayerClass,
  useDashboardPortalLayer,
} from "./dashboard-portal-layer";

const DashboardSelect = SelectPrimitive.Root;
const DashboardSelectGroup = SelectPrimitive.Group;
const DashboardSelectValue = SelectPrimitive.Value;

const DashboardSelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "dashboard-field-control flex h-10 w-full items-center justify-between gap-2 rounded-lg border px-3 text-sm text-foreground shadow-none outline-none transition-colors",
      "data-[placeholder]:text-muted-foreground",
      "focus-visible:border-[var(--dashboard-focus-ring)] focus-visible:ring-2 focus-visible:ring-[var(--dashboard-focus-ring)] focus-visible:ring-offset-0",
      "aria-invalid:border-[var(--dashboard-danger)] aria-invalid:ring-2 aria-invalid:ring-[var(--dashboard-danger-foreground)]",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "motion-reduce:transition-none",
      "[&>span]:line-clamp-1",
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown
        className="size-4 shrink-0 text-muted-foreground"
        aria-hidden="true"
      />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
DashboardSelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const DashboardSelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center bg-popover py-1 text-popover-foreground",
      className
    )}
    {...props}
  >
    <ChevronUp className="size-4" aria-hidden="true" />
  </SelectPrimitive.ScrollUpButton>
));
DashboardSelectScrollUpButton.displayName =
  SelectPrimitive.ScrollUpButton.displayName;

const DashboardSelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center bg-popover py-1 text-popover-foreground",
      className
    )}
    {...props}
  >
    <ChevronDown className="size-4" aria-hidden="true" />
  </SelectPrimitive.ScrollDownButton>
));
DashboardSelectScrollDownButton.displayName =
  SelectPrimitive.ScrollDownButton.displayName;

const DashboardSelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(
  (
    { className, children, position = "popper", sideOffset = 4, ...props },
    ref
  ) => {
    const portalLayer = useDashboardPortalLayer();

    return (
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          ref={ref}
          position={position}
          sideOffset={sideOffset}
          className={cn(
            "supplier-dashboard-portal dashboard-glass-popover relative max-h-[var(--radix-select-content-available-height)] min-w-[8rem] max-w-[var(--radix-select-content-available-width)] overflow-hidden rounded-lg border border-border text-popover-foreground outline-none",
            "data-[state=closed]:opacity-0 data-[state=open]:opacity-100",
            "transition-opacity duration-100 motion-reduce:transition-none",
            getDashboardPopoverLayerClass(portalLayer),
            position === "popper" &&
              "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
            className
          )}
          {...props}
        >
          <DashboardSelectScrollUpButton />
          <SelectPrimitive.Viewport
            className={cn(
              "dashboard-scroll-region max-h-[var(--radix-select-content-available-height)] p-1",
              position === "popper" &&
                "w-full min-w-[var(--radix-select-trigger-width)]"
            )}
          >
            {children}
          </SelectPrimitive.Viewport>
          <DashboardSelectScrollDownButton />
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    );
  }
);
DashboardSelectContent.displayName = SelectPrimitive.Content.displayName;

const DashboardSelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn(
      "px-2 py-1.5 text-xs font-medium text-muted-foreground",
      className
    )}
    {...props}
  />
));
DashboardSelectLabel.displayName = SelectPrimitive.Label.displayName;

const DashboardSelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-2 pl-8 pr-2 text-sm outline-none transition-colors",
      "data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground",
      "data-[highlighted]:ring-2 data-[highlighted]:ring-inset data-[highlighted]:ring-[var(--dashboard-focus-ring)]",
      "data-[state=checked]:font-medium",
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      "motion-reduce:transition-none",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex size-4 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="size-4" aria-hidden="true" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
DashboardSelectItem.displayName = SelectPrimitive.Item.displayName;

const DashboardSelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-border", className)}
    {...props}
  />
));
DashboardSelectSeparator.displayName = SelectPrimitive.Separator.displayName;

export {
  DashboardSelect,
  DashboardSelectContent,
  DashboardSelectGroup,
  DashboardSelectItem,
  DashboardSelectLabel,
  DashboardSelectScrollDownButton,
  DashboardSelectScrollUpButton,
  DashboardSelectSeparator,
  DashboardSelectTrigger,
  DashboardSelectValue,
};
