import { z } from "zod";
import {
  DatasetReferenceColumnPreviewSchema,
  DatasetTableReferenceDefinitionSchema,
  DatasetTableReferencesMutationResponseSchema,
} from "@kuinbee/dataset-preparation-contracts";
import {
  DatasetReferenceCommandSchema,
  type DatasetReferenceCommand,
} from "./dataset-upload-commands";
import { TablePageBasisSchema } from "./dataset-table-page-commands";
import { validateReferenceAcknowledgement } from "./dataset-reference-acknowledgement";
const id = z.string().cuid();
export const ReferenceSubjectSchema = z
  .object({
    memberId: id,
    tableId: id,
    component: z.enum(["FULL", "SAMPLE"]),
    fileName: z.string().max(300),
    tableName: z.string().max(300),
  })
  .strict();
export const ReferencePlanSchema = z
  .object({
    version: z.literal(1),
    planId: z.string().uuid(),
    actorId: id,
    draftId: id,
    basis: TablePageBasisSchema,
    subject: ReferenceSubjectSchema,
    referenceId: id.nullable(),
    definition: DatasetTableReferenceDefinitionSchema,
    labels: z.array(DatasetReferenceColumnPreviewSchema).max(32),
    targetLabel: z.string().max(1_024).nullable(),
    phase: z.enum(["EDITING", "PENDING", "ACKNOWLEDGED"]),
    command: DatasetReferenceCommandSchema.nullable(),
    acknowledgement: DatasetTableReferencesMutationResponseSchema.nullable(),
  })
  .strict()
  .superRefine((plan, context) => {
    const problem = () =>
      context.addIssue({
        code: "custom",
        message:
          "The retained reference must keep its exact account, Dataset, targets and command",
      });
    if (plan.draftId !== plan.basis.preparationId) problem();
    const selected = new Set(
      plan.definition.kind === "KEY"
        ? plan.definition.columnIds
        : plan.definition.kind === "JOIN"
          ? plan.definition.pairs.flatMap((pair) => [
              pair.sourceColumnId,
              pair.targetColumnId,
            ])
          : []
    );
    if (
      new Set(plan.labels.map((label) => label.id)).size !==
        plan.labels.length ||
      plan.labels.length !== selected.size ||
      plan.labels.some((label) => !selected.has(label.id))
    )
      problem();
    if (plan.phase === "EDITING") {
      if (plan.command || plan.acknowledgement) problem();
      return;
    }
    const command = plan.command;
    if (
      !command ||
      command.actorId !== plan.actorId ||
      command.draftId !== plan.draftId ||
      command.body.expectedContentId !== plan.basis.contentId ||
      command.body.expectedGeneration !== plan.basis.contentGeneration ||
      command.body.expectedPreparationGeneration !==
        plan.basis.preparationGeneration ||
      command.body.operations.length !== 1
    ) {
      problem();
      return;
    }
    const operation = command.body.operations[0];
    if (operation.operation === "REMOVE_REFERENCE") {
      if (operation.referenceId !== plan.referenceId) problem();
    } else if (
      operation.memberId !== plan.subject.memberId ||
      operation.tableId !== plan.subject.tableId ||
      (operation.referenceId ?? null) !== plan.referenceId ||
      JSON.stringify(operation.definition) !== JSON.stringify(plan.definition)
    )
      problem();
    if (
      (plan.phase === "PENDING" && plan.acknowledgement) ||
      (plan.phase === "ACKNOWLEDGED" && !plan.acknowledgement)
    )
      problem();
    if (plan.acknowledgement)
      try {
        validateReferenceAcknowledgement(command.body, plan.acknowledgement);
      } catch {
        problem();
      }
  });
export type ReferencePlan = z.infer<typeof ReferencePlanSchema>;
export type ReferenceSubject = z.infer<typeof ReferenceSubjectSchema>;
const prefix = "kuinbee:dataset-reference:v1:";
const key = (actorId: string, draftId: string) =>
  prefix + id.parse(actorId) + ":" + id.parse(draftId);
