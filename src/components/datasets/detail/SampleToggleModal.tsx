"use client";

import {
  DashboardButton,
  DashboardInlineAlert,
  DashboardInput,
  DashboardSelect,
  DashboardSelectContent,
  DashboardSelectItem,
  DashboardSelectTrigger,
  DashboardSelectValue,
  DashboardTextarea,
} from "@/components/dashboard";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/datasets/shared/DatasetDialog";
import { Label } from "@/components/ui/label";
import { ArrowRightLeft } from "lucide-react";
import type {
  Currency,
  SampleDeliveryMechanism,
} from "@/types/dataset-proposal.types";
import type { DatasetDetailTokens } from "./detailTokens";

interface SampleToggleModalProps {
  pendingSampleValue: boolean | null;
  sampleToggleSubmitting: boolean;
  sampleToggleError: string | null;

  // Form fields
  sampleWhy: string;
  onSampleWhyChange: (value: string) => void;
  sampleSize: string;
  onSampleSizeChange: (value: string) => void;
  sampleCompleteness: string;
  onSampleCompletenessChange: (value: string) => void;
  sampleDelivery: SampleDeliveryMechanism;
  onSampleDeliveryChange: (value: SampleDeliveryMechanism) => void;
  sampleDeliveryNotes: string;
  onSampleDeliveryNotesChange: (value: string) => void;
  sampleActualPrice: string;
  onSampleActualPriceChange: (value: string) => void;
  sampleActualPriceCurrency: Currency;
  onSampleActualPriceCurrencyChange: (value: Currency) => void;
  sampleNegotiable: "yes" | "no";
  onSampleNegotiableChange: (value: "yes" | "no") => void;

  // Handlers
  onConfirm: () => void;
  onCancel: () => void;

  isDark: boolean;
  tokens: DatasetDetailTokens;
}

