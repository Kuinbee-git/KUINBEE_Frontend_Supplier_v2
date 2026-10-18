import {
  DatasetPublicationReadinessResponseSchema,
  DatasetPublicationResponseSchema,
  DatasetContentPublishBodySchema,
  DatasetContentLifecycleBodySchema,
  DatasetContentVisibilityBodySchema,
} from "@kuinbee/dataset-preparation-contracts";
import { z } from "zod";
import {
  PreparationApiError,
  requestPreparationResource,
} from "./dataset-preparations";

export type SupplierDatasetPublication = z.infer<
  typeof DatasetPublicationReadinessResponseSchema
>;
const identity = { actorId: z.string().cuid(), datasetId: z.string().cuid() };
export const DatasetPublicationCommandSchema = z.discriminatedUnion("kind", [
  z
    .object({
      ...identity,
      kind: z.literal("PUBLISH"),
      body: DatasetContentPublishBodySchema,
    })
    .strict(),
  z
    .object({
      ...identity,
      kind: z.literal("VISIBILITY"),
      body: DatasetContentVisibilityBodySchema,
    })
    .strict(),
  z
    .object({
      ...identity,
      kind: z.enum(["DELIST", "ARCHIVE"]),
      body: DatasetContentLifecycleBodySchema,
    })
    .strict(),
]);
export type DatasetPublicationCommand = z.infer<
  typeof DatasetPublicationCommandSchema
>;
const base = (id: string) =>
  `/api/v2/supplier/datasets/${encodeURIComponent(z.string().cuid().parse(id))}`;
export const datasetPublicationApi = {
  async get(datasetId: string) {
    const result = await requestPreparationResource(
      `${base(datasetId)}/publication`,
      DatasetPublicationReadinessResponseSchema,
      { cache: "no-store", signal: AbortSignal.timeout(30_000) }
    );
    if (result.state.datasetId !== datasetId)
      throw new PreparationApiError(
        "The Dataset changed. Refresh before continuing.",
        "INCOMPATIBLE_RESPONSE"
      );
    return result;
  },
  async send(input: DatasetPublicationCommand) {
    const command = DatasetPublicationCommandSchema.parse(input);
    const result = await requestPreparationResource(
      `${base(command.datasetId)}/${command.kind.toLowerCase()}`,
      DatasetPublicationResponseSchema,
      {
        method: command.kind === "VISIBILITY" ? "PATCH" : "POST",
        body: JSON.stringify(command.body),
        signal: AbortSignal.timeout(30_000),
      }
    );
    if (
      result.requestId !== command.body.requestId ||
      result.state.datasetId !== command.datasetId ||
      result.state.workflowRevision !==
        command.body.expectedWorkflowRevision + 1 ||
      (command.kind === "PUBLISH" &&
        (result.publication?.contentId !== command.body.expectedContentId ||
          result.state.datasetStatus !== "PUBLISHED")) ||
      (command.kind === "VISIBILITY" &&
        result.visibility !== command.body.visibility) ||
      (command.kind !== "PUBLISH" &&
        (result.state.publishedContentId !==
          command.body.expectedPublishedContentId ||
          (result.publication?.id ?? null) !==
            command.body.expectedPublicationId)) ||
      (command.kind === "DELIST" &&
        result.state.datasetStatus !== "DELISTED") ||
      (command.kind === "ARCHIVE" && result.state.datasetStatus !== "ARCHIVED")
    ) {
      throw new PreparationApiError(
        "The action could not be confirmed. Confirm the same request before continuing.",
        "INCOMPATIBLE_RESPONSE"
      );
    }
    return result;
  },
};
