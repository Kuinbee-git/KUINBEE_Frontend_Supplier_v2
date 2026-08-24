"use client";

import { DashboardButton } from "@/components/dashboard";
import { DashboardInput } from "@/components/dashboard";
import { Label } from "@/components/ui/label";
import { DashboardTextarea } from "@/components/dashboard";
import { DashboardCheckbox } from "@/components/dashboard";
import { Plus, X as XIcon } from "lucide-react";
import type { DatasetThemeTokens } from "@/constants/dataset.constants";
import type { Feature } from "@/types/dataset-proposal.types";

interface EditableFeatureValues {
  name: string;
  dataType: string;
  description: string | null;
  isNullable: boolean;
}

type FeatureChangeHandler = <K extends keyof EditableFeatureValues>(
  index: number,
  field: K,
  value: EditableFeatureValues[K]
) => void;

interface FeaturesStepProps {
  features: Feature[];
  onChange: FeatureChangeHandler;
  onAdd: () => void;
  onRemove: (index: number) => void;
  disabled?: boolean;
  isDark?: boolean;
  tokens: DatasetThemeTokens;
}

export function FeaturesStep({
  features,
  onChange,
  onAdd,
  onRemove,
  disabled,
  tokens,
}: FeaturesStepProps) {
  return (
    <>
      <div className="flex items-center justify-between">
        <Label style={{ color: tokens.textPrimary }}>
          Features / Columns{" "}
          <span className="text-[var(--dashboard-danger-foreground)]">*</span>
        </Label>
        <DashboardButton
          size="compact"
          variant="outline"
          onClick={onAdd}
          disabled={disabled}
          className="rounded-lg"
        >
          <Plus className="w-4 h-4" />
          Add Feature
        </DashboardButton>
      </div>

      <div className="space-y-4">
        {features.map((feature, index) => (
          <div
            key={index}
            className="p-4 border rounded-lg space-y-4"
            style={{
              borderColor: tokens.borderDefault,
              background:
                "color-mix(in srgb, var(--dashboard-text) 2%, transparent)",
            }}
          >
            <div className="flex items-center justify-between">
              <span
                className="text-sm font-medium"
                style={{ color: tokens.textSecondary }}
              >
                Feature {index + 1}
              </span>
              {features.length > 1 && (
                <DashboardButton
                  size="compact"
                  variant="ghost"
                  onClick={() => onRemove(index)}
                  disabled={disabled}
                  className="rounded-lg"
                  aria-label={`Remove feature ${index + 1}`}
                >
                  <XIcon className="w-4 h-4" />
                </DashboardButton>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label style={{ color: tokens.textPrimary }}>
                  Feature Name{" "}
                  <span className="text-[var(--dashboard-danger-foreground)]">
                    *
                  </span>
                </Label>
                <DashboardInput
                  value={feature.name}
                  onChange={(e) => onChange(index, "name", e.target.value)}
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
                  Data Type{" "}
                  <span className="text-[var(--dashboard-danger-foreground)]">
                    *
                  </span>
                </Label>
                <DashboardInput
                  value={feature.dataType}
                  onChange={(e) => onChange(index, "dataType", e.target.value)}
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
              <Label style={{ color: tokens.textPrimary }}>Description</Label>
              <DashboardTextarea
                value={feature.description || ""}
                onChange={(e) =>
                  onChange(index, "description", e.target.value || null)
                }
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
              <DashboardCheckbox
                id={`nullable-${index}`}
                checked={feature.isNullable}
                onCheckedChange={(checked) =>
                  onChange(index, "isNullable", checked === true)
                }
                disabled={disabled}
              />
              <Label
                htmlFor={`nullable-${index}`}
                style={{ color: tokens.textPrimary }}
              >
                This feature can be nullable
              </Label>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
