"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LayoutDashboard, Database, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { label: "Overview", path: "/dashboard/stats", icon: LayoutDashboard },
  { label: "Datasets", path: "/dashboard/stats/datasets", icon: Database },
  { label: "Buyers", path: "/dashboard/stats/buyers", icon: Users },
];

export function StatsTabNav() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleTabClick = (path: string) => {
    const range = searchParams.get("range");
    router.push(range ? `${path}?range=${range}` : path);
  };

  return (
    <nav
      className="supplier-glass-panel inline-flex min-w-max gap-1 rounded-xl border p-1"
      aria-label="Analytics sections"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive =
          pathname === tab.path ||
          (tab.path !== "/dashboard/stats" && pathname?.startsWith(tab.path));
        return (
          <button
            key={tab.path}
            onClick={() => handleTabClick(tab.path)}
            className={cn(
              "flex items-center gap-2 rounded-lg border border-transparent px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-foreground/[0.04] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-4",
              isActive && "border-primary/25 bg-primary/10 text-primary"
            )}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon className="w-4 h-4" />
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
