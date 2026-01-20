import { useMemo } from "react";
import { useThemeStore } from "@/store/theme.store";

/**
 * Design tokens hook for supplier dashboard and onboarding
 * Provides consistent theming across all supplier components
 */
export function useSupplierTokens() {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  const tokens = useMemo(
    () => ({
      // Surfaces
      surfaceUnified: isDark
        ? "linear-gradient(135deg, #1a2240 0%, #2a3250 50%, #1f2847 100%)"
        : "linear-gradient(135deg, #ffffff 0%, #f9fafb 50%, #f5f7fb 100%)",

      // Glass morphism
      glassBg: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(255, 255, 255, 0.88)",
      glassBorder: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.5)",
      glassShadow: isDark
        ? "0 8px 16px rgba(0, 0, 0, 0.4), 0 20px 40px rgba(0, 0, 0, 0.35), 0 40px 80px rgba(0, 0, 0, 0.25)"
        : "0 8px 16px rgba(26, 34, 64, 0.08), 0 20px 60px rgba(26, 34, 64, 0.12), 0 40px 100px rgba(26, 34, 64, 0.08)",

      // Typography
      textPrimary: isDark ? "#ffffff" : "#1a2240",
      textSecondary: isDark ? "rgba(255, 255, 255, 0.6)" : "#525d6f",
      textMuted: isDark ? "rgba(255, 255, 255, 0.5)" : "#7a8494",

      // Borders
      borderDefault: isDark ? "rgba(255, 255, 255, 0.1)" : "#dde3f0",
      borderSubtle: isDark ? "rgba(255, 255, 255, 0.04)" : "rgba(26, 34, 64, 0.06)",

      // Inputs
      inputBg: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(255, 255, 255, 0.7)",
      inputBorder: isDark ? "rgba(255, 255, 255, 0.1)" : "#dde3f0",

      // Status colors
      warningBg: isDark ? "rgba(245, 158, 11, 0.1)" : "rgba(245, 158, 11, 0.08)",
      warningBorder: "rgba(245, 158, 11, 0.3)",
      warningText: "#f59e0b",

      successBg: isDark ? "rgba(16, 185, 129, 0.1)" : "rgba(16, 185, 129, 0.08)",
      successBorder: "rgba(16, 185, 129, 0.3)",
      successText: "#10b981",

      verifiedBg: isDark ? "rgba(16, 185, 129, 0.1)" : "rgba(16, 185, 129, 0.08)",
      verifiedBorder: "rgba(16, 185, 129, 0.3)",
      verifiedText: "#10b981",

      errorBg: isDark ? "rgba(239, 68, 68, 0.1)" : "rgba(239, 68, 68, 0.08)",
      errorBorder: "rgba(239, 68, 68, 0.3)",
      errorText: "#ef4444",

      infoBg: isDark ? "rgba(255, 255, 255, 0.04)" : "rgba(26, 34, 64, 0.04)",
      infoBorder: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(26, 34, 64, 0.08)",

      // Navigation
      sidebarBg: isDark ? "rgba(255, 255, 255, 0.04)" : "rgba(255, 255, 255, 0.6)",
      navItemHover: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(26, 34, 64, 0.06)",
      navItemActive: isDark
        ? "linear-gradient(135deg, rgba(26, 34, 64, 0.4), rgba(42, 50, 80, 0.3))"
        : "linear-gradient(135deg, rgba(26, 34, 64, 0.08), rgba(26, 34, 64, 0.04))",

      // Grid pattern (used by layouts and backgrounds)
      gridPattern: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(26, 34, 64, 0.15)',
      gridOpacity: isDark ? 0.6 : 0.4,

      // Theme flag
      isDark,
    }),
    [isDark]
  );

  return tokens;
}
