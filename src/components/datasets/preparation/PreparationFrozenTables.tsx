"use client";
import type { DatasetPrivateTableMetadataQuery } from "@kuinbee/dataset-preparation-contracts";
import { datasetTableMetadataApi } from "@/lib/api/dataset-table-metadata";
import { useAuthStore } from "@/store/auth.store";
import { TableMetadataPanel } from "./PreparationTableMetadataPanel";
import { ReferenceViews } from "./PreparationReferenceViews";
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
    <div className="min-w-0 space-y-4">
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
      <ReferenceViews
        sourceKey={JSON.stringify([actorId, datasetId, context])}
        enabled={enabled}
        load={(filters, signal) =>
          datasetTableMetadataApi.references(
            datasetId,
            { ...filters, ...context, limit: filters.limit },
            signal
          )
        }
      />
    </div>
  );
}
