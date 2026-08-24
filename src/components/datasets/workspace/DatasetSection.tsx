import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import {
  DashboardCard,
  DashboardCardContent,
  DashboardCardHeader,
  DashboardCardTitle,
} from "@/components/dashboard";
import { cn } from "@/lib/utils";

export function DatasetSection({
  title,
  description,
  icon: Icon,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("min-w-0", className)}>
      <DashboardCard className="overflow-hidden">
        <DashboardCardHeader className="flex-row items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            {Icon && (
              <span className="dashboard-tone-neutral flex size-8 shrink-0 items-center justify-center rounded-lg border">
                <Icon className="size-4" aria-hidden="true" />
              </span>
            )}
            <div>
              <DashboardCardTitle headingLevel="h2">{title}</DashboardCardTitle>
              {description && (
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {description}
                </p>
              )}
            </div>
          </div>
          {action}
        </DashboardCardHeader>
        <DashboardCardContent>{children}</DashboardCardContent>
      </DashboardCard>
    </section>
  );
}
