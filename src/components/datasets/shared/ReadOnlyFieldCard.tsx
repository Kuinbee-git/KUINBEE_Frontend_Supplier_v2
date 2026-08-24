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
    <div
      className="rounded-lg p-3"
      style={{
        background:
          tokens.infoBg ||
          "color-mix(in srgb, var(--dashboard-action) 6%, var(--dashboard-surface))",
        border: `1px solid ${tokens.borderSubtle || "var(--dashboard-border)"}`,
      }}
    >
      <p className="text-xs mb-1" style={{ color: tokens.textMuted }}>
        {label}
      </p>
      <p className="text-sm font-medium" style={{ color: tokens.textPrimary }}>
        {value ?? "N/A"}
      </p>
    </div>
  );
}
