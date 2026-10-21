import { z } from "zod";
import {
  DatasetPreparationCreateBodySchema,
  DatasetPreparationPatchBodySchema,
  DatasetPreparationMetadataSchema,
} from "@kuinbee/dataset-preparation-contracts";
import { PreparationApiError } from "@/lib/api/dataset-preparations";

const id = z.string().cuid();
export const PreparationSaveOperationSchema = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("create"),
      body: DatasetPreparationCreateBodySchema,
    })
    .strict(),
  z
    .object({
      kind: z.literal("patch"),
      id,
      body: DatasetPreparationPatchBodySchema,
    })
    .strict(),
]);
export type PreparationSaveOperation = z.infer<
  typeof PreparationSaveOperationSchema
>;
const recordSchema = z
  .object({
    version: z.literal(1),
    actorId: id,
    routeDraftId: id.nullable(),
    operation: PreparationSaveOperationSchema,
    metadata: DatasetPreparationMetadataSchema,
    baseline: DatasetPreparationMetadataSchema.nullable(),
  })
  .strict()
  .refine(
    (record) =>
      record.operation.kind === "create"
        ? record.routeDraftId === null
        : record.operation.id === record.routeDraftId,
    "The saved request must belong to this draft route"
  );
export type PreparationSaveRecord = z.infer<typeof recordSchema>;
const maximumBytes = 229_376;
const key = (actorId: string, routeDraftId?: string) =>
  `kuinbee:dataset-save:v1:${id.parse(actorId)}:${routeDraftId ? id.parse(routeDraftId) : "new"}`;
export function readPreparationSave(
  actorId: string,
  routeDraftId?: string
): PreparationSaveRecord | null {
  const text = sessionStorage.getItem(key(actorId, routeDraftId));
  if (text === null) return null;
  if (new TextEncoder().encode(text).length > maximumBytes)
    throw Error(
      "The retained draft save exceeds this browser's recovery budget."
    );
  const record = recordSchema.parse(JSON.parse(text));
  if (
    record.actorId !== actorId ||
    record.routeDraftId !== (routeDraftId ?? null)
  )
    throw Error("This draft save belongs to another account or route.");
  return record;
}
export function retainPreparationSave(
  actorId: string,
  routeDraftId: string | undefined,
  operation: PreparationSaveOperation,
  metadata: PreparationSaveRecord["metadata"],
  baseline: PreparationSaveRecord["baseline"]
) {
  const record = recordSchema.parse({
    version: 1,
    actorId,
    routeDraftId: routeDraftId ?? null,
    operation,
    metadata,
    baseline,
  });
  const value = JSON.stringify(record);
  if (new TextEncoder().encode(value).length > maximumBytes)
    throw Error(
      "This draft save is too large to retain safely. No request was sent."
    );
  const previous = readPreparationSave(actorId, routeDraftId);
  if (
    previous &&
    JSON.stringify(previous.operation) !== JSON.stringify(record.operation)
  )
    throw Error("Confirm the previous draft save before starting another.");
  sessionStorage.setItem(key(actorId, routeDraftId), value);
  if (sessionStorage.getItem(key(actorId, routeDraftId)) !== value)
    throw Error(
      "This browser could not retain the draft save. No request was sent."
    );
}
export function clearPreparationSave(
  actorId: string,
  routeDraftId: string | undefined,
  operation: PreparationSaveOperation
) {
  const previous = readPreparationSave(actorId, routeDraftId);
  if (
    previous &&
    JSON.stringify(previous.operation) !==
      JSON.stringify(PreparationSaveOperationSchema.parse(operation))
  )
    throw Error("The retained draft save changed.");
  sessionStorage.removeItem(key(actorId, routeDraftId));
  if (sessionStorage.getItem(key(actorId, routeDraftId)) !== null)
    throw Error("The acknowledged draft save could not be cleared.");
}
export const uncertainPreparationSave = (failure: unknown) =>
  !(failure instanceof PreparationApiError) ||
  [401, 403, 404, 429].includes(failure.status ?? 0) ||
  (failure.status ?? 0) >= 500 ||
  ["NETWORK_ERROR", "INCOMPATIBLE_RESPONSE"].includes(failure.code);
