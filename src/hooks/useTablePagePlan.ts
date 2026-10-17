"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  parseTablePageSnapshot,
  subscribeTablePagePlans,
  tablePagePlanSnapshot,
} from "@/lib/datasets/dataset-table-page-commands";

export function useTablePagePlan(actorId: string | undefined, draftId: string) {
  const snapshot = useSyncExternalStore(
    subscribeTablePagePlans,
    () => (actorId ? tablePagePlanSnapshot(actorId, draftId) : ""),
    () => ""
  );
  return useMemo(() => {
    try {
      return {
        plan: actorId
          ? parseTablePageSnapshot(snapshot, actorId, draftId)
          : null,
        error: "",
      };
    } catch {
      return {
        plan: null,
        error:
          "This browser could not recover your retained table page. Changes are paused to protect those answers.",
      };
    }
  }, [snapshot, actorId, draftId]);
}
