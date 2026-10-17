"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type {
  DatasetTableReferenceViewsPage,
  DatasetTableReferenceView,
  DatasetPrivateTableReferenceViewsResponse,
} from "@kuinbee/dataset-preparation-contracts";
import { DashboardButton as Button } from "@/components/dashboard";

type Loaded = {
  page: DatasetTableReferenceViewsPage;
  targets?: DatasetPrivateTableReferenceViewsResponse["targets"];
};
export type ReferenceViewFilters = {
  afterId?: string;
  contentGeneration?: number;
  limit: number;
};
const words = (value: string | null) =>
  value === null ? "Not answered" : value.toLowerCase().replaceAll("_", " ");
type Column = Extract<
  DatasetTableReferenceView["definition"],
  { kind: "KEY" }
>["columns"][number];
const column = (value: Column) =>
  `Column ${value.position}: ${value.namePreview === null ? "No header" : value.namePreview || "Blank header"}${value.nameTruncated ? "…" : ""}`;
export function ReferenceViews({
  sourceKey,
  enabled = true,
  includeDictionary = true,
  load,
}: {
  sourceKey: string;
  enabled?: boolean;
  includeDictionary?: boolean;
  load: (filters: ReferenceViewFilters, signal: AbortSignal) => Promise<Loaded>;
}) {
  const [open, setOpen] = useState(false);
  const [navigation, setNavigation] = useState<{
    key: string;
    generation?: number;
    cursors: (string | undefined)[];
  }>({ key: sourceKey, cursors: [undefined] });
  const selected =
    navigation.key === sourceKey
      ? navigation
      : { key: sourceKey, cursors: [undefined] };
  const filters: ReferenceViewFilters = {
    contentGeneration: selected.generation,
    afterId: selected.cursors.at(-1),
    limit: 5,
  };
  const result = useQuery({
    queryKey: ["dataset-reference-views", sourceKey, filters],
    enabled: open && enabled,
    retry: false,
    gcTime: 0,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    queryFn: ({ signal }) => load(filters, signal),
  });
  const page = result.data?.page;
  const privateTarget = (id: string) =>
    result.data?.targets?.find((target) => target.id === id);
  const sourceLocation = (id: string) => {
    const locator = result.data?.targets?.find(
      (target) => target.id === id
    )?.sourceLocator;
    return locator?.kind === "ARCHIVE_ENTRY"
      ? locator.path
      : locator?.kind === "WORKBOOK_SHEET"
        ? locator.sheetName
        : null;
  };
  const targetLocation = (id: string) => {
    const locator = result.data?.targets?.find(
      (target) => target.id === id
    )?.targetLocator;
    return locator?.kind === "ARCHIVE_ENTRY"
      ? locator.path
      : locator?.kind === "WORKBOOK_SHEET"
        ? locator.sheetName
        : null;
  };
  return (
    <section
      aria-label="Table keys and relationships"
      className="min-w-0 space-y-3 border-t border-border pt-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-semibold">
          {includeDictionary
            ? "Keys, relationships & data dictionary"
            : "Keys & relationships"}
        </h3>
        <Button
          type="button"
          variant="outline"
          disabled={!enabled}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? "Hide table relationships" : "View table relationships"}
        </Button>
      </div>
      {open && (
        <>
          <p className="text-sm text-muted-foreground">
            Supplier-declared structure for this exact content. These
            declarations do not establish verified uniqueness, semantic
            correctness, or permission to download files.
          </p>
          {!enabled ? (
            <p className="text-sm text-muted-foreground">
              Refresh this content before viewing its relationships.
            </p>
          ) : result.isPending ? (
            <p role="status" className="text-sm">
              Loading table relationships…
            </p>
          ) : result.isError ? (
            <div className="space-y-2">
              <p role="alert" className="break-words text-sm">
                {result.error instanceof Error
                  ? result.error.message
                  : "Relationships could not be loaded."}
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => void result.refetch()}
              >
                Retry table relationships
              </Button>
            </div>
          ) : (
            page && (
              <>
                {!page.items.length && (
                  <p className="text-sm text-muted-foreground">
                    {includeDictionary
                      ? "No keys, relationships or dictionary answers were declared for this content."
                      : "No keys or relationships were declared for this content."}
                  </p>
                )}
                <ul className="min-w-0 divide-y divide-border">
                  {page.items.map((row) => (
                    <li
                      key={row.id}
                      className="min-w-0 space-y-2 break-words py-3 text-sm [overflow-wrap:anywhere]"
                    >
                      <p className="font-medium">
                        {row.sourceTable.displayName ||
                          "Table without a display name"}{" "}
                        · {row.component === "FULL" ? "Full dataset" : "Sample"}
                      </p>
                      {privateTarget(row.id)?.sourceFileName && (
                        <p className="text-muted-foreground">
                          Source file: {privateTarget(row.id)!.sourceFileName}
                        </p>
                      )}
                      {sourceLocation(row.id) && (
                        <p className="text-muted-foreground">
                          In this file: {sourceLocation(row.id)}
                        </p>
                      )}
                      {row.definition.kind === "KEY" ? (
                        <>
                          <p>
                            Key type: {words(row.definition.keyKind)}
                            {row.definition.label
                              ? ` · ${row.definition.label}`
                              : ""}
                          </p>
                          {row.definition.columns.length ? (
                            <ol className="list-decimal space-y-1 pl-5">
                              {row.definition.columns.map((item) => (
                                <li key={item.id}>{column(item)}</li>
                              ))}
                            </ol>
                          ) : (
                            <p>No key columns selected.</p>
                          )}
                        </>
                      ) : row.definition.kind === "JOIN" ? (
                        <>
                          <p>
                            Related table:{" "}
                            {row.definition.targetTable
                              ? row.definition.targetTable.displayName ||
                                "Table without a display name"
                              : "Not selected"}
                            {row.definition.label
                              ? ` · ${row.definition.label}`
                              : ""}
                          </p>
                          <p>
                            Cardinality: {words(row.definition.cardinality)}
                          </p>
                          <ol className="list-decimal space-y-1 pl-5">
                            {row.definition.pairs.map((pair) => (
                              <li key={pair.source.id}>
                                {column(pair.source)} → {column(pair.target)}
                              </li>
                            ))}
                          </ol>
                        </>
                      ) : (
                        <p>Data dictionary: {words(row.definition.state)}</p>
                      )}
                      {targetLocation(row.id) && (
                        <p>Target in this file: {targetLocation(row.id)}</p>
                      )}
                      {privateTarget(row.id)?.targetFileName && (
                        <p>
                          Target file: {privateTarget(row.id)!.targetFileName}
                        </p>
                      )}
                      {row.definition.notes && (
                        <p className="whitespace-pre-wrap">
                          {row.definition.notes}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={result.isFetching || selected.cursors.length < 2}
                    onClick={() =>
                      setNavigation({
                        key: sourceKey,
                        generation: page.contentGeneration,
                        cursors: selected.cursors.slice(0, -1),
                      })
                    }
                  >
                    Previous relationships
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={result.isFetching || !page.nextCursor?.afterId}
                    onClick={() =>
                      setNavigation({
                        key: sourceKey,
                        generation: page.contentGeneration,
                        cursors: [
                          ...selected.cursors,
                          page.nextCursor!.afterId,
                        ],
                      })
                    }
                  >
                    Next relationships
                  </Button>
                </div>
              </>
            )
          )}
        </>
      )}
    </section>
  );
}
