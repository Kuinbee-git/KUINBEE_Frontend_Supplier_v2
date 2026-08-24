"use client";

import {
  DashboardSelect,
  DashboardSelectContent,
  DashboardSelectItem,
  DashboardSelectTrigger,
  DashboardSelectValue,
} from "@/components/dashboard";

interface DatasetSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: { label: string; value: string }[];
  label?: string;
  placeholder?: string;
  triggerId: string;
  ariaLabel?: string;
  triggerClassName?: string;
  disabled?: boolean;
  isDark?: boolean;
  tokens?: {
    inputBg: string;
    inputBorder: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    surfaceCard: string;
    borderDefault: string;
  };
}

export function DatasetSelect({
  value,
  onValueChange,
  options,
  label,
  placeholder = "Select an option",
  triggerId,
  ariaLabel,
  triggerClassName,
  disabled = false,
}: DatasetSelectProps) {
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={triggerId}
          className="mb-2 block text-sm font-medium text-foreground"
        >
          {label}
        </label>
      )}
      <DashboardSelect
        value={value || undefined}
        onValueChange={onValueChange}
        disabled={disabled}
      >
        <DashboardSelectTrigger
          id={triggerId}
          aria-label={ariaLabel}
          className={triggerClassName}
        >
          <DashboardSelectValue placeholder={placeholder} />
        </DashboardSelectTrigger>
        <DashboardSelectContent className="max-h-80">
          {options.map((option) => (
            <DashboardSelectItem key={option.value} value={option.value}>
              {option.label}
            </DashboardSelectItem>
          ))}
        </DashboardSelectContent>
      </DashboardSelect>
    </div>
  );
}
