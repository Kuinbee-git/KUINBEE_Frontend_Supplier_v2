"use client";

import { useCallback } from "react";
import { useAuthStore } from "@/store";

export type DraftProposalData = Record<string, unknown>;

const DRAFT_KEY_PREFIX = "kuinbee_proposal_draft";
const DRAFT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export function useDraftProposal() {
  const userId = useAuthStore((state) => state.user?.id);
  const draftKey = userId ? `${DRAFT_KEY_PREFIX}:${userId}` : null;

  /**
   * Load draft from localStorage
   */
  const loadDraft = useCallback((): Partial<DraftProposalData> | null => {
    if (typeof window === "undefined" || !draftKey) return null;

    try {
      const draftStr = localStorage.getItem(draftKey);
      if (!draftStr) return null;

      const draft = JSON.parse(draftStr);

      // Check TTL expiration
      if (draft._timestamp && Date.now() - draft._timestamp > DRAFT_TTL_MS) {
        localStorage.removeItem(draftKey);
        return null;
      }

      return draft;
    } catch (error) {
      console.error("Failed to load draft:", error);
      return null;
    }
  }, [draftKey]);

  /*
   * Save draft to localStorage
   */
  const saveDraft = useCallback(
    (data: Partial<DraftProposalData>) => {
      if (typeof window === "undefined" || !draftKey) return;

      try {
        const dataWithTimestamp = {
          ...data,
          _timestamp: Date.now(),
        };
        localStorage.setItem(draftKey, JSON.stringify(dataWithTimestamp));
      } catch (error) {
        console.error("Failed to save draft:", error);
      }
    },
    [draftKey]
  );

  /**
   * Clear draft from localStorage
   */
  const clearDraft = useCallback(() => {
    if (typeof window === "undefined" || !draftKey) return;

    try {
      localStorage.removeItem(draftKey);
    } catch (error) {
      console.error("Failed to clear draft:", error);
    }
  }, [draftKey]);

  /**
   * Check if a draft exists
   */
  const hasDraft = useCallback((): boolean => {
    if (typeof window === "undefined" || !draftKey) return false;

    try {
      return localStorage.getItem(draftKey) !== null;
    } catch (error) {
      console.error("Failed to check draft:", error);
      return false;
    }
  }, [draftKey]);

  return {
    loadDraft,
    saveDraft,
    clearDraft,
    hasDraft,
    isDraftStorageReady: Boolean(draftKey),
  };
}
