"use client";

import { ReactNode } from "react";
import { useSupplierTokens } from "@/hooks/useSupplierTokens";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
}

/**
 * Reusable section header component
 * Standardizes heading styles across pages
 */
export function SectionHeader({ title, subtitle, actions, className = "" }: SectionHeaderProps) {
  const tokens = useSupplierTokens();

  return (
    <div className={`flex items-start justify-between gap-4 ${className}`}>
      <div>
        <h2
          className="mb-2 transition-colors duration-300"
          style={{
            color: tokens.textPrimary,
            fontWeight: "600",
            fontSize: "20px",
            lineHeight: "1.4",
          }}
        >
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm" style={{ color: tokens.textSecondary, lineHeight: "1.5" }}>
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex-shrink-0">{actions}</div>}
    </div>
  );
}
