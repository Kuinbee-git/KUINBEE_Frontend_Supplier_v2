"use client";

import { useId } from "react";
import { useQuery, type QueryKey } from "@tanstack/react-query";

/**
 * Coordinate a component-owned request with the query lifecycle. These loaders
 * also populate editable local state, so their completion is instance-scoped:
 * another mounted form must not reuse a cached completion without loading data.
 * Refreshes remain explicit; focus/reconnect must not overwrite unsaved edits.
 */
export function useComponentRequest(
  request: () => Promise<unknown>,
  inputs: QueryKey,
  enabled = true
) {
  const instance = useId();
  useQuery({
    queryKey: ["component-request", instance, ...inputs],
    queryFn: async () => {
      await request();
      return true;
    },
    enabled,
    retry: false,
    gcTime: 0,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}
