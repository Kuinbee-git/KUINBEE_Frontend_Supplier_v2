"use client";

import { BarChart3, Database, Users } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { DashboardButton, DashboardCard } from "@/components/dashboard";

const tabs = [
  { label: "Overview", path: "/dashboard/stats", icon: BarChart3 },
  { label: "Datasets", path: "/dashboard/stats/datasets", icon: Database },
  { label: "Buyers", path: "/dashboard/stats/buyers", icon: Users },
] as const;

export function StatsTabNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const range = searchParams.get("range");

  return (
    <nav aria-label="Analytics sections" className="max-w-full overflow-x-auto">
      <DashboardCard className="inline-flex min-w-max gap-1 p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active =
            pathname === tab.path ||
            (tab.path !== "/dashboard/stats" && pathname?.startsWith(tab.path));
          const href = range ? `${tab.path}?range=${range}` : tab.path;

          return (
            <DashboardButton
              key={tab.path}
              asChild
              variant={active ? "secondary" : "ghost"}
              size="compact"
              className="shadow-none"
            >
              <Link href={href} aria-current={active ? "page" : undefined}>
                <Icon aria-hidden="true" />
                {tab.label}
              </Link>
            </DashboardButton>
          );
        })}
      </DashboardCard>
    </nav>
  );
}
