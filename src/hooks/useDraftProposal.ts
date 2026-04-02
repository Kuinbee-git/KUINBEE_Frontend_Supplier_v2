'use client';

import { useCallback } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DraftProposalData = Record<string, any>;

const DRAFT_KEY = 'kuinbee_proposal_draft';
const DRAFT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export function useDraftProposal() {
  /**
   * Load draft from localStorage
   */
  const loadDraft = useCallback((): Partial<DraftProposalData> | null => {
    if (typeof window === 'undefined') return null;
    
    try {
      const draftStr = localStorage.getItem(DRAFT_KEY);
      if (!draftStr) return null;
      
      const draft = JSON.parse(draftStr);
      
      // Check TTL expiration
      if (draft._timestamp && Date.now() - draft._timestamp > DRAFT_TTL_MS) {
        localStorage.removeItem(DRAFT_KEY);
        return null;
      }
      
      return draft;
    } catch (error) {
      console.error('Failed to load draft:', error);
      return null;
    }
  }, []);

  /*
   * Save draft to localStorage
   */
  const saveDraft = useCallback((data: Partial<DraftProposalData>) => {
    if (typeof window === 'undefined') return;
    
    try {
      const dataWithTimestamp = {
        ...data,
        _timestamp: Date.now(),
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(dataWithTimestamp));
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  }, []);

  /**
   * Clear draft from localStorage
   */
  const clearDraft = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch (error) {
      console.error('Failed to clear draft:', error);
    }
  }, []);

  /**
   * Check if a draft exists
   */
  const hasDraft = useCallback((): boolean => {
    if (typeof window === 'undefined') return false;
    
    try {
      return localStorage.getItem(DRAFT_KEY) !== null;
    } catch (error) {
      console.error('Failed to check draft:', error);
      return false;
    }
  }, []);

  return {
    loadDraft,
    saveDraft,
    clearDraft,
    hasDraft,
  };
}
