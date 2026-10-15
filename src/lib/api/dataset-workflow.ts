import {
  DatasetPreparationIdParamsSchema,
  DatasetWorkflowResponseSchema,
  DatasetProposalReadinessQuerySchema,
  DatasetProposalReadinessResponseSchema,
  DatasetPricingSaveBodySchema,
  DatasetPricingSubmitBodySchema,
  DatasetProposalSubmitBodySchema,
  DatasetSubmissionResponseSchema,
  DatasetFrozenInventoryQuerySchema,
  DatasetFrozenInventoryResponseSchema,
  DatasetEditContextQuerySchema,
  DatasetEditContextResponseSchema,
  DatasetEditBaseResponseSchema,
  type DatasetPricingSaveBody,
  type DatasetPricingSubmitBody,
  type DatasetProposalSubmitBody,
  type DatasetFrozenInventoryQuery,
  type DatasetWorkflowResponse,
  type DatasetWorkflowState,
} from "@kuinbee/dataset-preparation-contracts";
import {
  PreparationApiError,
  requestPreparationResource,
} from "./dataset-preparations";

export type DatasetProposalReadiness = ReturnType<
  typeof DatasetProposalReadinessResponseSchema.parse
>;
export type DatasetSubmission = ReturnType<
  typeof DatasetSubmissionResponseSchema.parse
>;
export type DatasetFrozenInventory = ReturnType<
  typeof DatasetFrozenInventoryResponseSchema.parse
>;
export type DatasetEditContext = ReturnType<
  typeof DatasetEditContextResponseSchema.parse
>;
export type DatasetEditBase = ReturnType<
  typeof DatasetEditBaseResponseSchema.parse
>;
export type DatasetEditOperation = DatasetEditContext["operation"];

