"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

import { cn } from "@/lib/utils/cn";

const DashboardTooltipProvider = TooltipPrimitive.Provider;
const DashboardTooltip = TooltipPrimitive.Root;
const DashboardTooltipTrigger = TooltipPrimitive.Trigger;

const DashboardTooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, collisionPadding = 8, sideOffset = 6, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      collisionPadding={collisionPadding}
      sideOffset={sideOffset}
      className={cn(
        "supplier-dashboard-portal dashboard-glass-popover z-[var(--dashboard-layer-tooltip)] max-w-64 rounded-md border border-border px-2.5 py-1.5 text-xs leading-[1.125rem] text-popover-foreground outline-none",
        "transition-opacity duration-100 data-[state=closed]:opacity-0 data-[state=instant-open]:opacity-100 data-[state=delayed-open]:opacity-100 motion-reduce:transition-none",
        className
      )}
      {...props}
    />
  </TooltipPrimitive.Portal>
));

DashboardTooltipContent.displayName = TooltipPrimitive.Content.displayName;

export {
  DashboardTooltip,
  DashboardTooltipContent,
  DashboardTooltipProvider,
  DashboardTooltipTrigger,
};
