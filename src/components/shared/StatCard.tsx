import { useSupplierTokens } from "@/hooks/useSupplierTokens";

import { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: ReactNode;
  className?: string;
}

/**
 * Stat card for displaying metrics
 * Used in dashboard overview
 */
export function StatCard({ label, value, className = "" }: StatCardProps) {
  const tokens = useSupplierTokens();

  return (
    <div
      className={`rounded-xl p-5 transition-all duration-300 ${className}`}
      style={{
        background: tokens.glassBg,
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: `1px solid ${tokens.glassBorder}`,
        boxShadow: tokens.glassShadow,
      }}
    >
      <p
        className="text-xs mb-2"
        style={{ color: tokens.textMuted, lineHeight: "1.4" }}
      >
        {label}
      </p>
      <p
        className="text-2xl"
        style={{
          color: tokens.textPrimary,
          fontWeight: "700",
          lineHeight: "1.2",
        }}
      >
        {value}
      </p>
    </div>
  );
}
