import { API_BASE_URL } from "@/constants/api.constants";
import type {
  CustomCollectionApiError,
  CustomCollectionListQuery,
  CustomCollectionListResponse,
  CustomCollectionRevision,
  CustomCollectionRevisionInput,
  CustomCollectionService,
  CustomCollectionServiceDetailResponse,
} from "@/types/custom-collection.types";

const root = `${API_BASE_URL}/api/v1/supplier/custom-collection-services`;

interface SuccessEnvelope<T> {
  success: true;
  data: T;
}

interface ErrorEnvelope {
  success: false;
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
}

const request = async <T>(
  url: string,
  options: RequestInit = {}
): Promise<T> => {
  const response = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });

  const payload = (await response.json().catch(() => null)) as
    | SuccessEnvelope<T>
    | ErrorEnvelope
    | null;

  if (!response.ok) {
    const errorPayload = payload && "error" in payload ? payload.error : null;
    const error = new Error(
      errorPayload?.message ||
        "We could not complete that request. Please try again."
    ) as CustomCollectionApiError;
    error.status = response.status;
    error.code = errorPayload?.code || `HTTP_${response.status}`;
    error.details = errorPayload?.details;
    throw error;
  }

  if (!payload || !("data" in payload)) {
    throw new Error("The server returned an invalid response.");
  }

  return payload.data;
};

const queryString = (query: CustomCollectionListQuery = {}) => {
  const params = new URLSearchParams();
  if (query.page) params.set("page", String(query.page));
  if (query.pageSize) params.set("pageSize", String(query.pageSize));
  if (query.q?.trim()) params.set("q", query.q.trim());
  if (query.status) params.set("status", query.status);
  if (query.availability) params.set("availability", query.availability);
  return params.toString();
};

export const customCollectionApi = {
  list: (query?: CustomCollectionListQuery) => {
    const params = queryString(query);
    return request<CustomCollectionListResponse>(
      `${root}${params ? `?${params}` : ""}`
    );
  },

  get: (serviceId: string) =>
    request<CustomCollectionServiceDetailResponse>(`${root}/${serviceId}`),

  create: (body: CustomCollectionRevisionInput) =>
    request<{ service: CustomCollectionService }>(root, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  patch: (
    serviceId: string,
    revisionId: string,
    body: Partial<CustomCollectionRevisionInput>
  ) =>
    request<{ revision: CustomCollectionRevision }>(
      `${root}/${serviceId}/revisions/${revisionId}`,
      { method: "PATCH", body: JSON.stringify(body) }
    ),

  createRevision: (serviceId: string) =>
    request<{ revision: CustomCollectionRevision }>(
      `${root}/${serviceId}/revisions`,
      {
        method: "POST",
      }
    ),

  submit: (serviceId: string, revisionId: string) =>
    request<{ revision: CustomCollectionRevision }>(
      `${root}/${serviceId}/revisions/${revisionId}/submit`,
      { method: "POST" }
    ),

  publish: (serviceId: string) =>
    request<{ service: CustomCollectionService }>(
      `${root}/${serviceId}/publish`,
      { method: "POST" }
    ),

  unpublish: (serviceId: string) =>
    request<{ service: CustomCollectionService }>(
      `${root}/${serviceId}/unpublish`,
      { method: "POST" }
    ),

  archive: (serviceId: string, reason?: string) =>
    request<{ service: CustomCollectionService }>(
      `${root}/${serviceId}/archive`,
      {
        method: "POST",
        body: JSON.stringify({ reason: reason?.trim() || undefined }),
      }
    ),

  uploadCover: async (serviceId: string, revisionId: string, file: File) => {
    const signed = await request<{
      assetId: string;
      uploadUrl: string;
      method: "PUT";
      headers: Record<string, string>;
    }>(`${root}/${serviceId}/revisions/${revisionId}/cover/presign`, {
      method: "POST",
      body: JSON.stringify({ contentType: file.type, fileName: file.name }),
    });

    const uploaded = await fetch(signed.uploadUrl, {
      method: signed.method,
      headers: signed.headers,
      body: file,
    });
    if (!uploaded.ok) {
      throw new Error(
        "The cover image could not be uploaded. Please try again."
      );
    }

    return request<{ assetId: string; url: string }>(
      `${root}/${serviceId}/revisions/${revisionId}/cover/complete`,
      {
        method: "POST",
        body: JSON.stringify({ assetId: signed.assetId }),
      }
    );
  },
};