export function SampleToggleModal({
  pendingSampleValue,
  sampleToggleSubmitting,
  sampleToggleError,
  sampleWhy,
  onSampleWhyChange,
  sampleSize,
  onSampleSizeChange,
  sampleCompleteness,
  onSampleCompletenessChange,
  sampleDelivery,
  onSampleDeliveryChange,
  sampleDeliveryNotes,
  onSampleDeliveryNotesChange,
  sampleActualPrice,
  onSampleActualPriceChange,
  sampleActualPriceCurrency,
  onSampleActualPriceCurrencyChange,
  sampleNegotiable,
  onSampleNegotiableChange,
  onConfirm,
  onCancel,
}: SampleToggleModalProps) {
  return (
    <Dialog
      open
      onOpenChange={(open) => !open && !sampleToggleSubmitting && onCancel()}
    >
      <DialogContent
        className="max-w-xl"
        showCloseButton={!sampleToggleSubmitting}
        onEscapeKeyDown={(event) =>
          sampleToggleSubmitting && event.preventDefault()
        }
        onPointerDownOutside={(event) =>
          sampleToggleSubmitting && event.preventDefault()
        }
      >
        <DialogHeader>
          <div className="flex items-start gap-3">
            <span className="dashboard-tone-info flex size-9 shrink-0 items-center justify-center rounded-lg border">
              <ArrowRightLeft className="size-4" aria-hidden="true" />
            </span>
            <div>
              <DialogTitle>
                {pendingSampleValue
                  ? "Enable Sample Mode"
                  : "Disable Sample Mode"}
              </DialogTitle>
              <DialogDescription>
                {pendingSampleValue
                  ? "Describe how this sample represents the complete dataset."
                  : "Confirm that this proposal should return to regular dataset mode."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-5 space-y-4">
          <p className="text-sm text-muted-foreground">
            {pendingSampleValue
              ? "Confirm this draft should be marked as sample and provide required sample details."
              : "Confirm this draft should be converted from sample to regular. Sample-specific fields will be cleared."}
          </p>

          {pendingSampleValue && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sample-why">Why sample *</Label>
                <DashboardTextarea
                  id="sample-why"
                  value={sampleWhy}
                  onChange={(e) => onSampleWhyChange(e.target.value)}
                  rows={3}
                  placeholder="Explain why this is a sample dataset"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sample-size">Actual dataset size *</Label>
                  <DashboardInput
                    id="sample-size"
                    value={sampleSize}
                    onChange={(e) => onSampleSizeChange(e.target.value)}
                    placeholder="e.g., 120 GB"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sample-completeness">
                    Completeness (optional)
                  </Label>
                  <DashboardInput
                    id="sample-completeness"
                    value={sampleCompleteness}
                    onChange={(e) => onSampleCompletenessChange(e.target.value)}
                    placeholder="e.g., 80% representative"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sample-delivery">Delivery mechanism *</Label>
                  <DashboardSelect
                    value={sampleDelivery}
                    onValueChange={(value) =>
                      onSampleDeliveryChange(value as SampleDeliveryMechanism)
                    }
                  >
                    <DashboardSelectTrigger id="sample-delivery">
                      <DashboardSelectValue />
                    </DashboardSelectTrigger>
                    <DashboardSelectContent>
                      <DashboardSelectItem value="API">API</DashboardSelectItem>
                      <DashboardSelectItem value="FILE">
                        File
                      </DashboardSelectItem>
                      <DashboardSelectItem value="OTHER">
                        Other
                      </DashboardSelectItem>
                    </DashboardSelectContent>
                  </DashboardSelect>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sample-negotiable">
                    Is price negotiable? *
                  </Label>
                  <DashboardSelect
                    value={sampleNegotiable}
                    onValueChange={(value) =>
                      onSampleNegotiableChange(value as "yes" | "no")
                    }
                  >
                    <DashboardSelectTrigger id="sample-negotiable">
                      <DashboardSelectValue />
                    </DashboardSelectTrigger>
                    <DashboardSelectContent>
                      <DashboardSelectItem value="yes">Yes</DashboardSelectItem>
                      <DashboardSelectItem value="no">No</DashboardSelectItem>
                    </DashboardSelectContent>
                  </DashboardSelect>
                </div>
              </div>

              {sampleDelivery === "OTHER" && (
                <div className="space-y-2">
                  <Label htmlFor="sample-delivery-notes">
                    Delivery mechanism notes *
                  </Label>
                  <DashboardInput
                    id="sample-delivery-notes"
                    value={sampleDeliveryNotes}
                    onChange={(e) =>
                      onSampleDeliveryNotesChange(e.target.value)
                    }
                    placeholder="Describe delivery mechanism"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sample-actual-price">
                    Actual full price *
                  </Label>
                  <DashboardInput
                    id="sample-actual-price"
                    type="number"
                    min={0}
                    step={1}
                    value={sampleActualPrice}
                    onChange={(e) => onSampleActualPriceChange(e.target.value)}
                    placeholder="e.g., 499"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sample-currency">Currency *</Label>
                  <DashboardSelect
                    value={sampleActualPriceCurrency}
                    onValueChange={(value) =>
                      onSampleActualPriceCurrencyChange(value as Currency)
                    }
                  >
                    <DashboardSelectTrigger id="sample-currency">
                      <DashboardSelectValue />
                    </DashboardSelectTrigger>
                    <DashboardSelectContent>
                      <DashboardSelectItem value="USD">
                        USD ($)
                      </DashboardSelectItem>
                      <DashboardSelectItem value="INR">
                        INR (₹)
                      </DashboardSelectItem>
                      <DashboardSelectItem value="EUR">
                        EUR (€)
                      </DashboardSelectItem>
                      <DashboardSelectItem value="GBP">
                        GBP (£)
                      </DashboardSelectItem>
                    </DashboardSelectContent>
                  </DashboardSelect>
                </div>
              </div>
            </div>
          )}

          {sampleToggleError && (
            <DashboardInlineAlert
              tone="danger"
              title="Sample mode could not be updated"
              message={sampleToggleError}
            />
          )}

          <DialogFooter>
            <DashboardButton
              variant="outline"
              onClick={onCancel}
              disabled={sampleToggleSubmitting}
            >
              Cancel
            </DashboardButton>
            <DashboardButton
              onClick={onConfirm}
              disabled={sampleToggleSubmitting}
            >
              {sampleToggleSubmitting ? "Saving..." : "Confirm"}
            </DashboardButton>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
