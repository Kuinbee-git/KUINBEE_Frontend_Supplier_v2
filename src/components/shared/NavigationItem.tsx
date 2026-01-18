import { LucideIcon } from "lucide-react";
import { useSupplierTokens } from "@/hooks/useSupplierTokens";

interface NavigationItemProps {
  icon: LucideIcon;
  label: string;
  isActive?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  collapsed?: boolean;
}

/**
 * Navigation item for sidebar menus
 * Supports active, disabled, and collapsed states
 */
export function NavigationItem({
  icon: Icon,
  label,
  isActive = false,
  disabled = false,
  onClick,
  collapsed = false,
}: NavigationItemProps) {
  const tokens = useSupplierTokens();

  const handleClick = () => {
    if (!disabled && onClick) {
      onClick();
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`w-full rounded-lg transition-all duration-200 flex items-center ${
        collapsed ? "justify-center p-3" : "gap-3 px-4 py-3"
      } ${disabled ? "opacity-50 cursor-not-allowed" : "hover:scale-[1.02] cursor-pointer"}`}
      style={{
        background: isActive ? tokens.navItemActive : "transparent",
        color: isActive ? tokens.textPrimary : tokens.textSecondary,
      }}
      onMouseEnter={(e) => {
        if (!disabled && !isActive) {
          e.currentTarget.style.background = tokens.navItemHover;
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !isActive) {
          e.currentTarget.style.background = "transparent";
        }
      }}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      {!collapsed && (
        <span className="text-sm font-medium transition-colors duration-200">
          {label}
        </span>
      )}
    </button>
  );
}
