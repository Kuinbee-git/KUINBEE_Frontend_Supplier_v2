/**
 * Dataset Types
 */

import { BaseEntity } from "./common.types";

// ===== Dataset Status =====

export type DatasetStatus =
  | "SUBMITTED" // Submitted for verification
  | "UNDER_REVIEW" // Under admin review
  | "VERIFIED" // Approved, ready to publish
  | "PUBLISHED" // Published on marketplace
  | "DELISTED" // Temporarily off-market for update flow
  | "ARCHIVED" // Removed from marketplace
  | "REJECTED"; // Rejected by admin

// ===== Dataset Visibility =====

export type DatasetVisibility =
  | "PUBLIC" // Available to all
  | "PRIVATE" // Available to specific buyers
  | "UNLISTED"; // Not shown in marketplace browse

// ===== Dataset Entity =====

export interface Dataset extends BaseEntity {
  // Identity
  datasetId: string;
  name: string;
  description: string;

  // Supplier
  supplierId: string;
  supplierName: string;

  // Classification
  categoryId: string;
  categoryName: string;
  sourceId?: string;
  sourceName?: string;
  tags: string[];

  // Metadata
  dataFormat: string[];
  updateFrequency:
    | "realtime"
    | "daily"
    | "weekly"
    | "monthly"
    | "quarterly"
    | "yearly";
  geographicCoverage: string[];
  temporalCoverage?: {
    from: string;
    to: string;
  };

  // Pricing
  pricingModel:
    | "free"
    | "one_time"
    | "subscription"
    | "usage_based"
    | "contact";
  price?: number;
  currency?: string;

  // Size & Schema
  estimatedSize?: string;
  recordCount?: number;
  schemaFields?: DatasetSchemaField[];

  // Files
  activeUploadId?: string;
  uploadHistory?: DatasetUpload[];

  // Status & Lifecycle
  status: DatasetStatus;
  visibility: DatasetVisibility;
  publishedAt?: string;
  lastReviewedAt?: string;

  // Review
  reviewThread?: ReviewMessage[];
  changesRequested?: string[];
}

// ===== Dataset Schema =====

export interface DatasetSchemaField {
  name: string;
  type: "string" | "number" | "boolean" | "date" | "object" | "array";
  description?: string;
  required?: boolean;
  example?: string;
}

// ===== Dataset Upload =====

export interface DatasetUpload extends BaseEntity {
  datasetId: string;
  version: number;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadedAt: string;
  uploadedBy: string;

  status: "active" | "superseded" | "rejected";

  // Validation
  validationStatus?: "pending" | "passed" | "failed";
  validationErrors?: string[];

  // Admin review
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
}

// ===== Review Thread =====

export interface ReviewMessage extends BaseEntity {
  datasetId: string;
  authorId: string;
  authorName: string;
  authorType: "admin" | "supplier";
  message: string;
  timestamp: string;

  // Metadata
  isInternal?: boolean; // Admin-only notes
  attachments?: string[];
}

// ===== Create/Update DTOs =====

export interface CreateDatasetDto {
  name: string;
  description: string;
  categoryId: string;
  sourceId?: string;
  tags: string[];
  dataFormat: string[];
  updateFrequency: Dataset["updateFrequency"];
  geographicCoverage: string[];
  temporalCoverage?: Dataset["temporalCoverage"];
  pricingModel: Dataset["pricingModel"];
  price?: number;
  currency?: string;
  estimatedSize?: string;
  recordCount?: number;
  visibility: DatasetVisibility;
}

export type UpdateDatasetDto = Partial<CreateDatasetDto>;

// ===== Dataset List Item (for tables) =====

export interface DatasetListItem {
  id: string;
  datasetId: string;
  name: string;
  status: DatasetStatus;
  visibility: DatasetVisibility;
  categoryName: string;
  updatedAt: string;
  uploadCount: number;
  hasActiveUpload: boolean;
}

// ===== Published Dataset Types (Stage 4) =====

import type {
  DatasetStatus as ProposalDatasetStatus,
  DatasetVisibility as ProposalDatasetVisibility,
  Currency,
  DatasetPricingVersion,
} from "./dataset-proposal.types";

// List My Datasets
export interface ListDatasetsQuery {
  q?: string;
  status?:
    | "SUBMITTED"
    | "UNDER_REVIEW"
    | "VERIFIED"
    | "PUBLISHED"
    | "DELISTED"
    | "ARCHIVED";
  visibility?: "PUBLIC" | "PRIVATE" | "UNLISTED";
  page?: number;
  pageSize?: number;
}

export interface PublishedDatasetListItem {
  id: string;
  datasetUniqueId: string;
  title: string;
  rating: string | null;
  reviewCount: number;
  status: ProposalDatasetStatus;
  visibility: ProposalDatasetVisibility;
  isSample?: boolean;
  actualPrice?: number | null;
  actualPriceCurrency?: string | null;
  isNegotiable?: boolean | null;
  pricing?: DatasetPricingVersion | null;
  publishedUploadId: string | null;
  publishedAt: string | null;
  updatedAt: string;
}

export interface ListDatasetsResponse {
  items: PublishedDatasetListItem[];
  page: number;
  pageSize: number;
  total: number;
  summary: {
    total: number;
    byStatus: Record<
      | "SUBMITTED"
      | "UNDER_REVIEW"
      | "VERIFIED"
      | "PUBLISHED"
      | "DELISTED"
      | "ARCHIVED",
      number
    >;
    byVisibility: Record<"PUBLIC" | "PRIVATE" | "UNLISTED", number>;
  };
}

