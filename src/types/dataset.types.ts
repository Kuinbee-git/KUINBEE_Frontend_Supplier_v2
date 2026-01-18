/**
 * Dataset Types
 */

import { BaseEntity } from "./common.types";

// ===== Dataset Status =====

export type DatasetStatus = 
  | 'draft'                // Initial creation, editable
  | 'submitted'            // Submitted for review, awaiting file
  | 'under_review'         // Admin actively reviewing
  | 'changes_requested'    // Admin requested changes
  | 'verified'             // Approved and locked (terminal state)
  | 'rejected';            // Rejected (terminal state)

// ===== Dataset Visibility =====

export type DatasetVisibility = 
  | 'public'      // Available to all
  | 'private'     // Available to specific buyers
  | 'unlisted';   // Not shown in marketplace

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
  updateFrequency: 'realtime' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  geographicCoverage: string[];
  temporalCoverage?: {
    from: string;
    to: string;
  };
  
  // Pricing
  pricingModel: 'free' | 'one_time' | 'subscription' | 'usage_based' | 'contact';
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
  type: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array';
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
  
  status: 'active' | 'superseded' | 'rejected';
  
  // Validation
  validationStatus?: 'pending' | 'passed' | 'failed';
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
  authorType: 'admin' | 'supplier';
  message: string;
  timestamp: string;
  
  // Metadata
  isInternal?: boolean;  // Admin-only notes
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
  updateFrequency: Dataset['updateFrequency'];
  geographicCoverage: string[];
  temporalCoverage?: Dataset['temporalCoverage'];
  pricingModel: Dataset['pricingModel'];
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
