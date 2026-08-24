"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import * as LabelPrimitive from "@radix-ui/react-label";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { AlertCircle, Check, Circle } from "lucide-react";

import { cn } from "@/lib/utils/cn";

export const DashboardInput = React.forwardRef<
  HTMLInputElement,
  React.ComponentPropsWithoutRef<"input">
>(({ className, type, ...props }, ref) => (
  <input
    ref={ref}
    type={type}
    className={cn(
      "dashboard-field-control flex h-10 w-full rounded-lg border px-3 py-2 text-sm text-foreground shadow-none transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-[var(--dashboard-focus-ring)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dashboard-focus-ring)] focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-[var(--dashboard-danger)] aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-[var(--dashboard-danger-foreground)] motion-reduce:transition-none",
      className
    )}
    {...props}
  />
));

DashboardInput.displayName = "DashboardInput";

export const DashboardTextarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentPropsWithoutRef<"textarea">
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "dashboard-field-control flex min-h-24 w-full resize-y rounded-lg border px-3 py-2 text-sm leading-6 text-foreground shadow-none transition-colors placeholder:text-muted-foreground focus-visible:border-[var(--dashboard-focus-ring)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dashboard-focus-ring)] focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-[var(--dashboard-danger)] aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-[var(--dashboard-danger-foreground)] motion-reduce:transition-none",
      className
    )}
    {...props}
  />
));

DashboardTextarea.displayName = "DashboardTextarea";

export const DashboardCheckbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer size-4 shrink-0 rounded border border-[var(--dashboard-control-border)] bg-input-background text-primary-foreground shadow-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dashboard-focus-ring)] focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-[var(--dashboard-indicator)] data-[state=checked]:bg-[var(--dashboard-indicator)] data-[state=indeterminate]:border-[var(--dashboard-indicator)] data-[state=indeterminate]:bg-[var(--dashboard-indicator)] motion-reduce:transition-none",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
      <Check className="size-3.5" aria-hidden="true" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));

DashboardCheckbox.displayName = "DashboardCheckbox";

type DashboardRadioGroupAccessibleName =
  | { "aria-label": string; "aria-labelledby"?: string }
  | { "aria-label"?: string; "aria-labelledby": string };

export type DashboardRadioGroupProps = React.ComponentPropsWithoutRef<
  typeof RadioGroupPrimitive.Root
> &
  DashboardRadioGroupAccessibleName;

export const DashboardRadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  DashboardRadioGroupProps
>(({ className, ...props }, ref) => (
  <RadioGroupPrimitive.Root
    ref={ref}
    className={cn("grid gap-3", className)}
    {...props}
  />
));

DashboardRadioGroup.displayName = "DashboardRadioGroup";

export const DashboardRadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, ...props }, ref) => (
  <RadioGroupPrimitive.Item
    ref={ref}
    className={cn(
      "aspect-square size-4 rounded-full border border-[var(--dashboard-control-border)] bg-input-background text-[var(--dashboard-indicator)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dashboard-focus-ring)] focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-[var(--dashboard-indicator)]",
      className
    )}
    {...props}
  >
    <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
      <Circle className="size-2.5 fill-current" aria-hidden="true" />
    </RadioGroupPrimitive.Indicator>
  </RadioGroupPrimitive.Item>
));

DashboardRadioGroupItem.displayName = "DashboardRadioGroupItem";

export const DashboardSwitch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitive.Root
    ref={ref}
    className={cn(
      "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-[var(--dashboard-control-border)] bg-[var(--dashboard-switch-track)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dashboard-focus-ring)] focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-[var(--dashboard-indicator)] data-[state=checked]:bg-[var(--dashboard-indicator)] motion-reduce:transition-none",
      className
    )}
    {...props}
  >
    <SwitchPrimitive.Thumb className="pointer-events-none block size-5 translate-x-0.5 rounded-full bg-[var(--dashboard-switch-thumb)] shadow-sm transition-transform data-[state=checked]:translate-x-[1.375rem] motion-reduce:transition-none" />
  </SwitchPrimitive.Root>
));

