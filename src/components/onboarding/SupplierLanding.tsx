"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { ArrowRight } from "lucide-react";
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
    <SupplierOnboardingShell>
      <section className={styles.landing}>
        <p className={styles.eyebrow}>Supplier network</p>
        <h1 className={styles.landingTitle}>Become a Kuinbee supplier.</h1>
        <p className={styles.intro}>
          Share your data capabilities. We’ll review your application and guide
          you through verification.
        </p>
        <div className={styles.actions}>
          <DashboardButton asChild size="large">
            <Link href={`/apply${search}`}>
              Become a supplier
              <ArrowRight aria-hidden="true" />
            </Link>
          </DashboardButton>
          <DashboardButton asChild variant="outline" size="large">
            <Link href="/auth/login">Supplier login</Link>
          </DashboardButton>
        </div>
        <p className={styles.landingStatus}>
          Already applied?{" "}
          <Link className={styles.textButton} href="/application/status">
            Check application status
          </Link>
        </p>
      </section>
    </SupplierOnboardingShell>
  );
}
