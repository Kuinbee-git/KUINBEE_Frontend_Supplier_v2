import { z } from "zod";
import {
  DatasetTableDescriptionsMutationBodySchema,
  DatasetTableDescriptionsMutationResponseSchema,
  type DatasetTableDescriptionsMutationBody,
} from "@kuinbee/dataset-preparation-contracts";
import { PreparationApiError } from "@/lib/api/dataset-preparations";

const id = z.string().cuid();
const generation = z.number().int().min(0).max(2_147_483_647);
export const TablePageBasisSchema = z
  .object({
    preparationId: id,
    preparationGeneration: generation,
    contentId: id,
    contentGeneration: generation,
  })
  .strict();
export type TablePageBasis = z.infer<typeof TablePageBasisSchema>;
export type TablePageOperation =
  DatasetTableDescriptionsMutationBody["operations"][number];
const TableCommandSchema = z
  .object({
    kind: z.literal("TABLES"),
    actorId: id.optional(),
    draftId: id,
    body: DatasetTableDescriptionsMutationBodySchema,
  })
  .strict();
export type TablePageCommand = z.infer<typeof TableCommandSchema>;
const receiptSchema = z
  .object({
    command: TableCommandSchema,
    response: DatasetTableDescriptionsMutationResponseSchema,
  })
  .strict();
const subjectSchema = z
  .object({
    component: z.enum(["FULL", "SAMPLE"]),
    fileName: z.string().max(300),
    tableName: z.string().max(300),
    columns: z
      .array(
        z
          .object({
            id,
            position: z.number().int().min(1).max(1024),
            name: z.string().max(120).nullable(),
          })
          .strict()
      )
      .max(50),
  })
  .strict();
export type TablePageSubject = z.infer<typeof subjectSchema>;
const planSchema = z
  .object({
    version: z.literal(1),
    actorId: id,
    draftId: id,
    planId: z.string().uuid(),
    subject: subjectSchema,
    expectedBasis: TablePageBasisSchema,
    totalOperations: z.number().int().min(1).max(50),
    remaining: z
      .array(
        DatasetTableDescriptionsMutationBodySchema.shape.operations.element
      )
      .max(50),
    command: TableCommandSchema.nullable(),
    lastAcknowledgement: receiptSchema.nullable(),
    lastRejection: TableCommandSchema.nullable(),
  })
  .strict();
export type TablePagePlan = z.infer<typeof planSchema>;
export const TABLE_PAGE_COMMAND_BYTES = 32_768;
export const TABLE_PAGE_PLAN_BYTES = 524_288;
export const TABLE_PAGE_SESSION_BYTES = 4_194_304;
const prefix = "kuinbee:dataset-table-page:v1:";
const key = (actorId: string, draftId: string) =>
  prefix + id.parse(actorId) + ":" + id.parse(draftId);
