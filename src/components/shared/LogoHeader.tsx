import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSupplierTokens } from "@/hooks/useSupplierTokens";
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
              src={tokens.isDark ? logoDark.src : logoLight.src}
              alt="Kuinbee"
              className="h-16 transition-opacity duration-300"
              style={{ opacity: tokens.isDark ? 0.9 : 1 }}
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
              className="gap-2 transition-colors h-10 px-4"
              style={{ color: tokens.textSecondary }}
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm">Logout</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
