"use client";

import { useMemo, useSyncExternalStore } from "react";

type RestoredDraft<T> = { data: T; restored: boolean };

function createSessionDraftStore<T extends { clientRequestId: string }>(
  key: string,
  ttl: number,
  empty: () => T
) {
  let snapshot: RestoredDraft<T> | null = null;
  return {
    getSnapshot: () => snapshot,
    subscribe: (notify: () => void) => {
      if (!snapshot) {
        const fallback = { ...empty(), clientRequestId: crypto.randomUUID() };
        snapshot = { data: fallback, restored: false };
        try {
          const raw = sessionStorage.getItem(key);
          if (raw) {
            const saved = JSON.parse(raw);
            const age = Date.now() - saved.savedAt;
            if (
              saved.version === 1 &&
              age >= 0 &&
              age < ttl &&
              saved.data &&
              typeof saved.data === "object"
            ) {
              snapshot = {
                data: { ...fallback, ...saved.data },
                restored: true,
              };
            } else {
              sessionStorage.removeItem(key);
            }
          }
        } catch {
          // Storage is optional; blocked, expired, or invalid drafts start fresh.
        }
        notify();
      }
      return () => {};
    },
  };
}

// Read browser storage when subscribing, after hydration. The cached snapshot
// prevents repeated JSON parsing or new request IDs during rendering/StrictMode.
export function useSessionDraft<T extends { clientRequestId: string }>(
  key: string,
  ttl: number,
  empty: () => T
): RestoredDraft<T> | null {
  const store = useMemo(
    () => createSessionDraftStore(key, ttl, empty),
    [key, ttl, empty]
  );
  return useSyncExternalStore(store.subscribe, store.getSnapshot, () => null);
}
