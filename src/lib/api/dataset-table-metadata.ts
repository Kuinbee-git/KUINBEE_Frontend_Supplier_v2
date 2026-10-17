import {
  DatasetPreparationIdParamsSchema,
  DatasetPrivateTableMetadataQuerySchema,
  DatasetPrivateTableMetadataResponseSchema,
  DatasetFileAccessPageQuerySchema,
  DatasetFileAccessPageResponseSchema,
  type DatasetPrivateTableMetadataQuery,
  type DatasetFileAccessPageQuery,
} from "@kuinbee/dataset-preparation-contracts";
import {
  PreparationApiError,
  requestPreparationResource,
} from "./dataset-preparations";
const base = (draftId: string) =>
  `/api/v2/supplier/dataset-files/${encodeURIComponent(DatasetPreparationIdParamsSchema.parse({ draftId }).draftId)}`;
const incompatible = (): never => {
  throw new PreparationApiError(
    "The table context changed. Refresh before continuing.",
    "INCOMPATIBLE_RESPONSE"
  );
};
function params(query: object) {
  const values = new URLSearchParams();
  for (const [key, value] of Object.entries(query))
    if (value !== undefined) values.set(key, String(value));
  return values;
}
function matches(
  value: {
    datasetId: string;
    scope: string;
    component: string;
    contentId: string;
    contentGeneration: number;
    workflowRevision: number | null;
    editOperation: string | null;
  },
  draftId: string,
  query: DatasetFileAccessPageQuery
) {
  if (
    value.datasetId !== draftId ||
    value.scope !== query.scope ||
    value.component !== query.component ||
    value.contentId !== query.contentId ||
    value.contentGeneration !== query.contentGeneration ||
    value.workflowRevision !== query.expectedWorkflowRevision ||
    value.editOperation !==
      (query.scope === "EDIT_BASE" ? (query.editOperation ?? "METADATA") : null)
  )
    incompatible();
}
export const datasetTableMetadataApi = {
  async page(
    draftId: string,
    supplied: DatasetPrivateTableMetadataQuery,
    signal?: AbortSignal
  ) {
    const query = DatasetPrivateTableMetadataQuerySchema.parse(supplied);
    if (query.scope === "GRANTED")
      throw new PreparationApiError(
        "Use the owned supplier content context.",
        "INVALID_FILE_SCOPE",
        400
      );
    const result = await requestPreparationResource(
      `${base(draftId)}/tables?${params(query)}`,
      DatasetPrivateTableMetadataResponseSchema,
      { signal, cache: "no-store" }
    );
    matches(result.context, draftId, query);
    if (
      result.memberId !== (query.memberId ?? null) ||
      result.page.tableId !== (query.tableId ?? null) ||
      result.page.items.length > query.limit ||
      (result.page.nextCursor && result.page.nextCursor.limit !== query.limit)
    )
      incompatible();
    return result;
  },
  async editMembers(
    draftId: string,
    supplied: DatasetFileAccessPageQuery,
    signal?: AbortSignal
  ) {
    const query = DatasetFileAccessPageQuerySchema.parse(supplied);
    if (query.scope !== "EDIT_BASE" || query.editOperation !== "METADATA")
      throw new PreparationApiError(
        "Choose the permitted metadata edit base.",
        "INVALID_FILE_SCOPE",
        400
      );
    const result = await requestPreparationResource(
      `${base(draftId)}/inventory?${params(query)}`,
      DatasetFileAccessPageResponseSchema,
      { signal, cache: "no-store" }
    );
    matches(result.context, draftId, query);
    if (
      result.items.length > query.limit ||
      (result.nextCursor && result.nextCursor.limit !== query.limit)
    )
      incompatible();
    return result;
  },
};
