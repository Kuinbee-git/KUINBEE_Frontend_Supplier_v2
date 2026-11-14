"use client";

import { useEffect, useState } from "react";
import type { DatasetCreationContextResponse } from "@kuinbee/dataset-preparation-contracts";
import { preparationApi } from "@/lib/api/dataset-preparations";
import {
  DashboardErrorState,
  DashboardLoadingState,
} from "@/components/dashboard";
import { DatasetWorkspace } from "./workspace";
import { DatasetPreparationScreen } from "./preparation/DatasetPreparationScreen";

// The backend confirms current approval; no response can reopen the old creator.
export function DatasetCreationRoute() {
  const [context, setContext] = useState<DatasetCreationContextResponse | null>(
    null
  );
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    preparationApi.creationContext(controller.signal).then(
      (value) => {
        if (!controller.signal.aborted) setContext(value);
      },
      (failure) => {
        if (!controller.signal.aborted)
          setError(
            failure instanceof Error
              ? failure.message
              : "Proposal creation could not be loaded. Please retry."
          );
      }
    );
    return () => controller.abort();
  }, [attempt]);

  if (context?.workflow === "CONTENT") return <DatasetPreparationScreen />;
  const message =
    error ||
    (context?.workflow === "LEGACY"
      ? "The dataset creator has been updated. Reload the page and try again."
      : "");
  return (
    <DatasetWorkspace>
      {message ? (
        <DashboardErrorState
          title="Proposal creation could not be loaded"
          message={message}
          onRetry={() => {
            setContext(null);
            setError("");
            setAttempt((value) => value + 1);
          }}
        />
      ) : (
        <DashboardLoadingState label="Opening proposal creation" />
      )}
    </DatasetWorkspace>
  );
}
