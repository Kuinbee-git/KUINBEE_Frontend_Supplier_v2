"use client";

import React, { useMemo } from "react";
import { getPasswordStrength } from "@/lib/utils/auth.utils";

interface PasswordStrengthIndicatorProps {
  password: string;
  tokens: {
    textSecondary: string;
  };
}

/**
 * Visual indicator for password strength
 */
export function PasswordStrengthIndicator({
  password,
}: PasswordStrengthIndicatorProps) {
  const strengthData = useMemo(() => getPasswordStrength(password), [password]);

  if (!password || !strengthData) return null;

  return (
    <div className="space-y-2 mt-2">
      <div className="h-1 w-full rounded-full bg-[var(--dashboard-control-border)] overflow-hidden">
        <div
          className="h-full transition-[width] duration-150 motion-reduce:transition-none"
          style={{
            width: `${strengthData.text === "Strong" ? 100 : strengthData.text === "Fair" ? 66 : 33}%`,
            backgroundColor: "var(--dashboard-indicator)",
          }}
        />
      </div>
      <p className="text-xs" style={{ color: "var(--dashboard-text-muted)" }}>
        Password strength:{" "}
        <span style={{ color: "var(--foreground)", fontWeight: 500 }}>
          {strengthData.text}
        </span>
      </p>
    </div>
  );
}
