"use client";

import type { Feature } from "@/types/dataset-proposal.types";
import type { DatasetDetailTokens } from "../detailTokens";

interface FeaturesDisplayProps {
  features: Feature[];
  tokens: DatasetDetailTokens;
  isDark: boolean;
}

export function FeaturesDisplay({
  features,
  tokens,
  isDark,
}: FeaturesDisplayProps) {
  return (
    <div
      className="w-full overflow-hidden rounded-xl border"
      style={{ borderColor: tokens.borderSubtle }}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead
            style={{
              background: isDark
                ? "color-mix(in srgb, var(--dashboard-text) 3%, transparent)"
                : "color-mix(in srgb, var(--dashboard-text) 3%, transparent)",
            }}
          >
            <tr>
              <th
                className="px-4 py-3 font-semibold"
                style={{ color: tokens.textPrimary }}
              >
                Feature Name
              </th>
              <th
                className="px-4 py-3 font-semibold"
                style={{ color: tokens.textPrimary }}
              >
                Data Type
              </th>
              <th
                className="px-4 py-3 font-semibold"
                style={{ color: tokens.textPrimary }}
              >
                Constraint
              </th>
              <th
                className="px-4 py-3 font-semibold w-full min-w-[200px]"
                style={{ color: tokens.textPrimary }}
              >
                Description
              </th>
            </tr>
          </thead>
          <tbody
            className="divide-y"
            style={{ borderColor: tokens.borderSubtle }}
          >
            {features.map((feature, index) => (
              <tr
                key={index}
                className="transition-colors hover:bg-accent"
                style={{
                  background: isDark
                    ? "color-mix(in srgb, var(--dashboard-text) 1%, transparent)"
                    : "color-mix(in srgb, var(--dashboard-text) 1%, transparent)",
                }}
              >
                <td
                  className="px-4 py-4 font-medium"
                  style={{ color: tokens.textPrimary }}
                >
                  {feature.name}
                </td>
                <td className="px-4 py-4">
                  <span
                    className="font-mono text-xs px-2 py-1 rounded bg-muted"
                    style={{ color: tokens.textSecondary }}
                  >
                    {feature.dataType}
                  </span>
                </td>
                <td className="px-4 py-4">
                  {feature.isNullable !== undefined ? (
                    <span
                      className="px-2 py-1 text-xs rounded-md font-medium inline-block"
                      style={{
                        background: feature.isNullable
                          ? "color-mix(in srgb, var(--dashboard-warning) 10%, transparent)"
                          : "color-mix(in srgb, var(--dashboard-success) 10%, transparent)",
                        color: feature.isNullable
                          ? "var(--dashboard-warning-foreground)"
                          : "var(--dashboard-success-foreground)",
                      }}
                    >
                      {feature.isNullable ? "Nullable" : "Required"}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </td>
                <td
                  className="px-4 py-4 text-xs whitespace-normal"
                  style={{ color: tokens.textMuted }}
                >
                  {feature.description || "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
