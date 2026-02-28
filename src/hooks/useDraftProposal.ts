'use client';

import { useCallback } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DraftProposalData = Record<string, any>;

const DRAFT_KEY = 'kuinbee_proposal_draft';

export function useDraftProposal() {
  /**
   * Load draft from localStorage
   */
  const loadDraft = useCallback((): Partial<DraftProposalData> | null => {
    if (typeof window === 'undefined') return null;
    
    try {
      const draft = localStorage.getItem(DRAFT_KEY);
      return draft ? JSON.parse(draft) : null;
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
      localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
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
