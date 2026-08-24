"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

import { cn } from "@/lib/utils/cn";
import { DashboardButton } from "./dashboard-button";

type PaginationItem = number | "ellipsis-left" | "ellipsis-right";

function getPaginationItems(page: number, pageCount: number): PaginationItem[] {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  const items: PaginationItem[] = [1];
  const rangeStart = Math.max(2, page - 1);
  const rangeEnd = Math.min(pageCount - 1, page + 1);

  if (rangeStart > 2) {
    items.push("ellipsis-left");
  }

  for (let value = rangeStart; value <= rangeEnd; value += 1) {
    items.push(value);
  }

  if (rangeEnd < pageCount - 1) {
    items.push("ellipsis-right");
  }

  items.push(pageCount);
  return items;
}

export interface DashboardPaginationProps {
  ariaLabel?: string;
  className?: string;
  disabled?: boolean;
  getPageHref?: (page: number) => string;
  itemLabel: string;
  onPageChange?: (page: number) => void;
  page: number;
  pageSize: number;
  totalItems: number;
}

export function DashboardPagination({
  ariaLabel,
  className,
  disabled = false,
  getPageHref,
  itemLabel,
  onPageChange,
  page,
  pageSize,
  totalItems,
}: DashboardPaginationProps) {
  const safeTotalItems =
    Number.isFinite(totalItems) && totalItems > 0 ? Math.floor(totalItems) : 0;
  const safePageSize =
    Number.isFinite(pageSize) && pageSize > 0
      ? Math.max(1, Math.floor(pageSize))
      : 1;
  const safePage = Number.isFinite(page) ? Math.floor(page) : 1;
  const pageCount = Math.max(1, Math.ceil(safeTotalItems / safePageSize));
  const currentPage = Math.min(Math.max(1, safePage), pageCount);
  const rangeStart =
    safeTotalItems === 0 ? 0 : (currentPage - 1) * safePageSize + 1;
  const rangeEnd = Math.min(currentPage * safePageSize, safeTotalItems);
  const items = getPaginationItems(currentPage, pageCount);
  const canNavigate = Boolean(onPageChange || getPageHref);

  const renderControl = (
    targetPage: number,
    content: React.ReactNode,
    label: string,
    options?: { current?: boolean; disabled?: boolean; iconOnly?: boolean }
  ) => {
    const isDisabled = disabled || options?.disabled || !canNavigate;
    const className = cn(options?.iconOnly && "px-2 sm:px-3");

    if (getPageHref && !isDisabled) {
      return (
        <DashboardButton
          asChild
          variant={options?.current ? "default" : "outline"}
          size="compact"
          className={className}
        >
          <Link
            href={getPageHref(targetPage)}
            aria-current={options?.current ? "page" : undefined}
            aria-label={label}
            onClick={() => onPageChange?.(targetPage)}
          >
            {content}
          </Link>
        </DashboardButton>
      );
    }

    return (
      <DashboardButton
        variant={options?.current ? "default" : "outline"}
        size="compact"
        className={className}
        aria-current={options?.current ? "page" : undefined}
        aria-label={label}
        disabled={isDisabled}
        onClick={() => onPageChange?.(targetPage)}
      >
        {content}
      </DashboardButton>
    );
  };

  if (safeTotalItems <= safePageSize && pageCount === 1) {
    return (
      <p
        className={cn("text-sm text-muted-foreground", className)}
        role="status"
        aria-live="polite"
      >
        Showing {safeTotalItems} {itemLabel}
      </p>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <p className="text-sm text-muted-foreground" aria-live="polite">
        Showing {rangeStart}–{rangeEnd} of {safeTotalItems} {itemLabel}
      </p>
      <nav aria-label={ariaLabel ?? `${itemLabel} pagination`}>
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          {renderControl(
            Math.max(1, currentPage - 1),
            <>
              <ChevronLeft aria-hidden="true" />
              <span className="hidden sm:inline">Previous</span>
            </>,
            "Previous page",
            { disabled: currentPage === 1, iconOnly: true }
          )}

          {items.map((item) =>
            typeof item === "number" ? (
              <React.Fragment key={item}>
                {renderControl(item, item, `Page ${item}`, {
                  current: item === currentPage,
                })}
              </React.Fragment>
            ) : (
              <span
                key={item}
                className="flex size-9 items-center justify-center text-muted-foreground"
                aria-hidden="true"
              >
                <MoreHorizontal className="size-4" />
              </span>
            )
          )}

          {renderControl(
            Math.min(pageCount, currentPage + 1),
            <>
              <span className="hidden sm:inline">Next</span>
              <ChevronRight aria-hidden="true" />
            </>,
            "Next page",
            { disabled: currentPage === pageCount, iconOnly: true }
          )}
        </div>
      </nav>
    </div>
  );
}
