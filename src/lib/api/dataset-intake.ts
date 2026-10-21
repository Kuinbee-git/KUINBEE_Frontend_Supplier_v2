import {
  DatasetIntakeConfigQuerySchema,
  DatasetIntakeConfigResponseSchema,
  DatasetUploadAdmissionBodySchema,
  DatasetUploadActionBodySchema,
  DatasetUploadCancelBodySchema,
  DatasetUploadAttemptResponseSchema,
  DatasetUploadAttemptStatusResponseSchema,
  DatasetUploadsPageQuerySchema,
  DatasetUploadsPageResponseSchema,
  DatasetUploadPartsPageQuerySchema,
  DatasetUploadPartsPageResponseSchema,
  DatasetUploadPartParamsSchema,
  DatasetUploadPartQuerySchema,
  type DatasetUploadAdmissionBody,
  type DatasetUploadActionBody,
  type DatasetUploadCancelBody,
  type DatasetUploadAttemptResponse,
  type DatasetUploadAttemptStatusResponse,
  type DatasetUploadsPageQuery,
  type DatasetUploadPartsPageQuery,
} from "@kuinbee/dataset-preparation-contracts";
import {
  PreparationApiError,
  requestPreparationResource,
} from "./dataset-preparations";

const base = (draftId: string) =>
  `/api/v2/supplier/dataset-drafts/${encodeURIComponent(draftId)}`;
const upload = (draftId: string, attemptId: string) =>
  `${base(draftId)}/uploads/${encodeURIComponent(attemptId)}`;
const incompatible = (): never => {
  throw new PreparationApiError(
    "Upload status changed or could not be verified. Refresh before continuing.",
    "INCOMPATIBLE_RESPONSE"
  );
};
const queryString = (query: object) => {
  const parameters = new URLSearchParams();
  for (const [key, value] of Object.entries(query))
    if (value !== undefined) parameters.set(key, String(value));
  return parameters.toString();
};
function matchesAttempt<
  T extends DatasetUploadAttemptResponse | DatasetUploadAttemptStatusResponse,