// Get Dataset Details
export interface DatasetDetailsResponse {
  dataset: {
    id: string;
    datasetUniqueId: string;
    title: string;
    rating: string | null;
    reviewCount: number;
    status: ProposalDatasetStatus;
    visibility: ProposalDatasetVisibility;
    isSample?: boolean;
    sampleNotes?: {
      whySample: string;
      actualDataSize: string;
      completeness?: string;
      deliveryMechanism: "API" | "FILE" | "OTHER";
      deliveryMechanismNotes?: string;
    } | null;
    actualPrice?: number | null;
    actualPriceCurrency?: string | null;
    isNegotiable?: boolean | null;
    isPaid: boolean;
    price: string | null;
    currency: Currency;
    license: string;
    publishedUploadId: string | null;
    publishedAt: string | null;
    archivedAt: string | null;
    updatedAt: string;
  };
  aboutDatasetInfo: {
    overview: string | null;
    description: string | null;
    dataQuality: string | null;
    useCases: string | null;
    limitations: string | null;
    methodology: string | null;
    updatedAt: string;
  } | null;
  dataFormatInfo: {
    fileFormat: string;
    rows: number | null;
    cols: number | null;
    fileSize: string | null;
    compressionType: string;
    encoding: string;
    updatedAt: string;
  } | null;
  features: Array<{
    id: string;
    name: string;
    dataType: string;
    description: string | null;
    isNullable: boolean;
  }>;
  primaryCategory: {
    id: string;
    name: string;
    createdAt: string;
    createdBy: string;
  } | null;
  secondaryCategories: Array<{
    id: string;
    name: string;
    createdAt: string;
    createdBy: string;
  }>;
  source: {
    id: string;
    name: string;
    description: string | null;
    websiteUrl: string | null;
    createdBy: string;
    createdByType: string;
    isVerified: boolean;
    createdAt: string;
    updatedAt: string;
  } | null;
  locationInfo: {
    country: string;
    state: string | null;
    city: string | null;
    region: string | null;
    coordinates: string | null;
    coverage: string | null;
    updatedAt?: string;
  } | null;
  tags: string[];
  verification: {
    id: string;
    status:
      | "PENDING"
      | "SUBMITTED"
      | "CHANGES_REQUESTED"
      | "RESUBMITTED"
      | "UNDER_REVIEW"
      | "VERIFIED"
      | "REJECTED";
    notes: string | null;
    rejectionReason: string | null;
    updatedAt: string;
  } | null;
  publishedUpload: {
    id: string;
    status: "UPLOADING" | "UPLOADED" | "FAILED" | "PROMOTED";
    scope: "FINAL";
    originalFileName: string | null;
    contentType: string | null;
    sizeBytes: string | null;
    updatedAt: string;
  } | null;
}

export interface DatasetQuestionAnswer {
  id: string;
  answer: string;
  createdAt: string;
}

export interface DatasetQuestion {
  id: string;
  question: string;
  createdAt: string;
  answers: DatasetQuestionAnswer[];
}

export interface DatasetQuestionsResponse {
  items: DatasetQuestion[];
  page: number;
  pageSize: number;
  total: number;
}

export interface AnswerQuestionRequest {
  answer: string;
}

export interface AnswerQuestionResponse {
  answer: DatasetQuestionAnswer;
}

export interface DatasetReview {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface DatasetReviewsResponse {
  items: DatasetReview[];
  page: number;
  pageSize: number;
  total: number;
}

// Publish Dataset
export interface PublishDatasetResponse {
  dataset: {
    id: string;
    status: "PUBLISHED";
    publishedUploadId: string;
    publishedAt: string;
    updatedAt: string;
  };
  publishedUpload: {
    id: string;
    scope: "FINAL";
    status: "PROMOTED";
    s3Key: string;
    updatedAt: string;
  };
}

// Change Visibility
export interface ChangeVisibilityRequest {
  visibility: "PUBLIC" | "PRIVATE" | "UNLISTED";
}

export interface ChangeVisibilityResponse {
  dataset: {
    id: string;
    visibility: ProposalDatasetVisibility;
    updatedAt: string;
  };
}

// Request Pricing Change
export interface PricingChangeRequest {
  requestedIsPaid: boolean;
  requestedPrice?: string | null;
  requestedCurrency?: "INR" | "USD" | "EUR" | "GBP";
  reason: string;
}

// Archive Dataset
export interface ArchiveDatasetResponse {
  dataset: {
    id: string;
    status: "ARCHIVED";
    archivedAt: string;
    updatedAt: string;
  };
}

export interface DelistDatasetResponse {
  dataset: {
    id: string;
    status: "DELISTED";
    updatedAt: string;
  };
}

export interface SubmitDatasetUpdateResponse {
  dataset: {
    id: string;
    status: "SUBMITTED";
    updatedAt: string;
  };
  verification: {
    id: string;
    status: "SUBMITTED" | "RESUBMITTED";
    currentUploadId: string | null;
    submittedAt: string;
    updatedAt: string;
  };
}

// Download Published File
export interface DownloadUrlResponse {
  url: string;
  expiresAt: string;
  upload: {
    id: string;
    originalFileName: string | null;
    contentType: string | null;
    sizeBytes: string | null;
  };
}
