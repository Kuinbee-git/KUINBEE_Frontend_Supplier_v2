"use client";

import { DashboardCheckbox, DashboardInput } from "@/components/dashboard";
import { Label } from "@/components/ui/label";
import { DashboardTextarea } from "@/components/dashboard";
import { DatasetSelect } from "@/components/datasets/shared/DatasetSelect";
import { CategoriesSelect, SourcesSelect } from "@/components/catalog";
import {
  DATASET_TYPES,
  type DatasetThemeTokens,
} from "@/constants/dataset.constants";
import type {
  Currency,
  DatasetSuperType,
  SampleDeliveryMechanism,
} from "@/types/dataset-proposal.types";
import type { Source } from "@/types/catalog.types";

interface BasicInfoData {
  title: string;
  superType: DatasetSuperType | "";
  primaryCategoryId: string;
  sourceId: string;
  license: string;
  isSample: boolean;
  sampleNotes: {
    whySample: string;
    actualDataSize: string;
    completeness: string;
    deliveryMechanism: SampleDeliveryMechanism | "";
    deliveryMechanismNotes: string;
  };
  actualPrice: string;
  actualPriceCurrency: Currency;
  isNegotiable: boolean | null;
}

type BasicInfoField =
  | Exclude<keyof BasicInfoData, "sampleNotes">
  | `sampleNotes.${keyof BasicInfoData["sampleNotes"]}`;

interface BasicInfoStepProps {
  data: BasicInfoData;
  onChange: (field: BasicInfoField, value: string | boolean | null) => void;
  onSourceCreated?: (source: Source) => void;
  disabled?: boolean;
  tokens: DatasetThemeTokens;
  isDark?: boolean;
}

