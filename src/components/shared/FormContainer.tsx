"use client";

import { ReactNode } from "react";
import { useSupplierTokens } from "@/hooks/useSupplierTokens";

interface FormContainerProps {
  children: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl";
  centered?: boolean;
  className?: string;
}

/**
 * Reusable form container with glass morphism
 * Reduces duplicate form wrapper code
 */
export function FormContainer({
  children,
  maxWidth = "md",
  centered = true,
  className = "",
}: FormContainerProps) {
  const tokens = useSupplierTokens();

  const widthClasses = {
    sm: "max-w-[400px]",
    md: "max-w-[600px]",
    lg: "max-w-[800px]",
    xl: "max-w-[1000px]",
  };

  return (
    <div
      className={`relative z-10 ${
        centered ? "flex items-center justify-center" : ""
      } px-6 py-16 min-h-[calc(100vh-88px)]`}
    >
      <div className={`w-full ${widthClasses[maxWidth]} ${className}`}>
        <div
          className="relative rounded-2xl transition-all duration-500 border"
          style={{
            background: tokens.glassBg,
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            borderColor: tokens.glassBorder,
            boxShadow: tokens.glassShadow,
          }}
        >
          {/* Rim light effect */}
          <div
            className="absolute top-0 left-0 right-0 h-px rounded-t-2xl"
            style={{
              background: tokens.isDark
                ? "linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.15) 50%, transparent 100%)"
                : "linear-gradient(90deg, transparent 0%, rgba(26, 34, 64, 0.12) 50%, transparent 100%)",
            }}
          />

          {/* Content */}
          <div className="relative z-10 p-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
