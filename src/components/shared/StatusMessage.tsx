import { ReactNode } from "react";
import { AlertTriangle, AlertCircle, CheckCircle2, Info } from "lucide-react";
import { useSupplierTokens } from "@/hooks/useSupplierTokens";

type MessageVariant = "warning" | "error" | "success" | "info";

interface StatusMessageProps {
  variant: MessageVariant;
  title?: string;
  message: string | ReactNode;
  className?: string;
}

/**
 * Consistent status message component
 * Supports warning, error, success, and info variants
 */
export function StatusMessage({ variant, title, message, className = "" }: StatusMessageProps) {
  const tokens = useSupplierTokens();

  const config = {
    warning: {
      icon: AlertTriangle,
      bg: tokens.warningBg,
      border: tokens.warningBorder,
      iconColor: tokens.warningText,
    },
    error: {
      icon: AlertCircle,
      bg: tokens.errorBg,
      border: tokens.errorBorder,
      iconColor: tokens.errorText,
    },
    success: {
      icon: CheckCircle2,
      bg: tokens.successBg,
      border: tokens.successBorder,
      iconColor: tokens.successText,
    },
    info: {
      icon: Info,
      bg: tokens.infoBg,
      border: tokens.infoBorder,
      iconColor: tokens.textSecondary,
    },
  };

  const { icon: Icon, bg, border, iconColor } = config[variant];

  return (
    <div
      className={`rounded-xl border p-4 transition-all duration-300 ${className}`}
      style={{
        background: bg,
        borderColor: border,
      }}
    >
      <div className="flex items-start gap-3">
        <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: iconColor }} />
        <div className="flex-1">
          {title && (
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
          )}
          <div
            className="text-sm"
            style={{ color: tokens.textSecondary, lineHeight: "1.5" }}
          >
            {message}
          </div>
        </div>
      </div>
    </div>
  );
}
