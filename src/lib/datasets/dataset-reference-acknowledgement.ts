import {
  DatasetTableReferencesMutationResponseSchema,
  type DatasetTableReferencesMutationBody,
  type DatasetTableReferencesMutationResponse,
} from "@kuinbee/dataset-preparation-contracts";
import { PreparationApiError } from "@/lib/api/dataset-preparations";

export function validateReferenceAcknowledgement(
  body: DatasetTableReferencesMutationBody,
  supplied: unknown
): DatasetTableReferencesMutationResponse {
  const parsed =
    DatasetTableReferencesMutationResponseSchema.safeParse(supplied);
  const incompatible = (): never => {
    throw new PreparationApiError(
      "The reference acknowledgement changed. Your answers are retained; confirm the original save before continuing.",
      "INCOMPATIBLE_RESPONSE"
    );
  };
  if (!parsed.success) incompatible();
  const ack = parsed.data!;
  const copied = body.editContext?.mode === "INITIALIZE";
  if (
    ack.requestId !== body.requestId ||
    ack.results.length !== body.operations.length ||
    ack.generation !== (copied ? 2 : body.expectedGeneration + 1) ||
    ack.preparationGeneration !==
      body.expectedPreparationGeneration + (copied ? 1 : 0) ||
    (copied
      ? ack.contentId === body.expectedContentId
      : ack.contentId !== body.expectedContentId)
  )
    incompatible();
  const members = new Map<string, string>(),
    used = new Set<string>();
  const member = (before: string, after: string) => {
    if (!copied) {
      if (before !== after) incompatible();
      return;
    }
    if (
      before === after ||
      (members.has(before) && members.get(before) !== after) ||
      [...members].some(([other, value]) => other !== before && value === after)
    )
      incompatible();
    members.set(before, after);
  };
  for (const [index, operation] of body.operations.entries()) {
    const result = ack.results[index];
    if (
      result.index !== index ||
      result.operation !== operation.operation ||
      used.has(result.referenceId)
    )
      incompatible();
    used.add(result.referenceId);
    if (
      operation.referenceId &&
      (copied
        ? result.referenceId === operation.referenceId
        : result.referenceId !== operation.referenceId)
    )
      incompatible();
    if (operation.operation === "PUT_REFERENCE") {
      if (result.tableId !== operation.tableId) incompatible();
      member(operation.memberId, result.memberId);
      const target =
        operation.definition.kind === "KEY"
          ? null
          : operation.definition.target;
      if (!target) {
        if (result.targetMemberId !== null) incompatible();
      } else {
        if (!result.targetMemberId) incompatible();
        member(target.memberId, result.targetMemberId!);
      }
    }
  }
  return ack;
}
