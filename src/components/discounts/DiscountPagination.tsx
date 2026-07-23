"use client";

import { Button } from "@/components/ui/button";
import { getDatasetThemeTokens } from "@/constants/dataset.constants";

interface DiscountPaginationProps {
  page: number;
  pageSize: number;
  total: number;
  itemLabel: string;
  tokens: ReturnType<typeof getDatasetThemeTokens>;
  onPageChange: (page: number) => void;
}

export function DiscountPagination({
  page,
  pageSize,
  total,
  itemLabel,
  tokens,
  onPageChange,
}: DiscountPaginationProps) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm" style={{ color: tokens.textMuted }}>
        Showing {start} to {end} of {total} {itemLabel}
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
        >
          Previous
        </Button>
        <span className="px-2 text-sm" style={{ color: tokens.textMuted }}>
          Page {page} of {totalPages}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