export function BasicInfoStep({
  data,
  onChange,
  onSourceCreated,
  disabled,
  tokens,
  isDark = false,
}: BasicInfoStepProps) {
  const CURRENCY_OPTIONS = [
    { value: "USD", label: "USD ($)" },
    { value: "INR", label: "INR (₹)" },
    { value: "EUR", label: "EUR (€)" },
    { value: "GBP", label: "GBP (£)" },
  ];

  const DELIVERY_OPTIONS = [
    { value: "API", label: "API" },
    { value: "FILE", label: "File" },
    { value: "OTHER", label: "Other" },
  ];

  const NEGOTIABLE_OPTIONS = [
    { value: "yes", label: "Yes" },
    { value: "no", label: "No" },
  ];

  const sampleNotes = data.sampleNotes ?? {
    whySample: "",
    actualDataSize: "",
    completeness: "",
    deliveryMechanism: "",
    deliveryMechanismNotes: "",
  };

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="title" style={{ color: tokens.textPrimary }}>
          Dataset Title{" "}
          <span className="text-[var(--dashboard-danger-foreground)]">*</span>
        </Label>
        <DashboardInput
          id="title"
          value={data.title}
          onChange={(e) => onChange("title", e.target.value)}
          placeholder="e.g., Financial Q4 2023 Report"
          disabled={disabled}
          style={{
            background: tokens.inputBg,
            borderColor: tokens.inputBorder,
            color: tokens.textPrimary,
          }}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="superType" style={{ color: tokens.textPrimary }}>
          Dataset Type{" "}
          <span className="text-[var(--dashboard-danger-foreground)]">*</span>
        </Label>
        <DatasetSelect
          triggerId="superType"
          value={data.superType}
          onValueChange={(value) => onChange("superType", value)}
          options={[...DATASET_TYPES]}
          placeholder="Select dataset type"
          isDark={isDark}
          tokens={tokens}
        />
      </div>

      {/* Primary Category - Dynamic Dropdown */}
      <CategoriesSelect
        value={data.primaryCategoryId}
        onValueChange={(value) => onChange("primaryCategoryId", value)}
        disabled={disabled}
        tokens={tokens}
        isDark={isDark}
      />

      {/* Source - Dynamic Dropdown with Create New */}
      <SourcesSelect
        value={data.sourceId}
        onValueChange={(value) => onChange("sourceId", value)}
        onSourceCreated={onSourceCreated}
        disabled={disabled}
        tokens={tokens}
        isDark={isDark}
        allowCreate={true}
      />

      <div className="space-y-2">
        <Label htmlFor="license" style={{ color: tokens.textPrimary }}>
          License{" "}
          <span className="text-[var(--dashboard-danger-foreground)]">*</span>
        </Label>
        <DashboardInput
          id="license"
          value={data.license}
          onChange={(e) => onChange("license", e.target.value)}
          placeholder="e.g., MIT, Apache-2.0, Proprietary"
          disabled={disabled}
          style={{
            background: tokens.inputBg,
            borderColor: tokens.inputBorder,
            color: tokens.textPrimary,
          }}
        />
      </div>

      <div
        className="space-y-2 pt-2 border-t"
        style={{ borderColor: tokens.borderDefault }}
      >
        <div className="flex items-center gap-3">
          <DashboardCheckbox
            id="is-sample-proposal"
            checked={data.isSample}
            onCheckedChange={(checked) =>
              onChange("isSample", checked === true)
            }
            disabled={disabled}
          />
          <Label
            htmlFor="is-sample-proposal"
            style={{ color: tokens.textPrimary }}
            className="cursor-pointer font-medium"
          >
            This is a sample dataset proposal
          </Label>
        </div>
      </div>

      {data.isSample ? (
        <div
          className="space-y-4 rounded-lg border p-4"
          style={{ borderColor: tokens.borderDefault }}
        >
          <div className="space-y-2">
            <Label htmlFor="whySample" style={{ color: tokens.textPrimary }}>
              Why is this a sample dataset?{" "}
              <span className="text-[var(--dashboard-danger-foreground)]">
                *
              </span>
            </Label>
            <DashboardTextarea
              id="whySample"
              value={sampleNotes.whySample ?? ""}
              onChange={(e) =>
                onChange("sampleNotes.whySample", e.target.value)
              }
              placeholder="Describe why this proposal is a sample"
              disabled={disabled}
              rows={3}
              style={{
                background: tokens.inputBg,
                borderColor: tokens.inputBorder,
                color: tokens.textPrimary,
              }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="actualDataSize"
                style={{ color: tokens.textPrimary }}
              >
                Actual dataset size{" "}
                <span className="text-[var(--dashboard-danger-foreground)]">
                  *
                </span>
              </Label>
              <DashboardInput
                id="actualDataSize"
                value={sampleNotes.actualDataSize ?? ""}
                onChange={(e) =>
                  onChange("sampleNotes.actualDataSize", e.target.value)
                }
                placeholder="e.g., 120 GB"
                disabled={disabled}
                style={{
                  background: tokens.inputBg,
                  borderColor: tokens.inputBorder,
                  color: tokens.textPrimary,
                }}
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="completeness"
                style={{ color: tokens.textPrimary }}
              >
                Completeness (optional)
              </Label>
              <DashboardInput
                id="completeness"
                value={sampleNotes.completeness ?? ""}
                onChange={(e) =>
                  onChange("sampleNotes.completeness", e.target.value)
                }
                placeholder="e.g., 80% representative"
                disabled={disabled}
                style={{
                  background: tokens.inputBg,
                  borderColor: tokens.inputBorder,
                  color: tokens.textPrimary,
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="sample-delivery-mechanism"
                style={{ color: tokens.textPrimary }}
              >
                Delivery mechanism{" "}
                <span className="text-[var(--dashboard-danger-foreground)]">
                  *
                </span>
              </Label>
              <DatasetSelect
                triggerId="sample-delivery-mechanism"
                value={sampleNotes.deliveryMechanism ?? ""}
                onValueChange={(value) =>
                  onChange("sampleNotes.deliveryMechanism", value)
                }
                options={DELIVERY_OPTIONS}
                placeholder="Select delivery mechanism"
                isDark={isDark}
                tokens={tokens}
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="sample-price-negotiable"
                style={{ color: tokens.textPrimary }}
              >
                Is price negotiable?{" "}
                <span className="text-[var(--dashboard-danger-foreground)]">
                  *
                </span>
              </Label>
              <DatasetSelect
                triggerId="sample-price-negotiable"
                value={
                  data.isNegotiable === null
                    ? ""
                    : data.isNegotiable
                      ? "yes"
                      : "no"
                }
                onValueChange={(value) =>
                  onChange("isNegotiable", value === "yes")
                }
                options={NEGOTIABLE_OPTIONS}
                placeholder="Select one"
                isDark={isDark}
                tokens={tokens}
              />
            </div>
          </div>

          {sampleNotes.deliveryMechanism === "OTHER" ? (
            <div className="space-y-2">
              <Label
                htmlFor="deliveryMechanismNotes"
                style={{ color: tokens.textPrimary }}
              >
                Delivery mechanism notes{" "}
                <span className="text-[var(--dashboard-danger-foreground)]">
                  *
                </span>
              </Label>
              <DashboardInput
                id="deliveryMechanismNotes"
                value={sampleNotes.deliveryMechanismNotes ?? ""}
                onChange={(e) =>
                  onChange("sampleNotes.deliveryMechanismNotes", e.target.value)
                }
                placeholder="Describe delivery mechanism"
                disabled={disabled}
                style={{
                  background: tokens.inputBg,
                  borderColor: tokens.inputBorder,
                  color: tokens.textPrimary,
                }}
              />
            </div>
          ) : null}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="actualPrice"
                style={{ color: tokens.textPrimary }}
              >
                Actual full price (integer){" "}
                <span className="text-[var(--dashboard-danger-foreground)]">
                  *
                </span>
              </Label>
              <DashboardInput
                id="actualPrice"
                type="number"
                min={0}
                step={1}
                value={data.actualPrice ?? ""}
                onChange={(e) => onChange("actualPrice", e.target.value)}
                placeholder="e.g., 499"
                disabled={disabled}
                style={{
                  background: tokens.inputBg,
                  borderColor: tokens.inputBorder,
                  color: tokens.textPrimary,
                }}
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="sample-actual-price-currency"
                style={{ color: tokens.textPrimary }}
              >
                Actual price currency{" "}
                <span className="text-[var(--dashboard-danger-foreground)]">
                  *
                </span>
              </Label>
              <DatasetSelect
                triggerId="sample-actual-price-currency"
                value={data.actualPriceCurrency || "USD"}
                onValueChange={(value) =>
                  onChange("actualPriceCurrency", value)
                }
                options={CURRENCY_OPTIONS}
                placeholder="Select currency"
                isDark={isDark}
                tokens={tokens}
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
