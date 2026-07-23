import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function DatasetActionBar({
  label = "Actions",
  children,
  sticky = false,
  className,
}: {
  label?: string;
  children: ReactNode;
  sticky?: boolean;
  className?: string;
}) {
  return (
    <section
      aria-label={label}
      className={cn(
        "supplier-glass-panel rounded-xl border p-3",
        sticky && "sticky bottom-3 z-20 backdrop-blur-xl",
        className
      )}
    >
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
        {children}
      </div>
    </section>
  );
}
