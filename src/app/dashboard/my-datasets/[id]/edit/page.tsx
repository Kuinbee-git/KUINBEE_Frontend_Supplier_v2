"use client";

import { useParams } from "next/navigation";
import { DelistedDatasetEdit } from "@/components/datasets";
import { DatasetContractRoute } from "@/components/datasets/DatasetContractRoute";

export default function DelistedDatasetEditPage() {
  const params = useParams();
  const datasetId = params.id as string;

  return (
    <DatasetContractRoute datasetId={datasetId}>
      <DelistedDatasetEdit datasetId={datasetId} />
    </DatasetContractRoute>
  );
}
