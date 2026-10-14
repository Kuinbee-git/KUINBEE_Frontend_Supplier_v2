import { notFound } from "next/navigation";
import { DatasetPreparationIdParamsSchema } from "@kuinbee/dataset-preparation-contracts";
import { DATASET_PREPARATION_ENABLED } from "@/lib/dataset-preparation-environment";
import { DatasetPreparationScreen } from "@/components/datasets/preparation/DatasetPreparationScreen";

export default async function DraftProposalPage({
  params,
}: {
  params: Promise<{ draftId: string }>;
}) {
  if (!DATASET_PREPARATION_ENABLED) notFound();
  const { draftId } = await params;
  if (!DatasetPreparationIdParamsSchema.safeParse({ draftId }).success)
    notFound();
  return <DatasetPreparationScreen draftId={draftId} />;
}
