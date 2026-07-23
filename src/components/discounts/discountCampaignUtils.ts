import type { PublishedDatasetListItem } from "@/types/dataset.types";
import type {
  CreateDiscountProposalRequest,
  DatasetDiscountProposal,
  DiscountType,
} from "@/types/discount.types";

export type EligibleDiscountDataset = PublishedDatasetListItem & {
  priceSurface: "DATASET_PRICING" | "SAMPLE_ACTUAL_PRICE";
  baseAmount: string;
  currency: string;
  surfaceLabel: string;
};

export const ENABLE_DEMO_DISCOUNT_DATASETS =
  process.env.NODE_ENV !== "production";
export const DEMO_DISCOUNT_DATASET_PREFIX =
  "__demo_discount_campaign_dataset__";

export const statusColors: Record<string, string> = {
  SUBMITTED: "#2563eb",
  UNDER_REVIEW: "#7c3aed",
  APPROVED: "#059669",
  ACTIVE: "#16a34a",
  REJECTED: "#dc2626",
  CANCELLED: "#64748b",
  EXPIRED: "#92400e",
  DRAFT: "#64748b",
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

export const isDemoDataset = (datasetId: string) =>
  datasetId.startsWith(DEMO_DISCOUNT_DATASET_PREFIX);

export const isDemoProposal = (proposalId: string) =>
  proposalId.startsWith("__demo_discount_proposal__");

const createDemoDataset = ({
  id,
  datasetUniqueId,
  title,
  price,
  currency = "INR",
  isSample = false,
}: {
  id: string;
  datasetUniqueId: string;
  title: string;
  price: string;
  currency?: "INR" | "USD" | "EUR" | "GBP";
  isSample?: boolean;
}): EligibleDiscountDataset => ({
  id,
  datasetUniqueId,
  title,
  rating: null,
  reviewCount: 0,
  status: "PUBLISHED",
  visibility: "PUBLIC",
  isSample,
  actualPrice: isSample ? Number(price) : null,
  actualPriceCurrency: isSample ? currency : null,
  isNegotiable: isSample ? true : false,
  pricing: isSample
    ? null
    : {
        id: `${id}_active_pricing`,
        datasetId: id,
        status: "ACTIVE",
        isPaid: true,
        price,
        currency,
        notes: null,
        changeRationale: null,
        rejectionReason: null,
        submittedAt: new Date().toISOString(),
        approvedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
  publishedUploadId: `${id}_upload`,
  publishedAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  priceSurface: isSample ? "SAMPLE_ACTUAL_PRICE" : "DATASET_PRICING",
  baseAmount: price,
  currency,
  surfaceLabel: isSample
    ? "Full dataset commercial price"
    : "Marketplace checkout price",
});

export const demoDiscountDatasets: EligibleDiscountDataset[] = [
  createDemoDataset({
    id: `${DEMO_DISCOUNT_DATASET_PREFIX}paid_empty`,
    datasetUniqueId: "DEMO-DISCOUNT-001",
    title: "Demo Consumer Spending Signals",
    price: "12500",
  }),
  createDemoDataset({
    id: `${DEMO_DISCOUNT_DATASET_PREFIX}sample`,
    datasetUniqueId: "DEMO-SAMPLE-002",
    title: "Demo Retail Footfall Sample",
    price: "48000",
    currency: "USD",
    isSample: true,
  }),
  createDemoDataset({
    id: `${DEMO_DISCOUNT_DATASET_PREFIX}submitted`,
    datasetUniqueId: "DEMO-DISCOUNT-003",
    title: "Demo Logistics Route Dataset",
    price: "22000",
  }),
  createDemoDataset({
    id: `${DEMO_DISCOUNT_DATASET_PREFIX}active`,
    datasetUniqueId: "DEMO-DISCOUNT-004",
    title: "Demo Weather Risk Index",
    price: "18000",
  }),
];

const createDemoProposal = ({
  dataset,
  status,
  discountType,
  discountValue,
  finalPrice,
}: {
  dataset: EligibleDiscountDataset;
  status: DatasetDiscountProposal["status"];
  discountType: DiscountType;
  discountValue: string;
  finalPrice: number;
}): DatasetDiscountProposal => {
  const now = new Date();
  const starts = new Date();
  starts.setDate(starts.getDate() - (status === "ACTIVE" ? 1 : -1));
  const ends = new Date();
  ends.setDate(ends.getDate() + 10);

  return {
    id: `__demo_discount_proposal__${dataset.id}_${status.toLowerCase()}`,
    datasetId: dataset.id,
    pricingVersionId: dataset.pricing?.id ?? null,
    targetSurface: dataset.priceSurface,
    status,
    basePriceSnapshot: dataset.baseAmount,
    currencySnapshot: dataset.currency as "INR" | "USD" | "EUR" | "GBP",
    discountType,
    discountValue,
    finalPriceSnapshot: finalPrice,
    startsAt: starts.toISOString(),
    endsAt: ends.toISOString(),
    supplierNotes:
      status === "ACTIVE"
        ? "Demo active campaign for visual review."
        : "Demo submitted campaign awaiting admin review.",
    adminNotes: status === "ACTIVE" ? "Approved demo proposal." : null,
    rejectionReason: null,
    submittedAt: now.toISOString(),
    reviewedAt: status === "ACTIVE" ? now.toISOString() : null,
    approvedAt: status === "ACTIVE" ? now.toISOString() : null,
    createdById: "__demo_supplier__",
    reviewedById: status === "ACTIVE" ? "__demo_admin__" : null,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
};

export const demoProposalMap: Record<string, DatasetDiscountProposal[]> = {
  [`${DEMO_DISCOUNT_DATASET_PREFIX}submitted`]: [
    createDemoProposal({
      dataset: demoDiscountDatasets[2],
      status: "SUBMITTED",
      discountType: "PERCENTAGE",
      discountValue: "18",
      finalPrice: 18040,
    }),
  ],
  [`${DEMO_DISCOUNT_DATASET_PREFIX}active`]: [
    createDemoProposal({
      dataset: demoDiscountDatasets[3],
      status: "ACTIVE",
      discountType: "FIXED_AMOUNT",
      discountValue: "2500",
      finalPrice: 15500,
    }),
  ],
  [`${DEMO_DISCOUNT_DATASET_PREFIX}sample`]: [
    createDemoProposal({
      dataset: demoDiscountDatasets[1],
      status: "APPROVED",
      discountType: "PERCENTAGE",
      discountValue: "12",
      finalPrice: 42240,
    }),
  ],
};

export const getDemoDatasets = () =>
  ENABLE_DEMO_DISCOUNT_DATASETS ? demoDiscountDatasets : [];

export const getInitialDemoProposalMap = () =>
  ENABLE_DEMO_DISCOUNT_DATASETS ? demoProposalMap : {};

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

export const createDemoDiscountProposal = (
  dataset: EligibleDiscountDataset,
  payload: CreateDiscountProposalRequest
): DatasetDiscountProposal => {
  const preview = calculatePreview({
    baseAmount: dataset.baseAmount,
    discountType: payload.discountType,
    discountValue: payload.discountValue,
  });
  const now = new Date().toISOString();

  return {
    id: `__demo_discount_proposal__${dataset.id}_${Date.now()}`,
    datasetId: dataset.id,
    pricingVersionId: dataset.pricing?.id ?? null,
    targetSurface: payload.targetSurface,
    status: "SUBMITTED",
    basePriceSnapshot: dataset.baseAmount,
    currencySnapshot: dataset.currency as "INR" | "USD" | "EUR" | "GBP",
    discountType: payload.discountType,
    discountValue: payload.discountValue,
    finalPriceSnapshot: preview?.final ?? Number(dataset.baseAmount),
    startsAt: payload.startsAt,
    endsAt: payload.endsAt,
    supplierNotes: payload.supplierNotes || null,
    adminNotes: null,
    rejectionReason: null,
    submittedAt: now,
    reviewedAt: null,
    approvedAt: null,
    createdById: "__demo_supplier__",
    reviewedById: null,
    createdAt: now,
    updatedAt: now,
  };
};
