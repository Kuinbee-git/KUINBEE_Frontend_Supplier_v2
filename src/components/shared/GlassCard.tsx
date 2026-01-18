import { ReactNode } from "react";
import { useSupplierTokens } from "@/hooks/useSupplierTokens";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  withRimLight?: boolean;
}

/**
 * Glassmorphism card component with backdrop blur
 * Used throughout supplier onboarding and dashboard
 */
export function GlassCard({ children, className = "", withRimLight = true }: GlassCardProps) {
  const tokens = useSupplierTokens();

  return (
    <div
      className={`relative rounded-2xl transition-all duration-500 border ${className}`}
      style={{
        background: tokens.glassBg,
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderColor: tokens.glassBorder,
        boxShadow: tokens.glassShadow,
      }}
    >
      {/* Rim light effect */}
      {withRimLight && (
        <div
          className="absolute top-0 left-0 right-0 h-px rounded-t-2xl"
          style={{
            background: tokens.isDark
              ? "linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.15) 50%, transparent 100%)"
              : "linear-gradient(90deg, transparent 0%, rgba(26, 34, 64, 0.12) 50%, transparent 100%)",
          }}
        />
      )}

      <div className="relative z-10">{children}</div>
    </div>
  );
}
