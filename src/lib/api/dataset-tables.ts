import {
  DatasetPreparationIdParamsSchema,
  DatasetTableDescriptionsPageQuerySchema,
  DatasetTableDescriptionsPageResponseSchema,
  DatasetTableDescriptionsMutationBodySchema,
  DatasetTableDescriptionsMutationResponseSchema,
  type DatasetTableDescriptionsPageQuery,
  type DatasetTableDescriptionsMutationBody,
} from "@kuinbee/dataset-preparation-contracts";
import {
  PreparationApiError,
  requestPreparationResource,
} from "./dataset-preparations";
import { validateTableDescriptionAcknowledgement } from "@/lib/datasets/dataset-table-page-commands";

const base = (draftId: string) => {
  const parsed = DatasetPreparationIdParamsSchema.parse({ draftId });
  return `/api/v2/supplier/dataset-drafts/${encodeURIComponent(parsed.draftId)}/files/tables`;
};
function incompatible(): never {
  throw new PreparationApiError(
    "The table response changed. Your answers are retained; refresh before continuing.",
    "INCOMPATIBLE_RESPONSE"
  );
}
export const datasetTablesApi = {
  async page(
    draftId: string,
    supplied: DatasetTableDescriptionsPageQuery,
    signal?: AbortSignal
  ) {
    const query = DatasetTableDescriptionsPageQuerySchema.parse(supplied);
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query))
      if (value !== undefined) params.set(key, String(value));
    const page = await requestPreparationResource(
      `${base(draftId)}?${params}`,
      DatasetTableDescriptionsPageResponseSchema,
      { signal, cache: "no-store" }
    );
    if (
      page.contentId !== query.contentId ||
      page.contentGeneration !== query.contentGeneration ||
      page.preparationGeneration !== query.expectedPreparationGeneration ||
      page.memberId !== query.memberId ||
      page.tableId !== (query.tableId ?? null) ||
      page.items.length > query.limit ||
      (page.nextCursor && page.nextCursor.limit !== query.limit)
    )
      incompatible();
    return page;
  },
  async mutate(
    draftId: string,
    supplied: DatasetTableDescriptionsMutationBody
  ) {
    const body = DatasetTableDescriptionsMutationBodySchema.parse(supplied);
    const ack = await requestPreparationResource(
      base(draftId),
      DatasetTableDescriptionsMutationResponseSchema,
      {
        method: "PATCH",
        body: JSON.stringify(body),
        cache: "no-store",
        signal: AbortSignal.timeout(30_000),
      }
    );
    return validateTableDescriptionAcknowledgement(body, ack);
  },
};
