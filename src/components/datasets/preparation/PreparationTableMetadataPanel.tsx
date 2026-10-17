"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type {
  DatasetTableMetadataPage,
  DatasetPrivateTableMetadataResponse,
} from "@kuinbee/dataset-preparation-contracts";
import { DashboardButton as Button } from "@/components/dashboard";

type Loaded = {
  page: DatasetTableMetadataPage;
  targets?: DatasetPrivateTableMetadataResponse["targets"];
};
export type TableMetadataFilters = {
  tableId?: string;
  afterId?: string;
  contentGeneration?: number;
  limit: number;
};
const words = (value: string) => value.toLowerCase().replaceAll("_", " ");
const answer = (value: { state: string | null; value: string | null }) =>
  value.state === "KNOWN"
    ? value.value || "Not provided"
    : value.state === null
      ? "Not answered"
      : words(value.state);
export function TableMetadataPanel({
  sourceKey,
  enabled = true,
  load,
}: {
  sourceKey: string;
  enabled?: boolean;
  load: (filters: TableMetadataFilters, signal: AbortSignal) => Promise<Loaded>;
}) {
  const [open, setOpen] = useState(false);
  const [navigation, setNavigation] = useState<{
    key: string;
    tableId?: string;
    generation?: number;
    cursors: (string | undefined)[];
  }>({ key: sourceKey, cursors: [undefined] });
  const selected =
    navigation.key === sourceKey
      ? navigation
      : { key: sourceKey, cursors: [undefined] };
  const filters: TableMetadataFilters = {
    tableId: selected.tableId,
    contentGeneration: selected.generation,
    afterId: selected.cursors.at(-1),
    limit: 20,
  };
  const view = useQuery({
    queryKey: ["dataset-table-definitions", sourceKey, filters],
    enabled: open && enabled,
    retry: false,
    gcTime: 0,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    queryFn: ({ signal }) => load(filters, signal),
  });
  const page = view.data?.page;
  const source = (id: string) => {
    const locator = view.data?.targets?.find(
      (target) => target.id === id
    )?.locator;
    return locator
      ? locator.kind === "ARCHIVE_ENTRY"
        ? locator.path
        : locator.sheetName
      : null;
  };
  return (
    <section
      aria-label="Table definitions"
      className="min-w-0 space-y-3 border-t border-border pt-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-semibold">Table definitions</h3>
        <Button
          type="button"
          variant="outline"
          disabled={!enabled}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? "Hide table definitions" : "View table definitions"}
        </Button>
      </div>
      {open && (
        <>
          <p className="text-sm text-muted-foreground">
            Column names and counts describe the inspected material. Meanings,
            types and units are supplier declarations. Definitions do not grant
            file download access.
          </p>
          {!enabled ? (
            <p className="text-sm text-muted-foreground">
              Refresh this content before viewing its definitions.
            </p>
          ) : view.isPending ? (
            <p role="status" className="text-sm">
              Loading table definitions…
            </p>
          ) : view.isError ? (
            <div className="space-y-2">
              <p role="alert" className="break-words text-sm">
                {view.error instanceof Error
                  ? view.error.message
                  : "Definitions could not be loaded."}
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => void view.refetch()}
              >
                Retry table definitions
              </Button>
            </div>
          ) : (
            page && (
              <>
                {page.tableId && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setNavigation({
                        key: sourceKey,
                        generation: page.contentGeneration,
                        cursors: [undefined],
                      })
                    }
                  >
                    Back to table list
                  </Button>
                )}
                {page.table && (
                  <div className="min-w-0 space-y-1 text-sm">
                    <p className="break-words font-medium [overflow-wrap:anywhere]">
                      {page.table.displayName ||
                        page.table.recordUnit ||
                        "Table without a display name"}
                    </p>
                    {source(page.table.id) && (
                      <p className="break-words text-muted-foreground [overflow-wrap:anywhere]">
                        In this file: {source(page.table.id)}
                      </p>
                    )}
                    <p className="text-muted-foreground">
                      {page.table.component === "FULL"
                        ? "Full dataset"
                        : "Sample"}{" "}
                      · {page.table.observed.dataRecordCount} observed data
                      records · {page.table.observed.columnCount} observed
                      columns
                    </p>
                    <p>
                      Supplier-declared purpose:{" "}
                      {page.table.applicability.companionPurposes
                        ?.map(words)
                        .join(", ") ?? words(page.table.applicability.purpose)}
                    </p>
                    <p>One record: {page.table.recordUnit || "Not recorded"}</p>
                    <p>Missing values: {answer(page.table.missingValues)}</p>
                  </div>
                )}
                {!page.items.length ? (
                  <p className="text-sm text-muted-foreground">
                    No table descriptions were recorded for this content.
                  </p>
                ) : (
                  <ul
                    className="min-w-0 divide-y divide-border"
                    aria-label={
                      page.tableId ? "Column definitions" : "Table descriptions"
                    }
                  >
                    {page.items.map((item) => (
                      <li key={item.id} className="min-w-0 space-y-2 py-3">
                        {item.kind === "TABLE" ? (
                          <>
                            <p className="break-words text-sm font-medium [overflow-wrap:anywhere]">
                              {item.displayName ||
                                item.recordUnit ||
                                "Table without a display name"}
                            </p>
                            {source(item.id) && (
                              <p className="break-words text-xs text-muted-foreground [overflow-wrap:anywhere]">
                                In this file: {source(item.id)}
                              </p>
                            )}
                            <p className="text-sm text-muted-foreground">
                              {item.component === "FULL"
                                ? "Full dataset"
                                : "Sample"}{" "}
                              · {item.observed.dataRecordCount} observed data
                              records · {item.observed.columnCount} observed
                              columns
                            </p>
                            <p className="text-sm">
                              One record: {item.recordUnit || "Not recorded"}
                            </p>
                            <p className="text-sm">
                              Missing values: {answer(item.missingValues)}
                            </p>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() =>
                                setNavigation({
                                  key: sourceKey,
                                  tableId: item.id,
                                  generation: page.contentGeneration,
                                  cursors: [undefined],
                                })
                              }
                            >
                              View columns
                            </Button>
                          </>
                        ) : (
                          <>
                            <p className="break-words text-sm font-medium [overflow-wrap:anywhere]">
                              Column {item.position}:{" "}
                              {item.observedName === null
                                ? "No header"
                                : item.observedName === ""
                                  ? "Blank header"
                                  : item.observedName}
                            </p>
                            <dl className="grid min-w-0 gap-2 text-sm sm:grid-cols-2">
                              <div>
                                <dt className="font-medium">Meaning</dt>
                                <dd className="whitespace-pre-wrap break-words text-muted-foreground [overflow-wrap:anywhere]">
                                  {answer(item.meaning)}
                                </dd>
                              </div>
                              <div>
                                <dt className="font-medium">Declared type</dt>
                                <dd className="text-muted-foreground">
                                  {item.declaredType
                                    ? words(item.declaredType)
                                    : "Not answered"}
                                </dd>
                              </div>
                              <div>
                                <dt className="font-medium">Units</dt>
                                <dd className="whitespace-pre-wrap break-words text-muted-foreground [overflow-wrap:anywhere]">
                                  {answer(item.unit)}
                                </dd>
                              </div>
                              <div>
                                <dt className="font-medium">
                                  Observed storage
                                </dt>
                                <dd className="text-muted-foreground">
                                  UTF-8 text
                                </dd>
                              </div>
                            </dl>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-muted-foreground">
                    Page {selected.cursors.length}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={selected.cursors.length < 2 || view.isFetching}
                    onClick={() =>
                      setNavigation({
                        ...selected,
                        cursors: selected.cursors.slice(0, -1),
                      })
                    }
                  >
                    Previous definitions page
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!page.nextCursor || view.isFetching}
                    onClick={() => {
                      if (page.nextCursor?.afterId)
                        setNavigation({
                          ...selected,
                          generation: page.contentGeneration,
                          cursors: [
                            ...selected.cursors,
                            page.nextCursor.afterId,
                          ],
                        });
                    }}
                  >
                    Next definitions page
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
