import type { PublishedDatasetListItem } from "@/types/dataset.types";
import type { DiscountType } from "@/types/discount.types";

export type EligibleDiscountDataset = PublishedDatasetListItem & {
  priceSurface: "DATASET_PRICING" | "SAMPLE_ACTUAL_PRICE";
  baseAmount: string;
  currency: string;
  surfaceLabel: string;
};

export const currencySymbol = (currency: string) => {
  if (currency === "USD") return "$";
  if (currency === "EUR") return "€";
  if (currency === "GBP") return "£";
  return "₹";
};

export const formatMoney = (amount: string | number, currency: string) => {
  const numeric = Number(amount);
  const display = Number.isFinite(numeric)
    ? numeric.toLocaleString("en-IN", { maximumFractionDigits: 2 })
    : String(amount);
  return `${currencySymbol(currency)}${display} ${currency}`;
};

export const toInputDateTime = (date: Date) => {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
};

export const toIsoFromInput = (value: string) => new Date(value).toISOString();

export const statusLabel = (status: string) =>
  status
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");

export const getEligibleDataset = (
  dataset: PublishedDatasetListItem
): EligibleDiscountDataset | null => {
  if (dataset.status !== "PUBLISHED" || dataset.visibility !== "PUBLIC")
    return null;

  if (dataset.isSample) {
    if (!dataset.actualPrice || dataset.actualPrice <= 0) return null;
    return {
      ...dataset,
      priceSurface: "SAMPLE_ACTUAL_PRICE",
      baseAmount: String(dataset.actualPrice),
      currency:
        dataset.actualPriceCurrency ?? dataset.pricing?.currency ?? "INR",
      surfaceLabel: "Full dataset commercial price",
    };
  }

  if (
    dataset.pricing?.status === "ACTIVE" &&
    dataset.pricing.isPaid &&
    dataset.pricing.price
  ) {
    return {
      ...dataset,
      priceSurface: "DATASET_PRICING",
      baseAmount: dataset.pricing.price,
      currency: dataset.pricing.currency,
      surfaceLabel: "Marketplace checkout price",
    };
  }

  return null;
};

export const calculatePreview = ({
  baseAmount,
  discountType,
  discountValue,
}: {
  baseAmount: string;
  discountType: DiscountType;
  discountValue: string;
}) => {
  const base = Number(baseAmount);
  const value = Number(discountValue);
  if (
    !Number.isFinite(base) ||
    !Number.isFinite(value) ||
    base <= 0 ||
    value <= 0
  ) {
    return null;
  }

  const rawFinal =
    discountType === "PERCENTAGE" ? base - (base * value) / 100 : base - value;
  const final = Math.ceil(Math.max(rawFinal, 0));

  if (final <= 0 || final >= base) return null;
  return { final, amountOff: Math.max(base - final, 0) };
};
