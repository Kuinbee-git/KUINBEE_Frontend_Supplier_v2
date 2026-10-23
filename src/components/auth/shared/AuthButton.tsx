"use client";
import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { DashboardButton } from "@/components/dashboard/ui/dashboard-button";
interface AuthButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  children: ReactNode;
  variant?: "primary" | "secondary";
  type?: "button" | "submit";
  className?: string;
  isDark?: boolean;
}
export function AuthButton({
  onClick,
  disabled,
  isLoading,
  children,
  variant = "primary",
  type = "button",
  className = "",
}: AuthButtonProps) {
  return (
    <DashboardButton
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      variant={variant === "primary" ? "default" : "outline"}
      className={`w-full ${className}`}
      aria-busy={isLoading || undefined}
    >
      {isLoading ? (
        <>
          <Loader2 className="animate-spin" aria-hidden="true" />
          Loading...
        </>
      ) : (
        children
      )}
    </DashboardButton>
  );
}
