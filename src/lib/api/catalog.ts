/**
 * Catalog API Service
 * Handles all catalog-related API calls (sources, categories)
 */

import { CATALOG_API, API_BASE_URL } from "@/constants/api.constants";
import type {
  Source,
  ListSourcesQuery,
  ListSourcesResponse,
  CreateSourceRequest,
  CreateSourceResponse,
  UpdateSourceRequest,
  UpdateSourceResponse,
  DeleteSourceResponse,
  ListCategoriesQuery,
  ListCategoriesResponse,
} from "@/types/catalog.types";

// ===== Helper: API Fetch =====
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      
      const error: any = new Error(
        errorData?.message || `HTTP ${response.status}: ${response.statusText}`
      );
      error.status = response.status;
      error.code = errorData?.code || `HTTP_${response.status}`;
      error.data = errorData;
      
      console.error(`[API] ${options.method || 'GET'} ${endpoint} failed:`, error);
      throw error;
    }

    return response.json();
  } catch (err: any) {
    if (err.status) throw err;
    
    console.error(`[API] Network error for ${endpoint}:`, err);
    const error: any = new Error(err.message || "Network error");
    error.code = "NETWORK_ERROR";
    throw error;
  }
}

// ===== Sources API =====

/**
 * List supplier-owned sources
 */
export async function listMySources(
  query?: ListSourcesQuery
): Promise<ListSourcesResponse> {
  const queryParams = new URLSearchParams();
  
  if (query?.q) queryParams.set("q", query.q);
  if (query?.sort) queryParams.set("sort", query.sort);
  if (query?.page) queryParams.set("page", query.page.toString());
  if (query?.pageSize) queryParams.set("pageSize", query.pageSize.toString());
  
  const url = queryParams.toString()
    ? `${CATALOG_API.LIST_SOURCES}?${queryParams.toString()}`
    : CATALOG_API.LIST_SOURCES;
  
  const response = await apiFetch<{ data: ListSourcesResponse }>(url, {
    method: "GET",
  });
  
  return response.data;
}

/**
 * Create a new supplier-owned source
 */
export async function createSource(
  data: CreateSourceRequest
): Promise<CreateSourceResponse> {
  return apiFetch<CreateSourceResponse>(CATALOG_API.CREATE_SOURCE, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Update a supplier-owned source
 */
export async function updateSource(
  sourceId: string,
  data: UpdateSourceRequest
): Promise<UpdateSourceResponse> {
  return apiFetch<UpdateSourceResponse>(CATALOG_API.UPDATE_SOURCE(sourceId), {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

/**
 * Delete a supplier-owned source
 */
export async function deleteSource(
  sourceId: string
): Promise<DeleteSourceResponse> {
  return apiFetch<DeleteSourceResponse>(CATALOG_API.DELETE_SOURCE(sourceId), {
    method: "DELETE",
  });
}

// ===== Categories API =====

/**
 * List categories (supplier view)
 */
export async function listCategories(
  query?: ListCategoriesQuery
): Promise<ListCategoriesResponse> {
  const queryParams = new URLSearchParams();
  
  if (query?.q) queryParams.set("q", query.q);
  if (query?.page) queryParams.set("page", query.page.toString());
  if (query?.pageSize) queryParams.set("pageSize", query.pageSize.toString());
  
  const url = queryParams.toString()
    ? `${CATALOG_API.LIST_CATEGORIES}?${queryParams.toString()}`
    : CATALOG_API.LIST_CATEGORIES;
  
  const response = await apiFetch<{ data: ListCategoriesResponse }>(url, {
    method: "GET",
  });
  
  return response.data;
}
