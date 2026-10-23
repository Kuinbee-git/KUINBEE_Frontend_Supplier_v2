"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { DashboardButton } from "@/components/dashboard/ui/dashboard-button";
import { DashboardCard } from "@/components/dashboard/ui/dashboard-card";
import { SupplierOnboardingShell } from "./SupplierOnboardingShell";
import styles from "./supplier-onboarding.module.css";

export function SupplierLanding() {
  const search = useSyncExternalStore(
    () => () => {},
    () => window.location.search,
    () => ""
  );

  return (
    <SupplierOnboardingShell actions={<></>} centered showFooter={false}>
      <DashboardCard
        className={styles.landing}
        role="region"
        aria-label="Supplier access"
      >
        <p className={styles.landingCopy} data-supplier-landing-copy>
          Partner with Kuinbee.
        </p>
        <div className={styles.landingActions}>
          <DashboardButton asChild size="large">
            <Link href={`/apply${search}`}>Become a supplier</Link>
          </DashboardButton>
          <DashboardButton asChild variant="outline" size="large">
            <Link href="/auth/login">Supplier login</Link>
          </DashboardButton>
        </div>
      </DashboardCard>
    </SupplierOnboardingShell>
  );
}
