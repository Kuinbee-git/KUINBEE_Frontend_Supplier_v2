import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils/cn";

export type DashboardButtonSize = "compact" | "default" | "large" | "icon";

const dashboardButtonVariants = cva(
  "dashboard-button relative inline-flex items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-[calc(var(--dashboard-radius)+0.125rem)] border text-sm font-medium transition-[background-color,border-color,color,box-shadow,transform] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dashboard-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "dashboard-button-primary",
        secondary: "dashboard-button-secondary",
        outline: "dashboard-button-outline dashboard-glass-control",
        ghost: "dashboard-button-ghost",
        destructive: "dashboard-button-destructive",
        link: "dashboard-button-link underline-offset-4 hover:underline",
      },
      size: {
        compact: "h-9 px-3.5",
        default: "h-10 px-4",
        large: "h-11 px-5",
        icon: "size-10 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

type DashboardButtonBaseProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "disabled"
> &
  Omit<VariantProps<typeof dashboardButtonVariants>, "size">;

type DashboardButtonAccessibleSize =
  | ({ size: "icon" } & (
      | { "aria-label": string; "aria-labelledby"?: string }
      | { "aria-label"?: string; "aria-labelledby": string }
    ))
  | {
      size?: Exclude<DashboardButtonSize, "icon">;
    };

type DashboardButtonRenderMode =
  | { asChild: true; disabled?: never }
  | { asChild?: false; disabled?: boolean };

export type DashboardButtonProps = DashboardButtonBaseProps &
  DashboardButtonAccessibleSize &
  DashboardButtonRenderMode;

export const DashboardButton = React.forwardRef<
  HTMLButtonElement,
  DashboardButtonProps
>(
  (
    {
      asChild = false,
      className,
      disabled,
      size = "default",
      type = "button",
      variant = "default",
      ...props
    },
    ref
  ) => {
    const Component = asChild ? Slot : "button";

    return (
      <Component
        ref={ref}
        className={cn(dashboardButtonVariants({ size, variant, className }))}
        data-dashboard-variant={variant}
        {...(!asChild ? { disabled, type } : {})}
        {...props}
      />
    );
  }
);

DashboardButton.displayName = "DashboardButton";
