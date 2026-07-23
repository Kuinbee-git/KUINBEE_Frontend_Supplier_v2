import type { Currency } from "./dataset-proposal.types";

export type DiscountTargetSurface = "DATASET_PRICING" | "SAMPLE_ACTUAL_PRICE";
export type DiscountType = "PERCENTAGE" | "FIXED_AMOUNT";
export type DiscountProposalStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "ACTIVE"
  | "EXPIRED"
  | "CANCELLED";

export interface DatasetDiscountProposal {
  id: string;
  datasetId: string;
  pricingVersionId: string | null;
  targetSurface: DiscountTargetSurface;
  status: DiscountProposalStatus;
  basePriceSnapshot: string;
  currencySnapshot: Currency;
  discountType: DiscountType;
  discountValue: string;
  finalPriceSnapshot: number;
  startsAt: string;
  endsAt: string;
  supplierNotes: string | null;
  adminNotes: string | null;
  rejectionReason: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  approvedAt: string | null;
  createdById: string;
  reviewedById: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DiscountProposalListResponse {
  items: DatasetDiscountProposal[];
  page: number;
  pageSize: number;
  total: number;
}

export interface CreateDiscountProposalRequest {
  targetSurface: DiscountTargetSurface;
  discountType: DiscountType;
  discountValue: string;
  startsAt: string;
  endsAt: string;
  supplierNotes?: string;
}

export interface DiscountProposalResponse {
  discountProposal: DatasetDiscountProposal;
}
