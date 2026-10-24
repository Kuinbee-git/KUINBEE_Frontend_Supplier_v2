"use client";

import Image from "next/image";
import Link from "next/link";
import { useSyncExternalStore } from "react";
import { ArrowRight, AudioLines, FileText, Images } from "lucide-react";
import { DashboardButton } from "@/components/dashboard/ui/dashboard-button";
import { DashboardCard } from "@/components/dashboard/ui/dashboard-card";
import { SupplierOnboardingShell } from "./SupplierOnboardingShell";
import styles from "./supplier-onboarding.module.css";

function SupplierNetworkVisual() {
  return (
    <div className={styles.networkVisual} aria-hidden="true">
      <svg className={styles.networkLines} viewBox="0 0 460 420" fill="none">
        <path d="M196 78C230 78 230 138 230 179" />
        <path d="M369 128C369 208 320 231 282 231" />
        <path d="M230 283C230 300 174 286 174 316" />
        <circle cx="230" cy="161" r="3" />
        <circle cx="306" cy="230" r="3" />
        <circle cx="194" cy="297" r="3" />
      </svg>
      <DashboardCard className={`${styles.dataTile} ${styles.textTile}`}>
        <span className={styles.tileLabel}>
          <FileText />
          Text & language
        </span>
        <div className={styles.textSample}>
          <i />
          <i />
          <i />
        </div>
      </DashboardCard>
      <DashboardCard className={`${styles.dataTile} ${styles.audioTile}`}>
        <span className={styles.tileLabel}>
          <AudioLines />
          Speech & audio
        </span>
        <div className={styles.audioSample}>
          {[12, 22, 14, 32, 42, 24, 16, 34, 26, 44, 30, 18, 24, 12].map(
            (height, i) => (
              <i key={i} style={{ height }} />
            )
          )}
        </div>
      </DashboardCard>
      <DashboardCard className={`${styles.dataTile} ${styles.visionTile}`}>
        <span className={styles.tileLabel}>
          <Images />
          Images & video
        </span>
        <div className={styles.visionSample}>
          <svg viewBox="0 0 88 42" fill="none">
            <rect x=".5" y=".5" width="87" height="41" rx="5" />
            <circle cx="64" cy="12" r="4" />
            <path d="m5 37 22-23 19 20 12-12 25 15" />
          </svg>
          <svg viewBox="0 0 88 42" fill="none">
            <rect x=".5" y=".5" width="87" height="41" rx="5" />
            <path d="m37 12 17 9-17 9V12Z" />
          </svg>
        </div>
      </DashboardCard>
      <DashboardCard className={styles.networkHub}>
        <span className={styles.hubLogo}>
          <Image
            src="/logo-light.png"
            alt=""
            width={256}
            height={256}
            className="size-12 scale-[2.4] object-contain dark:hidden"
          />
          <Image
            src="/logo-dark.png"
            alt=""
            width={256}
            height={256}
            className="hidden size-12 scale-[2.4] object-contain dark:block"
          />
        </span>
        <span>Kuinbee</span>
      </DashboardCard>
    </div>
  );
}

export function SupplierLanding() {
  const search = useSyncExternalStore(
    () => () => {},
    () => window.location.search,
    () => ""
  );

  return (
    <SupplierOnboardingShell actions={<></>} centered showFooter={false}>
      <section className={styles.landing} aria-label="Supplier access">
        <div className={styles.landingIntro}>
          <h1 className={styles.landingTitle}>
            Your data.
            <br />
            New opportunities.
          </h1>
          <p className={styles.landingCopy} data-supplier-landing-copy>
            Connect your datasets and collection expertise with data buyers
            worldwide.
          </p>
          <div className={styles.landingActions}>
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
          <p className={styles.landingNote}>
            For individuals and organizations.
          </p>
        </div>
        <SupplierNetworkVisual />
      </section>
    </SupplierOnboardingShell>
  );
}
