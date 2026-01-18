import { LucideIcon, Mail, AlertCircle, CheckCircle2 } from "lucide-react";
import { useSupplierTokens } from "@/hooks/useSupplierTokens";

type IconType = "mail" | "alert" | "check" | LucideIcon;

interface InfoCardProps {
  icon: IconType;
  title: string;
  description: string;
  iconColor?: string;
}

/**
 * Info card with icon, title, and description
 * Used for instructions and informational messages
 */
export function InfoCard({ icon, title, description, iconColor }: InfoCardProps) {
  const tokens = useSupplierTokens();

  // Map string icon types to components
  const getIcon = () => {
    if (typeof icon === "string") {
      switch (icon) {
        case "mail":
          return Mail;
        case "alert":
          return AlertCircle;
        case "check":
          return CheckCircle2;
        default:
          return AlertCircle;
      }
    }
    return icon;
  };

  const Icon = getIcon();
  const defaultIconColor = tokens.textSecondary;

  return (
    <div
      className="rounded-xl p-4 transition-all duration-300"
      style={{
        background: tokens.infoBg,
        border: `1px solid ${tokens.infoBorder}`,
      }}
    >
      <div className="flex items-start gap-3">
        <Icon
          className="w-5 h-5 flex-shrink-0 mt-0.5"
          style={{ color: iconColor || defaultIconColor }}
        />
        <div className="flex-1">
          <p
            className="text-sm mb-1"
            style={{
              color: tokens.textPrimary,
              fontWeight: "600",
              lineHeight: "1.5",
            }}
          >
            {title}
          </p>
          <p
            className="text-sm"
            style={{ color: tokens.textSecondary, lineHeight: "1.5" }}
          >
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}
