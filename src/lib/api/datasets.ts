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
  DelistDatasetResponse,
  SubmitDatasetUpdateResponse,
  DownloadUrlResponse,
  DatasetQuestionsResponse,
  AnswerQuestionRequest,
  AnswerQuestionResponse,
  DatasetReviewsResponse,
} from "@/types/dataset.types";
import type {
  UpsertAboutInfoRequest,
  UpsertAboutInfoResponse,
  UpsertLocationInfoRequest,
  UpsertLocationInfoResponse,
  UpsertDataFormatRequest,
  UpsertDataFormatResponse,
  ReplaceFeaturesRequest,
  ReplaceFeaturesResponse,
  SetCategoriesRequest,
  SetCategoriesResponse,
  SetTagsRequest,
  SetTagsResponse,
  DatasetPricingVersion,
  UpsertPricingRequest,
  GetPricingResponse,
  SubmitPricingResponse,
} from "@/types/dataset-proposal.types";

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

// ===== Delist Dataset =====

/**
 * Delist a published dataset to start update flow
 * POST /api/v1/supplier/datasets/:datasetId/delist
 */
export async function delistDataset(
  datasetId: string
): Promise<DelistDatasetResponse> {
  const response = await apiFetch<{ success: boolean; data: DelistDatasetResponse }>(
    DATASET_API.DELIST(datasetId),
    {
      method: "POST",
    }
  );
  return response.data;
}

// ===== Submit Dataset Update =====

/**
 * Submit dataset metadata/pricing updates for admin review
 * POST /api/v1/supplier/datasets/:datasetId/submit-update
 */
export async function submitDatasetUpdate(
  datasetId: string
): Promise<SubmitDatasetUpdateResponse> {
  const response = await apiFetch<{ success: boolean; data: SubmitDatasetUpdateResponse }>(
    DATASET_API.SUBMIT_UPDATE(datasetId),
    {
      method: "POST",
    }
  );
  return response.data;
}

// ===== Metadata Update (Delisted Flow) =====

/**
 * Upsert about info for an existing published dataset in update flow
 * PUT /api/v1/supplier/datasets/:datasetId/about
 */
export async function upsertDatasetAboutInfo(
  datasetId: string,
  data: UpsertAboutInfoRequest
): Promise<UpsertAboutInfoResponse> {
  const response = await apiFetch<{ success: boolean; data: UpsertAboutInfoResponse }>(
    DATASET_API.UPSERT_ABOUT(datasetId),
    {
      method: "PUT",
      body: JSON.stringify(data),
    }
  );
  return response.data;
}

/**
 * Upsert location info for an existing published dataset in update flow
 * PUT /api/v1/supplier/datasets/:datasetId/location
 */
export async function upsertDatasetLocationInfo(
  datasetId: string,
  data: UpsertLocationInfoRequest
): Promise<UpsertLocationInfoResponse> {
  const response = await apiFetch<{ success: boolean; data: UpsertLocationInfoResponse }>(
    DATASET_API.UPSERT_LOCATION(datasetId),
    {
      method: "PUT",
      body: JSON.stringify(data),
    }
  );
  return response.data;
}

/**
 * Upsert data format info for an existing published dataset in update flow
 * PUT /api/v1/supplier/datasets/:datasetId/data-format
 */
export async function upsertDatasetDataFormatInfo(
  datasetId: string,
  data: UpsertDataFormatRequest
): Promise<UpsertDataFormatResponse> {
  const response = await apiFetch<{ success: boolean; data: UpsertDataFormatResponse }>(
    DATASET_API.UPSERT_DATA_FORMAT(datasetId),
    {
      method: "PUT",
      body: JSON.stringify(data),
    }
  );
  return response.data;
}

/**
 * Replace features for an existing published dataset in update flow
 * PUT /api/v1/supplier/datasets/:datasetId/features
 */
export async function replaceDatasetFeatures(
  datasetId: string,
  data: ReplaceFeaturesRequest
): Promise<ReplaceFeaturesResponse> {
  const response = await apiFetch<{ success: boolean; data: ReplaceFeaturesResponse }>(
    DATASET_API.REPLACE_FEATURES(datasetId),
    {
      method: "PUT",
      body: JSON.stringify(data),
    }
  );
  return response.data;
}

