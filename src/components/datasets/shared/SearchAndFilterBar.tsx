import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Search, Filter } from 'lucide-react';
import { StyledSelect } from './StyledSelect';

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
  tokens: any;
  isDark?: boolean;
}

export function SearchAndFilterBar({
  searchQuery,
  onSearchChange,
  filters,
  activeFilterCount,
  tokens,
  isDark = false,
}: SearchAndFilterBarProps) {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        <div className="flex-1 relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200" style={{ color: tokens.textMuted }} />
          <Input
            placeholder="Search datasets..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 transition-all duration-200"
            style={{
              background: tokens.inputBg,
              borderColor: tokens.inputBorder,
              color: tokens.textPrimary,
            }}
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="gap-2 transition-all duration-200 ease-out whitespace-nowrap"
          style={{
            borderColor: showFilters ? '#3b82f6' : tokens.borderDefault,
            color: showFilters ? '#3b82f6' : tokens.textPrimary,
            background: showFilters ? 'rgba(59, 130, 246, 0.05)' : tokens.inputBg,
          }}
        >
          <Filter className="w-4 h-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-blue-500 text-white font-medium">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>

      {/* Filter Panel */}
      <div
        style={{
          display: 'grid',
          gridTemplateRows: showFilters ? '1fr' : '0fr',
          transition: 'grid-template-rows 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <div style={{ overflow: 'hidden' }}>
          <Card
            style={{
              background: tokens.surfaceCard,
              borderColor: tokens.borderDefault,
              opacity: showFilters ? 1 : 0,
              transform: showFilters ? 'translateY(0)' : 'translateY(-8px)',
              transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <div className="p-6">
              <div className={`grid grid-cols-1 ${filters.length === 1 ? '' : 'md:grid-cols-2'} gap-6`}>
                {filters.map((filter, index) => (
                  <div key={index} className="space-y-2">
                    <StyledSelect
                      value={filter.value}
                      onValueChange={filter.onChange}
                      label={filter.label}
                      options={filter.options}
                      isDark={isDark}
                      tokens={tokens}
                    />
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
