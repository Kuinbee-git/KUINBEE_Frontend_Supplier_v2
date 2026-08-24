"use client";

import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { Check, ChevronRight, Circle } from "lucide-react";

import { cn } from "@/lib/utils/cn";
import {
  getDashboardPopoverLayerClass,
  useDashboardPortalLayer,
} from "./dashboard-portal-layer";

const DashboardDropdownMenu = DropdownMenuPrimitive.Root;
const DashboardDropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
const DashboardDropdownMenuGroup = DropdownMenuPrimitive.Group;
const DashboardDropdownMenuSub = DropdownMenuPrimitive.Sub;
const DashboardDropdownMenuPortal = DropdownMenuPrimitive.Portal;

const dashboardMenuContentClasses =
  "supplier-dashboard-portal dashboard-glass-popover dashboard-scroll-region max-h-[var(--radix-dropdown-menu-content-available-height)] min-w-40 overflow-x-hidden overflow-y-auto rounded-lg border border-border p-1 text-popover-foreground outline-none transition-opacity duration-100 data-[state=closed]:opacity-0 data-[state=open]:opacity-100 motion-reduce:transition-none";

type DashboardDropdownMenuRadioGroupAccessibleName =
  | { "aria-label": string; "aria-labelledby"?: string }
  | { "aria-label"?: string; "aria-labelledby": string };

type DashboardDropdownMenuRadioGroupProps = React.ComponentPropsWithoutRef<
  typeof DropdownMenuPrimitive.RadioGroup
> &
  DashboardDropdownMenuRadioGroupAccessibleName;

const DashboardDropdownMenuRadioGroup = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioGroup>,
  DashboardDropdownMenuRadioGroupProps
>((props, ref) => <DropdownMenuPrimitive.RadioGroup ref={ref} {...props} />);
DashboardDropdownMenuRadioGroup.displayName =
  DropdownMenuPrimitive.RadioGroup.displayName;

const DashboardDropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean;
  }
>(({ className, inset, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    data-dashboard-inset={inset || undefined}
    className={cn(
      "flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-2 text-sm outline-none transition-colors",
      "data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
      "data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground",
      "data-[highlighted]:ring-2 data-[highlighted]:ring-inset data-[highlighted]:ring-[var(--dashboard-focus-ring)]",
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      "data-[dashboard-inset=true]:pl-8 motion-reduce:transition-none",
      className
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto size-4" aria-hidden="true" />
  </DropdownMenuPrimitive.SubTrigger>
));
DashboardDropdownMenuSubTrigger.displayName =
  DropdownMenuPrimitive.SubTrigger.displayName;

const DashboardDropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, sideOffset = 4, ...props }, ref) => {
  const portalLayer = useDashboardPortalLayer();

  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.SubContent
        ref={ref}
        sideOffset={sideOffset}
        className={cn(
          dashboardMenuContentClasses,
          getDashboardPopoverLayerClass(portalLayer),
          className
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
});
DashboardDropdownMenuSubContent.displayName =
  DropdownMenuPrimitive.SubContent.displayName;

const DashboardDropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => {
  const portalLayer = useDashboardPortalLayer();

  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn(
          dashboardMenuContentClasses,
          getDashboardPopoverLayerClass(portalLayer),
          className
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
});
DashboardDropdownMenuContent.displayName =
  DropdownMenuPrimitive.Content.displayName;

const DashboardDropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean;
    variant?: "default" | "destructive";
  }
>(({ className, inset, variant = "default", ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    data-dashboard-inset={inset || undefined}
    data-dashboard-variant={variant}
    className={cn(
      "relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-2 text-sm outline-none transition-colors",
      "data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground",
      "data-[highlighted]:ring-2 data-[highlighted]:ring-inset data-[highlighted]:ring-[var(--dashboard-focus-ring)]",
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      "data-[dashboard-inset=true]:pl-8 motion-reduce:transition-none",
      variant === "destructive" &&
        "text-[var(--dashboard-danger-foreground)] data-[highlighted]:bg-destructive/10 data-[highlighted]:text-[var(--dashboard-danger-foreground)]",
      className
    )}
    {...props}
  />
));
DashboardDropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;

const DashboardDropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    checked={checked}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-2 pl-8 pr-2 text-sm outline-none transition-colors",
      "data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground",
      "data-[highlighted]:ring-2 data-[highlighted]:ring-inset data-[highlighted]:ring-[var(--dashboard-focus-ring)]",
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      "motion-reduce:transition-none",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex size-4 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Check className="size-4" aria-hidden="true" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
));
DashboardDropdownMenuCheckboxItem.displayName =
  DropdownMenuPrimitive.CheckboxItem.displayName;

const DashboardDropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-2 pl-8 pr-2 text-sm outline-none transition-colors",
      "data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground",
      "data-[highlighted]:ring-2 data-[highlighted]:ring-inset data-[highlighted]:ring-[var(--dashboard-focus-ring)]",
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      "motion-reduce:transition-none",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex size-4 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Circle className="size-2 fill-current" aria-hidden="true" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
));
DashboardDropdownMenuRadioItem.displayName =
  DropdownMenuPrimitive.RadioItem.displayName;

const DashboardDropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    data-dashboard-inset={inset || undefined}
    className={cn(
      "px-2 py-1.5 text-xs font-medium text-muted-foreground data-[dashboard-inset=true]:pl-8",
      className
    )}
    {...props}
  />
));
DashboardDropdownMenuLabel.displayName =
  DropdownMenuPrimitive.Label.displayName;

const DashboardDropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-border", className)}
    {...props}
  />
));
DashboardDropdownMenuSeparator.displayName =
  DropdownMenuPrimitive.Separator.displayName;

function DashboardDropdownMenuShortcut({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "ml-auto text-xs tracking-widest text-muted-foreground",
        className
      )}
      {...props}
    />
  );
}
DashboardDropdownMenuShortcut.displayName = "DashboardDropdownMenuShortcut";

export {
  DashboardDropdownMenu,
  DashboardDropdownMenuCheckboxItem,
  DashboardDropdownMenuContent,
  DashboardDropdownMenuGroup,
  DashboardDropdownMenuItem,
  DashboardDropdownMenuLabel,
  DashboardDropdownMenuPortal,
  DashboardDropdownMenuRadioGroup,
  DashboardDropdownMenuRadioItem,
  DashboardDropdownMenuSeparator,
  DashboardDropdownMenuShortcut,
  DashboardDropdownMenuSub,
  DashboardDropdownMenuSubContent,
  DashboardDropdownMenuSubTrigger,
  DashboardDropdownMenuTrigger,
};
