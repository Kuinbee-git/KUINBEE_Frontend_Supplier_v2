/**
 * Catalog Types
 * Type definitions for sources and categories
 */

// ===== Source Types =====

export interface Source {
  id: string;
  name: string;
  description: string | null;
  websiteUrl: string | null;
  isVerified: boolean;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export interface ListSourcesQuery {
  q?: string;
  sort?: "createdAt:desc" | "createdAt:asc" | "updatedAt:desc" | "updatedAt:asc" | "name:asc" | "name:desc";
  page?: number;
  pageSize?: number;
}

export interface ListSourcesResponse {
  items: Source[];
  page: number;
  pageSize: number;
  total: number;
}

export interface CreateSourceRequest {
  name: string;
  description?: string;
  websiteUrl?: string;
}

export interface CreateSourceResponse {
  success: boolean;
  data: {
    source: Source;
  };
}

export interface UpdateSourceRequest {
  name?: string;
  description?: string | null;
  websiteUrl?: string | null;
}

export interface UpdateSourceResponse {
  success: boolean;
  data: {
    source: Source;
  };
}

export interface DeleteSourceResponse {
  success: true;
}

// ===== Category Types =====

export interface Category {
  id: string;
  name: string;
  createdAt: string; // ISO
}

export interface ListCategoriesQuery {
  q?: string;
  page?: number;
  pageSize?: number;
}

export interface ListCategoriesResponse {
  items: Category[];
  page: number;
  pageSize: number;
  total: number;
}

// ===== Error Codes =====

export type CatalogErrorCode = 
  | "SOURCE_NAME_TAKEN"
  | "SOURCE_IN_USE"
  | "SOURCE_NOT_FOUND"
  | "CATEGORY_NOT_FOUND"
  | "VALIDATION_ERROR";
