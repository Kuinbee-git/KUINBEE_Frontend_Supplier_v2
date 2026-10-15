import {
  DatasetPreparationCreateBodySchema,
  DatasetPreparationPatchBodySchema,
  DatasetPreparationResponseSchema,
  DatasetPreparationsListResponseSchema,
  DatasetPreparationsListQuerySchema,
  DatasetPreparationCatalogLabelsQuerySchema,
  DatasetPreparationCatalogLabelsResponseSchema,
  type DatasetPreparationCreateBody,
  type DatasetPreparationPatchBody,
} from "@kuinbee/dataset-preparation-contracts";
import { API_BASE_URL } from "@/constants/api.constants";
import { DATASET_PREPARATION_ENABLED } from "@/lib/dataset-preparation-environment";

export class PreparationApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public status?: number
  ) {
    super(message);
    this.name = "PreparationApiError";
  }
}

const base = "/api/v2/supplier/dataset-drafts";
async function request<T>(
  path: string,
  schema: { parse(value: unknown): T },
  options: RequestInit = {}
): Promise<T> {
  if (!DATASET_PREPARATION_ENABLED)
    throw new PreparationApiError(
      "Dataset preparation is not available here.",
      "NOT_ENABLED"
    );
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      credentials: "include",
      headers: { "Content-Type": "application/json", ...options.headers },
    });
  } catch {
    throw new PreparationApiError(
      "We could not complete this request. Your input is retained.",
      "NETWORK_ERROR"
    );
  }
  const body = await response.json().catch(() => null);
  if (response.ok && body?.success !== true) {
    throw new PreparationApiError(
      "We could not read the server response. Your input is retained.",
      "INCOMPATIBLE_RESPONSE",
      response.status
    );
  }
  if (!response.ok || body?.success !== true) {
    const error = body?.error ?? body;
    throw new PreparationApiError(
      typeof error?.message === "string"
        ? error.message
        : "The request could not be completed.",
      typeof error?.code === "string" ? error.code : `HTTP_${response.status}`,
      response.status
    );
  }
  try {
    return schema.parse(body.data);
  } catch {
    throw new PreparationApiError(
      "The server response is incompatible. Your input is retained; retry the same request before continuing.",
      "INCOMPATIBLE_RESPONSE"
    );
  }
}

// Companion Dataset APIs use the same gated, strict response/error handling.
export { request as requestPreparationResource };

export const preparationApi = {
  list: (page = 1, q?: string) => {
    const query = DatasetPreparationsListQuerySchema.parse({
      page,
      limit: 20,
      ...(q?.trim() ? { q: q.trim() } : {}),
    });
    const parameters = new URLSearchParams({
      page: String(query.page),
      limit: String(query.limit),
    });
    if (query.q) parameters.set("q", query.q);
    return request(
      `${base}?${parameters}`,
      DatasetPreparationsListResponseSchema
    );
  },
  get: (id: string, signal?: AbortSignal) =>
    request(
      `${base}/${encodeURIComponent(id)}`,
      DatasetPreparationResponseSchema,
      { signal, cache: "no-store" }
    ),
  create: (body: DatasetPreparationCreateBody) =>
    request(base, DatasetPreparationResponseSchema, {
      method: "POST",
      body: JSON.stringify(DatasetPreparationCreateBodySchema.parse(body)),
    }),
  patch: (id: string, body: DatasetPreparationPatchBody) =>
    request(
      `${base}/${encodeURIComponent(id)}`,
      DatasetPreparationResponseSchema,
      {
        method: "PATCH",
        body: JSON.stringify(DatasetPreparationPatchBodySchema.parse(body)),
      }
    ),
  labels: (query: { primaryCategoryId?: string; sourceId?: string }) => {
    const normalized = DatasetPreparationCatalogLabelsQuerySchema.parse(query);
    const parameters = new URLSearchParams();
    for (const [key, value] of Object.entries(normalized))
      if (value) parameters.set(key, value);
    return request(
      `${base}/catalog-labels?${parameters}`,
      DatasetPreparationCatalogLabelsResponseSchema
    );
  },
};

export interface PreparationCatalogOption {
  id: string;
  name: string;
}
export async function listPreparationOptions(
  kind: "categories" | "sources",
  page: number,
  q: string
) {
  const params = new URLSearchParams({ page: String(page), pageSize: "20" });
  if (q.trim()) params.set("q", q.trim());
  return request(`/api/v1/supplier/${kind}?${params}`, {
    parse(value: unknown): {
      items: PreparationCatalogOption[];
      total: number;
    } {
      if (!value || typeof value !== "object")
        throw new Error("Invalid options");
      const data = value as { items?: unknown; total?: unknown };
      if (
        !Array.isArray(data.items) ||
        typeof data.total !== "number" ||
        !Number.isSafeInteger(data.total) ||
        data.total < 0
      )
        throw new Error("Invalid options");
      const items = data.items.map((item: unknown) => {
        if (
          !item ||
          typeof item !== "object" ||
          !("id" in item) ||
          !("name" in item) ||
          typeof item.id !== "string" ||
          typeof item.name !== "string"
        )
          throw new Error("Invalid option");
        return { id: item.id, name: item.name };
      });
      return { items, total: data.total };
    },
  });
}
