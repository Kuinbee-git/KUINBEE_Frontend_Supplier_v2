import { z } from "zod";
import {
  DatasetPricingSaveBodySchema,
  DatasetPricingSubmitBodySchema,
  DatasetProposalSubmitBodySchema,
} from "@kuinbee/dataset-preparation-contracts";
import { datasetWorkflowApi } from "@/lib/api/dataset-workflow";
import { PreparationApiError } from "@/lib/api/dataset-preparations";

const id = z.string().cuid();
export const DatasetWorkflowCommandSchema = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("PRICING_SAVE"),
      draftId: id,
      body: DatasetPricingSaveBodySchema,
    })
    .strict(),
  z
    .object({
      kind: z.literal("PRICING_SUBMIT"),
      draftId: id,
      body: DatasetPricingSubmitBodySchema,
    })
    .strict(),
  z
    .object({
      kind: z.literal("SUBMIT"),
      draftId: id,
      body: DatasetProposalSubmitBodySchema,
    })
    .strict(),
]);
export type DatasetWorkflowCommand = z.infer<
  typeof DatasetWorkflowCommandSchema
>;
const key = (draftId: string) =>
  `kuinbee:dataset-workflow-request:v1:${id.parse(draftId)}`;
const maximumBytes = 8_192;
const serialize = (command: DatasetWorkflowCommand) =>
  JSON.stringify(DatasetWorkflowCommandSchema.parse(command));

// One unresolved command per owned draft and browser tab. This contains only
// canonical pricing values and exact Save/Submit preconditions, never credentials,
// local file bytes, provider locations or inspection evidence. Reads never write.
export function readDatasetWorkflowCommand(
  draftId: string
): DatasetWorkflowCommand | null {
  const value = sessionStorage.getItem(key(draftId));
  if (value === null) return null;
  if (new TextEncoder().encode(value).length > maximumBytes)
    throw new Error("Stored proposal request is too large");
  const parsed = DatasetWorkflowCommandSchema.parse(JSON.parse(value));
  if (parsed.draftId !== draftId)
    throw new Error("Stored proposal request belongs to another draft");
  return parsed;
}
export function storeDatasetWorkflowCommand(command: DatasetWorkflowCommand) {
  const parsed = DatasetWorkflowCommandSchema.parse(command);
  const value = serialize(parsed);
  if (new TextEncoder().encode(value).length > maximumBytes)
    throw new Error("Proposal request is too large");
  const previous = readDatasetWorkflowCommand(parsed.draftId);
  if (previous && serialize(previous) !== value)
    throw new Error("Confirm the previous proposal request first");
  sessionStorage.setItem(key(parsed.draftId), value);
  if (sessionStorage.getItem(key(parsed.draftId)) !== value)
    throw new Error("Proposal request could not be retained");
}
export function clearDatasetWorkflowCommand(command: DatasetWorkflowCommand) {
  const parsed = DatasetWorkflowCommandSchema.parse(command);
  const previous = readDatasetWorkflowCommand(parsed.draftId);
  if (previous && serialize(previous) !== serialize(parsed))
    throw new Error("Stored proposal request changed");
  sessionStorage.removeItem(key(parsed.draftId));
  if (sessionStorage.getItem(key(parsed.draftId)) !== null)
    throw new Error("Proposal request could not be cleared");
}
const definiteWorkflowConflicts = new Set([
  "DRAFT_CHANGED",
  "PRICING_CHANGED",
  "INVALID_STATE",
  "SAMPLE_DISPLAY_ONLY",
  "SUBMISSION_NOT_READY",
  "DEPENDENCIES_CHANGED",
  "IDEMPOTENCY_CONFLICT",
  "CONTENT_CAPACITY_EXCEEDED",
  "INVALID_EDIT_CONTEXT",
  "MANAGED_IDENTITY_READ_ONLY",
  "MANAGED_MATERIAL_CHANGE_DEFERRED",
]);
// Owned workflow handlers check the immutable receipt before these domain
// conflicts. Auth, scope/gates, parsing and rate limits can reject a retry before
// receipt lookup, so even a 4xx response cannot disprove an earlier lost write.
// Unknown responses retain the same command rather than inventing a new UUID.
export const ambiguousDatasetWorkflowFailure = (failure: unknown) =>
  !(failure instanceof PreparationApiError) ||
  failure.status !== 409 ||
  !definiteWorkflowConflicts.has(failure.code);

// An explicit dispatch sends exactly the command already retained for replay.
// ACK handling, refresh and clearing belong to the caller; none occurs implicitly.
export function dispatchDatasetWorkflowCommand(
  command: DatasetWorkflowCommand,
  signal?: AbortSignal
) {
  const parsed = DatasetWorkflowCommandSchema.parse(command);
  const previous = readDatasetWorkflowCommand(parsed.draftId);
  if (!previous || serialize(previous) !== serialize(parsed))
    throw new Error("Retain the exact proposal request before sending it");
  switch (parsed.kind) {
    case "PRICING_SAVE":
      return datasetWorkflowApi.savePricing(
        parsed.draftId,
        parsed.body,
        signal
      );
    case "PRICING_SUBMIT":
      return datasetWorkflowApi.submitPricing(
        parsed.draftId,
        parsed.body,
        signal
      );
    case "SUBMIT":
      return datasetWorkflowApi.submit(parsed.draftId, parsed.body, signal);
  }
}
