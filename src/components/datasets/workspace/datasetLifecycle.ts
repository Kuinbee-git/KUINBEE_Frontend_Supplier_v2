import type {
  DatasetStatus,
  DatasetUploadStatus,
  VerificationStatus,
} from "@/types/dataset-proposal.types";

const EDITABLE_PROPOSAL_STATES = new Set<VerificationStatus>([
  "PENDING",
  "CHANGES_REQUESTED",
]);

export function isProposalEditable(
  status: VerificationStatus | null | undefined
) {
  return Boolean(status && EDITABLE_PROPOSAL_STATES.has(status));
}

export function isProposalSubmittable(
  status: VerificationStatus | null | undefined
) {
  return isProposalEditable(status);
}

export function isProposalLocked(
  status: VerificationStatus | null | undefined
) {
  return (
    status === "SUBMITTED" ||
    status === "RESUBMITTED" ||
    status === "UNDER_REVIEW"
  );
}

export function isProposalTerminal(
  status: VerificationStatus | null | undefined
) {
  return status === "VERIFIED" || status === "REJECTED";
}

export function isUploadReady(
  status: DatasetUploadStatus | string | null | undefined
) {
  return status === "UPLOADED";
}

export function canPublishDataset(
  datasetStatus: DatasetStatus,
  verificationStatus: VerificationStatus | null | undefined
) {
  return (
    verificationStatus === "VERIFIED" &&
    (datasetStatus === "VERIFIED" || datasetStatus === "DELISTED")
  );
}

export function canChangeDatasetVisibility(datasetStatus: DatasetStatus) {
  return datasetStatus === "PUBLISHED";
}

export function canDelistDataset(datasetStatus: DatasetStatus) {
  return datasetStatus === "PUBLISHED";
}

export function canArchiveDataset(datasetStatus: DatasetStatus) {
  return datasetStatus === "PUBLISHED";
}

export function canEditDatasetUpdate(
  datasetStatus: DatasetStatus,
  verificationStatus: VerificationStatus | null | undefined
) {
  return (
    (datasetStatus === "DELISTED" &&
      (verificationStatus === "PENDING" ||
        verificationStatus === "VERIFIED")) ||
    (datasetStatus === "SUBMITTED" &&
      verificationStatus === "CHANGES_REQUESTED")
  );
}

export function canSubmitDatasetUpdate(
  datasetStatus: DatasetStatus,
  verificationStatus: VerificationStatus | null | undefined
) {
  return canEditDatasetUpdate(datasetStatus, verificationStatus);
}
