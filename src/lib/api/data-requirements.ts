import { API_BASE_URL } from "@/constants/api.constants";
import type {
  DataRequirementReceipt,
  DataRequirementSubmission,
} from "@/types/data-requirement.types";

export const submitSupplierDataRequirement = async (
  body: DataRequirementSubmission
): Promise<DataRequirementReceipt> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  const response = await fetch(
    `${API_BASE_URL}/api/v1/supplier/data-requirements`,
    {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    }
  ).finally(() => clearTimeout(timeout));
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(
      payload?.error?.message ||
        "We could not submit the requirement. Please try again."
    ) as Error & { code?: string; status?: number };
    error.code = payload?.error?.code;
    error.status = response.status;
    throw error;
  }
  if (!payload?.data)
    throw new Error("The server returned an invalid response.");
  return payload.data;
};
