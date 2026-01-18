import { Moon, Sun } from "lucide-react";
import { useSupplierTokens } from "@/hooks/useSupplierTokens";
import { useThemeStore } from "@/store/theme.store";

/**
 * Dark mode toggle button
 * Consistent styling across all views
 */
export function DarkModeToggle() {
  const tokens = useSupplierTokens();
  const { theme, toggleTheme } = useThemeStore();

  return (
    <button
      onClick={toggleTheme}
      className="w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-105"
      style={{
        background: tokens.glassBg,
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: `1px solid ${tokens.glassBorder}`,
        color: tokens.textPrimary,
      }}
      aria-label="Toggle dark mode"
    >
      {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}
