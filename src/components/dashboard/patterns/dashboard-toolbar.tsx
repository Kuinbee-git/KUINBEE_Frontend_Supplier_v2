"use client";

import * as React from "react";
import { Search, X } from "lucide-react";

import { cn } from "@/lib/utils/cn";
import { DashboardButton } from "../ui/dashboard-button";
import { DashboardCard } from "../ui/dashboard-card";
import { DashboardInput } from "../ui/dashboard-form";

export interface DashboardToolbarProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "aria-label" | "role"
> {
  ariaLabel: string;
  landmark?: "region" | "search";
}

export const DashboardToolbar = React.forwardRef<
  HTMLDivElement,
  DashboardToolbarProps
>(({ ariaLabel, children, className, landmark = "search", ...props }, ref) => (
  <DashboardCard
    ref={ref}
    role={landmark}
    aria-label={ariaLabel}
    className={cn("p-3 sm:p-4", className)}
    {...props}
  >
    <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center">
      {children}
    </div>
  </DashboardCard>
));

DashboardToolbar.displayName = "DashboardToolbar";

export interface DashboardSearchFieldProps extends Omit<
  React.ComponentPropsWithoutRef<typeof DashboardInput>,
  "onChange" | "type" | "value"
> {
  clearLabel?: string;
  label: string;
  onClear?: () => void;
  onValueChange: (value: string) => void;
  value: string;
}

export const DashboardSearchField = React.forwardRef<
  HTMLInputElement,
  DashboardSearchFieldProps
>(
  (
    {
      className,
      clearLabel,
      disabled,
      id,
      label,
      onClear,
      onValueChange,
      placeholder,
      readOnly,
      value,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const inputId = id ?? `dashboard-search-${generatedId.replaceAll(":", "")}`;
    const canClear = value.length > 0 && !disabled && !readOnly;
    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

    const handleClear = () => {
      if (onClear) {
        onClear();
      } else {
        onValueChange("");
      }

      window.requestAnimationFrame(() => inputRef.current?.focus());
    };

    return (
      <div className={cn("min-w-0 flex-1", className)}>
        <label htmlFor={inputId} className="sr-only">
          {label}
        </label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <DashboardInput
            ref={inputRef}
            id={inputId}
            type="search"
            value={value}
            onChange={(event) => onValueChange(event.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            readOnly={readOnly}
            className={cn(
              "pl-9 pr-10 [&::-webkit-search-cancel-button]:appearance-none",
              !canClear && "pr-3"
            )}
            {...props}
          />
          {canClear ? (
            <DashboardButton
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1.5 top-1/2 size-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={clearLabel ?? `Clear ${label}`}
              onClick={handleClear}
            >
              <X aria-hidden="true" />
            </DashboardButton>
          ) : null}
        </div>
      </div>
    );
  }
);

DashboardSearchField.displayName = "DashboardSearchField";

export interface DashboardToolbarFiltersProps extends React.HTMLAttributes<HTMLDivElement> {
  ariaLabel?: string;
}

export const DashboardToolbarFilters = React.forwardRef<
  HTMLDivElement,
  DashboardToolbarFiltersProps
>(({ ariaLabel, className, ...props }, ref) => (
  <div
    ref={ref}
    role={ariaLabel ? "group" : undefined}
    aria-label={ariaLabel}
    className={cn(
      "grid min-w-0 gap-3 sm:grid-cols-2 lg:flex lg:w-auto lg:flex-wrap lg:items-center lg:[&>*]:min-w-44",
      className
    )}
    {...props}
  />
));

DashboardToolbarFilters.displayName = "DashboardToolbarFilters";

export interface DashboardToolbarActionsProps extends React.HTMLAttributes<HTMLDivElement> {
  ariaLabel?: string;
}

export const DashboardToolbarActions = React.forwardRef<
  HTMLDivElement,
  DashboardToolbarActionsProps
>(({ ariaLabel, className, ...props }, ref) => (
  <div
    ref={ref}
    role={ariaLabel ? "group" : undefined}
    aria-label={ariaLabel}
    className={cn(
      "flex min-w-0 flex-col-reverse gap-2 [&>*]:w-full sm:flex-row sm:flex-wrap sm:items-center sm:[&>*]:w-auto lg:ml-auto lg:justify-end",
      className
    )}
    {...props}
  />
));

DashboardToolbarActions.displayName = "DashboardToolbarActions";
