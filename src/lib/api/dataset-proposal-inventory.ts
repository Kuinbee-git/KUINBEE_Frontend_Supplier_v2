import {
  DatasetSupplierProposalsQuerySchema,
  DatasetSupplierProposalsResponseSchema,
  type DatasetSupplierProposalsQuery,
} from "@kuinbee/dataset-preparation-contracts";
import {
  PreparationApiError,
  requestPreparationResource,
} from "./dataset-preparations";

export async function listDatasetProposalInventory(
  input: Partial<DatasetSupplierProposalsQuery>
) {
  const query = DatasetSupplierProposalsQuerySchema.parse(input);
  const parameters = new URLSearchParams();
  for (const [key, value] of Object.entries(query))
    if (value !== undefined) parameters.set(key, String(value));
  const result = await requestPreparationResource(
    `/api/v2/supplier/dataset-proposals?${parameters}`,
    DatasetSupplierProposalsResponseSchema,
    { cache: "no-store", signal: AbortSignal.timeout(30_000) }
  );
  if (
    result.page !== query.page ||
    result.pageSize !== query.pageSize ||
    (query.scope === "SUBMITTED" &&
      result.items.some(
        (item) =>
          !item.verificationStatus || item.verificationStatus === "PENDING"
      ))
  ) {
    throw new PreparationApiError(
      "The proposal inventory changed. Refresh before continuing.",
      "INCOMPATIBLE_RESPONSE"
    );
  }
  return result;
}
