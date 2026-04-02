'use client';

import { Label } from '@/components/ui/label';

interface CategoriesDisplayProps {
  categoryIds: string[];
  tokens: any;
  isDark: boolean;
}

export function CategoriesDisplay({ categoryIds, tokens, isDark }: CategoriesDisplayProps) {
  return (
    <div className="space-y-2">
      <Label style={{ color: tokens.textSecondary }}>Category IDs</Label>
      <div className="flex flex-wrap gap-2">
        {categoryIds.map((categoryId, index) => (
          <span
            key={index}
            className="px-3 py-1 text-xs font-mono rounded-full"
            style={{
              background: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)',
              color: '#3b82f6',
              border: '1px solid rgba(59, 130, 246, 0.3)',
            }}
          >
            {categoryId}
          </span>
        ))}
      </div>
    </div>
  );
}
