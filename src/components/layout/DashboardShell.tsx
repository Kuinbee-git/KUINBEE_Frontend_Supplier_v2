"use client";

import * as React from "react";
import { flushSync } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  BadgePercent,
  BarChart3,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardPenLine,
  Database,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Moon,
  Settings,
  Star,
  Sun,
  User,
  WandSparkles,
  type LucideIcon,
} from "lucide-react";

import {
  DashboardButton,
  DashboardDropdownMenu,
  DashboardDropdownMenuContent,
  DashboardDropdownMenuItem,
  DashboardDropdownMenuLabel,
  DashboardDropdownMenuSeparator,
  DashboardDropdownMenuTrigger,
  DashboardSheet,
  DashboardSheetContent,
  DashboardSheetTrigger,
  DashboardTooltip,
  DashboardTooltipContent,
  DashboardTooltipProvider,
  DashboardTooltipTrigger,
} from "@/components/dashboard";
import { cn } from "@/lib/utils/cn";
import { useAuthStore, useThemeStore } from "@/store";

interface DashboardShellProps {
  children: React.ReactNode;
}

interface DashboardViewTransition {
  finished: Promise<void>;
}

type ViewTransitionDocument = Document & {
  startViewTransition?: (update: () => void) => DashboardViewTransition;
};

interface NavigationItem {
  icon: LucideIcon;
  id: string;
  label: string;
  path: string;
}

interface NavigationGroup {
  id: string;
  items: readonly NavigationItem[];
  label: string;
}

const navigationGroups: readonly NavigationGroup[] = [
  {
    id: "workspace",
    label: "Workspace",
    items: [
      {
        id: "overview",
        label: "Overview",
        icon: LayoutDashboard,
        path: "/dashboard",
      },
      {
        id: "stats",
        label: "Analytics",
        icon: BarChart3,
        path: "/dashboard/stats",
      },
    ],
  },
  {
    id: "data-catalogue",
    label: "Data catalogue",
    items: [
      {
        id: "datasets",
        label: "My datasets",
        icon: Database,
        path: "/dashboard/my-datasets",
      },
      {
        id: "drafts",
        label: "My drafts",
        icon: FileText,
        path: "/dashboard/datasets",
      },
      {
        id: "proposals",
        label: "Submitted proposals",
        icon: FileText,
        path: "/dashboard/proposals",
      },
      {
        id: "delisted-edits",
        label: "Delisted edits",
        icon: Database,
        path: "/dashboard/my-datasets?status=DELISTED",
      },
    ],
  },
  {
    id: "supplier-tools",
    label: "Supplier tools",
    items: [
      {
        id: "custom-collection-services",
        label: "Custom collection services",
        icon: WandSparkles,
        path: "/dashboard/custom-collection-services",
      },
      {
        id: "discount-campaigns",
        label: "Dataset promotions",
        icon: BadgePercent,
        path: "/dashboard/discount-campaigns",
      },
    ],
  },
  {
    id: "data-sourcing",
    label: "Data sourcing",
    items: [
      {
        id: "data-requirement",
        label: "Submit a data requirement",
        icon: ClipboardPenLine,
        path: "/dashboard/data-requirements/submit",
      },
    ],
  },
  {
    id: "engagement",
    label: "Engagement",
    items: [
      {
        id: "questions",
        label: "Questions",
        icon: MessageSquare,
        path: "/dashboard/questions",
      },
      {
        id: "reviews",
        label: "Reviews",
        icon: Star,
        path: "/dashboard/reviews",
      },
    ],
  },
];

function isNavigationItemActive(
  item: NavigationItem,
  pathname: string,
  delistedView: boolean
) {
  if (item.id === "delisted-edits") return delistedView;

  if (item.id === "datasets") {
    return pathname.startsWith("/dashboard/my-datasets") && !delistedView;
  }

  const itemPathname = item.path.split("?")[0];
  return (
    pathname === itemPathname ||
    (itemPathname !== "/dashboard" && pathname.startsWith(itemPathname))
  );
}

