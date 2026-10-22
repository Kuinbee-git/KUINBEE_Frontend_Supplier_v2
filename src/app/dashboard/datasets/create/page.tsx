"use client";

import { CreateDataset } from "@/components/datasets";
import { useThemeStore } from "@/store";
import { DATASET_PREPARATION_ENABLED } from "@/lib/dataset-preparation-environment";
import { DatasetPreparationScreen } from "@/components/datasets/preparation/DatasetPreparationScreen";
import { DatasetCreationRoute } from "@/components/datasets/DatasetCreationRoute";

export default function CreateDatasetPage() {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  if (
    DATASET_PREPARATION_ENABLED &&
    process.env.NEXT_PUBLIC_APP_ENV === "production"
  )
    return <DatasetCreationRoute isDark={isDark} />;

  return DATASET_PREPARATION_ENABLED ? (
    <DatasetPreparationScreen />
  ) : (
    <CreateDataset isDark={isDark} />
  );
}
