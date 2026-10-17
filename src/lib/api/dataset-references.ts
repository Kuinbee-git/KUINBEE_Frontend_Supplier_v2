import {
  DatasetPreparationIdParamsSchema,
  DatasetTableReferencesPageQuerySchema,
  DatasetTableReferencesPageResponseSchema,
  DatasetTableReferencesMutationBodySchema,
  DatasetTableReferencesMutationResponseSchema,
  DatasetTableReferenceTargetsQuerySchema,
  DatasetTableReferenceTargetsResponseSchema,
  type DatasetTableReferencesPageQuery,
  type DatasetTableReferencesMutationBody,
  type DatasetTableReferenceTargetsQuery,
} from "@kuinbee/dataset-preparation-contracts";
import {
  PreparationApiError,
  requestPreparationResource,
} from "./dataset-preparations";
import { validateReferenceAcknowledgement } from "@/lib/datasets/dataset-reference-acknowledgement";
const base = (draftId: string) =>
  `/api/v2/supplier/dataset-drafts/${encodeURIComponent(DatasetPreparationIdParamsSchema.parse({ draftId }).draftId)}/files`;
const params = (value: object) =>
  new URLSearchParams(
    Object.entries(value)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, String(v)])
  );
function incompatible(): never {
  throw new PreparationApiError(
    "The reference page changed. Keep your answers and refresh its exact context.",
    "INCOMPATIBLE_RESPONSE"
  );
}
const sameCursor = (query: object, cursor: object | null) =>
  !cursor ||
  [...new Set([...Object.keys(query), ...Object.keys(cursor)])].every(
    (key) =>
      key === "afterId" ||
      (query as Record<string, unknown>)[key] ===
        (cursor as Record<string, unknown>)[key]
  );
export const datasetReferencesApi = {
  async page(
    draftId: string,
    supplied: DatasetTableReferencesPageQuery,
    signal?: AbortSignal
  ) {
    const query = DatasetTableReferencesPageQuerySchema.parse(supplied);
    const page = await requestPreparationResource(
      `${base(draftId)}/table-references?${params(query)}`,
      DatasetTableReferencesPageResponseSchema,
      { signal, cache: "no-store" }
    );
    if (
      page.contentId !== query.contentId ||
      page.contentGeneration !== query.contentGeneration ||
      page.preparationGeneration !== query.expectedPreparationGeneration ||
      page.items.length > query.limit ||
      !sameCursor(query, page.nextCursor) ||
      page.items.some(
        (row) =>
          (query.component && row.component !== query.component) ||
          (query.memberId && row.memberId !== query.memberId) ||
          (query.tableId && row.tableId !== query.tableId) ||
          (query.kind && row.definition.kind !== query.kind) ||
          row.id === query.afterId
      )
    )
      incompatible();
    return page;
  },
  async targets(
    draftId: string,
    supplied: DatasetTableReferenceTargetsQuery,
    signal?: AbortSignal
  ) {
    const query = DatasetTableReferenceTargetsQuerySchema.parse(supplied);
    const page = await requestPreparationResource(
      `${base(draftId)}/table-reference-targets?${params(query)}`,
      DatasetTableReferenceTargetsResponseSchema,
      { signal, cache: "no-store" }
    );
    if (
      page.contentId !== query.contentId ||
      page.contentGeneration !== query.contentGeneration ||
      page.preparationGeneration !== query.expectedPreparationGeneration ||
      page.memberId !== query.memberId ||
      page.tableId !== query.tableId ||
      page.targetMemberId !== query.targetMemberId ||
      page.kind !== query.kind ||
      page.items.length > query.limit ||
      !sameCursor(query, page.nextCursor) ||
      page.items.some((row) => row.id === query.afterId)
    )
      incompatible();
    return page;
  },
  async mutate(draftId: string, supplied: DatasetTableReferencesMutationBody) {
    const body = DatasetTableReferencesMutationBodySchema.parse(supplied);
    const result = await requestPreparationResource(
      `${base(draftId)}/table-references`,
      DatasetTableReferencesMutationResponseSchema,
      {
        method: "PATCH",
        body: JSON.stringify(body),
        cache: "no-store",
        signal: AbortSignal.timeout(30_000),
      }
    );
    return validateReferenceAcknowledgement(body, result);
  },
};
