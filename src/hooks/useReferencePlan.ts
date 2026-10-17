"use client";
import { useMemo, useSyncExternalStore } from "react";
import {
  parseReferencePlan,
  referencePlanSnapshot,
  subscribeReferencePlans,
} from "@/lib/datasets/dataset-reference-plan";
export function useReferencePlan(actorId: string | undefined, draftId: string) {
  const snapshot = useSyncExternalStore(
    subscribeReferencePlans,
    () => (actorId ? referencePlanSnapshot(actorId, draftId) : ""),
    () => ""
  );
  return useMemo(() => {
    try {
      return {
        plan: actorId ? parseReferencePlan(snapshot, actorId, draftId) : null,
        error: "",
      };
    } catch {
      return {
        plan: null,
        error:
          "This browser could not recover its reference answers. Changes are paused to protect them.",
      };
    }
  }, [snapshot, actorId, draftId]);
}
