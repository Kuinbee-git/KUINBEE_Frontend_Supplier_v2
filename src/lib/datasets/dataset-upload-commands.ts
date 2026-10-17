import { z } from "zod";
import {
  DatasetUploadAdmissionBodySchema,
  DatasetUploadActionBodySchema,
  DatasetUploadCancelBodySchema,
  DatasetFilesMutationBodySchema,
  DatasetTableDescriptionsMutationBodySchema,
} from "@kuinbee/dataset-preparation-contracts";
import { datasetIntakeApi } from "@/lib/api/dataset-intake";
import { datasetFilesApi } from "@/lib/api/dataset-files";
import { datasetTablesApi } from "@/lib/api/dataset-tables";
import { PreparationApiError } from "@/lib/api/dataset-preparations";

const id = z.string().cuid();
export const DatasetUploadCommandSchema = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("ADMIT"),
      draftId: id,
      body: DatasetUploadAdmissionBodySchema,
    })
    .strict(),
  z
    .object({
      kind: z.literal("FINALIZE"),
      draftId: id,
      attemptId: id,
      body: DatasetUploadActionBodySchema,
    })
    .strict(),
  z
    .object({
      kind: z.literal("CANCEL"),
      draftId: id,
      attemptId: id,
      body: DatasetUploadCancelBodySchema,
    })
    .strict(),
  z
    .object({
      kind: z.literal("REMOVE"),
      draftId: id,
      attemptId: id,
      body: DatasetUploadCancelBodySchema,
    })
    .strict(),
  z
    .object({
      kind: z.literal("TABLES"),
      actorId: id.optional(),
      draftId: id,
      body: DatasetTableDescriptionsMutationBodySchema,
    })
    .strict(),
  z
    .object({
      kind: z.literal("MEMBERS"),
      draftId: id,
      body: DatasetFilesMutationBodySchema,
    })
    .strict(),
]);
export type DatasetUploadCommand = z.infer<typeof DatasetUploadCommandSchema>;
const key = (draftId: string) =>
  `kuinbee:dataset-file-request:v1:${id.parse(draftId)}`;
const maximumBytes = 32_768;

// One bounded command per owned draft and browser tab. Store no local file
// bytes, credentials, storage locations or inspection evidence. Persist before
// dispatch so a reload/lost ACK replays the exact UUID and preconditions.
export function readDatasetUploadCommand(
  draftId: string
): DatasetUploadCommand | null {
  const value = sessionStorage.getItem(key(draftId));
  if (value === null) return null;
  if (new TextEncoder().encode(value).length > maximumBytes)
    throw new Error("Stored file request is too large");
  const parsed = DatasetUploadCommandSchema.parse(JSON.parse(value));
  if (parsed.draftId !== draftId)
    throw new Error("Stored file request belongs to another draft");
  return parsed;
}
export function storeDatasetUploadCommand(command: DatasetUploadCommand) {
  const parsed = DatasetUploadCommandSchema.parse(command);
  const value = JSON.stringify(parsed);
  if (new TextEncoder().encode(value).length > maximumBytes)
    throw new Error("File request is too large");
  const previous = readDatasetUploadCommand(parsed.draftId);
  if (previous && JSON.stringify(previous) !== value)
    throw new Error("Confirm the previous file request first");
  sessionStorage.setItem(key(parsed.draftId), value);
  if (sessionStorage.getItem(key(parsed.draftId)) !== value)
    throw new Error("File request could not be retained");
}
export function clearDatasetUploadCommand(command: DatasetUploadCommand) {
  const previous = readDatasetUploadCommand(command.draftId);
  if (
    previous &&
    JSON.stringify(previous) !==
      JSON.stringify(DatasetUploadCommandSchema.parse(command))
  )
    throw new Error("Stored file request changed");
  sessionStorage.removeItem(key(command.draftId));
  if (sessionStorage.getItem(key(command.draftId)) !== null)
    throw new Error("File request could not be cleared");
}
const definiteTableConflicts = new Set([
  "DRAFT_CHANGED",
  "INVALID_STATE",
  "IDEMPOTENCY_CONFLICT",
  "CONTENT_CAPACITY_EXCEEDED",
  "INVALID_EDIT_CONTEXT",
  "MANAGED_IDENTITY_READ_ONLY",
  "MANAGED_MATERIAL_CHANGE_DEFERRED",
]);
// Auth/scope/rate-limit failures can occur before immutable receipt lookup.
// They cannot disprove a prior lost write; retain the exact file command too.
export const ambiguousDatasetUploadFailure = (
  failure: unknown,
  kind?: DatasetUploadCommand["kind"]
) =>
  (failure instanceof PreparationApiError &&
    [401, 403, 404, 429].includes(failure.status ?? 0)) ||
  (kind === "TABLES"
    ? !(failure instanceof PreparationApiError) ||
      failure.status !== 409 ||
      !definiteTableConflicts.has(failure.code)
    : !(failure instanceof PreparationApiError) ||
      ["NETWORK_ERROR", "INCOMPATIBLE_RESPONSE"].includes(failure.code) ||
      (failure.status ?? 0) >= 500);

export function dispatchDatasetUploadCommand(command: DatasetUploadCommand) {
  switch (command.kind) {
    case "TABLES":
      return datasetTablesApi.mutate(command.draftId, command.body);
    case "ADMIT":
      return datasetIntakeApi.admit(command.draftId, command.body);
    case "FINALIZE":
      return datasetIntakeApi.finalize(
        command.draftId,
        command.attemptId,
        command.body
      );
    case "CANCEL":
      return datasetIntakeApi.cancel(
        command.draftId,
        command.attemptId,
        command.body
      );
    case "REMOVE":
      return datasetIntakeApi.remove(
        command.draftId,
        command.attemptId,
        command.body
      );
    case "MEMBERS":
      return datasetFilesApi.mutate(command.draftId, command.body);
  }
}
