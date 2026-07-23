/**
 * Dataset Proposal API Service
 * Handles all dataset proposal-related API calls
 */

import { DATASET_PROPOSAL_API, API_BASE_URL } from "@/constants/api.constants";
import type {
  CreateProposalRequest,
  CreateProposalResponse,
  ListProposalsQuery,
  ListProposalsResponse,
  ProposalDetailsResponse,
  UpdateProposalRequest,
  UpdateProposalResponse,
  DiscardProposalResponse,
  UpsertAboutInfoRequest,
  UpsertAboutInfoResponse,
  UpsertLocationInfoRequest,
  UpsertLocationInfoResponse,
  SetTagsRequest,
  SetTagsResponse,
  UpsertDataFormatRequest,
  UpsertDataFormatResponse,
  ReplaceFeaturesRequest,
  ReplaceFeaturesResponse,
  SetCategoriesRequest,
  SetCategoriesResponse,
  PresignUploadRequest,
  PresignUploadResponse,
  CompleteUploadRequest,
  CompleteUploadResponse,
  PresignSampleUploadRequest,
  PresignSampleUploadResponse,
  CompleteSampleUploadRequest,
  CompleteSampleUploadResponse,
  SubmitProposalResponse,
  DatasetPricingVersion,
  UpsertPricingRequest,
  GetPricingResponse,
  SubmitPricingResponse,
} from "@/types/dataset-proposal.types";

interface ApiError extends Error {
  status?: number;
  code?: string;
  data?: unknown;
}

