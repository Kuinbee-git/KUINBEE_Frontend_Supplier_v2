"use client";

import { useState, useMemo, useRef } from "react";
import {
  submitProposal,
  submitProposalPricing,
} from "@/lib/api/dataset-proposals";
import {
  isProposalSubmittable,
  isUploadReady,
} from "@/components/datasets/workspace";
import { toast } from "sonner";
import type {
  ProposalDetailsResponse,
  DatasetPricingVersion,
} from "@/types/dataset-proposal.types";

interface UseSubmitProposalOptions {
  proposal: ProposalDetailsResponse;
  pricingData: DatasetPricingVersion | null;
  onRefresh?: () => void;
}

export function useSubmitProposal({
  proposal,
  pricingData,
  onRefresh,
}: UseSubmitProposalOptions) {
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const submissionInFlight = useRef(false);

  const missingPrerequisites = useMemo(() => {
    const missing: string[] = [];

    if (
      !proposal.currentUpload ||
      !isUploadReady(proposal.currentUpload.status)
    ) {
      missing.push("File upload");
    }
    if (!proposal.aboutDatasetInfo) {
      missing.push("About Dataset information");
    }
    if (!proposal.dataFormatInfo) {
      missing.push("Data Format information");
    }
    if (!proposal.features || proposal.features.length === 0) {
      missing.push("At least one feature/column");
    }
    if (!pricingData) {
      missing.push("Pricing configuration");
    } else if (pricingData.isPaid && pricingData.price === null) {
      missing.push("Paid dataset price");
    }

    return missing;
  }, [
    pricingData,
    proposal.currentUpload,
    proposal.aboutDatasetInfo,
    proposal.dataFormatInfo,
    proposal.features,
  ]);

  const getErrorMessage = (error: unknown): string => {
    const apiError =
      error && typeof error === "object"
        ? (error as {
            code?: string;
            data?: { code?: string };
            message?: string;
          })
        : null;
    const errorCode = apiError?.data?.code || apiError?.code;

    const errorMessages: Record<string, string> = {
      NO_UPLOAD:
        "No file has been uploaded. Please upload a dataset file before submitting.",
      UPLOAD_NOT_READY:
        "The uploaded file is not ready. Please wait for the upload to complete.",
      ABOUT_INFO_REQUIRED:
        "About Dataset information is missing. Please fill in the About section.",
      DATA_FORMAT_REQUIRED:
        "Data Format information is missing. Please fill in the Data Format section.",
      FEATURES_REQUIRED:
        "At least one feature/column is required. Please define features in the Features section.",
      INVALID_STATE:
        "This proposal cannot be submitted in its current state. Please check the status.",
      NOT_FOUND: "Proposal not found. It may have been deleted.",
      FORBIDDEN: "You do not have permission to submit this proposal.",
      NETWORK_ERROR:
        "Unable to connect to the server. Please check your internet connection and try again.",
      TIMEOUT:
        "The request took too long. Please check your internet connection and try again.",
      OFFLINE:
        "You appear to be offline. Please check your internet connection.",
    };

    if (errorCode && errorMessages[errorCode]) {
      return errorMessages[errorCode];
    }

    if (
      apiError?.message?.includes("Failed to fetch") ||
      apiError?.message?.includes("Network")
    ) {
      return "Unable to connect to the server. Please verify your internet connection is working and try again.";
    }

    return (
      apiError?.message ||
      "Failed to submit proposal. Please check your connection and try again."
    );
  };

  const handleSubmitForReview = () => {
    if (!isProposalSubmittable(proposal.verification.status)) {
      toast.error("This proposal is locked", {
        description:
          "Its review state changed. Refresh the page before trying again.",
      });
      return;
    }

    if (missingPrerequisites.length > 0) {
      toast.error("Cannot submit", {
        description: `Please complete: ${missingPrerequisites.join(", ")}`,
        duration: 5000,
      });
      return;
    }

    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = async () => {
    if (submissionInFlight.current || submitting) return;
    if (!isProposalSubmittable(proposal.verification.status)) {
      setShowConfirmModal(false);
      toast.error("This proposal is no longer submittable", {
        description: "Refresh the page to see its current review state.",
      });
      return;
    }

    submissionInFlight.current = true;
    setShowConfirmModal(false);
    setSubmitting(true);
    try {
      const pricingNeedsSubmission =
        pricingData &&
        ["DRAFT", "CHANGES_REQUESTED", "REJECTED"].includes(pricingData.status);

      if (pricingNeedsSubmission) {
        await submitProposalPricing(proposal.dataset.id);
      }

      await submitProposal(proposal.dataset.id);

      const action =
        proposal.verification.status === "PENDING"
          ? "submitted"
          : "resubmitted";
      const pricingMessage = pricingNeedsSubmission
        ? " along with your pricing"
        : "";

      toast.success(`Proposal ${action} successfully${pricingMessage}`, {
        description:
          "Your proposal has been sent to the admin review queue. You will receive a notification when the review is complete.",
      });

      onRefresh?.();
    } catch (error: unknown) {
      console.error("Failed to submit proposal:", error);
      toast.error("Failed to submit proposal", {
        description: getErrorMessage(error),
        duration: 6000,
      });
    } finally {
      submissionInFlight.current = false;
      setSubmitting(false);
    }
  };

  const handleCancelSubmit = () => {
    setShowConfirmModal(false);
  };

  return {
    submitting,
    showConfirmModal,
    missingPrerequisites,
    handleSubmitForReview,
    handleConfirmSubmit,
    handleCancelSubmit,
  };
}
