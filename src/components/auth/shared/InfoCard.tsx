"use client";
import type { ReactNode } from "react";
import { Mail, AlertCircle, CheckCircle2 } from "lucide-react";
import styles from "@/components/onboarding/supplier-onboarding.module.css";
interface InfoCardProps {
  icon?: "mail" | "alert" | "success";
  iconColor?: string;
  children: ReactNode;
  isDark?: boolean;
  tokens: { textPrimary: string; textSecondary: string };
}
export function InfoCard({ icon = "mail", children }: InfoCardProps) {
  const Icon =
    icon === "mail" ? Mail : icon === "alert" ? AlertCircle : CheckCircle2;
  return (
    <div className={`${styles.notice} flex items-start gap-3`}>
      <Icon className="size-4 shrink-0 mt-0.5" aria-hidden="true" />
      <div className="min-w-0 space-y-2">{children}</div>
    </div>
  );
}