function getErrorMessage(value: unknown, fallback: string): string {
  if (value && typeof value === "object" && "message" in value) {
    const message = (value as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return fallback;
}

// ===== Helper: API Fetch =====
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL}${endpoint}`;

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
      const errorData: unknown = await response.json().catch(() => null);

      // Global auth failure handler
      if (response.status === 401 || response.status === 403) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("auth-storage");
          localStorage.removeItem("kuinbee-supplier-storage");
          localStorage.removeItem("onboarding-storage");
          window.location.href = "/auth/login";
        }
      }

      const error = new Error(
        getErrorMessage(
          errorData,
          `HTTP ${response.status}: ${response.statusText}`
        )
      ) as ApiError;
      error.status = response.status;
      error.code =
        errorData &&
        typeof errorData === "object" &&
        "code" in errorData &&
        typeof (errorData as { code?: unknown }).code === "string"
          ? (errorData as { code: string }).code
          : `HTTP_${response.status}`;
      error.data = errorData;

      console.error(
        `[API] ${options.method || "GET"} ${endpoint} failed:`,
        error
      );
      throw error;
    }

    return response.json();
  } catch (err: unknown) {
    // If error already has status, rethrow
    if (err && typeof err === "object" && "status" in err) throw err;

    // Network error or other fetch error
    console.error(`[API] Network error for ${endpoint}:`, err);
    const error = new Error(getErrorMessage(err, "Network error")) as ApiError;
    error.code = "NETWORK_ERROR";
    throw error;
  }
}

// ===== Create Draft Proposal =====

/**
 * Create a new dataset proposal in Draft state (verification.status = PENDING)
 */
export async function createDatasetProposal(
  data: CreateProposalRequest
): Promise<CreateProposalResponse> {
  const response = await apiFetch<{
    success: boolean;
    data: CreateProposalResponse;
  }>(DATASET_PROPOSAL_API.CREATE, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return response.data;
}

// ===== List My Proposals =====

/**
 * List the supplier's dataset proposals with optional filtering
 */
export async function listMyProposals(
  query?: ListProposalsQuery
): Promise<ListProposalsResponse> {
  const queryParams = new URLSearchParams();

  if (query?.q) queryParams.set("q", query.q);
  if (query?.scope) queryParams.set("scope", query.scope);
  if (query?.status) queryParams.set("status", query.status);
  if (query?.verificationStatus)
    queryParams.set("verificationStatus", query.verificationStatus);
  if (query?.page) queryParams.set("page", query.page.toString());
  if (query?.pageSize) queryParams.set("pageSize", query.pageSize.toString());

  const url = queryParams.toString()
    ? `${DATASET_PROPOSAL_API.LIST}?${queryParams.toString()}`
    : DATASET_PROPOSAL_API.LIST;

  const response = await apiFetch<{
    success: boolean;
    data: ListProposalsResponse;
  }>(url, {
    method: "GET",
  });

  return response.data;
}

// ===== Get Proposal Details =====

/**
 * Get detailed information about a dataset proposal
 */
export async function getProposalDetails(
  datasetId: string
): Promise<ProposalDetailsResponse> {
  const response = await apiFetch<{
    success: boolean;
    data: ProposalDetailsResponse;
  }>(DATASET_PROPOSAL_API.GET_DETAILS(datasetId), {
    method: "GET",
  });
  return response.data;
}

// ===== Update Proposal Metadata =====

/**
 * Update proposal metadata (only when verification.status = PENDING or CHANGES_REQUESTED)
 */
export async function updateProposalMetadata(
  datasetId: string,
  data: UpdateProposalRequest
): Promise<UpdateProposalResponse> {
  const response = await apiFetch<{
    success: boolean;
    data: UpdateProposalResponse;
  }>(DATASET_PROPOSAL_API.UPDATE_METADATA(datasetId), {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  return response.data;
}

/**
 * Permanently discard an owned proposal that has never been submitted.
 */
export async function discardDraftProposal(
  datasetId: string
): Promise<DiscardProposalResponse> {
  const response = await apiFetch<{
    success: boolean;
    data: DiscardProposalResponse;
  }>(DATASET_PROPOSAL_API.DISCARD_DRAFT(datasetId), { method: "DELETE" });
  return response.data;
}

// ===== Upsert About Dataset Info =====

/**
 * Create or update AboutDatasetInfo for a proposal
 */
export async function upsertAboutInfo(
  datasetId: string,
  data: UpsertAboutInfoRequest
): Promise<UpsertAboutInfoResponse> {
  const response = await apiFetch<{
    success: boolean;
    data: UpsertAboutInfoResponse;
  }>(DATASET_PROPOSAL_API.UPSERT_ABOUT(datasetId), {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return response.data;
}

/**
 * Create or update LocationInfo for a proposal
 */
export async function upsertLocationInfo(
  datasetId: string,
  data: UpsertLocationInfoRequest
): Promise<UpsertLocationInfoResponse> {
  const response = await apiFetch<{
    success: boolean;
    data: UpsertLocationInfoResponse;
  }>(DATASET_PROPOSAL_API.UPSERT_LOCATION(datasetId), {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return response.data;
}

/**
 * Replace free-text tags for a proposal (creates missing tags server-side)
 */
export async function setProposalTags(
  datasetId: string,
  data: SetTagsRequest
): Promise<SetTagsResponse> {
  const response = await apiFetch<{ success: boolean; data: SetTagsResponse }>(
    DATASET_PROPOSAL_API.SET_TAGS(datasetId),
    {
      method: "PUT",
      body: JSON.stringify(data),
    }
  );
  return response.data;
}

// ===== Upsert Data Format Info =====

/**
 * Create or update DataFormatInfo for a proposal
 */
export async function upsertDataFormatInfo(
  datasetId: string,
  data: UpsertDataFormatRequest
): Promise<UpsertDataFormatResponse> {
  const response = await apiFetch<{
    success: boolean;
    data: UpsertDataFormatResponse;
  }>(DATASET_PROPOSAL_API.UPSERT_DATA_FORMAT(datasetId), {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return response.data;
}

// ===== Replace Features =====

/**
 * Replace the entire list of features (columns/schema) for a proposal
 */
export async function replaceFeatures(
  datasetId: string,
  data: ReplaceFeaturesRequest
): Promise<ReplaceFeaturesResponse> {
  const response = await apiFetch<{
    success: boolean;
    data: ReplaceFeaturesResponse;
  }>(DATASET_PROPOSAL_API.REPLACE_FEATURES(datasetId), {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return response.data;
}

// ===== Set Secondary Categories =====

/**
 * Set secondary categories (in addition to primaryCategoryId)
 */
export async function setSecondaryCategories(
  datasetId: string,
  data: SetCategoriesRequest
): Promise<SetCategoriesResponse> {
  const response = await apiFetch<{
    success: boolean;
    data: SetCategoriesResponse;
  }>(DATASET_PROPOSAL_API.SET_CATEGORIES(datasetId), {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return response.data;
}

// ===== Presign Current Upload =====

/**
 * Create a new current upload attempt and return a presigned PUT URL for S3
 * This is re-entrant and can be called multiple times
 */
export async function presignCurrentUpload(
  datasetId: string,
  data: PresignUploadRequest = {}
): Promise<PresignUploadResponse> {
  const response = await apiFetch<{
    success: boolean;
    data: PresignUploadResponse;
  }>(DATASET_PROPOSAL_API.PRESIGN_UPLOAD(datasetId), {
    method: "POST",
    body: JSON.stringify(data),
  });
  return response.data;
}

// ===== Complete Current Upload =====

/**
 * Mark the current upload as completed (status: UPLOADED)
 * Idempotent: if already UPLOADED, returns success
 */
export async function completeCurrentUpload(
  datasetId: string,
  data: CompleteUploadRequest = {}
): Promise<CompleteUploadResponse> {
  const response = await apiFetch<{
    success: boolean;
    data: CompleteUploadResponse;
  }>(DATASET_PROPOSAL_API.COMPLETE_UPLOAD(datasetId), {
    method: "POST",
    body: JSON.stringify(data),
  });
  return response.data;
}

// ===== Presign Sample Upload =====

/**
 * Create or replace sample upload and return a presigned PUT URL for S3
 */
export async function presignSampleUpload(
  datasetId: string,
  data: PresignSampleUploadRequest = {}
): Promise<PresignSampleUploadResponse> {
  const response = await apiFetch<{
    success: boolean;
    data: PresignSampleUploadResponse;
  }>(DATASET_PROPOSAL_API.PRESIGN_SAMPLE_UPLOAD(datasetId), {
    method: "POST",
    body: JSON.stringify(data),
  });
  return response.data;
}

// ===== Complete Sample Upload =====

/**
 * Mark sample upload as completed (status: UPLOADED)
 */
export async function completeSampleUpload(
  datasetId: string,
  data: CompleteSampleUploadRequest = {}
): Promise<CompleteSampleUploadResponse> {
  const response = await apiFetch<{
    success: boolean;
    data: CompleteSampleUploadResponse;
  }>(DATASET_PROPOSAL_API.COMPLETE_SAMPLE_UPLOAD(datasetId), {
    method: "POST",
    body: JSON.stringify(data),
  });
  return response.data;
}

// ===== Submit / Resubmit Proposal =====

/**
 * Submit the proposal to admin queue
 * - If verification.status = PENDING, moves to SUBMITTED
 * - If verification.status = CHANGES_REQUESTED, moves to RESUBMITTED
 *
 * Requires:
 * - currentUpload.status = UPLOADED
 * - AboutDatasetInfo present
 * - DataFormatInfo present
 * - At least 1 Feature
 */
export async function submitProposal(
  datasetId: string
): Promise<SubmitProposalResponse> {
  const response = await apiFetch<{
    success: boolean;
    data: SubmitProposalResponse;
  }>(DATASET_PROPOSAL_API.SUBMIT(datasetId), {
    method: "POST",
  });
  return response.data;
}

// ===== Pricing =====

/**
 * Get the latest pricing version for a proposal
 */
export async function getProposalPricing(
  datasetId: string
): Promise<GetPricingResponse> {
  const response = await apiFetch<{
    success: boolean;
    data: GetPricingResponse;
  }>(`${DATASET_PROPOSAL_API.GET_DETAILS(datasetId)}/pricing`, {
    method: "GET",
  });
  return response.data;
}

/**
 * Upsert (create or update) pricing for a proposal
 */
export async function upsertProposalPricing(
  datasetId: string,
  data: UpsertPricingRequest
): Promise<DatasetPricingVersion> {
  const response = await apiFetch<{
    success: boolean;
    data: { pricing: DatasetPricingVersion };
  }>(`${DATASET_PROPOSAL_API.GET_DETAILS(datasetId)}/pricing`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return response.data.pricing;
}

/**
 * Submit proposal pricing for admin review
 */
export async function submitProposalPricing(
  datasetId: string
): Promise<SubmitPricingResponse> {
  const response = await apiFetch<{
    success: boolean;
    data: SubmitPricingResponse;
  }>(`${DATASET_PROPOSAL_API.GET_DETAILS(datasetId)}/pricing/submit`, {
    method: "POST",
  });
  return response.data;
}

// ===== Utility: Upload File to S3 =====

/**
 * Helper function to upload a file to S3 using a presigned URL
 * This is separate from the API calls above but useful for the upload flow
 */
export async function uploadFileToS3(
  presignedUrl: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Track upload progress
    if (onProgress) {
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          onProgress(progress);
        }
      });
    }

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`S3 upload failed with status ${xhr.status}`));
      }
    });

    xhr.addEventListener("error", () => {
      reject(new Error("Network error during S3 upload"));
    });

    xhr.addEventListener("abort", () => {
      reject(new Error("S3 upload aborted"));
    });

    xhr.open("PUT", presignedUrl);
    xhr.setRequestHeader(
      "Content-Type",
      file.type || "application/octet-stream"
    );
    xhr.send(file);
  });
}