interface DashboardNavigationProps {
  collapsed?: boolean;
  onNavigate?: () => void;
}

function DashboardNavigation({
  collapsed = false,
  onNavigate,
}: DashboardNavigationProps) {
  const pathname = usePathname() ?? "/dashboard";
  const searchParams = useSearchParams();
  const delistedView =
    pathname === "/dashboard/my-datasets" &&
    searchParams.get("status") === "DELISTED";

  return (
    <nav aria-label="Supplier dashboard" className="space-y-5 px-3 py-4">
      {navigationGroups.map((group) => (
        <div key={group.id} className="space-y-1">
          <p
            className={cn(
              "px-2 pb-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground/80",
              collapsed && "sr-only"
            )}
          >
            {group.label}
          </p>
          {group.items.map((item) => {
            const Icon = item.icon;
            const active = isNavigationItemActive(item, pathname, delistedView);
            const link = (
              <Link
                href={item.path}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                aria-label={collapsed ? item.label : undefined}
                className={cn(
                  "dashboard-nav-item relative flex h-10 min-w-0 items-center gap-3 rounded-lg border border-transparent py-2 pl-5 pr-3 text-sm font-medium text-muted-foreground outline-none transition-[background-color,border-color,color,box-shadow,transform] duration-150",
                  "hover:bg-accent hover:text-accent-foreground",
                  "focus-visible:ring-2 focus-visible:ring-[var(--dashboard-focus-ring)]",
                  "motion-reduce:transition-none",
                  active &&
                    "dashboard-nav-active font-semibold text-foreground",
                  active &&
                    !collapsed &&
                    "before:absolute before:left-2 before:h-4 before:w-0.5 before:rounded-full before:bg-[var(--dashboard-action)] before:content-['']",
                  collapsed && "justify-center px-0"
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                {collapsed ? null : (
                  <span className="truncate">{item.label}</span>
                )}
              </Link>
            );

            if (!collapsed)
              return <React.Fragment key={item.id}>{link}</React.Fragment>;

            return (
              <DashboardTooltip key={item.id}>
                <DashboardTooltipTrigger asChild>
                  {link}
                </DashboardTooltipTrigger>
                <DashboardTooltipContent side="right">
                  {item.label}
                </DashboardTooltipContent>
              </DashboardTooltip>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

function DashboardBrand({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/dashboard"
      aria-label="Kuinbee dashboard"
      className={cn(
        "flex h-16 items-center gap-3 rounded-md px-3 outline-none focus-visible:ring-2 focus-visible:ring-[var(--dashboard-focus-ring)]",
        compact && "justify-center px-0"
      )}
    >
      <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden">
        <Image
          src="/logo-light.png"
          alt=""
          width={32}
          height={32}
          className="size-8 scale-[2.4] object-contain dark:hidden"
          priority
        />
        <Image
          src="/logo-dark.png"
          alt=""
          width={32}
          height={32}
          className="hidden size-8 scale-[2.4] object-contain dark:block"
          priority
        />
      </span>
      {compact ? null : (
        <span className="truncate text-base font-semibold tracking-tight text-foreground">
          Kuinbee
        </span>
      )}
    </Link>
  );
}

function getUserInitials(name?: string, email?: string) {
  const source = name?.trim() || email?.trim() || "Supplier";
  const segments = source.split(/[\s@._-]+/).filter(Boolean);

  return segments
    .slice(0, 2)
    .map((segment) => segment[0]?.toUpperCase())
    .join("");
}

export function DashboardShell({ children }: DashboardShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isDark, setTheme } = useThemeStore();
  const { user, logout } = useAuthStore();
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [mobileNavigationOpen, setMobileNavigationOpen] = React.useState(false);
  const mainContentRef = React.useRef<HTMLElement>(null);
  const activeThemeTransition = React.useRef<DashboardViewTransition | null>(
    null
  );
  const initials = getUserInitials(user?.name, user?.email);

  React.useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      mainContentRef.current?.scrollTo({ top: 0, left: 0, behavior: "auto" });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  const handleLogout = () => {
    logout();
    router.push("/auth/login");
  };

  const handleThemeToggle = React.useCallback(() => {
    if (activeThemeTransition.current) return;

    const nextTheme = isDark ? "light" : "dark";
    const root = document.documentElement;
    const viewTransitionDocument = document as ViewTransitionDocument;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const applyTheme = () => {
      // Keep the theme class, Zustand subscribers, logos, and icon in the same
      // paint so the compositor crossfades two complete dashboard frames.
      flushSync(() => setTheme(nextTheme));
    };

    root.dataset.dashboardThemeTransition = "true";

    if (reduceMotion || !viewTransitionDocument.startViewTransition) {
      applyTheme();
      window.requestAnimationFrame(() => {
        delete root.dataset.dashboardThemeTransition;
      });
      return;
    }

    let transition: DashboardViewTransition;

    try {
      transition = viewTransitionDocument.startViewTransition(applyTheme);
    } catch {
      applyTheme();
      delete root.dataset.dashboardThemeTransition;
      return;
    }

    activeThemeTransition.current = transition;

    const finishThemeTransition = () => {
      if (activeThemeTransition.current === transition) {
        activeThemeTransition.current = null;
      }
      delete root.dataset.dashboardThemeTransition;
    };

    // A view transition can reject when the browser skips it (for example,
    // when the tab becomes hidden). Both outcomes need the same cleanup.
    void transition.finished.then(finishThemeTransition, finishThemeTransition);
  }, [isDark, setTheme]);

  return (
    <DashboardTooltipProvider delayDuration={250}>
      <div
        className="supplier-dashboard dashboard-canvas flex h-dvh min-h-0 w-full overflow-hidden text-foreground"
        data-ui-scope="supplier-dashboard"
      >
        <a
          href="#supplier-dashboard-main"
          className="sr-only fixed left-4 top-4 z-[var(--dashboard-layer-tooltip)] rounded-lg bg-popover px-3 py-2 text-sm font-medium text-popover-foreground shadow-lg focus:not-sr-only focus:outline-none focus:ring-2 focus:ring-[var(--dashboard-focus-ring)]"
        >
          Skip to content
        </a>

        <aside
          className={cn(
            "dashboard-shell-sidebar hidden h-dvh shrink-0 flex-col border-r border-border transition-[width] duration-200 motion-reduce:transition-none lg:flex",
            sidebarCollapsed
              ? "w-[var(--dashboard-sidebar-collapsed-width)]"
              : "w-[var(--dashboard-sidebar-width)]"
          )}
        >
          <div className="border-b border-border px-3">
            <DashboardBrand compact={sidebarCollapsed} />
          </div>
          <div
            id="supplier-dashboard-desktop-navigation"
            className="dashboard-scroll-region min-h-0 flex-1 overflow-y-auto"
          >
            <DashboardNavigation collapsed={sidebarCollapsed} />
          </div>
          <div className="border-t border-border p-3">
            <DashboardButton
              variant="outline"
              size="compact"
              className={cn(
                "dashboard-glass-control w-full border",
                sidebarCollapsed && "px-0"
              )}
              aria-label={
                sidebarCollapsed ? "Expand navigation" : "Collapse navigation"
              }
              aria-controls="supplier-dashboard-desktop-navigation"
              aria-expanded={!sidebarCollapsed}
              onClick={() => setSidebarCollapsed((current) => !current)}
            >
              {sidebarCollapsed ? (
                <ChevronRight aria-hidden="true" />
              ) : (
                <>
                  <ChevronLeft aria-hidden="true" />
                  <span>Collapse navigation</span>
                </>
              )}
            </DashboardButton>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <header className="dashboard-shell-topbar h-[var(--dashboard-topbar-height)] shrink-0 border-b border-border">
            <div className="mx-auto flex h-full w-full max-w-[var(--dashboard-content-max-width)] items-center justify-between px-[var(--dashboard-page-padding-inline)]">
              <div className="flex min-w-0 items-center gap-3">
                <DashboardSheet
                  open={mobileNavigationOpen}
                  onOpenChange={setMobileNavigationOpen}
                >
                  <DashboardSheetTrigger asChild>
                    <DashboardButton
                      variant="outline"
                      size="icon"
                      aria-label="Open navigation"
                      className="dashboard-glass-control lg:hidden"
                    >
                      <Menu aria-hidden="true" />
                    </DashboardButton>
                  </DashboardSheetTrigger>
                  <DashboardSheetContent
                    side="left"
                    title="Kuinbee"
                    description="Supplier workspace navigation"
                    className="dashboard-glass-popover w-[min(18rem,calc(100%-1rem))]"
                  >
                    <DashboardNavigation
                      onNavigate={() => setMobileNavigationOpen(false)}
                    />
                  </DashboardSheetContent>
                </DashboardSheet>

                <div className="lg:hidden">
                  <DashboardBrand compact />
                </div>
                <p className="hidden text-sm font-medium text-muted-foreground lg:block">
                  Supplier workspace
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <DashboardButton
                  variant="outline"
                  size="icon"
                  aria-label={isDark ? "Use light theme" : "Use dark theme"}
                  onClick={handleThemeToggle}
                  className="dashboard-glass-control"
                >
                  {isDark ? (
                    <Sun aria-hidden="true" />
                  ) : (
                    <Moon aria-hidden="true" />
                  )}
                </DashboardButton>

                <DashboardDropdownMenu>
                  <DashboardDropdownMenuTrigger asChild>
                    <DashboardButton
                      variant="outline"
                      size="default"
                      aria-label="Open account menu"
                      className="dashboard-glass-control max-w-60 gap-2 px-2 sm:px-3"
                    >
                      <span className="dashboard-tone-info flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold">
                        {initials}
                      </span>
                      <span className="hidden max-w-40 truncate sm:inline">
                        {user?.name || user?.email || "Supplier"}
                      </span>
                      <ChevronDown
                        className="hidden text-muted-foreground sm:block"
                        aria-hidden="true"
                      />
                    </DashboardButton>
                  </DashboardDropdownMenuTrigger>
                  <DashboardDropdownMenuContent
                    align="end"
                    className="dashboard-glass-popover w-60"
                  >
                    <DashboardDropdownMenuLabel className="normal-case">
                      <span className="block truncate text-sm font-medium text-foreground">
                        {user?.name || "Supplier account"}
                      </span>
                      <span className="mt-0.5 block truncate font-normal">
                        {user?.email || "Account settings"}
                      </span>
                    </DashboardDropdownMenuLabel>
                    <DashboardDropdownMenuSeparator />
                    <DashboardDropdownMenuItem asChild>
                      <Link href="/dashboard/profile">
                        <User aria-hidden="true" />
                        Profile
                      </Link>
                    </DashboardDropdownMenuItem>
                    <DashboardDropdownMenuItem asChild>
                      <Link href="/dashboard/account">
                        <Settings aria-hidden="true" />
                        Account settings
                      </Link>
                    </DashboardDropdownMenuItem>
                    <DashboardDropdownMenuSeparator />
                    <DashboardDropdownMenuItem
                      variant="destructive"
                      onSelect={handleLogout}
                    >
                      <LogOut aria-hidden="true" />
                      Sign out
                    </DashboardDropdownMenuItem>
                  </DashboardDropdownMenuContent>
                </DashboardDropdownMenu>
              </div>
            </div>
          </header>

          <main
            ref={mainContentRef}
            id="supplier-dashboard-main"
            tabIndex={-1}
            className="dashboard-scroll-region min-h-0 flex-1 overflow-y-auto bg-transparent outline-none"
          >
            {children}
          </main>
        </div>
      </div>
    </DashboardTooltipProvider>
  );
}
