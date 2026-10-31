import { notFound } from "next/navigation";
import Link from "next/link";
import { DashboardButton } from "@/components/dashboard";
import {
  DatasetPageHeader,
  DatasetWorkspace,
} from "@/components/datasets/workspace/DatasetWorkspace";
import { DATASET_PREPARATION_ENABLED } from "@/lib/dataset-preparation-environment";
import { DatasetGuideTour } from "@/components/datasets/guide/DatasetGuideTour";
import { DatasetGuideReference } from "@/components/datasets/guide/DatasetGuideReference";
export default function DatasetProposalGuidePage() {
  if (!DATASET_PREPARATION_ENABLED) notFound();
  return (
    <DatasetWorkspace className="dataset-proposal-workspace max-w-[80rem]">
      <DatasetPageHeader
        title="Dataset proposal guide"
        description="One screen at a time. Follow the example, then prepare your own collections."
        action={
          <DashboardButton asChild variant="outline">
            <Link href="/dashboard/datasets">Back to my drafts</Link>
          </DashboardButton>
        }
      />
      <DatasetGuideTour>
        <DatasetGuideReference />
      </DatasetGuideTour>
    </DatasetWorkspace>
  );
}
