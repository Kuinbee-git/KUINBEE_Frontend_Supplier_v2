"use client";
import { useCallback, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { DatasetPreparationIdParamsSchema } from "@kuinbee/dataset-preparation-contracts";
import { DATASET_PREPARATION_ENABLED } from "@/lib/dataset-preparation-environment";
import { datasetWorkflowApi } from "@/lib/api/dataset-workflow";
import { PreparationApiError } from "@/lib/api/dataset-preparations";
import { useComponentRequest } from "@/hooks/useComponentRequest";
import {
  DashboardErrorState,
  DashboardLoadingState,
} from "@/components/dashboard";
import { DatasetWorkspace } from "./workspace";

// Existing bookmarks choose the authoritative content editor. A failed read is
// never interpreted as permission to open an old mutation form.
export function DatasetContractRoute({
  datasetId,
  children,
}: {
  datasetId: string;
  children: ReactNode;
}) {
  if (
    !DATASET_PREPARATION_ENABLED ||
    !DatasetPreparationIdParamsSchema.safeParse({ draftId: datasetId }).success
  )
    return children;
  return (
    <ResolveDatasetContract key={datasetId} datasetId={datasetId}>
      {children}
    </ResolveDatasetContract>
  );
}
function ResolveDatasetContract({
  datasetId,
  children,
}: {
  datasetId: string;
  children: ReactNode;
}) {
  const router = useRouter(),
    [legacy, setLegacy] = useState(false),
    [error, setError] = useState("");
  const load = useCallback(async () => {
    setError("");
    try {
      await datasetWorkflowApi.state(datasetId);
      router.replace(`/dashboard/datasets/drafts/${datasetId}`);
    } catch (failure) {
      if (failure instanceof PreparationApiError && failure.status === 404)
        setLegacy(true);
      else
        setError(
          failure instanceof Error
            ? failure.message
            : "The saved proposal could not be loaded."
        );
    }
  }, [datasetId, router]);
  useComponentRequest(load, [datasetId]);
  if (legacy) return children;
  return (
    <DatasetWorkspace>
      {error ? (
        <DashboardErrorState
          title="Proposal could not be loaded"
          message={error}
          onRetry={() => void load()}
        />
      ) : (
        <DashboardLoadingState label="Opening your saved proposal" />
      )}
    </DatasetWorkspace>
  );
}
