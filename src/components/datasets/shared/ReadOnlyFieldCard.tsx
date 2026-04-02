'use client';

interface ReadOnlyFieldCardProps {
  label: string;
  value: React.ReactNode;
  tokens: {
    textPrimary: string;
    textMuted: string;
    infoBg?: string;
    borderSubtle?: string;
  };
}

export function ReadOnlyFieldCard({ label, value, tokens }: ReadOnlyFieldCardProps) {
  return (
    <div
      className="rounded-lg p-3"
      style={{
        background: tokens.infoBg || 'rgba(59, 130, 246, 0.05)',
        border: `1px solid ${tokens.borderSubtle || 'rgba(0,0,0,0.06)'}`,
      }}
    >
      <p className="text-xs mb-1" style={{ color: tokens.textMuted }}>
        {label}
      </p>
      <p className="text-sm font-medium" style={{ color: tokens.textPrimary }}>
        {value || 'N/A'}
      </p>
    </div>
  );
}
