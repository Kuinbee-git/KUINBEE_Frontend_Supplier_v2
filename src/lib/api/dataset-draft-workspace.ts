import {
  DatasetDraftWorkspaceQuerySchema,
  DatasetDraftWorkspaceResponseSchema,
} from "@kuinbee/dataset-preparation-contracts";
import { API_BASE_URL } from "@/constants/api.constants";
import { DATASET_PREPARATION_ENABLED } from "@/lib/dataset-preparation-environment";
import { PreparationApiError } from "./dataset-preparations";

export async function listDatasetDraftWorkspace(page = 1, q?: string) {
  if (!DATASET_PREPARATION_ENABLED)
    throw new PreparationApiError(
      "This draft workspace is unavailable here.",
      "NOT_ENABLED"
    );
  const query = DatasetDraftWorkspaceQuerySchema.parse({
    page,
    limit: 20,
    ...(q?.trim() ? { q: q.trim() } : {}),
  });
  const parameters = new URLSearchParams({
    page: String(query.page),
    limit: String(query.limit),
  });
  if (query.q) parameters.set("q", query.q);
  let response: Response;
  try {
    response = await fetch(
      `${API_BASE_URL}/api/v2/supplier/dataset-drafts/workspace?${parameters}`,
      {
        credentials: "include",
        headers: {
          Accept: "application/json;profile=kuinbee.dataset-guided-empty-v1",
        },
      }
    );
  } catch {
    throw new PreparationApiError(
      "Draft proposals could not be loaded. Try again.",
      "NETWORK_ERROR"
    );
  }
  const body = await response.json().catch(() => null);
  if (!response.ok || body?.success !== true)
    throw new PreparationApiError(
      typeof body?.error?.message === "string"
        ? body.error.message
        : "Draft proposals could not be loaded.",
      typeof body?.error?.code === "string"
        ? body.error.code
        : `HTTP_${response.status}`,
      response.status
    );
  const parsed = DatasetDraftWorkspaceResponseSchema.safeParse(body.data);
  if (!parsed.success)
    throw new PreparationApiError(
      "The draft inventory response could not be read. Try again.",
      "INCOMPATIBLE_RESPONSE",
      response.status
    );
  return parsed.data;
}
