"use client";

import type { ComponentProps } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";

// Keep native selection and keyboard behavior while sharing the dashboard's
// chevron, spacing and disabled treatment across every proposal step.
export function PreparationNativeSelect({
  className,
  children,
  ...props
}: ComponentProps<"select">) {
  return (
    <span className="relative block min-w-0">
      <select
        {...props}
        className={cn(
          className,
          "preparation-native-select peer appearance-none pr-10"
        )}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground peer-disabled:opacity-50"
      />
    </span>
  );
}
