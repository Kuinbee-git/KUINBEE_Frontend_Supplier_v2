"use client";
import { memo, type ReactNode } from "react";
import Link from "next/link";
import { SupplierOnboardingShell } from "@/components/onboarding/SupplierOnboardingShell";
import { DashboardButton } from "@/components/dashboard/ui/dashboard-button";
import styles from "@/components/onboarding/supplier-onboarding.module.css";
interface AuthShellWrapperProps {
  isDark: boolean;
  onToggleDark: () => void;
  children: ReactNode;
  showNav?: ReactNode;
}
function AuthShellWrapperComponent({
  children,
  showNav,
}: AuthShellWrapperProps) {
  return (
    <SupplierOnboardingShell
      actions={
        <DashboardButton asChild variant="ghost" size="compact">
          <Link href="/">Supplier home</Link>
        </DashboardButton>
      }
    >
      {showNav}
      <section className={`${styles.panel} ${styles.narrow}`}>
        {children}
      </section>
    </SupplierOnboardingShell>
  );
}
export const AuthShellWrapper = memo(AuthShellWrapperComponent);
export default AuthShellWrapper;
