"use client";
import type { DatasetPrivateTableMetadataQuery } from "@kuinbee/dataset-preparation-contracts";
import { datasetTableMetadataApi } from "@/lib/api/dataset-table-metadata";
import { useAuthStore } from "@/store/auth.store";
import { TableMetadataPanel } from "./PreparationTableMetadataPanel";
export function PreparationFrozenTables({
  datasetId,
  context,
  enabled = true,
}: {
  datasetId: string;
  context: Omit<DatasetPrivateTableMetadataQuery, "limit">;
  enabled?: boolean;
}) {
  const actorId = useAuthStore((state) => state.user?.id);
  return (
    <TableMetadataPanel
      sourceKey={JSON.stringify([actorId, datasetId, context])}
      enabled={enabled}
      load={(filters, signal) =>
        datasetTableMetadataApi.page(
          datasetId,
          { ...filters, ...context, limit: filters.limit },
          signal
        )
      }
    />
  );
}
