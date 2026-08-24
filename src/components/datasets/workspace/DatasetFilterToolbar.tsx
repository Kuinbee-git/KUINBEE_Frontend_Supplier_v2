"use client";

import { X } from "lucide-react";

import {
  DashboardButton,
  DashboardSearchField,
  DashboardSelect,
  DashboardSelectContent,
  DashboardSelectItem,
  DashboardSelectTrigger,
  DashboardSelectValue,
  DashboardToolbar,
  DashboardToolbarFilters,
} from "@/components/dashboard";

interface DatasetFilter {
  value: string;
  onValueChange: (value: string) => void;
  options: { label: string; value: string }[];
  ariaLabel: string;
}

export function DatasetFilterToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder,
  searchAriaLabel,
  filters = [],
  activeFilterCount = 0,
  onClear,
}: {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  searchAriaLabel: string;
  filters?: DatasetFilter[];
  activeFilterCount?: number;
  onClear: () => void;
  isDark?: boolean;
}) {
  const hasCriteria = Boolean(searchValue.trim()) || activeFilterCount > 0;

  return (
    <DashboardToolbar ariaLabel="Search and filter records">
      <DashboardSearchField
        value={searchValue}
        onValueChange={onSearchChange}
        label={searchAriaLabel}
        placeholder={searchPlaceholder}
        maxLength={120}
      />

      {filters.length > 0 && (
        <DashboardToolbarFilters
          ariaLabel="Dataset filters"
          className={filters.length === 1 ? "lg:[&>*]:w-56" : undefined}
        >
          {filters.map((filter) => (
            <DashboardSelect
              key={filter.ariaLabel}
              value={filter.value}
              onValueChange={filter.onValueChange}
            >
              <DashboardSelectTrigger aria-label={filter.ariaLabel}>
                <DashboardSelectValue />
              </DashboardSelectTrigger>
              <DashboardSelectContent>
                {filter.options.map((option) => (
                  <DashboardSelectItem key={option.value} value={option.value}>
                    {option.label}
                  </DashboardSelectItem>
                ))}
              </DashboardSelectContent>
            </DashboardSelect>
          ))}
        </DashboardToolbarFilters>
      )}

      {hasCriteria && (
        <DashboardButton type="button" variant="ghost" onClick={onClear}>
          <X aria-hidden="true" /> Clear
          {activeFilterCount > 0 && (
            <span className="dashboard-tone-neutral rounded-full border px-1.5 py-0.5 text-[11px]">
              {activeFilterCount}
            </span>
          )}
        </DashboardButton>
      )}
    </DashboardToolbar>
  );
}