DashboardSwitch.displayName = "DashboardSwitch";

export interface DashboardFieldControlProps {
  id: string;
  "aria-describedby"?: string;
  "aria-errormessage"?: string;
  "aria-invalid"?: true;
  "aria-required"?: true;
}

export interface DashboardFieldProps {
  children: (controlProps: DashboardFieldControlProps) => React.ReactNode;
  className?: string;
  description?: React.ReactNode;
  error?: React.ReactNode;
  id?: string;
  label: React.ReactNode;
  required?: boolean;
}

export function DashboardField({
  children,
  className,
  description,
  error,
  id,
  label,
  required = false,
}: DashboardFieldProps) {
  const generatedId = React.useId();
  const fieldId = id ?? `dashboard-field-${generatedId.replaceAll(":", "")}`;
  const descriptionId = description ? `${fieldId}-description` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  const describedBy =
    [descriptionId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("grid gap-2", className)}>
      <LabelPrimitive.Root
        htmlFor={fieldId}
        className="text-sm font-medium leading-5 text-foreground"
      >
        {label}
        {required ? (
          <>
            <span
              className="ml-1 text-[var(--dashboard-danger-foreground)]"
              aria-hidden="true"
            >
              *
            </span>
            <span className="sr-only"> (required)</span>
          </>
        ) : null}
      </LabelPrimitive.Root>
      {children({
        id: fieldId,
        "aria-describedby": describedBy,
        "aria-errormessage": errorId,
        "aria-invalid": error ? true : undefined,
        "aria-required": required ? true : undefined,
      })}
      {description ? (
        <p
          id={descriptionId}
          className="text-xs leading-[1.125rem] text-muted-foreground"
        >
          {description}
        </p>
      ) : null}
      {error ? (
        <p
          id={errorId}
          className="text-xs leading-[1.125rem] text-[var(--dashboard-danger-foreground)]"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

export interface DashboardChoiceGroupFieldProps extends Omit<
  React.FieldsetHTMLAttributes<HTMLFieldSetElement>,
  "children"
> {
  children: (groupProps: {
    "aria-describedby"?: string;
    "aria-errormessage"?: string;
    "aria-invalid"?: true;
    "aria-labelledby": string;
    "aria-required"?: true;
  }) => React.ReactNode;
  description?: React.ReactNode;
  error?: React.ReactNode;
  label: React.ReactNode;
  required?: boolean;
}

export function DashboardChoiceGroupField({
  children,
  className,
  description,
  error,
  label,
  required = false,
  ...props
}: DashboardChoiceGroupFieldProps) {
  const generatedId = React.useId().replaceAll(":", "");
  const labelId = `dashboard-choice-group-${generatedId}-label`;
  const descriptionId = description
    ? `dashboard-choice-group-${generatedId}-description`
    : undefined;
  const errorId = error
    ? `dashboard-choice-group-${generatedId}-error`
    : undefined;
  const describedBy =
    [descriptionId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <fieldset className={cn("grid gap-3", className)} {...props}>
      <legend
        id={labelId}
        className="text-sm font-medium leading-5 text-foreground"
      >
        {label}
        {required ? (
          <>
            <span
              className="ml-1 text-[var(--dashboard-danger-foreground)]"
              aria-hidden="true"
            >
              *
            </span>
            <span className="sr-only"> (required)</span>
          </>
        ) : null}
      </legend>
      {description ? (
        <p
          id={descriptionId}
          className="text-xs leading-[1.125rem] text-muted-foreground"
        >
          {description}
        </p>
      ) : null}
      {children({
        "aria-describedby": describedBy,
        "aria-errormessage": errorId,
        "aria-invalid": error ? true : undefined,
        "aria-labelledby": labelId,
        "aria-required": required ? true : undefined,
      })}
      {error ? (
        <p
          id={errorId}
          className="text-xs leading-[1.125rem] text-[var(--dashboard-danger-foreground)]"
        >
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}

export interface DashboardChoiceFieldProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "children"
> {
  control: React.ReactElement<{ id?: string }>;
  description?: React.ReactNode;
  id?: string;
  label: React.ReactNode;
}

export function DashboardChoiceField({
  className,
  control,
  description,
  id,
  label,
  ...props
}: DashboardChoiceFieldProps) {
  const generatedId = React.useId();
  const controlId = id ?? `dashboard-choice-${generatedId.replaceAll(":", "")}`;
  const descriptionId = description ? `${controlId}-description` : undefined;

  return (
    <div className={cn("flex items-start gap-3", className)} {...props}>
      {React.cloneElement(control, {
        id: controlId,
        ...(descriptionId ? { "aria-describedby": descriptionId } : {}),
      })}
      <div className="grid gap-1">
        <LabelPrimitive.Root
          htmlFor={controlId}
          className="cursor-pointer text-sm font-medium leading-5 text-foreground"
        >
          {label}
        </LabelPrimitive.Root>
        {description ? (
          <p
            id={descriptionId}
            className="text-xs leading-[1.125rem] text-muted-foreground"
          >
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export interface DashboardFormGridProps extends React.HTMLAttributes<HTMLDivElement> {
  columns?: 1 | 2 | 3;
}

const formGridColumns = {
  1: "grid-cols-1",
  2: "grid-cols-1 md:grid-cols-2",
  3: "grid-cols-1 md:grid-cols-2 xl:grid-cols-3",
} as const;

export function DashboardFormGrid({
  className,
  columns = 2,
  ...props
}: DashboardFormGridProps) {
  return (
    <div
      className={cn("grid gap-4", formGridColumns[columns], className)}
      {...props}
    />
  );
}

export interface DashboardFormError {
  fieldId?: string;
  message: React.ReactNode;
}

export interface DashboardFormErrorSummaryProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "title"
> {
  errors: readonly (DashboardFormError | React.ReactNode)[];
  focusKey?: React.Key;
  focusOnMount?: boolean;
  title?: React.ReactNode;
}

export const DashboardFormErrorSummary = React.forwardRef<
  HTMLDivElement,
  DashboardFormErrorSummaryProps
>(
  (
    {
      className,
      errors,
      focusKey,
      focusOnMount = false,
      title = "Please correct the following fields",
      ...props
    },
    forwardedRef
  ) => {
    const localRef = React.useRef<HTMLDivElement>(null);

    React.useImperativeHandle(
      forwardedRef,
      () => localRef.current as HTMLDivElement
    );

    React.useEffect(() => {
      if (focusOnMount && errors.length > 0) {
        localRef.current?.focus();
      }
    }, [errors.length, focusKey, focusOnMount]);

    if (errors.length === 0) return null;

    return (
      <div
        ref={localRef}
        role="alert"
        aria-atomic="true"
        tabIndex={focusOnMount ? -1 : undefined}
        className={cn(
          "dashboard-tone-danger rounded-xl border px-4 py-3 outline-none focus-visible:ring-2 focus-visible:ring-[var(--dashboard-focus-ring)]",
          className
        )}
        {...props}
      >
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-5">{title}</p>
            <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm leading-5">
              {errors.map((error, index) => {
                const structuredError =
                  !React.isValidElement(error) &&
                  typeof error === "object" &&
                  error !== null &&
                  "message" in error
                    ? (error as DashboardFormError)
                    : undefined;
                const message: React.ReactNode = structuredError
                  ? structuredError.message
                  : (error as React.ReactNode);

                return (
                  <li key={structuredError?.fieldId ?? index}>
                    {structuredError?.fieldId ? (
                      <a
                        href={`#${structuredError.fieldId}`}
                        className="underline underline-offset-2"
                        onClick={() => {
                          window.requestAnimationFrame(() => {
                            document
                              .getElementById(structuredError.fieldId as string)
                              ?.focus();
                          });
                        }}
                      >
                        {message}
                      </a>
                    ) : (
                      message
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    );
  }
);

DashboardFormErrorSummary.displayName = "DashboardFormErrorSummary";
