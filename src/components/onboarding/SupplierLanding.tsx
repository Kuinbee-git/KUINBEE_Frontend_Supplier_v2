"use client";
import Link from "next/link";
import { useSyncExternalStore } from "react";
import { SupplierOnboardingShell } from "./SupplierOnboardingShell";
import styles from "./supplier-onboarding.module.css";

export function SupplierLanding() {
  const search = useSyncExternalStore(() => () => {}, () => window.location.search, () => "");
  const apply = `/apply${search}`;
  return <SupplierOnboardingShell><section className="py-10 md:py-16">
    <p className={styles.eyebrow}>Kuinbee supplier network</p><h1 className={styles.title}>Bring your data expertise<br/>to the right opportunities.</h1>
    <p className={styles.intro}>Tell us what you can offer. After qualification, complete a secure verification workspace and build your supplier profile.</p>
    <div className={styles.actions}><Link className={styles.button} href={apply}>Become a supplier</Link><Link className={styles.secondary} href="/auth/login">Supplier login</Link><Link className={styles.textButton} href="/application/status">Check application status</Link></div>
    <div className={`${styles.grid} mt-14`}>
      <section className={styles.panel}><p className={styles.eyebrow}>01 · Qualification</p><h2 className={styles.sectionTitle}>Start with your capabilities</h2><p className={styles.muted}>Share your data, coverage and experience. Save as you go and submit when you’re ready. Our team reviews your application before inviting you.</p></section>
      <section className={styles.panel}><p className={styles.eyebrow}>02 · Verification</p><h2 className={styles.sectionTitle}>One place to finish</h2><p className={styles.muted}>Confirm your prefilled information, upload the applicable private documents and submit for final approval. Your existing supplier account stays with you.</p></section>
    </div>
  </section></SupplierOnboardingShell>;
}
