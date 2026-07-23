"use client";

import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getDatasetThemeTokens } from "@/constants/dataset.constants";
import { StyledSelect } from "../shared/StyledSelect";

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
  isDark = false,
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
  const tokens = getDatasetThemeTokens(isDark);
  const hasCriteria = Boolean(searchValue.trim()) || activeFilterCount > 0;

  return (
    <section
      aria-label="Search and filter records"
      className="supplier-glass-panel mt-6 rounded-2xl border p-3 sm:p-4"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <Search
            aria-hidden="true"
            className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            className="supplier-glass-input h-10 pl-9 pr-10"
            maxLength={120}
            placeholder={searchPlaceholder}
            aria-label={searchAriaLabel}
          />
          {searchValue && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              aria-label="Clear search"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {filters.length > 0 && (
          <div
            className={
              filters.length === 1
                ? "lg:w-56"
                : "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:w-[420px]"
            }
          >
            {filters.map((filter) => (
              <StyledSelect
                key={filter.ariaLabel}
                value={filter.value}
                onValueChange={filter.onValueChange}
                options={filter.options}
                ariaLabel={filter.ariaLabel}
                triggerClassName="h-10"
                isDark={isDark}
                tokens={tokens}
              />
            ))}
          </div>
        )}

        {hasCriteria && (
          <Button
            type="button"
            variant="ghost"
            onClick={onClear}
            className="h-10 justify-center px-3 lg:justify-start"
          >
            <X /> Clear
            {activeFilterCount > 0 && (
              <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[11px] text-primary">
                {activeFilterCount}
              </span>
            )}
          </Button>
        )}
      </div>
    </section>
  );
}
