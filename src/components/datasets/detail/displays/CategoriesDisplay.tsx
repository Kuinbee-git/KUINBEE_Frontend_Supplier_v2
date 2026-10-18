"use client";

import { Label } from "@/components/ui/label";
import type { DatasetDetailTokens } from "../detailTokens";

interface CategoriesDisplayProps {
  categoryIds: string[];
  categories?: Array<{ id: string; name: string }>;
  tokens: DatasetDetailTokens;
  isDark: boolean;
}

export function CategoriesDisplay({
  categoryIds,
  categories = [],
  tokens,
  isDark,
}: CategoriesDisplayProps) {
  return (
    <div className="space-y-2">
      <Label style={{ color: tokens.textSecondary }}>Other categories</Label>
      <div className="flex flex-wrap gap-2">
        {categoryIds.map((categoryId) => (
          <span
            key={categoryId}
            className="max-w-full break-words rounded-full px-3 py-1 text-xs [overflow-wrap:anywhere]"
            style={{
              background: isDark
                ? "color-mix(in srgb, var(--dashboard-action) 15%, transparent)"
                : "color-mix(in srgb, var(--dashboard-action) 10%, transparent)",
              color: "var(--dashboard-info-foreground)",
              border:
                "1px solid color-mix(in srgb, var(--dashboard-action) 30%, transparent)",
            }}
          >
            {categories.find((category) => category.id === categoryId)?.name ??
              "Category label unavailable"}
          </span>
        ))}
      </div>
    </div>
  );
}
