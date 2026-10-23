"use client";
import styles from "@/components/onboarding/supplier-onboarding.module.css";
interface AuthAlertProps {
  message: string;
  variant?: "error" | "success" | "info";
  isDark?: boolean;
  tokens: { textPrimary: string };
}
export function AuthAlert({ message, variant = "error" }: AuthAlertProps) {
  return (
    <p
      role={variant === "error" ? "alert" : "status"}
      className={variant === "error" ? styles.error : styles.notice}
    >
      {message}
    </p>
  );
}
