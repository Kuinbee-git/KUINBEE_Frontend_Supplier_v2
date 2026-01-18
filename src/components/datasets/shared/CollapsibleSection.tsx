import { ChevronDown, ChevronUp } from 'lucide-react';
import { ReactNode } from 'react';

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
  isDark = false,
  icon,
}: CollapsibleSectionProps) {
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : '#dde3f0';
  const textPrimary = isDark ? '#ffffff' : '#1a2240';
  const textMuted = isDark ? 'rgba(255, 255, 255, 0.5)' : '#7a8494';
  const hoverBg = isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(26, 34, 64, 0.02)';

  return (
    <div className="border-b" style={{ borderColor }}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-6 py-4 transition-colors duration-200"
        style={{
          color: textPrimary,
          background: 'transparent',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = hoverBg)}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      >
        <div className="flex items-center gap-3">
          {icon && <span style={{ color: textMuted }}>{icon}</span>}
          <span className="text-sm font-semibold">{title}</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4" style={{ color: textMuted }} />
        ) : (
          <ChevronDown className="w-4 h-4" style={{ color: textMuted }} />
        )}
      </button>

      {isExpanded && <div className="px-6 py-4">{children}</div>}
    </div>
  );
}
