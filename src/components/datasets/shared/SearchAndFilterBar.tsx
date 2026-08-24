import { useState } from "react";
import {
  DashboardButton,
  DashboardCard,
  DashboardInput,
} from "@/components/dashboard";
import { Search, Filter } from "lucide-react";
import { DatasetSelect } from "./DatasetSelect";
import type { DatasetThemeTokens } from "@/constants/dataset.constants";

interface FilterOption {
  label: string;
  value: string;
}

interface SearchAndFilterBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filters: Array<{
    label: string;
    value: string;
    options: FilterOption[];
    onChange: (value: string) => void;
  }>;
  activeFilterCount: number;
  tokens: DatasetThemeTokens;
  isDark?: boolean;
}

export function SearchAndFilterBar({
  searchQuery,
  onSearchChange,
  filters,
  activeFilterCount,
}: SearchAndFilterBarProps) {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        <div className="flex-1 relative w-full">
          <Search
            className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <DashboardInput
            aria-label="Search datasets"
            placeholder="Search datasets..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <DashboardButton
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          aria-controls="dataset-filters"
          aria-expanded={showFilters}
          className="whitespace-nowrap"
        >
          <Filter className="size-4" aria-hidden="true" />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-1 rounded-full bg-[var(--dashboard-action)] px-2 py-0.5 text-xs font-medium text-[var(--dashboard-action-foreground)]">
              {activeFilterCount}
            </span>
          )}
        </DashboardButton>
      </div>

      {showFilters ? (
        <DashboardCard id="dataset-filters" className="p-6">
          <div
            className={`grid grid-cols-1 gap-6 ${filters.length === 1 ? "" : "md:grid-cols-2"}`}
          >
            {filters.map((filter, index) => (
              <DatasetSelect
                key={`${filter.label}-${index}`}
                value={filter.value}
                onValueChange={filter.onChange}
                label={filter.label}
                triggerId={`dataset-filter-${index}`}
                options={filter.options}
              />
            ))}
          </div>
        </DashboardCard>
      ) : null}
    </div>
  );
}