>(draftId: string, attemptId: string | null, result: T): T {
  if (
    result.rootId !== draftId ||
    (attemptId !== null && result.id !== attemptId)
  )
    incompatible();
  return result;
}
async function request<T>(
  path: string,
  schema: { parse(value: unknown): T },
  options: RequestInit = {},
  timeoutMs = 30_000
): Promise<T> {
  const controller = new AbortController(),
    abort = () => controller.abort();
  options.signal?.addEventListener("abort", abort, { once: true });
  if (options.signal?.aborted) abort();
  const timer = setTimeout(abort, timeoutMs);
  try {
    return await requestPreparationResource(path, schema, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener("abort", abort);
  }
}

export const datasetIntakeApi = {
  async config(
    draftId: string,
    expectedPreparationGeneration: number,
    signal?: AbortSignal
  ) {
    const query = DatasetIntakeConfigQuerySchema.parse({
      expectedPreparationGeneration,
    });
    const result = await request(
      `${base(draftId)}/intake-config?${queryString(query)}`,
      DatasetIntakeConfigResponseSchema,
      { signal }
    );
    if (
      result.context.preparationId !== draftId ||
      result.context.preparationGeneration !== expectedPreparationGeneration
    )
      incompatible();
    return result;
  },
  async uploads(
    draftId: string,
    supplied: DatasetUploadsPageQuery,
    signal?: AbortSignal
  ) {
    const query = DatasetUploadsPageQuerySchema.parse(supplied);
    const result = await request(
      `${base(draftId)}/uploads?${queryString(query)}`,
      DatasetUploadsPageResponseSchema,
      { signal }
    );
    if (
      result.preparationId !== draftId ||
      (query.component &&
        result.items.some((item) => item.component !== query.component))
    )
      incompatible();
    return result;
  },
  async status(draftId: string, attemptId: string, signal?: AbortSignal) {
    return matchesAttempt(
      draftId,
      attemptId,
      await request(
        upload(draftId, attemptId),
        DatasetUploadAttemptStatusResponseSchema,
        { signal }
      )
    );
  },
  async parts(
    draftId: string,
    attemptId: string,
    supplied: DatasetUploadPartsPageQuery,
    signal?: AbortSignal
  ) {
    const query = DatasetUploadPartsPageQuerySchema.parse(supplied);
    const result = await request(
      `${upload(draftId, attemptId)}/parts?${queryString(query)}`,
      DatasetUploadPartsPageResponseSchema,
      { signal }
    );
    if (
      result.preparationId !== draftId ||
      result.attemptId !== attemptId ||
      result.attemptRevision !== query.expectedAttemptRevision ||
      result.recoveryEpoch !== query.expectedRecoveryEpoch ||
      result.items.some(
        (item) => item.partNumber <= (query.afterPartNumber ?? 0)
      )
    )
      incompatible();
    return result;
  },
  async admit(
    draftId: string,
    supplied: DatasetUploadAdmissionBody,
    signal?: AbortSignal
  ) {
    const body = DatasetUploadAdmissionBodySchema.parse(supplied);
    const result = matchesAttempt(
      draftId,
      null,
      await request(
        `${base(draftId)}/uploads`,
        DatasetUploadAttemptResponseSchema,
        { method: "POST", body: JSON.stringify(body), signal }
      )
    );
    if (
      result.requestId !== body.requestId ||
      result.contentId !== body.expectedContentId ||
      result.component !== body.component ||
      result.role !== body.role ||
      result.originalName !== body.originalName ||
      (result.relativePath ?? null) !== (body.relativePath ?? null) ||
      result.expectedBytes !== body.expectedBytes ||
      JSON.stringify(result.inspectionProfile) !==
        JSON.stringify(body.inspectionProfile)
    )
      incompatible();
    return result;
  },
  async finalize(
    draftId: string,
    attemptId: string,
    supplied: DatasetUploadActionBody,
    signal?: AbortSignal
  ) {
    const body = DatasetUploadActionBodySchema.parse(supplied);
    const result = matchesAttempt(
      draftId,
      attemptId,
      await request(
        `${upload(draftId, attemptId)}/finalize`,
        DatasetUploadAttemptResponseSchema,
        { method: "POST", body: JSON.stringify(body), signal }
      )
    );
    if (
      result.requestId !== body.requestId ||
      result.contentId !== body.expectedContentId
    )
      incompatible();
    return result;
  },
  async cancel(
    draftId: string,
    attemptId: string,
    supplied: DatasetUploadCancelBody,
    signal?: AbortSignal
  ) {
    const body = DatasetUploadCancelBodySchema.parse(supplied);
    const result = matchesAttempt(
      draftId,
      attemptId,
      await request(
        `${upload(draftId, attemptId)}/cancel`,
        DatasetUploadAttemptResponseSchema,
        { method: "POST", body: JSON.stringify(body), signal }
      )
    );
    if (
      result.requestId !== body.requestId ||
      result.state !== "CANCEL_REQUESTED"
    )
      incompatible();
    return result;
  },
  async remove(
    draftId: string,
    attemptId: string,
    supplied: DatasetUploadCancelBody,
    signal?: AbortSignal
  ) {
    const body = DatasetUploadCancelBodySchema.parse(supplied);
    const result = matchesAttempt(
      draftId,
      attemptId,
      await request(
        `${upload(draftId, attemptId)}/remove`,
        DatasetUploadAttemptResponseSchema,
        { method: "POST", body: JSON.stringify(body), signal }
      )
    );
    if (
      result.requestId !== body.requestId ||
      result.state !== "CANCEL_REQUESTED"
    )
      incompatible();
    return result;
  },
  async putPart(
    draftId: string,
    attemptId: string,
    partNumber: number,
    supplied: DatasetUploadActionBody,
    bytes: Blob,
    signal?: AbortSignal
  ) {
    const params = DatasetUploadPartParamsSchema.parse({
      draftId,
      attemptId,
      partNumber,
    });
    const query = DatasetUploadPartQuerySchema.parse(supplied);
    if (bytes.size < 1 || bytes.size > 8 * 1_024 * 1_024)
      throw new PreparationApiError(
        "The upload slice is outside the allowed size.",
        "INVALID_UPLOAD_PART"
      );
    const result = matchesAttempt(
      draftId,
      attemptId,
      await request(
        `${upload(params.draftId, params.attemptId)}/parts/${params.partNumber}?${queryString(query)}`,
        DatasetUploadAttemptStatusResponseSchema,
        {
          method: "PUT",
          body: bytes,
          headers: { "Content-Type": "application/octet-stream" },
          signal,
        },
        300_000
      )
    );
    if (result.contentId !== query.expectedContentId) incompatible();
    return result;
  },
};
