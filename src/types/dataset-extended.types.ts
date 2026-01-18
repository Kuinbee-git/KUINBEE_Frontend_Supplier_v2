/**
 * Dataset Types
 * Extended types for dataset management
 */

export type DatasetStatusExtended = "draft" | "pending" | "published" | "rejected" | "archived";

export type DatasetCategoryType =
  | "finance"
  | "healthcare"
  | "retail"
  | "technology"
  | "manufacturing"
  | "logistics"
  | "real-estate"
  | "energy"
  | "telecom"
  | "government"
  | "education"
  | "media"
  | "agriculture"
  | "transportation"
  | "other";

export type DatasetFileFormat = "csv" | "json" | "xml" | "excel" | "parquet" | "other";

export interface DatasetMetadataInfo {
  rowCount?: number;
  columnCount?: number;
  fileSize: number;
  fileType: DatasetFileFormat;
  encoding?: string;
  delimiter?: string;
  hasHeaders?: boolean;
  schema?: DatasetSchemaInfo;
}

export interface DatasetSchemaInfo {
  columns: DatasetColumnInfo[];
}

export interface DatasetColumnInfo {
  name: string;
  type: "string" | "number" | "boolean" | "date" | "datetime" | "object" | "array";
  nullable: boolean;
  description?: string;
}

export interface DatasetExtended {
  id: string;
  supplierId: string;
  name: string;
  description: string;
  category: DatasetCategoryType;
  tags: string[];
  status: DatasetStatusExtended;
  metadata: DatasetMetadataInfo;
  pricing?: DatasetPricingInfo;
  statistics?: DatasetStatisticsInfo;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface DatasetPricingInfo {
  pricePerDownload?: number;
  pricePerMonth?: number;
  pricePerYear?: number;
  currency: string;
  isFree: boolean;
}

export interface DatasetStatisticsInfo {
  views: number;
  downloads: number;
  revenue: number;
  rating?: number;
  reviewCount: number;
}

export interface DatasetUploadProgressInfo {
  uploadedBytes: number;
  totalBytes: number;
  percentage: number;
  status: "uploading" | "processing" | "completed" | "failed";
  error?: string;
}

export interface DatasetFilterOptions {
  status?: DatasetStatusExtended[];
  category?: DatasetCategoryType[];
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: "name" | "createdAt" | "updatedAt" | "views" | "downloads";
  sortOrder?: "asc" | "desc";
}
