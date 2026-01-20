"use client";

import { ReactNode } from "react";
import { useSupplierTokens } from "@/hooks/useSupplierTokens";

interface PageBackgroundProps {
  children: ReactNode;
  withGrid?: boolean;
  className?: string;
}

/**
 * Reusable page background with optional grid pattern
 * Eliminates duplicate background/grid code across 6+ components
 */
export function PageBackground({ children, withGrid = true, className = "" }: PageBackgroundProps) {
  const tokens = useSupplierTokens();

  return (
    <div className={`relative min-h-screen w-full overflow-hidden ${className}`}>
      {/* Unified background */}
      <div
        className="absolute inset-0 transition-all duration-500"
        style={{ background: tokens.surfaceUnified }}
      />

      {/* Optional grid pattern overlay */}
      {withGrid && (
        <div
          className="absolute inset-0 transition-opacity duration-500"
          style={{
            backgroundImage: tokens.isDark
              ? `linear-gradient(${tokens.borderSubtle} 1px, transparent 1px), linear-gradient(90deg, ${tokens.borderSubtle} 1px, transparent 1px)`
              : `linear-gradient(rgba(26, 34, 64, 0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(26, 34, 64, 0.15) 1px, transparent 1px)`,
            backgroundSize: "32px 32px",
            opacity: tokens.isDark ? 0.6 : 0.4,
          }}
        />
      )}

      {/* Content */}
      {children}
    </div>
  );
}
