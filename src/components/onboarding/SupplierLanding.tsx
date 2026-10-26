"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { DashboardButton } from "@/components/dashboard/ui/dashboard-button";
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
      <section className={styles.landing} aria-label="Supplier access">
        <p className={styles.landingCopy} data-supplier-landing-copy>
          Connect your data and expertise with buyers through Kuinbee.
        </p>
        <div className={styles.landingActions}>
          <DashboardButton asChild size="large">
            <Link href={`/apply${search}`}>Become a supplier</Link>
          </DashboardButton>
          <DashboardButton asChild variant="outline" size="large">
            <Link href="/auth/login">Supplier login</Link>
          </DashboardButton>
        </div>
      </section>
    </SupplierOnboardingShell>
  );
}
