"use client";
import { useState, type ChangeEvent, type KeyboardEvent } from "react";
import {
  DashboardField,
  DashboardInput,
} from "@/components/dashboard/ui/dashboard-form";
import styles from "@/components/onboarding/supplier-onboarding.module.css";
interface PasswordInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;
  placeholder?: string;
  autoComplete?: string;
  tokens: {
    textPrimary: string;
    textSecondary: string;
    inputBorder: string;
    inputBg: string;
  };
}
export function PasswordInput({
  id,
  label,
  value,
  onChange,
  onKeyDown,
  placeholder = "Enter password",
  autoComplete = "current-password",
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <DashboardField id={id} label={label}>
      {(control) => (
        <div className="relative">
          <DashboardInput
            {...control}
            type={showPassword ? "text" : "password"}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            onKeyDown={onKeyDown}
            className="pr-16"
            autoComplete={autoComplete}
          />
          <button
            type="button"
            className={styles.passwordToggle}
            aria-controls={id}
            aria-pressed={showPassword}
            aria-label={`${showPassword ? "Hide" : "Show"} ${label.toLowerCase()}`}
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
      )}
    </DashboardField>
  );
}
