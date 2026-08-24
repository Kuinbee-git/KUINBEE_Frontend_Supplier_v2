import { ChevronDown, ChevronUp } from "lucide-react";
import type { ReactNode } from "react";

interface CollapsibleSectionProps {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: ReactNode;
  isDark?: boolean;
  icon?: ReactNode;
}

export function CollapsibleSection({
  title,
  isExpanded,
  onToggle,
  children,
  icon,
}: CollapsibleSectionProps) {
  return (
    <div className="border-b border-[var(--dashboard-border)]">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isExpanded}
        className="flex w-full items-center justify-between px-6 py-4 text-foreground transition-colors duration-150 hover:bg-[var(--dashboard-button-ghost-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--dashboard-focus-ring)] motion-reduce:transition-none"
      >
        <div className="flex items-center gap-3">
          {icon && (
            <span className="text-muted-foreground" aria-hidden="true">
              {icon}
            </span>
          )}
          <span className="text-sm font-semibold">{title}</span>
        </div>
        {isExpanded ? (
          <ChevronUp
            className="size-4 text-muted-foreground"
            aria-hidden="true"
          />
        ) : (
          <ChevronDown
            className="size-4 text-muted-foreground"
            aria-hidden="true"
          />
        )}
      </button>

      {isExpanded && <div className="px-6 py-4">{children}</div>}
    </div>
  );
}
