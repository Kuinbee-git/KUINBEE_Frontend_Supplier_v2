"use client";

import { DATASET_PREPARATION_ENABLED } from "@/lib/dataset-preparation-environment";
import { DatasetPreparationScreen } from "@/components/datasets/preparation/DatasetPreparationScreen";
import { DatasetCreationRoute } from "@/components/datasets/DatasetCreationRoute";
import { DashboardErrorState } from "@/components/dashboard";
import { DatasetWorkspace } from "@/components/datasets/workspace";

export default function CreateDatasetPage() {
  if (!DATASET_PREPARATION_ENABLED)
    return (
      <DatasetWorkspace>
        <DashboardErrorState
          title="Dataset creation is unavailable"
          message="Please reload the page or try again later."
          onRetry={() => window.location.reload()}
        />
      </DatasetWorkspace>
    );
  if (
    DATASET_PREPARATION_ENABLED &&
    process.env.NEXT_PUBLIC_APP_ENV === "production"
  )
    return <DatasetCreationRoute />;

  return <DatasetPreparationScreen />;
}
