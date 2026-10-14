import { notFound } from "next/navigation";
import { DATASET_PREPARATION_ENABLED } from "@/lib/dataset-preparation-environment";
import { DatasetPreparationList } from "@/components/datasets/preparation/DatasetPreparationList";

export default function SavedDatasetDraftsPage() {
  if (!DATASET_PREPARATION_ENABLED) notFound();
  return <DatasetPreparationList />;
}
