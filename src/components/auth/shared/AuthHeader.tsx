"use client";
import styles from "@/components/onboarding/supplier-onboarding.module.css";
interface AuthHeaderProps {
  title: string;
  subtitle?: string;
  tokens: { textPrimary: string; textSecondary: string };
}
export function AuthHeader({ title, subtitle }: AuthHeaderProps) {
  return (
    <div className="space-y-2 mb-6">
      <h1 className={styles.title}>{title}</h1>
      {subtitle && <p className={styles.authDescription}>{subtitle}</p>}
    </div>
  );
}
