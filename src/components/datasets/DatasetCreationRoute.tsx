"use client";

import { useEffect, useState } from "react";
import type { DatasetCreationContextResponse } from "@kuinbee/dataset-preparation-contracts";
import { preparationApi } from "@/lib/api/dataset-preparations";
import {
  DashboardErrorState,
  DashboardLoadingState,
} from "@/components/dashboard";
import { DatasetWorkspace } from "./workspace";
import { CreateDataset } from "./CreateDataset";
import { DatasetPreparationScreen } from "./preparation/DatasetPreparationScreen";

// Production adoption is per supplier. Keep the existing single creation route
// and use the backend's permanent writer authority to choose its editor. Neither
// a timeout nor a malformed/failed read authorizes a legacy fallback.
export function DatasetCreationRoute({ isDark }: { isDark: boolean }) {
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
  if (context?.workflow === "LEGACY") return <CreateDataset isDark={isDark} />;
  return (
    <DatasetWorkspace>
      {error ? (
        <DashboardErrorState
          title="Proposal creation could not be loaded"
          message={error}
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
