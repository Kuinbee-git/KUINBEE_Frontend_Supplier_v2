import { PreparationApiError } from "@/lib/api/dataset-preparations";

// Guidance never changes receipt/retry classification or assumes that an
// unlinked file, a retained snapshot or an uncertain request has been removed.
export function datasetActionError(
  failure: unknown,
  fallback = "The Dataset request could not be completed."
) {
  const message = failure instanceof Error ? failure.message : fallback;
  if (!(failure instanceof PreparationApiError)) return message;
  const hint: Record<string, string> = {
    CONTENT_CAPACITY_EXCEEDED:
      "This information or edit-history limit is separate from file storage. Keep this page open to preserve unsaved answers; contact support if the limit persists.",
    CONTENT_RECONCILIATION_REQUIRED:
      "Keep your unsaved table and reference answers. Contact support before retrying; removing uploaded files will not repair this metadata issue.",
    DATASET_CAPACITY_EXCEEDED:
      "The 5 GB Dataset allowance includes retained files and upload reservations. Cancel incomplete uploads or delete eligible unselected stored files, then wait for backend cleanup to release space.",
    SUPPLIER_CAPACITY_EXCEEDED:
      "The 100 GB supplier allowance includes retained files and reservations across Datasets. Space is released only after the backend completes eligible cleanup.",
    OBJECT_HISTORY_PROTECTED:
      "This stored file protects a review or an existing purchase. Keep it and contact support for a permitted correction.",
    CAPACITY_RECONCILIATION_REQUIRED:
      "Kuinbee must reconcile storage before this action can continue. Refresh file status; contact support if reconciliation remains pending.",
    RECOVERY_RECONCILIATION_REQUIRED:
      "Kuinbee must reconcile file security and storage. Refresh file status before continuing.",
    RECOVERY_EPOCH_CHANGED:
      "Recovery authority changed. Refresh the exact file status before starting another action; keep any original unconfirmed request.",
  };
  return Object.hasOwn(hint, failure.code)
    ? `${message} ${hint[failure.code]}`
    : message;
}
