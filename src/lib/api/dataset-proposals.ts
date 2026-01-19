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
  UpsertAboutInfoRequest,
  UpsertAboutInfoResponse,
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
  SubmitProposalResponse,
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
    // If error already has status, rethrow
    if (err.status) throw err;
    
    // Network error or other fetch error
    console.error(`[API] Network error for ${endpoint}:`, err);
    const error: any = new Error(err.message || "Network error");
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
  return apiFetch<CreateProposalResponse>(DATASET_PROPOSAL_API.CREATE, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ===== List My Proposals =====

/**
 * List the supplier's dataset proposals with optional filtering
 */
export async function listMyProposals(
  query?: ListProposalsQuery
): Promise<ListProposalsResponse> {
  const queryParams = new URLSearchParams();
  
  if (query?.status) queryParams.set("status", query.status);
  if (query?.verificationStatus) queryParams.set("verificationStatus", query.verificationStatus);
  if (query?.page) queryParams.set("page", query.page.toString());
  if (query?.pageSize) queryParams.set("pageSize", query.pageSize.toString());
  
  const url = queryParams.toString() 
    ? `${DATASET_PROPOSAL_API.LIST}?${queryParams.toString()}`
    : DATASET_PROPOSAL_API.LIST;
  
  const response = await apiFetch<{ success: boolean; data: ListProposalsResponse }>(url, {
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
  return apiFetch<ProposalDetailsResponse>(
    DATASET_PROPOSAL_API.GET_DETAILS(datasetId),
    {
      method: "GET",
    }
  );
}

// ===== Update Proposal Metadata =====

/**
 * Update proposal metadata (only when verification.status = PENDING or CHANGES_REQUESTED)
 */
export async function updateProposalMetadata(
  datasetId: string,
  data: UpdateProposalRequest
): Promise<UpdateProposalResponse> {
  return apiFetch<UpdateProposalResponse>(
    DATASET_PROPOSAL_API.UPDATE_METADATA(datasetId),
    {
      method: "PATCH",
      body: JSON.stringify(data),
    }
  );
}

// ===== Upsert About Dataset Info =====

/**
 * Create or update AboutDatasetInfo for a proposal
 */
export async function upsertAboutInfo(
  datasetId: string,
  data: UpsertAboutInfoRequest
): Promise<UpsertAboutInfoResponse> {
  return apiFetch<UpsertAboutInfoResponse>(
    DATASET_PROPOSAL_API.UPSERT_ABOUT(datasetId),
    {
      method: "PUT",
      body: JSON.stringify(data),
    }
  );
}

// ===== Upsert Data Format Info =====

/**
 * Create or update DataFormatInfo for a proposal
 */
export async function upsertDataFormatInfo(
  datasetId: string,
  data: UpsertDataFormatRequest
): Promise<UpsertDataFormatResponse> {
  return apiFetch<UpsertDataFormatResponse>(
    DATASET_PROPOSAL_API.UPSERT_DATA_FORMAT(datasetId),
    {
      method: "PUT",
      body: JSON.stringify(data),
    }
  );
}

// ===== Replace Features =====

/**
 * Replace the entire list of features (columns/schema) for a proposal
 */
export async function replaceFeatures(
  datasetId: string,
  data: ReplaceFeaturesRequest
): Promise<ReplaceFeaturesResponse> {
  return apiFetch<ReplaceFeaturesResponse>(
    DATASET_PROPOSAL_API.REPLACE_FEATURES(datasetId),
    {
      method: "PUT",
      body: JSON.stringify(data),
    }
  );
}

// ===== Set Secondary Categories =====

/**
 * Set secondary categories (in addition to primaryCategoryId)
 */
export async function setSecondaryCategories(
  datasetId: string,
  data: SetCategoriesRequest
): Promise<SetCategoriesResponse> {
  return apiFetch<SetCategoriesResponse>(
    DATASET_PROPOSAL_API.SET_CATEGORIES(datasetId),
    {
      method: "PUT",
      body: JSON.stringify(data),
    }
  );
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
  return apiFetch<PresignUploadResponse>(
    DATASET_PROPOSAL_API.PRESIGN_UPLOAD(datasetId),
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
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
  return apiFetch<CompleteUploadResponse>(
    DATASET_PROPOSAL_API.COMPLETE_UPLOAD(datasetId),
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
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
  return apiFetch<SubmitProposalResponse>(
    DATASET_PROPOSAL_API.SUBMIT(datasetId),
    {
      method: "POST",
    }
  );
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
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.send(file);
  });
}
