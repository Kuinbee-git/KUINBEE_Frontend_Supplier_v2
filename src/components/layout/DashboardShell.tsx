"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  BarChart3,
  FileText,
  User,
  Settings,
  LogOut,
  Moon,
  Sun,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Database,
  MessageSquare,
  Star,
  BadgePercent,
  WandSparkles,
  Menu,
  X,
} from "lucide-react";
import { useThemeStore } from "@/store";
import { useAuthStore } from "@/store";

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isDark, toggleTheme } = useThemeStore();
  const { user, logout } = useAuthStore();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Design tokens
  const tokens = {
    surfaceUnified: isDark
      ? "linear-gradient(135deg, #1a2240 0%, #2a3250 50%, #1f2847 100%)"
      : "linear-gradient(135deg, #ffffff 0%, #f9fafb 50%, #f5f7fb 100%)",
    glassBg: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(255, 255, 255, 0.88)",
    glassBorder: isDark
      ? "rgba(255, 255, 255, 0.1)"
      : "rgba(255, 255, 255, 0.5)",
    textPrimary: isDark ? "#ffffff" : "#1a2240",
    textSecondary: isDark ? "rgba(255, 255, 255, 0.6)" : "#525d6f",
    textMuted: isDark ? "rgba(255, 255, 255, 0.5)" : "#7a8494",
    borderDefault: isDark ? "rgba(255, 255, 255, 0.1)" : "#dde3f0",
    borderSubtle: isDark
      ? "rgba(255, 255, 255, 0.04)"
      : "rgba(26, 34, 64, 0.06)",
    sidebarBg: isDark
      ? "rgba(255, 255, 255, 0.04)"
      : "rgba(255, 255, 255, 0.6)",
    navItemHover: isDark
      ? "rgba(255, 255, 255, 0.08)"
      : "rgba(26, 34, 64, 0.08)",
    navItemActive: isDark
      ? "linear-gradient(135deg, rgba(26, 34, 64, 0.4), rgba(42, 50, 80, 0.3))"
      : "linear-gradient(135deg, rgba(26, 34, 64, 0.12), rgba(26, 34, 64, 0.06))",
    navItemShadow: isDark
      ? "none"
      : "0 2px 8px rgba(26, 34, 64, 0.08), 0 4px 16px rgba(26, 34, 64, 0.06)",
    navItemActiveBorder: isDark
      ? "rgba(255, 255, 255, 0.1)"
      : "rgba(26, 34, 64, 0.15)",
    // Grid tokens
    gridPattern: isDark
      ? "rgba(255, 255, 255, 0.04)"
      : "rgba(26, 34, 64, 0.15)",
    gridOpacity: isDark ? 0.6 : 0.4,
  };

  const navItems = [
    {
      id: "overview",
      label: "Overview",
      icon: LayoutDashboard,
      path: "/dashboard",
      disabled: false,
    },
    {
      id: "stats",
      label: "Stats",
      icon: BarChart3,
      path: "/dashboard/stats",
      disabled: false,
    },
    {
      id: "proposals",
      label: "My Drafts",
      icon: FileText,
      path: "/dashboard/datasets",
      disabled: false,
    },
    {
      id: "submitted-proposals",
      label: "Submitted Proposals",
      icon: FileText,
      path: "/dashboard/proposals",
      disabled: false,
    },
    {
      id: "my-datasets",
      label: "My Datasets",
      icon: Database,
      path: "/dashboard/my-datasets",
      disabled: false,
    },
    {
      id: "discount-campaigns",
      label: "Discount Campaigns",
      icon: BadgePercent,
      path: "/dashboard/discount-campaigns",
      disabled: false,
    },
    {
      id: "custom-collection-services",
      label: "Custom Collection",
      icon: WandSparkles,
      path: "/dashboard/custom-collection-services",
      disabled: false,
    },
    {
      id: "questions",
      label: "Questions",
      icon: MessageSquare,
      path: "/dashboard/questions",
      disabled: false,
    },
    {
      id: "reviews",
      label: "Reviews",
      icon: Star,
      path: "/dashboard/reviews",
      disabled: false,
    },
    {
      id: "delisted-edits",
      label: "Delisted Edits",
      icon: Database,
      path: "/dashboard/my-datasets?status=DELISTED",
      disabled: false,
    },
    {
      id: "account",
      label: "Account",
      icon: Settings,
      path: "/dashboard/account",
      disabled: false,
    },
  ];

  const handleNavClick = (path: string, disabled: boolean) => {
    if (!disabled) {
      setMobileSidebarOpen(false);
      router.push(path);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/auth/login");
  };

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 transition-all duration-500"
        style={{ background: tokens.surfaceUnified }}
      />

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{
          backgroundImage: isDark
            ? `linear-gradient(${tokens.borderSubtle} 1px, transparent 1px), linear-gradient(90deg, ${tokens.borderSubtle} 1px, transparent 1px)`
            : `linear-gradient(${tokens.gridPattern} 1px, transparent 1px), linear-gradient(90deg, ${tokens.gridPattern} 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
          opacity: tokens.gridOpacity,
        }}
      />

      <div className="relative z-10 flex h-screen">
        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 h-screen w-64 flex-shrink-0 overflow-y-auto border-r transition-all duration-300 lg:relative lg:z-auto ${
            sidebarCollapsed ? "lg:w-20" : "lg:w-64"
          } ${mobileSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
          style={{
            background: tokens.sidebarBg,
            borderColor: tokens.borderDefault,
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
          }}
        >
          {/* Logo */}
          <div
            className="flex h-20 items-center justify-center border-b transition-all duration-300 lg:h-24"
            style={{
              borderColor: tokens.borderDefault,
              paddingLeft: sidebarCollapsed ? "0" : "16px",
              paddingRight: sidebarCollapsed ? "0" : "16px",
              background: isDark
                ? "rgba(255, 255, 255, 0.02)"
                : "rgba(255, 255, 255, 0.4)",
            }}
          >
            <div className="flex items-center justify-center gap-3 w-full">
              <div
                className="border rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300 hover:scale-105 cursor-pointer"
                style={{
                  height: "48px",
                  width: "54px",
                  background: isDark
                    ? "rgba(255, 255, 255, 0.1)"
                    : "rgba(255, 255, 255, 0.95)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  border: `1.5px solid ${isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(26, 34, 64, 0.12)"}`,
                  boxShadow: isDark
                    ? "0 4px 12px rgba(0, 0, 0, 0.3)"
                    : "0 2px 8px rgba(26, 34, 64, 0.08), 0 4px 16px rgba(26, 34, 64, 0.06)",
                }}
              >
                <Image
                  src={isDark ? "/logo-dark.png" : "/logo-light.png"}
                  alt="Kuinbee"
                  width={96}
                  height={96}
                  className="h-24 w-24 object-contain"
                  style={{ opacity: isDark ? 0.9 : 1 }}
                />
              </div>
              {!sidebarCollapsed && (
                <span
                  className="text-lg font-bold whitespace-nowrap transition-all duration-300 ease-out"
                  style={{
                    color: tokens.textPrimary,
                    opacity: sidebarCollapsed ? 0 : 1,
                    visibility: sidebarCollapsed ? "hidden" : "visible",
                    transform: sidebarCollapsed
                      ? "translateX(-10px)"
                      : "translateX(0)",
                  }}
                >
                  Kuinbee
                </span>
              )}
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(false)}
                className="absolute right-3 top-5 flex size-10 items-center justify-center rounded-lg lg:hidden"
                style={{ color: tokens.textSecondary }}
                aria-label="Close navigation"
              >
                <X className="size-5" />
              </button>
            </div>
          </div>

          {/* Collapse Toggle Button */}
          <div
            className="hidden border-b px-4 py-3 lg:flex lg:justify-center"
            style={{ borderColor: tokens.borderDefault }}
          >
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className={`w-full rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-[1.02] active:scale-95${sidebarCollapsed ? "" : " gap-2 px-5 py-2 border"}`}
              style={{
                height: "40px",
                background: isDark
                  ? "rgba(255, 255, 255, 0.08)"
                  : "rgba(255, 255, 255, 0.9)",
                border: `1.5px solid ${isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(26, 34, 64, 0.12)"}`,
                color: tokens.textSecondary,
                boxShadow: isDark
                  ? "none"
                  : "0 2px 6px rgba(26, 34, 64, 0.08), 0 4px 12px rgba(26, 34, 64, 0.05)",
                fontWeight: "600",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = isDark
                  ? "rgba(255, 255, 255, 0.12)"
                  : "rgba(255, 255, 255, 1)";
                e.currentTarget.style.color = tokens.textPrimary;
                if (!isDark) {
                  e.currentTarget.style.boxShadow =
                    "0 4px 12px rgba(26, 34, 64, 0.1), 0 8px 24px rgba(26, 34, 64, 0.08)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = isDark
                  ? "rgba(255, 255, 255, 0.08)"
                  : "rgba(255, 255, 255, 0.9)";
                e.currentTarget.style.color = tokens.textSecondary;
                if (!isDark) {
                  e.currentTarget.style.boxShadow =
                    "0 2px 6px rgba(26, 34, 64, 0.08), 0 4px 12px rgba(26, 34, 64, 0.05)";
                }
              }}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <>
                  <span
                    className="text-xs font-semibold tracking-wide"
                    style={{ letterSpacing: "0.02em" }}
                  >
                    Collapse
                  </span>
                  <ChevronLeft className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {/* Navigation */}
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              // Only one item should be active at a time
              const isDelistedEditsItem = item.id === "delisted-edits";
              const isMyDatasetsItem = item.id === "my-datasets";
              const isDelistedEditingView =
                pathname === "/dashboard/my-datasets" &&
                searchParams.get("status") === "DELISTED";

              let isActive = false;
              if (isDelistedEditsItem) {
                isActive = isDelistedEditingView;
              } else if (isMyDatasetsItem) {
                isActive =
                  pathname === "/dashboard/my-datasets" &&
                  !isDelistedEditingView;
              } else {
                isActive =
                  pathname === item.path ||
                  (item.path !== "/dashboard" &&
                    pathname?.startsWith(item.path));
              }
              const isDisabled = item.disabled;

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.path, isDisabled)}
                  disabled={isDisabled}
                  className={`w-full rounded-lg transition-all duration-300 ease-out flex items-center${sidebarCollapsed ? " justify-center" : ""}`}
                  style={{
                    padding: sidebarCollapsed ? "12px" : "12px 16px",
                    background: isActive ? tokens.navItemActive : "transparent",
                    border: `1px solid ${isActive ? tokens.navItemActiveBorder : "transparent"}`,
                    boxShadow:
                      isActive && !isDark ? tokens.navItemShadow : "none",
                    color: isDisabled ? tokens.textMuted : tokens.textPrimary,
                    opacity: isDisabled ? 0.5 : 1,
                    cursor: isDisabled ? "not-allowed" : "pointer",
                    minWidth: "0",
                    fontWeight: isActive ? "600" : "500",
                  }}
                  onMouseEnter={(e) => {
                    if (!isDisabled && !isActive) {
                      e.currentTarget.style.background = tokens.navItemHover;
                      if (!isDark) {
                        e.currentTarget.style.boxShadow =
                          "0 1px 4px rgba(26, 34, 64, 0.06)";
                      }
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.boxShadow = "none";
                    }
                  }}
                >
                  <span className="flex items-center justify-center w-6 h-6">
                    <Icon className="w-5 h-5 flex-shrink-0" />
                  </span>
                  <span
                    className="text-sm font-medium transition-all duration-300 ease-out overflow-hidden whitespace-nowrap"
                    style={{
                      opacity: sidebarCollapsed ? 0 : 1,
                      visibility: sidebarCollapsed ? "hidden" : "visible",
                      width: sidebarCollapsed ? "0" : "auto",
                      transform: sidebarCollapsed
                        ? "translateX(-10px)"
                        : "translateX(0)",
                    }}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </aside>

        {mobileSidebarOpen && (
          <button
            type="button"
            className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileSidebarOpen(false)}
            aria-label="Close navigation"
          />
        )}

        {/* Main Content */}
        <div className="flex min-w-0 flex-1 flex-col h-screen overflow-hidden">
          {/* Top Bar */}
          <header
            className="flex h-20 flex-shrink-0 items-center justify-between border-b px-4 sm:px-6 lg:h-24 lg:px-10"
            style={{ borderColor: tokens.borderDefault }}
          >
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setSidebarCollapsed(false);
                  setMobileSidebarOpen(true);
                }}
                className="flex size-10 shrink-0 items-center justify-center rounded-lg border lg:hidden"
                style={{
                  borderColor: tokens.borderDefault,
                  background: tokens.glassBg,
                  color: tokens.textPrimary,
                }}
                aria-label="Open navigation"
              >
                <Menu className="size-5" />
              </button>
              <div className="min-w-0">
                <h1
                  className="truncate text-lg transition-colors duration-300 sm:text-xl lg:text-2xl"
                  style={{
                    color: tokens.textPrimary,
                    fontWeight: "600",
                    lineHeight: "1.3",
                  }}
                >
                  Supplier Panel
                </h1>
                <p
                  className="mt-1 hidden text-sm sm:block"
                  style={{ color: tokens.textSecondary, lineHeight: "1.4" }}
                >
                  Manage your datasets and account
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleTheme}
                className="w-11 h-11 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95"
                style={{
                  background: isDark
                    ? "rgba(255, 255, 255, 0.1)"
                    : "rgba(255, 255, 255, 0.95)",
                  backdropFilter: "blur(16px)",
                  WebkitBackdropFilter: "blur(16px)",
                  border: `1.5px solid ${isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(26, 34, 64, 0.15)"}`,
                  color: tokens.textPrimary,
                  boxShadow: isDark
                    ? "0 4px 12px rgba(0, 0, 0, 0.3)"
                    : "0 2px 10px rgba(26, 34, 64, 0.1), 0 4px 20px rgba(26, 34, 64, 0.08)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = isDark
                    ? "rgba(255, 255, 255, 0.15)"
                    : "rgba(255, 255, 255, 1)";
                  if (!isDark) {
                    e.currentTarget.style.boxShadow =
                      "0 4px 16px rgba(26, 34, 64, 0.12), 0 8px 32px rgba(26, 34, 64, 0.1)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isDark
                    ? "rgba(255, 255, 255, 0.1)"
                    : "rgba(255, 255, 255, 0.95)";
                  if (!isDark) {
                    e.currentTarget.style.boxShadow =
                      "0 2px 10px rgba(26, 34, 64, 0.1), 0 4px 20px rgba(26, 34, 64, 0.08)";
                  }
                }}
                aria-label="Toggle dark mode"
              >
                {isDark ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </button>

              {/* User Menu Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex h-11 items-center gap-2 rounded-lg px-3 transition-all duration-300 hover:scale-105 active:scale-95 sm:px-5"
                  style={{
                    background: isDark
                      ? "rgba(255, 255, 255, 0.1)"
                      : "rgba(255, 255, 255, 0.95)",
                    backdropFilter: "blur(16px)",
                    WebkitBackdropFilter: "blur(16px)",
                    border: `1.5px solid ${isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(26, 34, 64, 0.15)"}`,
                    color: tokens.textSecondary,
                    boxShadow: isDark
                      ? "0 4px 12px rgba(0, 0, 0, 0.3)"
                      : "0 2px 10px rgba(26, 34, 64, 0.1), 0 4px 20px rgba(26, 34, 64, 0.08)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = isDark
                      ? "rgba(255, 255, 255, 0.15)"
                      : "rgba(255, 255, 255, 1)";
                    e.currentTarget.style.color = tokens.textPrimary;
                    if (!isDark) {
                      e.currentTarget.style.boxShadow =
                        "0 4px 16px rgba(26, 34, 64, 0.12), 0 8px 32px rgba(26, 34, 64, 0.1)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = isDark
                      ? "rgba(255, 255, 255, 0.1)"
                      : "rgba(255, 255, 255, 0.95)";
                    e.currentTarget.style.color = tokens.textSecondary;
                    if (!isDark) {
                      e.currentTarget.style.boxShadow =
                        "0 2px 10px rgba(26, 34, 64, 0.1), 0 4px 20px rgba(26, 34, 64, 0.08)";
                    }
                  }}
                >
                  <User className="w-5 h-5" />
                  <span className="hidden max-w-48 truncate text-base md:inline">
                    {user?.email || "User"}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${userMenuOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {/* Dropdown Menu */}
                {userMenuOpen && (
                  <>
                    {/* Backdrop to close menu */}
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setUserMenuOpen(false)}
                    />

                    {/* Menu Items */}
                    <div
                      className="absolute right-0 mt-2 w-56 rounded-lg shadow-lg z-50 overflow-hidden"
                      style={{
                        background: tokens.glassBg,
                        backdropFilter: "blur(16px)",
                        WebkitBackdropFilter: "blur(16px)",
                        border: `1px solid ${tokens.glassBorder}`,
                        boxShadow: isDark
                          ? "0 8px 24px rgba(0, 0, 0, 0.4)"
                          : "0 4px 16px rgba(26, 34, 64, 0.12), 0 8px 32px rgba(26, 34, 64, 0.08)",
                      }}
                    >
                      <div className="py-1">
                        {/* Profile */}
                        <button
                          onClick={() => {
                            setUserMenuOpen(false);
                            router.push("/dashboard/profile");
                          }}
                          className="w-full px-4 py-2.5 text-left flex items-center gap-3 transition-colors duration-200"
                          style={{
                            color: tokens.textPrimary,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background =
                              tokens.navItemHover;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                          }}
                        >
                          <User className="w-4 h-4" />
                          <span className="text-sm">Profile</span>
                        </button>

                        {/* Account Settings */}
                        <button
                          onClick={() => {
                            setUserMenuOpen(false);
                            router.push("/dashboard/account");
                          }}
                          className="w-full px-4 py-2.5 text-left flex items-center gap-3 transition-colors duration-200"
                          style={{
                            color: tokens.textPrimary,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background =
                              tokens.navItemHover;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                          }}
                        >
                          <Settings className="w-4 h-4" />
                          <span className="text-sm">Account Settings</span>
                        </button>

                        {/* Divider */}
                        <div
                          className="my-1 h-px"
                          style={{ background: tokens.borderDefault }}
                        />

                        {/* Logout */}
                        <button
                          onClick={() => {
                            setUserMenuOpen(false);
                            handleLogout();
                          }}
                          className="w-full px-4 py-2.5 text-left flex items-center gap-3 transition-colors duration-200"
                          style={{
                            color: tokens.textSecondary,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background =
                              tokens.navItemHover;
                            e.currentTarget.style.color = "#ef4444";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                            e.currentTarget.style.color = tokens.textSecondary;
                          }}
                        >
                          <LogOut className="w-4 h-4" />
                          <span className="text-sm">Logout</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>
    </div>
  );
}
