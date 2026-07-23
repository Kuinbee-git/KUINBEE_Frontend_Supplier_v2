import type { DatasetStatus } from "@/types/dataset.types";
import type { VerificationStatus } from "@/types/dataset-proposal.types";

export function formatDatasetDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function getDatasetActionLabel(status: DatasetStatus) {
  switch (status) {
    case "VERIFIED":
      return "Publish";
    case "PUBLISHED":
      return "Manage";
    case "DELISTED":
      return "Review";
    default:
      return "View";
  }
}

export function getProposalActionLabel(status: VerificationStatus | null) {
  switch (status) {
    case "PENDING":
      return "Continue";
    case "CHANGES_REQUESTED":
      return "Revise";
    case "SUBMITTED":
    case "RESUBMITTED":
    case "UNDER_REVIEW":
      return "Track";
    case "REJECTED":
      return "Review decision";
    default:
      return "View";
  }
}
