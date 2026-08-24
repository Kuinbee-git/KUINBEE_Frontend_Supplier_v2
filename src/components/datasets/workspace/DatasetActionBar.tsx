import type { ReactNode } from "react";

import { DashboardCard } from "@/components/dashboard";
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
      className={cn(sticky && "sticky bottom-3 z-20", className)}
    >
      <DashboardCard className="p-3">
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
          {children}
        </div>
      </DashboardCard>
    </section>
  );
}
