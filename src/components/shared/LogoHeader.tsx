import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSupplierTokens } from "@/hooks/useSupplierTokens";
import { useThemeStore } from "@/store";
import { DarkModeToggle } from "./DarkModeToggle";
import logoDark from "@/assets/logo-dark.png";
import logoLight from "@/assets/logo-light.png";

interface LogoHeaderProps {
  title: string;
  subtitle: string;
  onLogout?: () => void;
  showDarkModeToggle?: boolean;
}

/**
 * Consistent header with logo, title, and logout button
 * Used across onboarding and dashboard
 */
export function LogoHeader({
  title,
  subtitle,
  onLogout,
  showDarkModeToggle = true,
}: LogoHeaderProps) {
  const tokens = useSupplierTokens();
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  return (
    <div className="relative z-10 border-b" style={{ borderColor: tokens.borderDefault }}>
      <div className="max-w-[1400px] mx-auto px-8 py-6 flex items-center justify-between">
        {/* Logo and Title */}
        <div className="flex items-center gap-4">
          <div
            className="h-10 px-3 border rounded-lg flex items-center justify-center transition-all duration-300"
            style={{
              background: tokens.glassBg,
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              border: `1px solid ${tokens.glassBorder}`,
            }}
          >
            <img
              src={isDark ? logoDark.src : logoLight.src}
              alt="Kuinbee"
              className="h-16 transition-opacity duration-300"
              style={{ opacity: isDark ? 0.9 : 1 }}
            />
          </div>
          <div>
            <h1
              className="text-base transition-colors duration-300"
              style={{
                color: tokens.textPrimary,
                fontWeight: "600",
                lineHeight: "1.4",
              }}
            >
              {title}
            </h1>
            <p
              className="text-xs mt-0.5"
              style={{ color: tokens.textSecondary, lineHeight: "1.4" }}
            >
              {subtitle}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {showDarkModeToggle && <DarkModeToggle />}

          {onLogout && (
            <Button
              variant="ghost"
              onClick={onLogout}
              className="gap-2 transition-all duration-300 h-10 px-4 rounded-lg hover:scale-105 active:scale-95"
              style={{
                color: tokens.textPrimary,
                background: tokens.glassBg,
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                border: `1px solid ${tokens.glassBorder}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = isDark 
                  ? 'rgba(255, 255, 255, 0.12)' 
                  : 'rgba(255, 255, 255, 0.95)';
                e.currentTarget.style.boxShadow = isDark
                  ? '0 2px 8px rgba(0, 0, 0, 0.3)'
                  : '0 2px 8px rgba(26, 34, 64, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = tokens.glassBg;
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Logout</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
