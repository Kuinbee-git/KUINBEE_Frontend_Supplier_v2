"use client";

import { Label } from "@/components/ui/label";
import type { DatasetDetailTokens } from "../detailTokens";

interface CategoriesDisplayProps {
  categoryIds: string[];
  tokens: DatasetDetailTokens;
  isDark: boolean;
}

export function CategoriesDisplay({
  categoryIds,
  tokens,
  isDark,
}: CategoriesDisplayProps) {
  return (
    <div className="space-y-2">
      <Label style={{ color: tokens.textSecondary }}>Category IDs</Label>
      <div className="flex flex-wrap gap-2">
        {categoryIds.map((categoryId, index) => (
          <span
            key={index}
            className="px-3 py-1 text-xs font-mono rounded-full"
            style={{
              background: isDark
                ? "color-mix(in srgb, var(--dashboard-action) 15%, transparent)"
                : "color-mix(in srgb, var(--dashboard-action) 10%, transparent)",
              color: "var(--dashboard-info-foreground)",
              border:
                "1px solid color-mix(in srgb, var(--dashboard-action) 30%, transparent)",
            }}
          >
            {categoryId}
          </span>
        ))}
      </div>
    </div>
  );
}
