"use client";

import { ReactNode } from "react";
import { useSupplierTokens } from "@/hooks/useSupplierTokens";
import { LucideIcon } from "lucide-react";

interface ContentCardProps {
  children: ReactNode;
  icon?: LucideIcon;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
}

/**
 * Reusable content card with glass morphism
 * Consolidates repeated card patterns
 */
export function ContentCard({
  children,
  icon: Icon,
  title,
  subtitle,
  actions,
  className = "",
}: ContentCardProps) {
  const tokens = useSupplierTokens();

  return (
    <div
      className={`rounded-xl border p-6 transition-all duration-300 ${className}`}
      style={{
        background: tokens.glassBg,
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderColor: tokens.glassBorder,
        boxShadow: tokens.glassShadow,
      }}
    >
      {(title || Icon) && (
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {Icon && <Icon className="w-5 h-5" style={{ color: tokens.textSecondary }} />}
            <div>
              {title && (
                <h3
                  className="text-sm"
                  style={{
                    color: tokens.textPrimary,
                    fontWeight: "600",
                    lineHeight: "1.4",
                  }}
                >
                  {title}
                </h3>
              )}
              {subtitle && (
                <p
                  className="text-xs mt-0.5"
                  style={{ color: tokens.textSecondary, lineHeight: "1.5" }}
                >
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {actions && <div className="flex-shrink-0">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
