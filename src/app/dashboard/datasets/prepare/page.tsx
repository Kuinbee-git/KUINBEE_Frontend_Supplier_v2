import { notFound, redirect } from "next/navigation";
import { DATASET_PREPARATION_ENABLED } from "@/lib/dataset-preparation-environment";

export default function SavedDatasetDraftsPage() {
  if (!DATASET_PREPARATION_ENABLED) notFound();
  redirect("/dashboard/datasets");
}