const encode = (value: unknown) => JSON.stringify(value);
const size = (value: string) => new TextEncoder().encode(value).length;
const equal = (a: unknown, b: unknown) => encode(a) === encode(b);
const listeners = new Set<() => void>();
const changed = () => listeners.forEach((listener) => listener());
export function subscribeTablePagePlans(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}
export function tablePagePlanSnapshot(actorId: string, draftId: string) {
  try {
    return sessionStorage.getItem(key(actorId, draftId)) ?? "";
  } catch {
    return "STORAGE_UNAVAILABLE";
  }
}
const unavailable = (): never => {
  throw new Error(
    "This browser could not retain the table page safely. Your answers are kept; table writes are paused."
  );
};
function parsePlan(value: unknown): TablePagePlan {
  const plan = planSchema.parse(value);
  if (
    plan.draftId !== plan.expectedBasis.preparationId ||
    plan.remaining.length > plan.totalOperations
  )
    return unavailable();
  const targets = plan.remaining.map((operation) =>
    [
      operation.operation,
      operation.memberId,
      operation.tableId,
      operation.operation === "SET_COLUMN" ? operation.columnId : null,
    ].join(":")
  );
  const columns = new Set(plan.subject.columns.map((column) => column.id));
  if (
    columns.size !== plan.subject.columns.length ||
    new Set(plan.subject.columns.map((column) => column.position)).size !==
      columns.size ||
    plan.remaining.some(
      (operation) =>
        operation.operation === "SET_COLUMN" && !columns.has(operation.columnId)
    )
  )
    return unavailable();
  if (
    new Set(targets).size !== targets.length ||
    new Set(
      plan.remaining.map(
        (operation) => operation.memberId + ":" + operation.tableId
      )
    ).size > 1
  )
    return unavailable();
  if (
    plan.command &&
    (plan.command.actorId !== plan.actorId ||
      plan.command.draftId !== plan.draftId ||
      plan.command.body.expectedContentId !== plan.expectedBasis.contentId ||
      plan.command.body.expectedGeneration !==
        plan.expectedBasis.contentGeneration ||
      plan.command.body.expectedPreparationGeneration !==
        plan.expectedBasis.preparationGeneration ||
      !equal(
        plan.command.body.operations,
        plan.remaining.slice(0, plan.command.body.operations.length)
      ) ||
      size(encode(plan.command)) > TABLE_PAGE_COMMAND_BYTES)
  )
    return unavailable();
  if (!plan.remaining.length && (!plan.lastAcknowledgement || plan.command))
    return unavailable();
  if (plan.lastAcknowledgement) {
    const { command, response } = plan.lastAcknowledgement;
    validateTableDescriptionAcknowledgement(command.body, response);
    if (
      command.actorId !== plan.actorId ||
      command.draftId !== plan.draftId ||
      response.contentId !== plan.expectedBasis.contentId ||
      response.generation !== plan.expectedBasis.contentGeneration ||
      response.preparationGeneration !==
        plan.expectedBasis.preparationGeneration ||
      command.body.operations.length + plan.remaining.length >
        plan.totalOperations ||
      (plan.command && plan.command.body.requestId === command.body.requestId)
    )
      return unavailable();
  }
  if (
    plan.lastRejection &&
    (plan.lastRejection.actorId !== plan.actorId ||
      plan.lastRejection.draftId !== plan.draftId ||
      plan.lastRejection.body.expectedContentId !==
        plan.expectedBasis.contentId ||
      plan.lastRejection.body.expectedGeneration !==
        plan.expectedBasis.contentGeneration ||
      plan.lastRejection.body.expectedPreparationGeneration !==
        plan.expectedBasis.preparationGeneration ||
      !equal(
        plan.lastRejection.body.operations,
        plan.remaining.slice(0, plan.lastRejection.body.operations.length)
      ))
  )
    return unavailable();
  return plan;
}
export function parseTablePageSnapshot(
  snapshot: string,
  actorId: string,
  draftId: string
) {
  if (!snapshot) return null;
  if (size(snapshot) > TABLE_PAGE_PLAN_BYTES) return unavailable();
  const plan = parsePlan(JSON.parse(snapshot));
  if (plan.actorId !== actorId || plan.draftId !== draftId)
    return unavailable();
  return plan;
}
export function readTablePagePlan(
  actorId: string,
  draftId: string
): TablePagePlan | null {
  return parseTablePageSnapshot(
    tablePagePlanSnapshot(actorId, draftId),
    actorId,
    draftId
  );
}
export function storeTablePagePlan(supplied: TablePagePlan): TablePagePlan {
  const plan = parsePlan(supplied),
    encoded = encode(plan),
    ownKey = key(plan.actorId, plan.draftId);
  if (size(encoded) > TABLE_PAGE_PLAN_BYTES) return unavailable();
  const previous = readTablePagePlan(plan.actorId, plan.draftId);
  if (
    previous &&
    previous.planId !== plan.planId &&
    (previous.remaining.length || previous.command)
  )
    return unavailable();
  let bytes = size(encoded),
    count = 1;
  for (let index = 0; index < sessionStorage.length; index++) {
    const name = sessionStorage.key(index);
    if (
      (name?.startsWith(prefix) ||
        name?.startsWith("kuinbee:dataset-reference:v1:")) &&
      name !== ownKey
    ) {
      bytes += size(sessionStorage.getItem(name) ?? "");
      count++;
    }
  }
  if (bytes > TABLE_PAGE_SESSION_BYTES || count > 32) return unavailable();
  try {
    sessionStorage.setItem(ownKey, encoded);
    if (sessionStorage.getItem(ownKey) !== encoded) return unavailable();
  } catch {
    return unavailable();
  }
  changed();
  return plan;
}
export function clearTablePagePlan(plan: TablePagePlan) {
  const current = readTablePagePlan(plan.actorId, plan.draftId);
  if (!current) return;
  if (current.planId !== plan.planId) return unavailable();
  if (current.command)
    throw new Error(
      "Confirm the current table request before discarding its remaining page answers."
    );
  sessionStorage.removeItem(key(plan.actorId, plan.draftId));
  if (sessionStorage.getItem(key(plan.actorId, plan.draftId)) !== null)
    return unavailable();
  changed();
}
export function tablePageBasisMatches(a: TablePageBasis, b: TablePageBasis) {
  return equal(TablePageBasisSchema.parse(a), TablePageBasisSchema.parse(b));
}
export function validateTableDescriptionAcknowledgement(
  body: DatasetTableDescriptionsMutationBody,
  value: unknown
) {
  const ack = DatasetTableDescriptionsMutationResponseSchema.parse(value),
    initial = body.editContext?.mode === "INITIALIZE";
  const copiedMembers = new Map<string, string>();
  if (
    ack.requestId !== body.requestId ||
    ack.results.length !== body.operations.length ||
    (initial
      ? ack.contentId === body.expectedContentId ||
        ack.generation !== 2 ||
        ack.preparationGeneration !== body.expectedPreparationGeneration + 1
      : ack.contentId !== body.expectedContentId ||
        ack.generation !== body.expectedGeneration + 1 ||
        ack.preparationGeneration !== body.expectedPreparationGeneration) ||
    ack.results.some((result, index) => {
      const operation = body.operations[index]!;
      const previous = copiedMembers.get(operation.memberId);
      copiedMembers.set(operation.memberId, result.memberId);
      return (
        result.operation !== operation.operation ||
        result.tableId !== operation.tableId ||
        result.columnId !==
          (operation.operation === "SET_COLUMN" ? operation.columnId : null) ||
        (previous !== undefined && previous !== result.memberId) ||
        (!initial && result.memberId !== operation.memberId)
      );
    }) ||
    new Set(copiedMembers.values()).size !== copiedMembers.size
  )
    throw new PreparationApiError(
      "The table acknowledgement changed. Keep your answers and confirm the original request.",
      "INCOMPATIBLE_RESPONSE"
    );
  return ack;
}
export type TableCommandBuilder = (
  operations: TablePageOperation[],
  requestId: string
) => TablePageCommand;
export function prepareTablePageCommand(
  plan: TablePagePlan,
  basis: TablePageBasis,
  build: TableCommandBuilder
) {
  if (
    !tablePageBasisMatches(plan.expectedBasis, basis) ||
    plan.command ||
    !plan.remaining.length
  )
    throw new Error(
      "Refresh the exact saved table context before continuing this page."
    );
  const requestId = crypto.randomUUID();
  // Prove that even the last operation can fit before sending any prefix.
  for (const operation of plan.remaining) {
    const single = TableCommandSchema.parse(build([operation], requestId));
    if (size(encode(single)) > TABLE_PAGE_COMMAND_BYTES)
      throw new Error(
        "This column change exceeds the bounded request size. Your page answers are retained."
      );
  }
  let command: TablePageCommand | null = null;
  for (let count = 1; count <= plan.remaining.length; count++) {
    const candidate = TableCommandSchema.parse(
      build(plan.remaining.slice(0, count), requestId)
    );
    if (size(encode(candidate)) > TABLE_PAGE_COMMAND_BYTES) break;
    command = candidate;
  }
  if (!command)
    throw new Error(
      "This column change exceeds the bounded request size. Your page answers are retained."
    );
  return storeTablePagePlan({ ...plan, command, lastRejection: null });
}
export function recordTablePageRejection(
  actorId: string | undefined,
  supplied: TablePageCommand
) {
  if (!actorId) return null;
  const command = TableCommandSchema.parse(supplied),
    plan = readTablePagePlan(actorId, command.draftId);
  if (!plan) return null;
  if (plan.lastRejection && equal(plan.lastRejection, command)) return plan;
  if (!plan.command || !equal(plan.command, command)) return unavailable();
  return storeTablePagePlan({ ...plan, command: null, lastRejection: command });
}
export function beginTablePagePlan(
  actorId: string,
  basis: TablePageBasis,
  operations: TablePageOperation[],
  build: TableCommandBuilder,
  subject: TablePageSubject
) {
  const remaining =
    DatasetTableDescriptionsMutationBodySchema.shape.operations.parse(
      operations
    );
  const plan = parsePlan({
    version: 1,
    actorId,
    draftId: basis.preparationId,
    planId: crypto.randomUUID(),
    subject,
    expectedBasis: basis,
    totalOperations: remaining.length,
    remaining,
    command: null,
    lastAcknowledgement: null,
    lastRejection: null,
  });
  return prepareTablePageCommand(plan, basis, build);
}
// Called before the shared command journal clears an ACK. Persist unsent page
// answers independently; a reload can replay the same known UUID after any crash.
export function recordTablePageAcknowledgement(
  actorId: string | undefined,
  supplied: TablePageCommand,
  value: unknown
) {
  if (!actorId) return null;
  const command = TableCommandSchema.parse(supplied),
    plan = readTablePagePlan(actorId, command.draftId);
  if (!plan) return null;
  const response = validateTableDescriptionAcknowledgement(command.body, value);
  if (
    plan.lastAcknowledgement?.command.body.requestId === command.body.requestId
  ) {
    if (!equal(plan.lastAcknowledgement, { command, response }))
      return unavailable();
    return plan;
  }
  if (!plan.command || !equal(plan.command, command)) return unavailable();
  const mapping = new Map(
    command.body.operations.map((operation, index) => [
      operation.memberId,
      response.results[index]!.memberId,
    ])
  );
  const remaining = plan.remaining
    .slice(command.body.operations.length)
    .map((operation) => ({
      ...operation,
      memberId: mapping.get(operation.memberId) ?? operation.memberId,
    }));
  return storeTablePagePlan({
    ...plan,
    remaining,
    command: null,
    lastRejection: null,
    lastAcknowledgement: { command, response },
    expectedBasis: {
      preparationId: plan.draftId,
      preparationGeneration: response.preparationGeneration,
      contentId: response.contentId,
      contentGeneration: response.generation,
    },
  });
}