const base = (draftId: string) => {
  const { draftId: id } = DatasetPreparationIdParamsSchema.parse({ draftId });
  return `/api/v2/supplier/dataset-drafts/${encodeURIComponent(id)}`;
};
function incompatible(): never {
  throw new PreparationApiError(
    "The proposal response does not match the saved draft. Keep your input and refresh before continuing.",
    "INCOMPATIBLE_RESPONSE"
  );
}
const queryString = (query: object) => {
  const parameters = new URLSearchParams();
  for (const [key, value] of Object.entries(query))
    if (value !== undefined) parameters.set(key, String(value));
  return parameters.toString();
};
async function request<T>(
  path: string,
  schema: { parse(value: unknown): T },
  options: RequestInit = {}
): Promise<T> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  options.signal?.addEventListener("abort", abort, { once: true });
  if (options.signal?.aborted) abort();
  const timer = setTimeout(abort, 30_000);
  try {
    return await requestPreparationResource(path, schema, {
      ...options,
      cache: "no-store",
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener("abort", abort);
  }
}
function matchesDraft(draftId: string, state: DatasetWorkflowState) {
  if (state.datasetId !== draftId) incompatible();
  return state;
}
type PricingBody = DatasetPricingSaveBody | DatasetPricingSubmitBody;
function validateEditContext(body: PricingBody) {
  if (
    body.editContext?.mode === "INITIALIZE" &&
    body.editContext.expectedWorkflowRevision !== body.expectedWorkflowRevision
  )
    throw new PreparationApiError(
      "The correction context changed. Refresh before saving pricing.",
      "INVALID_EDIT_CONTEXT"
    );
}
function matchesPricingReceipt(
  draftId: string,
  body: PricingBody,
  result: DatasetWorkflowResponse
) {
  const state = matchesDraft(draftId, result.state);
  const initialized = body.editContext?.mode === "INITIALIZE";
  if (
    result.requestId !== body.requestId ||
    state.preparationGeneration !==
      body.expectedPreparationGeneration + (initialized ? 1 : 0) ||
    state.workflowRevision !==
      body.expectedWorkflowRevision + (initialized ? 2 : 1) ||
    !state.pricing
  )
    incompatible();
  const pricing = state.pricing;
  // A managed correction can create a separate pricing draft. Ordinary initial
  // and independent pricing writes retain their exact existing pricing ID.
  if (
    pricing.id === body.expectedPricingReference.id
      ? pricing.revision !== body.expectedPricingReference.revision + 1
      : !body.editContext || pricing.revision !== 1
  )
    incompatible();
  if (
    body.editContext?.mode === "EXISTING_DRAFT" &&
    state.activeContentId !== body.editContext.expectedContentId
  )
    incompatible();
  if (
    body.editContext?.mode === "INITIALIZE" &&
    (!state.activeContentId ||
      state.activeContentId === body.editContext?.expectedBaseContentId)
  )
    incompatible();
  return result;
}
const normalizedPrice = (price: string | null) => {
  if (price === null) return null;
  const [whole, fractional = ""] = price.split(".");
  return `${whole}.${fractional.padEnd(2, "0")}`;
};

// Each write returns its immutable acknowledgement. A replay may be older than
// today's workflow state; callers refresh separately after retaining the receipt.
// No method admits files, retries commands, publishes or changes action ownership.
export const datasetWorkflowApi = {
  async state(draftId: string, signal?: AbortSignal) {
    const result = await request(
      `${base(draftId)}/workflow`,
      DatasetWorkflowResponseSchema,
      { signal }
    );
    matchesDraft(draftId, result.state);
    if (result.requestId !== undefined) incompatible();
    return result;
  },
  async readiness(
    draftId: string,
    expectedPreparationGeneration: number,
    signal?: AbortSignal
  ) {
    const query = DatasetProposalReadinessQuerySchema.parse({
      expectedPreparationGeneration,
    });
    const result = await request(
      `${base(draftId)}/readiness?${queryString(query)}`,
      DatasetProposalReadinessResponseSchema,
      { signal }
    );
    matchesDraft(draftId, result.state);
    if (
      result.state.preparationGeneration !== expectedPreparationGeneration ||
      (result.contentId === null) !== (result.contentGeneration === null) ||
      (result.contentId !== null &&
        result.contentId !== result.state.activeContentId) ||
      result.canSubmit !== (result.issues.length === 0) ||
      (result.canSubmit &&
        (!result.contentId ||
          result.contentGeneration === null ||
          !result.dependencyFingerprint ||
          !result.state.pricing))
    )
      incompatible();
    return result;
  },
  async savePricing(
    draftId: string,
    supplied: DatasetPricingSaveBody,
    signal?: AbortSignal
  ) {
    const body = DatasetPricingSaveBodySchema.parse(supplied);
    validateEditContext(body);
    const result = matchesPricingReceipt(
      draftId,
      body,
      await request(`${base(draftId)}/pricing`, DatasetWorkflowResponseSchema, {
        method: "PUT",
        body: JSON.stringify(body),
        signal,
      })
    );
    const pricing = result.state.pricing!;
    if (
      pricing.isPaid !== body.changes.isPaid ||
      normalizedPrice(pricing.price) !== normalizedPrice(body.changes.price) ||
      pricing.currency !== body.changes.currency ||
      !["DRAFT", "CHANGES_REQUESTED", "REJECTED"].includes(pricing.status)
    )
      incompatible();
    return result;
  },
  async submitPricing(
    draftId: string,
    supplied: DatasetPricingSubmitBody,
    signal?: AbortSignal
  ) {
    const body = DatasetPricingSubmitBodySchema.parse(supplied);
    validateEditContext(body);
    const result = matchesPricingReceipt(
      draftId,
      body,
      await request(
        `${base(draftId)}/pricing/submit`,
        DatasetWorkflowResponseSchema,
        { method: "POST", body: JSON.stringify(body), signal }
      )
    );
    if (!["SUBMITTED", "RESUBMITTED"].includes(result.state.pricing!.status))
      incompatible();
    return result;
  },
  async submit(
    draftId: string,
    supplied: DatasetProposalSubmitBody,
    signal?: AbortSignal
  ) {
    const body = DatasetProposalSubmitBodySchema.parse(supplied);
    const result = await request(
      `${base(draftId)}/submit`,
      DatasetWorkflowResponseSchema,
      { method: "POST", body: JSON.stringify(body), signal }
    );
    const state = matchesDraft(draftId, result.state);
    if (
      result.requestId !== body.requestId ||
      state.preparationGeneration !== body.expectedPreparationGeneration ||
      state.workflowRevision !== body.expectedWorkflowRevision + 1 ||
      state.reviewedContentId !== body.expectedContentId ||
      state.activeContentId !== null ||
      state.pricing?.id !== body.expectedPricingReference.id ||
      state.pricing.revision !== body.expectedPricingReference.revision ||
      state.datasetStatus !== "SUBMITTED" ||
      !["SUBMITTED", "RESUBMITTED"].includes(state.verificationStatus)
    )
      incompatible();
    return result;
  },
  async submission(draftId: string, signal?: AbortSignal) {
    const result = await request(
      `${base(draftId)}/submission`,
      DatasetSubmissionResponseSchema,
      { signal }
    );
    matchesDraft(draftId, result.state);
    if (
      result.state.reviewedContentId !== result.submittedContent.id ||
      (result.submittedContent.uploadChoice === "SAMPLE_ONLY" &&
        result.submittedContent.pricingAtSubmission.isPaid)
    )
      incompatible();
    return result;
  },
  async inventory(
    draftId: string,
    supplied: DatasetFrozenInventoryQuery,
    signal?: AbortSignal
  ) {
    const query = DatasetFrozenInventoryQuerySchema.parse(supplied);
    const result = await request(
      `${base(draftId)}/submission/inventory?${queryString(query)}`,
      DatasetFrozenInventoryResponseSchema,
      { signal }
    );
    if (
      result.datasetId !== draftId ||
      result.workflowRevision !== query.expectedWorkflowRevision ||
      result.contentId !== query.contentId ||
      result.contentGeneration !== query.contentGeneration ||
      result.inventory !== query.inventory ||
      result.component !== (query.component ?? null) ||
      result.items.length > query.limit ||
      result.total < result.items.length ||
      result.items.some(
        (item, index) =>
          (query.afterId !== undefined && item.id <= query.afterId) ||
          (index > 0 && item.id <= result.items[index - 1].id)
      )
    )
      incompatible();
    return result;
  },
  async editContext(
    draftId: string,
    operation: DatasetEditOperation,
    signal?: AbortSignal
  ) {
    const query = DatasetEditContextQuerySchema.parse({ operation });
    const result = await request(
      `${base(draftId)}/edit-context?${queryString(query)}`,
      DatasetEditContextResponseSchema,
      { signal }
    );
    if (result.datasetId !== draftId || result.operation !== operation)
      incompatible();
    return result;
  },
  async editBase(
    draftId: string,
    operation: DatasetEditOperation,
    signal?: AbortSignal
  ) {
    const query = DatasetEditContextQuerySchema.parse({ operation });
    const result = await request(
      `${base(draftId)}/edit-base?${queryString(query)}`,
      DatasetEditBaseResponseSchema,
      { signal }
    );
    if (
      result.context.datasetId !== draftId ||
      result.context.operation !== operation
    )
      incompatible();
    return result;
  },
};
