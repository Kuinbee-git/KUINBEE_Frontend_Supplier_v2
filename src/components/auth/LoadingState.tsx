"use client";
import { memo } from "react";
import { Loader2 } from "lucide-react";
import {
  DashboardField,
  DashboardInput,
} from "@/components/dashboard/ui/dashboard-form";
import { DashboardButton } from "@/components/dashboard/ui/dashboard-button";
import styles from "@/components/onboarding/supplier-onboarding.module.css";
interface LoadingStateProps {
  email: string;
  isDark?: boolean;
  message?: string;
}
function LoadingStateComponent({
  email,
  message = "Checking...",
}: LoadingStateProps) {
  return (
    <div className="space-y-5" aria-busy="true">
      <h1 className={styles.title}>Supplier login</h1>
      <DashboardField id="email" label="Email">
        {(control) => (
          <DashboardInput {...control} type="email" value={email} disabled />
        )}
      </DashboardField>
      <DashboardButton disabled className="w-full">
        <Loader2 className="animate-spin" aria-hidden="true" />
        <span role="status">{message}</span>
      </DashboardButton>
    </div>
  );
}
export const LoadingState = memo(LoadingStateComponent);
export default LoadingState;