/**
 * Set secondary categories for an existing published dataset in update flow
 * PUT /api/v1/supplier/datasets/:datasetId/categories
 */
export async function setDatasetSecondaryCategories(
  datasetId: string,
  data: SetCategoriesRequest
): Promise<SetCategoriesResponse> {
  const response = await apiFetch<{ success: boolean; data: SetCategoriesResponse }>(
    DATASET_API.SET_CATEGORIES(datasetId),
    {
      method: "PUT",
      body: JSON.stringify(data),
    }
  );
  return response.data;
}

/**
 * Set tags for an existing published dataset in update flow
 * PUT /api/v1/supplier/datasets/:datasetId/tags
 */
export async function setDatasetTags(
  datasetId: string,
  data: SetTagsRequest
): Promise<SetTagsResponse> {
  const response = await apiFetch<{ success: boolean; data: SetTagsResponse }>(
    DATASET_API.SET_TAGS(datasetId),
    {
      method: "PUT",
      body: JSON.stringify(data),
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

/**
 * List marketplace questions for a dataset
 * GET /api/v1/marketplace/datasets/:datasetId/questions
 */
export async function getDatasetQuestions(
  datasetId: string,
): Promise<DatasetQuestionsResponse> {
  const response = await apiFetch<{ success: boolean; data: DatasetQuestionsResponse }>(
    DATASET_API.QUESTIONS(datasetId),
    {
      method: "GET",
    }
  );
  return response.data;
}

/**
 * Answer a marketplace question as supplier/admin
 * POST /api/v1/marketplace/questions/:questionId/answers
 */
export async function answerDatasetQuestion(
  questionId: string,
  data: AnswerQuestionRequest,
): Promise<AnswerQuestionResponse> {
  const response = await apiFetch<{ success: boolean; data: AnswerQuestionResponse }>(
    DATASET_API.ANSWER_QUESTION(questionId),
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
  return response.data;
}

/**
 * List marketplace reviews for a dataset
 * GET /api/v1/marketplace/datasets/:datasetId/reviews
 */
export async function getDatasetReviews(
  datasetId: string,
): Promise<DatasetReviewsResponse> {
  const response = await apiFetch<{ success: boolean; data: DatasetReviewsResponse }>(
    DATASET_API.REVIEWS(datasetId),
    {
      method: "GET",
    }
  );
  return response.data;
}

// ===== Pricing (Published Datasets) =====

/**
 * Get the latest pricing version for a published dataset
 * GET /api/v1/supplier/datasets/:datasetId/pricing
 */
export async function getDatasetPricing(
  datasetId: string
): Promise<GetPricingResponse> {
  const response = await apiFetch<{ success: boolean; data: GetPricingResponse }>(
    `${DATASET_API.GET_DETAILS(datasetId)}/pricing`,
    {
      method: "GET",
    }
  );
  return response.data;
}

/**
 * Upsert (create or update) pricing for a published dataset
 * PUT /api/v1/supplier/datasets/:datasetId/pricing
 */
export async function upsertDatasetPricing(
  datasetId: string,
  data: UpsertPricingRequest
): Promise<DatasetPricingVersion> {
  const response = await apiFetch<{ success: boolean; data: { pricing: DatasetPricingVersion } }>(
    `${DATASET_API.GET_DETAILS(datasetId)}/pricing`,
    {
      method: "PUT",
      body: JSON.stringify(data),
    }
  );
  return response.data.pricing;
}

/**
 * Submit dataset pricing for admin review
 * POST /api/v1/supplier/datasets/:datasetId/pricing/submit
 */
export async function submitDatasetPricing(
  datasetId: string
): Promise<SubmitPricingResponse> {
  const response = await apiFetch<{ success: boolean; data: SubmitPricingResponse }>(
    `${DATASET_API.GET_DETAILS(datasetId)}/pricing/submit`,
    {
      method: "POST",
    }
  );
  return response.data;
}

