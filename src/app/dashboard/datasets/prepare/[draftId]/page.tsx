import { notFound, redirect } from "next/navigation";
import { DatasetPreparationIdParamsSchema } from "@kuinbee/dataset-preparation-contracts";
import { DATASET_PREPARATION_ENABLED } from "@/lib/dataset-preparation-environment";

export default async function PrepareDatasetPage({
  params,
}: {
  params: Promise<{ draftId: string }>;
}) {
  if (!DATASET_PREPARATION_ENABLED) notFound();
  const { draftId } = await params;
  if (
    draftId !== "new" &&
    !DatasetPreparationIdParamsSchema.safeParse({ draftId }).success
  )
    notFound();
  redirect(
    draftId === "new"
      ? "/dashboard/datasets/create"
      : `/dashboard/datasets/drafts/${draftId}`
  );
}
