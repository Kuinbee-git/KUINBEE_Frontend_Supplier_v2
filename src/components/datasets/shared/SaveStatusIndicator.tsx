import { Save } from "lucide-react";

interface SaveStatusIndicatorProps {
  status: "saved" | "saving" | "idle";
  isDark?: boolean;
}

export function SaveStatusIndicator({ status }: SaveStatusIndicatorProps) {
  if (status === "idle") return null;

  return (
    <div
      className="flex items-center gap-2 text-sm text-muted-foreground"
      role="status"
      aria-live="polite"
    >
      <Save
        className={`w-4 h-4 ${status === "saving" ? "animate-spin" : ""}`}
        aria-hidden="true"
      />
      <span>{status === "saving" ? "Saving..." : "Saved"}</span>
    </div>
  );
}
