/**
 * Dataset API Service (Published/Verified Datasets)
 * Handles all published dataset-related API calls (Stage 4)
 */

import { DATASET_API, API_BASE_URL } from "@/constants/api.constants";
import type {
  ListDatasetsQuery,
  ListDatasetsResponse,
  DatasetDetailsResponse,
  PublishDatasetResponse,
  ChangeVisibilityRequest,
  ChangeVisibilityResponse,
  PricingChangeRequest,
  ArchiveDatasetResponse,
  DownloadUrlResponse,
} from "@/types/dataset.types";

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
      credentials: "include", // Include cookies for session
    });

    if (!response.ok) {
      // Try to parse error from response
      const errorData = await response.json().catch(() => null);
      
      // Global auth failure handler - ONLY redirect for 401
      // 403 is NOT an auth error - it's a permission/business logic error
      // Let the component handle 403 appropriately
      if (response.status === 401) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("auth-storage");
          localStorage.removeItem("kuinbee-supplier-storage");
          localStorage.removeItem("onboarding-storage");
          window.location.href = "/auth/login";
        }
      }
      
      const error: any = new Error(
        errorData?.message || `HTTP ${response.status}: ${response.statusText}`
      );
      error.status = response.status;
      error.code = errorData?.code || `HTTP_${response.status}`;
      error.data = errorData;
      
      throw error;
    }

    return response.json();
  } catch (err: any) {
    // If error already has status, rethrow
    if (err.status) {
      throw err;
    }
    
    // Network error or other fetch error
    const error: any = new Error(err.message || "Network error");
    error.code = "NETWORK_ERROR";
    throw error;
  }
}

// ===== List My Datasets =====

/**
 * List supplier's published/verified datasets (not proposals)
 * GET /api/v1/supplier/datasets
 */
export async function listMyDatasets(
  query?: ListDatasetsQuery
): Promise<ListDatasetsResponse> {
  const queryParams = new URLSearchParams();
  
  if (query?.status) queryParams.set("status", query.status);
  if (query?.visibility) queryParams.set("visibility", query.visibility);
  if (query?.page) queryParams.set("page", query.page.toString());
  if (query?.pageSize) queryParams.set("pageSize", query.pageSize.toString());
  
  const url = queryParams.toString() 
    ? `${DATASET_API.LIST}?${queryParams.toString()}`
    : DATASET_API.LIST;
  
  const response = await apiFetch<{ success: boolean; data: ListDatasetsResponse }>(url, {
    method: "GET",
  });
  
  return response.data;
}

// ===== Get Dataset Details =====

/**
 * Get details for a published/verified dataset
 * GET /api/v1/supplier/datasets/:datasetId
 */
export async function getDatasetDetails(
  datasetId: string
): Promise<DatasetDetailsResponse> {
  const response = await apiFetch<{ success: boolean; data: DatasetDetailsResponse }>(
    DATASET_API.GET_DETAILS(datasetId),
    {
      method: "GET",
    }
  );
  return response.data;
}

// ===== Publish Dataset =====

/**
 * Publish a verified dataset
 * POST /api/v1/supplier/datasets/:datasetId/publish
 */
export async function publishDataset(
  datasetId: string
): Promise<PublishDatasetResponse> {
  const response = await apiFetch<{ success: boolean; data: PublishDatasetResponse }>(
    DATASET_API.PUBLISH(datasetId),
    {
      method: "POST",
    }
  );
  return response.data;
}

// ===== Change Visibility =====

/**
 * Change dataset visibility
 * PATCH /api/v1/supplier/datasets/:datasetId/visibility
 */
export async function changeDatasetVisibility(
  datasetId: string,
  data: ChangeVisibilityRequest
): Promise<ChangeVisibilityResponse> {
  const response = await apiFetch<{ success: boolean; data: ChangeVisibilityResponse }>(
    DATASET_API.CHANGE_VISIBILITY(datasetId),
    {
      method: "PATCH",
      body: JSON.stringify(data),
    }
  );
  return response.data;
}

// ===== Request Pricing Change =====

/**
 * Request pricing change via support
 * POST /api/v1/supplier/datasets/:datasetId/pricing-change-request
 */
export async function requestPricingChange(
  datasetId: string,
  data: PricingChangeRequest
): Promise<{ success: true }> {
  const response = await apiFetch<{ success: true }>(
    DATASET_API.REQUEST_PRICING_CHANGE(datasetId),
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
  return response;
}

// ===== Archive Dataset =====

/**
 * Archive a dataset
 * POST /api/v1/supplier/datasets/:datasetId/archive
 */
export async function archiveDataset(
  datasetId: string
): Promise<ArchiveDatasetResponse> {
  const response = await apiFetch<{ success: boolean; data: ArchiveDatasetResponse }>(
    DATASET_API.ARCHIVE(datasetId),
    {
      method: "POST",
    }
  );
  return response.data;
}

// ===== Download Published File =====

/**
 * Get presigned URL for published file download
 * GET /api/v1/supplier/datasets/:datasetId/published-upload/download-url
 */
export async function getPublishedFileDownloadUrl(
  datasetId: string
): Promise<DownloadUrlResponse> {
  const response = await apiFetch<{ success: boolean; data: DownloadUrlResponse }>(
    DATASET_API.DOWNLOAD_PUBLISHED(datasetId),
    {
      method: "GET",
    }
  );
  return response.data;
}
