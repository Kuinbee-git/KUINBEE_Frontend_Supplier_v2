"use client";

import { AlertCircle } from "lucide-react";
import type { DatasetDetailTokens } from "./detailTokens";

interface ChangesRequestedBannerProps {
  notes: string;
  isDark: boolean;
  tokens: DatasetDetailTokens;
}

export function ChangesRequestedBanner({
  notes,
  isDark,
  tokens,
}: ChangesRequestedBannerProps) {
  return (
    <div
      className="mb-6 rounded-lg border px-6 py-4 flex items-start gap-4"
      style={{
        background: isDark
          ? "color-mix(in srgb, var(--dashboard-warning) 10%, transparent)"
          : "color-mix(in srgb, var(--dashboard-warning) 15%, transparent)",
        borderColor: isDark
          ? "color-mix(in srgb, var(--dashboard-warning) 30%, transparent)"
          : "color-mix(in srgb, var(--dashboard-warning) 40%, transparent)",
      }}
    >
      <div className="flex-shrink-0 mt-0.5">
        <AlertCircle
          className="w-6 h-6"
          style={{
            color: isDark
              ? "var(--dashboard-warning-foreground)"
              : "var(--dashboard-warning-foreground)",
          }}
        />
      </div>
      <div className="flex-1">
        <p
          className="text-base font-semibold mb-4"
          style={{
            color: isDark
              ? "var(--dashboard-warning-foreground)"
              : "var(--dashboard-warning-foreground)",
          }}
        >
          Changes Requested by the Admin
        </p>

        <div className="space-y-4">
          <div>
            <p
              className="text-xs font-medium mb-2 uppercase tracking-wider"
              style={{ color: tokens.textSecondary }}
            >
              Feedback Notes
            </p>
            <div
              className="p-3 rounded-lg border"
              style={{
                background: isDark
                  ? "color-mix(in srgb, var(--background) 20%, transparent)"
                  : "color-mix(in srgb, var(--dashboard-surface) 50%, transparent)",
                borderColor: isDark
                  ? "color-mix(in srgb, var(--dashboard-warning) 20%, transparent)"
                  : "color-mix(in srgb, var(--dashboard-warning) 30%, transparent)",
              }}
            >
              <p
                className="text-sm leading-relaxed"
                style={{ color: tokens.textPrimary }}
              >
                {notes}
              </p>
            </div>
          </div>

          <p className="text-xs pt-2" style={{ color: tokens.textSecondary }}>
            Please review the feedback above and make the necessary updates
            before resubmitting your proposal.
          </p>
        </div>
      </div>
    </div>
  );
}
