"use client";

import { useSupplierTokens } from "@/hooks/useSupplierTokens";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  message?: string;
}

/**
 * Loading Spinner Component
 * Shows a loading indicator with optional message
 */
export function LoadingSpinner({ size = "md", message }: LoadingSpinnerProps) {
  const tokens = useSupplierTokens();

  const sizes = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16",
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div
        className={`${sizes[size]} animate-spin rounded-full border-4`}
        style={{
          borderColor: `${tokens.borderSubtle}`,
          borderTopColor: tokens.textPrimary,
        }}
      />
      {message && (
        <p
          className="text-sm"
          style={{
            color: tokens.textSecondary,
            lineHeight: "1.5",
          }}
        >
          {message}
        </p>
      )}
    </div>
  );
}

/**
 * Loading Screen Component
 * Full-screen loading indicator
 */
export function LoadingScreen({ message = "Loading..." }: { message?: string }) {
  const tokens = useSupplierTokens();

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center"
      style={{ background: tokens.surfaceUnified }}
    >
      <LoadingSpinner size="lg" message={message} />
    </div>
  );
}

/**
 * Loading Skeleton Component
 * Placeholder skeleton for loading content
 */
export function LoadingSkeleton({
  className = "",
  count = 1,
}: {
  className?: string;
  count?: number;
}) {
  const tokens = useSupplierTokens();

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`animate-pulse rounded-lg ${className}`}
          style={{
            background: tokens.isDark
              ? "rgba(255, 255, 255, 0.05)"
              : "rgba(26, 34, 64, 0.05)",
          }}
        />
      ))}
    </>
  );
}
