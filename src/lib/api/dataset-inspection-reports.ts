import {
  DatasetUploadAttemptIdParamsSchema,
  DatasetMemberInspectionIdParamsSchema,
  DatasetUploadInspectionQuerySchema,
  DatasetMemberInspectionQuerySchema,
  DatasetUploadInspectionResponseSchema,
  DatasetMemberInspectionResponseSchema,
  type DatasetInspectionReportPage,
  type DatasetInspectionReportPageQuery,
  type DatasetUploadInspectionQuery,
  type DatasetMemberInspectionQuery,
} from "@kuinbee/dataset-preparation-contracts";
import {
  PreparationApiError,
  requestPreparationResource,
} from "./dataset-preparations";

const base = (draftId: string) =>
  `/api/v2/supplier/dataset-drafts/${encodeURIComponent(draftId)}`;
const params = (query: object) =>
  new URLSearchParams(
    Object.entries(query)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, String(value)])
  );
function incompatible(): never {
  throw new PreparationApiError(
    "The recorded file checks changed. Refresh the file status before continuing.",
    "INCOMPATIBLE_RESPONSE"
  );
}
function exactPage(
  page: DatasetInspectionReportPage,
  query: DatasetInspectionReportPageQuery
) {
  if (
    (query.expectedEvidenceId &&
      page.evidenceId !== query.expectedEvidenceId) ||
    page.items.length > query.limit ||
    (page.nextCursor && page.nextCursor.limit !== query.limit) ||
    page.items.some(
      (row, index) =>
        (query.afterId && row.id <= query.afterId) ||
        (index > 0 && row.id <= page.items[index - 1].id)
    )
  )
    incompatible();
}
export const datasetInspectionReportsApi = {
  async upload(
    draftId: string,
    attemptId: string,
    supplied: DatasetUploadInspectionQuery,
    signal?: AbortSignal
  ) {
    DatasetUploadAttemptIdParamsSchema.parse({ draftId, attemptId });
    const query = DatasetUploadInspectionQuerySchema.parse(supplied);
    const value = await requestPreparationResource(
      `${base(draftId)}/uploads/${encodeURIComponent(attemptId)}/inspection?${params(query)}`,
      DatasetUploadInspectionResponseSchema,
      { signal, cache: "no-store" }
    );
    if (
      value.preparationId !== draftId ||
      value.attemptId !== attemptId ||
      value.attemptRevision !== query.expectedAttemptRevision ||
      value.recoveryEpoch !== query.expectedRecoveryEpoch
    )
      incompatible();
    exactPage(value.page, query);
    return value;
  },
  async member(
    draftId: string,
    memberId: string,
    supplied: DatasetMemberInspectionQuery,
    signal?: AbortSignal
  ) {
    DatasetMemberInspectionIdParamsSchema.parse({ draftId, memberId });
    const query = DatasetMemberInspectionQuerySchema.parse(supplied);
    const value = await requestPreparationResource(
      `${base(draftId)}/files/${encodeURIComponent(memberId)}/inspection?${params(query)}`,
      DatasetMemberInspectionResponseSchema,
      { signal, cache: "no-store" }
    );
    if (
      value.preparationId !== draftId ||
      value.memberId !== memberId ||
      value.preparationGeneration !== query.expectedPreparationGeneration ||
      value.contentId !== query.contentId ||
      value.contentGeneration !== query.contentGeneration
    )
      incompatible();
    exactPage(value.page, query);
    return value;
  },
};
