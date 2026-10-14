import {
  DatasetFilesContextBodySchema,
  DatasetFilesContextResponseSchema,
  DatasetFilesInventoryPageQuerySchema,
  DatasetFilesInventoryPageResponseSchema,
  type DatasetFilesContextBody,
  type DatasetFilesContextResponse,
  type DatasetFilesInventoryPageQuery,
} from "@kuinbee/dataset-preparation-contracts";
import {
  PreparationApiError,
  requestPreparationResource,
} from "./dataset-preparations";

const base = (id: string) =>
  `/api/v2/supplier/dataset-drafts/${encodeURIComponent(id)}`;
function incompatible(): never {
  throw new PreparationApiError(
    "The files response does not match this draft. Refresh before continuing.",
    "INCOMPATIBLE_RESPONSE"
  );
}
const matchesDraft = (id: string, value: DatasetFilesContextResponse) => {
  if (value.preparationId !== id) incompatible();
  return value;
};

export const datasetFilesApi = {
  context: async (id: string, signal?: AbortSignal) =>
    matchesDraft(
      id,
      await requestPreparationResource(
        `${base(id)}/files-context`,
        DatasetFilesContextResponseSchema,
        { signal }
      )
    ),
  synchronize: async (id: string, supplied: DatasetFilesContextBody) => {
    const body = DatasetFilesContextBodySchema.parse(supplied);
    const response = matchesDraft(
      id,
      await requestPreparationResource(
        `${base(id)}/files-context`,
        DatasetFilesContextResponseSchema,
        { method: "POST", body: JSON.stringify(body) }
      )
    );
    if (
      response.requestId !== body.requestId ||
      response.preparationGeneration !== body.expectedPreparationGeneration ||
      response.sourcePreparationGeneration !==
        body.expectedPreparationGeneration ||
      response.contentId === null ||
      response.contentGeneration !==
        (body.expectedContentGeneration === null
          ? 0
          : body.expectedContentGeneration + 1) ||
      (body.expectedContentId !== null &&
        response.contentId !== body.expectedContentId)
    )
      incompatible();
    return response;
  },
  page: async (
    id: string,
    supplied: DatasetFilesInventoryPageQuery,
    signal?: AbortSignal
  ) => {
    const query = DatasetFilesInventoryPageQuerySchema.parse(supplied);
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query))
      if (value !== undefined) params.set(key, String(value));
    const response = await requestPreparationResource(
      `${base(id)}/files?${params}`,
      DatasetFilesInventoryPageResponseSchema,
      { signal }
    );
    if (
      response.preparationId !== id ||
      response.preparationGeneration !== query.expectedPreparationGeneration ||
      response.contentId !== query.contentId ||
      response.contentGeneration !== query.contentGeneration ||
      (query.component &&
        response.items.some((member) => member.component !== query.component))
    )
      incompatible();
    return response;
  },
};