const size = (text: string) => new TextEncoder().encode(text).length;
const listeners = new Set<() => void>();
const changed = () => listeners.forEach((listener) => listener());
export function subscribeReferencePlans(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}
export function referencePlanSnapshot(actorId: string, draftId: string) {
  try {
    return sessionStorage.getItem(key(actorId, draftId)) ?? "";
  } catch {
    return "!";
  }
}
export function parseReferencePlan(
  snapshot: string,
  actorId: string,
  draftId: string
): ReferencePlan | null {
  if (!snapshot) return null;
  if (size(snapshot) > 65_536)
    throw new Error("The retained reference is too large");
  const plan = ReferencePlanSchema.parse(JSON.parse(snapshot));
  if (plan.actorId !== actorId || plan.draftId !== draftId)
    throw new Error("The reference belongs to another account or Dataset");
  return plan;
}
export const readReferencePlan = (actorId: string, draftId: string) =>
  parseReferencePlan(referencePlanSnapshot(actorId, draftId), actorId, draftId);
function persistReferencePlan(
  supplied: ReferencePlan,
  resolution?: {
    command: DatasetReferenceCommand;
    phase: "EDITING" | "ACKNOWLEDGED";
  }
): ReferencePlan {
  const plan = ReferencePlanSchema.parse(supplied),
    raw = JSON.stringify(plan),
    ownKey = key(plan.actorId, plan.draftId);
  const previous = readReferencePlan(plan.actorId, plan.draftId);
  if (previous && previous.planId !== plan.planId)
    throw new Error(
      "Finish or explicitly discard the retained reference first"
    );
  if (previous?.phase === "PENDING" && JSON.stringify(previous) !== raw) {
    if (
      !resolution ||
      resolution.phase !== plan.phase ||
      JSON.stringify(previous.command) !== JSON.stringify(resolution.command) ||
      JSON.stringify({
        ...plan,
        phase: previous.phase,
        command: previous.command,
        acknowledgement: previous.acknowledgement,
      }) !== JSON.stringify(previous)
    )
      throw new Error("Confirm the exact pending reference request first");
  }
  if (previous?.phase === "ACKNOWLEDGED" && JSON.stringify(previous) !== raw)
    throw new Error(
      "Close the confirmed reference before starting another edit"
    );
  let bytes = size(raw),
    count = 1;
  for (let index = 0; index < sessionStorage.length; index++) {
    const name = sessionStorage.key(index);
    if (
      name !== ownKey &&
      (name?.startsWith(prefix) ||
        name?.startsWith("kuinbee:dataset-table-page:v1:"))
    ) {
      bytes += size(sessionStorage.getItem(name) ?? "");
      count++;
    }
  }
  if (size(raw) > 65_536 || bytes > 4_194_304 || count > 32)
    throw new Error(
      "This browser's retained-answer space is full; your current answers remain open"
    );
  sessionStorage.setItem(ownKey, raw);
  if (sessionStorage.getItem(ownKey) !== raw)
    throw new Error("The reference answers could not be retained");
  changed();
  return plan;
}
export const storeReferencePlan = (supplied: ReferencePlan) =>
  persistReferencePlan(supplied);
export function clearReferencePlan(plan: ReferencePlan) {
  const current = readReferencePlan(plan.actorId, plan.draftId);
  if (!current) return;
  if (current.planId !== plan.planId || current.phase === "PENDING")
    throw new Error("Confirm the exact reference save before discarding it");
  sessionStorage.removeItem(key(plan.actorId, plan.draftId));
  if (sessionStorage.getItem(key(plan.actorId, plan.draftId)) !== null)
    throw new Error("The retained reference could not be cleared");
  changed();
}
function exactPlan(
  actorId: string | undefined,
  command: DatasetReferenceCommand
) {
  if (!actorId || actorId !== command.actorId)
    throw new Error(
      "Use the supplier account that started this reference save"
    );
  const plan = readReferencePlan(actorId, command.draftId);
  if (
    !plan?.command ||
    JSON.stringify(plan.command) !== JSON.stringify(command)
  )
    throw new Error(
      "The retained reference request changed; preserve its original answers"
    );
  return plan;
}
export function recordReferenceAcknowledgement(
  actorId: string | undefined,
  command: DatasetReferenceCommand,
  supplied: unknown
) {
  const plan = exactPlan(actorId, command);
  const acknowledgement = validateReferenceAcknowledgement(
    command.body,
    supplied
  );
  return persistReferencePlan(
    { ...plan, phase: "ACKNOWLEDGED", acknowledgement },
    { command, phase: "ACKNOWLEDGED" }
  );
}
export function recordReferenceRejection(
  actorId: string | undefined,
  command: DatasetReferenceCommand
) {
  const plan = exactPlan(actorId, command);
  return persistReferencePlan(
    { ...plan, phase: "EDITING", command: null, acknowledgement: null },
    { command, phase: "EDITING" }
  );
}
