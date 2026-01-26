'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, X as XIcon } from 'lucide-react';
import type { Feature } from '@/types/dataset-proposal.types';

interface FeaturesStepProps {
  features: Feature[];
  onChange: (index: number, field: keyof Feature, value: any) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  disabled?: boolean;
  isDark?: boolean;
  tokens: any;
}

export function FeaturesStep({ features, onChange, onAdd, onRemove, disabled, isDark, tokens }: FeaturesStepProps) {
  return (
    <>
      <div className="flex items-center justify-between">
        <Label style={{ color: tokens.textPrimary }}>
          Features / Columns <span className="text-red-500">*</span>
        </Label>
        <Button
          size="sm"
          variant="outline"
          onClick={onAdd}
          disabled={disabled}
          className="gap-2 rounded-lg transition-all duration-200 hover:shadow-md hover:scale-105 active:scale-95"
          style={{
            background: tokens.glassBg,
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: `1.5px solid ${tokens.glassBorder}`,
            boxShadow: tokens.glassShadow,
            color: tokens.textPrimary,
          }}
        >
          <Plus className="w-4 h-4" />
          Add Feature
        </Button>
      </div>

      <div className="space-y-4">
        {features.map((feature, index) => (
          <div
            key={index}
            className="p-4 border rounded-lg space-y-4"
            style={{
              borderColor: tokens.borderDefault,
              background: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(26, 34, 64, 0.02)',
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium" style={{ color: tokens.textSecondary }}>
                Feature {index + 1}
              </span>
              {features.length > 1 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onRemove(index)}
                  disabled={disabled}
                  className="rounded-lg transition-all duration-200 hover:shadow-md active:scale-95"
                  style={{
                    background: tokens.glassBg,
                    backdropFilter: "blur(16px)",
                    WebkitBackdropFilter: "blur(16px)",
                    border: `1.5px solid ${tokens.glassBorder}`,
                    color: tokens.textPrimary,
                  }}
                >
                  <XIcon className="w-4 h-4" />
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label style={{ color: tokens.textPrimary }}>
                  Feature Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={feature.name}
                  onChange={(e) => onChange(index, 'name', e.target.value)}
                  placeholder="e.g., customer_id"
                  disabled={disabled}
                  style={{
                    background: tokens.inputBg,
                    borderColor: tokens.inputBorder,
                    color: tokens.textPrimary,
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label style={{ color: tokens.textPrimary }}>
                  Data Type <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={feature.dataType}
                  onChange={(e) => onChange(index, 'dataType', e.target.value)}
                  placeholder="e.g., string, integer, float"
                  disabled={disabled}
                  style={{
                    background: tokens.inputBg,
                    borderColor: tokens.inputBorder,
                    color: tokens.textPrimary,
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label style={{ color: tokens.textPrimary }}>
                Description
              </Label>
              <Textarea
                value={feature.description || ''}
                onChange={(e) => onChange(index, 'description', e.target.value || null)}
                placeholder="Describe this feature"
                rows={2}
                disabled={disabled}
                style={{
                  background: tokens.inputBg,
                  borderColor: tokens.inputBorder,
                  color: tokens.textPrimary,
                }}
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id={`nullable-${index}`}
                checked={feature.isNullable}
                onCheckedChange={(checked) => onChange(index, 'isNullable', checked)}
                disabled={disabled}
              />
              <Label htmlFor={`nullable-${index}`} style={{ color: tokens.textPrimary }}>
                This feature can be nullable
              </Label>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
