"use client";
import Link from "next/link";
import Image from "next/image";
import { PageBackground } from "@/components/shared";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { useThemeStore } from "@/store";
import type { ReactNode } from "react";
import styles from "./supplier-onboarding.module.css";

export function SupplierOnboardingShell({children}: {children: ReactNode}) {
  const {isDark, toggleTheme} = useThemeStore();
  return <PageBackground withGrid><div className={styles.shell}>
    <header className={styles.header}><Link href="/" aria-label="Kuinbee suppliers" style={{width: 72, height: 40, position: "relative", overflow: "hidden", display: "block"}}><Image src={isDark ? "/logo-dark.png" : "/logo-light.png"} alt="Kuinbee" width={130} height={40} style={{height: 180, width: 180, maxWidth: "none", position: "absolute", left: -57, top: -68}} /></Link>
      <div className={styles.headerActions}><Link href="/auth/login">Supplier login</Link><ThemeToggle isDark={isDark} onToggle={toggleTheme}/></div></header>
    <main className={styles.main}>{children}</main>
    <footer className={styles.footer}>Need help? <a href="mailto:support@kuinbee.com">support@kuinbee.com</a></footer>
  </div></PageBackground>;
}
