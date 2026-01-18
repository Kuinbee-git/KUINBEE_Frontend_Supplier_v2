/**
 * Dataset Proposal Types (Spec-Compliant)
 * Based on Stage 3 — Dataset Proposals (Supplier) specification
 */

// ===== Enums (Exact Prisma Values) =====

export type DatasetSuperType =
  | "CROSS_SECTIONAL"
  | "TIME_SERIES"
  | "PANEL"
  | "POOLED_CROSS_SECTIONAL"
  | "REPEATED_CROSS_SECTIONS"
  | "SPATIAL"
  | "SPATIO_TEMPORAL"
  | "EXPERIMENTAL"
  | "OBSERVATIONAL"
  | "BIG_DATA"
  | "EVENT_HISTORY_SURVIVAL"
  | "HIERARCHICAL_MULTILEVEL";

export type DatasetVisibility = "PUBLIC" | "PRIVATE" | "UNLISTED";

export type Currency = "INR" | "USD" | "EUR" | "GBP";

export type FileFormat =
  | "CSV"
  | "JSON"
  | "EXCEL"
  | "PARQUET"
  | "SQL"
  | "XML"
  | "TSV"
  | "AVRO"
  | "HDF5"
  | "PICKLE"
  | "FEATHER"
  | "OTHER";

export type CompressionType = "NONE" | "ZIP" | "GZIP" | "BZIP2" | "TAR" | "RAR";

export type DatasetUploadStatus = "UPLOADING" | "UPLOADED" | "FAILED" | "PROMOTED";

export type DatasetStatus = "SUBMITTED" | "UNDER_REVIEW" | "VERIFIED" | "PUBLISHED" | "REJECTED" | "ARCHIVED";

export type VerificationStatus =
  | "PENDING"
  | "SUBMITTED"
  | "CHANGES_REQUESTED"
  | "RESUBMITTED"
  | "UNDER_REVIEW"
  | "VERIFIED"
  | "REJECTED";

// ===== Request/Response Types =====

// Create Draft Proposal
export interface CreateProposalRequest {
  title: string;
  superType: DatasetSuperType;
  primaryCategoryId: string;
  sourceId: string;
  license: string;
}

export interface CreateProposalResponse {
  dataset: {
    id: string;
    datasetUniqueId: string;
    status: DatasetStatus;
    ownerType: "SUPPLIER";
    ownerId: string;
    title: string;
    superType: DatasetSuperType;
    primaryCategoryId: string;
    sourceId: string;
    license: string;
    createdAt: string;
    updatedAt: string;
  };
  verification: {
    id: string;
    status: VerificationStatus;
    currentUploadId: string | null;
    updatedAt: string;
  };
}

// List My Proposals
export interface ListProposalsQuery {
  status?: DatasetStatus;
  verificationStatus?: VerificationStatus;
  page?: number;
  pageSize?: number;
}

export interface ListProposalsResponse {
  items: Array<{
    id: string;
    datasetUniqueId: string;
    title: string;
    status: DatasetStatus;
    verificationStatus: VerificationStatus | null;
    currentUploadId: string | null;
    updatedAt: string;
  }>;
  page: number;
  pageSize: number;
  total: number;
}

// Get Proposal Details
export interface ProposalDetailsResponse {
  dataset: {
    id: string;
    datasetUniqueId: string;
    status: DatasetStatus;
    title: string;
    superType: DatasetSuperType;
    primaryCategoryId: string;
    sourceId: string;
    license: string;
    visibility?: DatasetVisibility;
    isPaid?: boolean;
    price?: string;
    currency?: Currency;
    updatedAt: string;
  };
  verification: {
    id: string;
    status: VerificationStatus;
    notes: string | null;
    rejectionReason: string | null;
    currentUploadId: string | null;
    updatedAt: string;
  };
  currentUpload: {
    id: string;
    status: DatasetUploadStatus;
    originalFileName: string | null;
    contentType: string | null;
    sizeBytes: string | null;
    updatedAt: string;
  } | null;
  about?: AboutDatasetInfo;
  dataFormat?: DataFormatInfo;
  features?: Feature[];
  secondaryCategoryIds?: string[];
}

// Update Proposal Metadata
export interface UpdateProposalRequest {
  title?: string;
  superType?: DatasetSuperType;
  primaryCategoryId?: string;
  sourceId?: string;
  license?: string;
  visibility?: DatasetVisibility;
  isPaid?: boolean;
  price?: string;
  currency?: Currency;
}

export interface UpdateProposalResponse {
  dataset: {
    id: string;
    updatedAt: string;
  };
  verification: {
    id: string;
    status: VerificationStatus;
    updatedAt: string;
  };
}

// About Dataset Info
export interface AboutDatasetInfo {
  overview: string;
  description: string;
  dataQuality: string;
  useCases?: string | null;
  limitations?: string | null;
  methodology?: string | null;
  updatedAt?: string;
}

export interface UpsertAboutInfoRequest {
  overview: string;
  description: string;
  dataQuality: string;
  useCases?: string | null;
  limitations?: string | null;
  methodology?: string | null;
}

export interface UpsertAboutInfoResponse {
  about: AboutDatasetInfo;
}

// Data Format Info
export interface DataFormatInfo {
  fileFormat: FileFormat;
  rows: number;
  cols: number;
  fileSize: string;
  compressionType?: CompressionType;
  encoding?: string;
  updatedAt?: string;
}

export interface UpsertDataFormatRequest {
  fileFormat: FileFormat;
  rows: number;
  cols: number;
  fileSize: string;
  compressionType?: CompressionType;
  encoding?: string;
}

export interface UpsertDataFormatResponse {
  dataFormat: DataFormatInfo;
}

// Features
export interface Feature {
  name: string;
  dataType: string;
  description?: string | null;
  isNullable?: boolean;
}

export interface ReplaceFeaturesRequest {
  features: Feature[];
}

export interface ReplaceFeaturesResponse {
  count: number;
}

// Secondary Categories
export interface SetCategoriesRequest {
  categoryIds: string[];
}

export interface SetCategoriesResponse {
  categoryIds: string[];
}

// Upload
export interface PresignUploadRequest {
  originalFileName?: string | null;
  contentType?: string | null;
  checksumSha256?: string | null;
}

export interface PresignUploadResponse {
  upload: {
    id: string;
    status: "UPLOADING";
    s3Key: string;
    createdAt: string;
  };
  putUrl: string;
  expiresAt: string;
}

export interface CompleteUploadRequest {
  sizeBytes?: string | null;
  etag?: string | null;
}

export interface CompleteUploadResponse {
  upload: {
    id: string;
    status: "UPLOADED";
    updatedAt: string;
  };
}

// Submit
export interface SubmitProposalResponse {
  dataset: {
    id: string;
    status: DatasetStatus;
    updatedAt: string;
  };
  verification: {
    id: string;
    status: VerificationStatus;
    currentUploadId: string;
    submittedAt: string;
    updatedAt: string;
  };
}
