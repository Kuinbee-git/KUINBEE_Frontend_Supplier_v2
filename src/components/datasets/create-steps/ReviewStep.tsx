"use client";

import type { LucideIcon } from "lucide-react";
import {
  BadgeDollarSign,
  CheckCircle2,
  Database,
  FileText,
  HardDrive,
  ListTree,
  Pencil,
  ShieldCheck,
  TableProperties,
} from "lucide-react";

import { Button } from "@/components/ui/button";

type EditableStep =
  | "basic"
  | "about"
  | "format"
  | "features"
  | "pricing"
  | "upload";

interface ReviewItem {
  step: EditableStep;
  title: string;
  value: string;
  detail: string;
  icon: LucideIcon;
}

interface ReviewStepProps {
  title: string;
  superType: string;
  country: string;
  fileFormat: string;
  fileSize: string;
  featureCount: number;
  isSample: boolean;
  isPaid: boolean;
  price: string | null;
  currency: string;
  fileUploaded: boolean;
  sampleFileUploaded: boolean;
  shouldShowSampleUpload: boolean;
  onEdit: (step: EditableStep) => void;
}

export function ReviewStep({
  title,
  superType,
  country,
  fileFormat,
  fileSize,
  featureCount,
  isSample,
  isPaid,
  price,
  currency,
  fileUploaded,
  sampleFileUploaded,
  shouldShowSampleUpload,
  onEdit,
}: ReviewStepProps) {
  const pricingLabel = isSample
    ? "Sample proposal — free listing"
    : isPaid
      ? `${currency} ${price || "Price not set"}`
      : "Free dataset";

  const items: ReviewItem[] = [
    {
      step: "basic",
      title: "Proposal identity",
      value: title || "Untitled proposal",
      detail: superType
        ? superType.replaceAll("_", " ")
        : "Dataset type not set",
      icon: Database,
    },
    {
      step: "about",
      title: "Description and coverage",
      value: country || "Location not set",
      detail: "Overview, quality, location, and discovery tags",
      icon: FileText,
    },
    {
      step: "format",
      title: "Data structure",
      value: fileFormat || "Format not set",
      detail: fileSize || "File size not set",
      icon: TableProperties,
    },
    {
      step: "features",
      title: "Schema definition",
      value: `${featureCount} ${featureCount === 1 ? "feature" : "features"}`,
      detail: "Columns and data types included in the proposal",
      icon: ListTree,
    },
    {
      step: "pricing",
      title: "Commercial setup",
      value: pricingLabel,
      detail: isSample
        ? "The full-dataset price is recorded in sample details"
        : "Buyer-facing pricing configuration",
      icon: BadgeDollarSign,
    },
    {
      step: "upload",
      title: "Delivery file",
      value: fileUploaded ? "Primary file attached" : "Primary file missing",
      detail: shouldShowSampleUpload
        ? sampleFileUploaded
          ? "Optional buyer sample attached"
          : "Optional buyer sample not attached"
        : "No separate buyer sample is required",
      icon: HardDrive,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.07] p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Your draft is saved and ready to inspect
            </h3>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Review each section before opening the proposal workspace. This
              step does not submit anything for moderation.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <section
              key={item.step}
              className="rounded-xl border border-border/80 bg-background/55 p-4 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                    {item.title}
                  </p>
                  <p className="mt-1 truncate text-sm font-semibold text-foreground">
                    {item.value}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {item.detail}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0"
                  onClick={() => onEdit(item.step)}
                  aria-label={`Edit ${item.title}`}
                >
                  <Pencil className="size-3.5" />
                </Button>
              </div>
            </section>
          );
        })}
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-border/80 bg-muted/35 p-4">
        <CheckCircle2
          className="mt-0.5 size-5 shrink-0 text-primary"
          aria-hidden="true"
        />
        <p className="text-sm leading-6 text-muted-foreground">
          Continue to the proposal page to make further edits, check any
          remaining requirements, and explicitly submit when you are ready.
        </p>
      </div>
    </div>
  );
}
