"use client";

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

export function ReadOnlyFieldCard({
  label,
  value,
  tokens,
}: ReadOnlyFieldCardProps) {
  return (
    <dl className="min-w-0 border-b border-border py-3">
      <dt className="text-xs mb-1" style={{ color: tokens.textMuted }}>
        {label}
      </dt>
      <dd
        className="break-words text-sm font-medium [overflow-wrap:anywhere]"
        style={{ color: tokens.textPrimary }}
      >
        {value ?? "N/A"}
      </dd>
    </dl>
  );
}
