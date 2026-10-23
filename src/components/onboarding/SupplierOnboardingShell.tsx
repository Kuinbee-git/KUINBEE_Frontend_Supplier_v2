"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Moon, Sun } from "lucide-react";
import { DashboardButton } from "@/components/dashboard/ui/dashboard-button";
import { useThemeStore } from "@/store";
import "@/app/dashboard/dashboard.css";
import styles from "./supplier-onboarding.module.css";

export function SupplierOnboardingShell({
  children,
  actions,
  centered = false,
  showFooter = true,
  className = "",
}: {
  children: ReactNode;
  actions?: ReactNode;
  centered?: boolean;
  showFooter?: boolean;
  className?: string;
}) {
  const { isDark, toggleTheme } = useThemeStore();

  return (
    <div
      className={`supplier-dashboard dashboard-canvas ${styles.shell} ${className}`}
      data-ui-scope="supplier-onboarding"
    >
      <a href="#supplier-onboarding-main" className={styles.skipLink}>
        Skip to content
      </a>
      <header className={`dashboard-shell-topbar ${styles.header}`}>
        <div className={styles.headerInner}>
          <Link
            href="/"
            aria-label="Kuinbee suppliers"
            className={styles.brand}
          >
            <span className={styles.logo}>
              <Image
                src="/logo-light.png"
                alt=""
                width={256}
                height={256}
                className="size-8 scale-[2.4] object-contain dark:hidden"
                priority
              />
              <Image
                src="/logo-dark.png"
                alt=""
                width={256}
                height={256}
                className="hidden size-8 scale-[2.4] object-contain dark:block"
                priority
              />
            </span>
            <span>
              Kuinbee
              <span className={styles.brandDivider} aria-hidden="true" />
              <span className={styles.brandCaption}>Suppliers</span>
            </span>
          </Link>
          <nav aria-label="Supplier account" className={styles.headerActions}>
            {actions ?? (
              <DashboardButton asChild variant="ghost" size="compact">
                <Link href="/auth/login">Supplier login</Link>
              </DashboardButton>
            )}
            <DashboardButton
              variant="outline"
              size="icon"
              onClick={toggleTheme}
              aria-label={
                isDark ? "Switch to light mode" : "Switch to dark mode"
              }
            >
              {isDark ? (
                <Sun aria-hidden="true" />
              ) : (
                <Moon aria-hidden="true" />
              )}
            </DashboardButton>
          </nav>
        </div>
      </header>
      <main
        id="supplier-onboarding-main"
        tabIndex={-1}
        className={`${styles.main} ${centered ? styles.centeredMain : ""}`}
        data-dashboard-content="true"
      >
        {children}
      </main>
      {showFooter && (
        <footer className={styles.footer}>
          <span>© {new Date().getFullYear()} Kuinbee</span>
          <a href="mailto:support@kuinbee.com">Contact support</a>
        </footer>
      )}
    </div>
  );
}
