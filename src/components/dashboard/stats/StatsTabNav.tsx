"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSupplierTokens } from "@/hooks/useSupplierTokens";
import { LayoutDashboard, Database, Users } from "lucide-react";

const tabs = [
    { label: "Overview", path: "/dashboard/stats", icon: LayoutDashboard },
    { label: "Datasets", path: "/dashboard/stats/datasets", icon: Database },
    { label: "Buyers", path: "/dashboard/stats/buyers", icon: Users },
];

export function StatsTabNav() {
    const tokens = useSupplierTokens();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const handleTabClick = (path: string) => {
        const range = searchParams.get("range");
        router.push(range ? `${path}?range=${range}` : path);
    };

    return (
        <div
            className="inline-flex rounded-xl p-1 gap-1"
            style={{
                background: tokens.glassBg,
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                border: `1px solid ${tokens.glassBorder}`,
            }}
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
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300"
                        style={{
                            background: isActive
                                ? tokens.isDark
                                    ? "rgba(74, 144, 226, 0.25)"
                                    : "rgba(26, 34, 64, 0.1)"
                                : "transparent",
                            color: isActive ? tokens.textPrimary : tokens.textMuted,
                            border: isActive
                                ? `1px solid ${tokens.isDark ? "rgba(74, 144, 226, 0.4)" : "rgba(26, 34, 64, 0.15)"}`
                                : "1px solid transparent",
                        }}
                    >
                        <Icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                );
            })}
        </div>
    );
}
