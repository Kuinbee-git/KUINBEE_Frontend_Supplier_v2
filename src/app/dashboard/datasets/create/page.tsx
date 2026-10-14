"use client";

import { CreateDataset } from "@/components/datasets";
import { useThemeStore } from "@/store";
import { DATASET_PREPARATION_ENABLED } from "@/lib/dataset-preparation-environment";
import { DatasetPreparationScreen } from "@/components/datasets/preparation/DatasetPreparationScreen";

export default function CreateDatasetPage() {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  return DATASET_PREPARATION_ENABLED ? (
    <DatasetPreparationScreen />
  ) : (
    <CreateDataset isDark={isDark} />
  );
}
