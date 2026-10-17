"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DatasetTableDescriptionChangesSchema,
  DatasetColumnDescriptionChangesSchema,
  DatasetTableDescriptionsMutationBodySchema,
  type DatasetFilesInventoryPageResponse,
  type DatasetTableDescriptionsPageQuery,
  type DatasetTableDescriptionsPageResponse,
  type DatasetTableDescriptionsMutationBody,
} from "@kuinbee/dataset-preparation-contracts";
import { DashboardButton } from "@/components/dashboard";
import { datasetTablesApi } from "@/lib/api/dataset-tables";
import { useAuthStore } from "@/store/auth.store";
import { useTablePagePlan } from "@/hooks/useTablePagePlan";
import {
  beginTablePagePlan,
  clearTablePagePlan,
  prepareTablePageCommand,
  tablePageBasisMatches,
  type TablePageCommand,
} from "@/lib/datasets/dataset-table-page-commands";
import {
  PreparationField,
  PreparationSelect,
  preparationControl,
} from "./PreparationFields";

type Basis = Pick<
  DatasetFilesInventoryPageResponse,
  "preparationId" | "preparationGeneration" | "contentId" | "contentGeneration"
>;
type Member = DatasetFilesInventoryPageResponse["items"][number];
type Page = DatasetTableDescriptionsPageResponse;
type Table = Extract<Page["items"][number], { kind: "TABLE" }>;
type Column = Extract<Page["items"][number], { kind: "COLUMN" }>;
type TableAnswers = ReturnType<
  typeof DatasetTableDescriptionChangesSchema.parse
>;
type ColumnAnswers = ReturnType<
  typeof DatasetColumnDescriptionChangesSchema.parse
>;
type Operation = DatasetTableDescriptionsMutationBody["operations"][number];
const basisKey = (basis: Basis) => JSON.stringify(basis);
const fileLabel = (file: Member) =>
  `${file.component === "FULL" ? "Full dataset" : "Sample"} · ${file.relativePath ?? file.originalFileName ?? "Unnamed file"}`;
const tableLabel = (table: Table) =>
  table.description?.displayName ||
  (table.locator?.kind === "ARCHIVE_ENTRY"
    ? table.locator.path
    : table.locator?.kind === "WORKBOOK_SHEET"
      ? table.locator.sheetName
      : "Table in uploaded file");
const emptyTable: TableAnswers = {
  displayName: null,
  recordUnit: null,
  missingConventionState: null,
  missingConventionDetails: null,
};
const emptyColumn: ColumnAnswers = {
  meaningState: null,
  description: null,
  semanticType: null,
  unitState: null,
  unit: null,
};
const states = [
  ["KNOWN", "Known"],
  ["UNKNOWN", "Unknown"],
  ["NOT_APPLICABLE", "Not applicable"],
] as const;
const types = [
  ["UNKNOWN", "Unknown"],
  ["IDENTIFIER", "Identifier"],
  ["CATEGORY", "Category"],
  ["TEXT", "Text"],
  ["INTEGER", "Whole number"],
  ["DECIMAL", "Decimal number"],
  ["BOOLEAN", "True / false"],
  ["DATE", "Date"],
  ["DATETIME", "Date and time"],
  ["COORDINATE", "Coordinate"],
  ["OTHER", "Other"],
] as const;
function changes<T extends object>(before: T, after: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(after).filter(
      ([key, value]) => value !== before[key as keyof T]
    )
  ) as Partial<T>;
}
function useTablePage(
  basis: Basis,
  memberId: string,
  tableId: string | undefined,
  enabled: boolean
) {
  const base = JSON.stringify({
    draftId: basis.preparationId,
    query: {
      contentId: basis.contentId,
      contentGeneration: basis.contentGeneration,
      expectedPreparationGeneration: basis.preparationGeneration,
      memberId,
      ...(tableId ? { tableId } : {}),
      limit: 20,
    },
  });
  const [navigation, setNavigation] = useState<{
    base: string;
    cursors: (string | undefined)[];
    index: number;
  }>({ base, cursors: [undefined], index: 0 });
  const index = navigation.base === base ? navigation.index : 0;
  const afterId =
    navigation.base === base ? navigation.cursors[index] : undefined;
  const [revision, setRevision] = useState(0);
  const requestKey = JSON.stringify({ base, afterId, revision, enabled });
  const request = useMemo(() => {
    const parsed = JSON.parse(requestKey) as {
      base: string;
      afterId?: string;
      revision: number;
      enabled: boolean;
    };
    return {
      ...(JSON.parse(parsed.base) as {
        draftId: string;
        query: DatasetTableDescriptionsPageQuery;
      }),
      ...parsed,
    };
  }, [requestKey]);
  const [snapshot, setSnapshot] = useState<{
    key: string;
    data: Page | null;
    error: string;
  } | null>(null);
  useEffect(() => {
    if (!request.enabled || !request.query.memberId) return;
    const controller = new AbortController();
    void datasetTablesApi
      .page(
        request.draftId,
        {
          ...request.query,
          ...(request.afterId ? { afterId: request.afterId } : {}),
        },
        controller.signal
      )
      .then((data) => {
        if (!controller.signal.aborted)
          setSnapshot({ key: requestKey, data, error: "" });
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setSnapshot({
            key: requestKey,
            data: null,
            error:
              error instanceof Error
                ? error.message
                : "Tables could not be loaded.",
          });
      });
    return () => controller.abort();
  }, [request, requestKey]);
  const current = enabled && snapshot?.key === requestKey ? snapshot : null;
  return {
    data: current?.data ?? null,
    error: current?.error ?? "",
    loading: Boolean(enabled && memberId && !current),
    index,
    refresh: () => setRevision((value) => value + 1),
    previous: () => {
      if (index > 0)
        setNavigation({ base, cursors: navigation.cursors, index: index - 1 });
    },
    next: () => {
      const next = current?.data?.nextCursor?.afterId;
      if (next)
        setNavigation({
          base,
          cursors: [
            ...(navigation.base === base
              ? navigation.cursors.slice(0, index + 1)
              : [undefined]),
            next,
          ],
          index: index + 1,
        });
    },
  };
}
function Pages({
  page,
  name,
  disabled,
}: {
  page: ReturnType<typeof useTablePage>;
  name: string;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span className="text-muted-foreground">Page {page.index + 1}</span>
      <DashboardButton
        type="button"
        variant="outline"
        disabled={disabled || page.loading || page.index === 0}
        onClick={page.previous}
        aria-label={`Previous ${name} page`}
      >
        Previous
      </DashboardButton>
      <DashboardButton
        type="button"
        variant="outline"
        disabled={disabled || page.loading || !page.data?.nextCursor}
        onClick={page.next}
        aria-label={`Next ${name} page`}
      >
        Next
      </DashboardButton>
    </div>
  );
}
type Edit = {
  basis: Basis;
  memberId: string;
  tableId: string;
  tableBefore: TableAnswers;
  table: TableAnswers;
  columns: Record<string, { before: ColumnAnswers; answers: ColumnAnswers }>;
};
function operations(edit: Edit): Operation[] {
  const tableChanges = changes(edit.tableBefore, edit.table);
  return [
    ...(Object.keys(tableChanges).length
      ? [
          {
            operation: "SET_TABLE" as const,
            memberId: edit.memberId,
            tableId: edit.tableId,
            changes: tableChanges,
          },
        ]
      : []),
    ...Object.entries(edit.columns).flatMap(([columnId, column]) => {
      const delta = changes(column.before, column.answers);
      return Object.keys(delta).length
        ? [
            {
              operation: "SET_COLUMN" as const,
              memberId: edit.memberId,
              tableId: edit.tableId,
              columnId,
              changes: delta,
            },
          ]
        : [];
    }),
  ];
}
const normalized = (value: Operation[]) =>
  DatasetTableDescriptionsMutationBodySchema.shape.operations.parse(value);
type Props = {
  basis: Basis;
  members: Member[];
  active: boolean;
  canChange: boolean;
  canInitializeFrozen?: boolean;
  pending: boolean;
  buildCommand: (
    basis: Basis,
    operations: Operation[],
    requestId: string
  ) => TablePageCommand;
  sendCommand: (
    command: TablePageCommand,
    replay?: boolean
  ) => Promise<unknown>;
  retry: () => Promise<unknown>;
  onDirtyChange: (dirty: boolean) => void;
};
export function PreparationTables(props: Props) {
  const actorId = useAuthStore((state) => state.user?.id);
  return (
    <TableEditor key={actorId ?? "signed-out"} {...props} actorId={actorId} />
  );
}
function TableEditor({
  basis,
  members,
  active,
  canChange,
  canInitializeFrozen = false,
  pending,
  buildCommand,
  sendCommand,
  retry,
  onDirtyChange,
  actorId,
}: Props & { actorId?: string }) {
  const [member, setMember] = useState<Member | null>(null);
  const [selection, setSelection] = useState<{
    memberId: string;
    id: string;
    label: string;
  } | null>(null);
  const [columnSelection, setColumnSelection] = useState<string>("");
  const [storedEdit, setEdit] = useState<Edit | null>(null);
  const [error, setError] = useState("");
  const [writing, setWriting] = useState(false);
  const restored = useTablePagePlan(actorId, basis.preparationId);
  const plan = restored.plan;
  const edit = storedEdit;
  const localDirty = Boolean(edit && operations(edit).length);
  const retainedDirty = Boolean(
    plan && (plan.command || plan.remaining.length)
  );
  const dirty = localDirty || retainedDirty || Boolean(restored.error);
  const stale = Boolean(
    localDirty && edit && basisKey(edit.basis) !== basisKey(basis)
  );
  const retainedStale = Boolean(
    plan &&
    !plan.command &&
    plan.remaining.length &&
    !tablePageBasisMatches(plan.expectedBasis, basis)
  );
  useEffect(() => {
    if (plan && !plan.command && !plan.remaining.length && !pending)
      void Promise.resolve()
        .then(() => clearTablePagePlan(plan))
        .catch((failure) => {
          setError(
            failure instanceof Error
              ? failure.message
              : "The saved table recovery record could not be cleared."
          );
        });
  }, [plan, pending]);
  useEffect(() => onDirtyChange(dirty), [dirty, onDirtyChange]);
  useEffect(() => () => onDirtyChange(false), [onDirtyChange]);
  // Keep the observed page paired with its unsaved answers if another writer
  // advances the content. Only an explicit reset may switch that edit base.
  const displayedBasis = edit?.basis ?? basis;
  const tables = useTablePage(
    displayedBasis,
    member?.id ?? "",
    undefined,
    active && Boolean(member)
  );
  const tableId =
    selection?.memberId === member?.id ? selection?.id : undefined;
  const columns = useTablePage(
    displayedBasis,
    member?.id ?? "",
    tableId,
    active && Boolean(member && tableId)
  );
  const table = columns.data?.table ?? null;
  const column =
    columns.data?.items.find(
      (item): item is Column =>
        item.kind === "COLUMN" && item.id === columnSelection
    ) ??
    columns.data?.items.find(
      (item): item is Column => item.kind === "COLUMN"
    ) ??
    null;
  const tableAnswers = edit?.table ?? table?.description ?? emptyTable;
  const columnAnswers =
    (column ? edit?.columns[column.id]?.answers : null) ??
    column?.description ??
    emptyColumn;
  const start = (): Edit | null =>
    edit ??
    (table && member
      ? {
          basis: { ...basis },
          memberId: member.id,
          tableId: table.id,
          tableBefore: { ...(table.description ?? emptyTable) },
          table: { ...(table.description ?? emptyTable) },
          columns: {},
        }
      : null);
  const updateTable = (name: keyof TableAnswers, value: string | null) => {
    const current = start();
    if (current) {
      const next = { ...current, table: { ...current.table, [name]: value } };
      setEdit(operations(next).length ? next : null);
    }
  };
  const updateColumn = (name: keyof ColumnAnswers, value: string | null) => {
    const current = start();
    if (current && column) {
      const previous = current.columns[column.id] ?? {
        before: { ...(column.description ?? emptyColumn) },
        answers: { ...(column.description ?? emptyColumn) },
      };
      const next = {
        ...current,
        columns: {
          ...current.columns,
          [column.id]: {
            ...previous,
            answers: { ...previous.answers, [name]: value },
          },
        },
      };
      setEdit(operations(next).length ? next : null);
    }
  };
  const locked =
    !canChange ||
    !actorId ||
    retainedDirty ||
    Boolean(restored.error) ||
    writing ||
    pending ||
    stale ||
    (Boolean(columns.data?.frozen) && !canInitializeFrozen) ||
    !columns.data;
  const navigationLocked = dirty || writing || pending;
  async function send(command: TablePageCommand, replay = false) {
    setWriting(true);
    setError("");
    try {
      await sendCommand(command, replay);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Descriptions could not be saved."
      );
    } finally {
      setWriting(false);
    }
  }
  async function saveOperations(delta: Operation[]) {
    if (!actorId || !member || !table || !columns.data) return;
    try {
      const next = beginTablePagePlan(
        actorId,
        basis,
        normalized(delta),
        (operations, requestId) => buildCommand(basis, operations, requestId),
        {
          component: member.component,
          fileName: (
            member.relativePath ??
            member.originalFileName ??
            "Unnamed file"
          ).slice(0, 300),
          tableName: tableLabel(table).slice(0, 300),
          columns: columns.data.items.flatMap((item) =>
            item.kind === "COLUMN" &&
            delta.some(
              (op) => op.operation === "SET_COLUMN" && op.columnId === item.id
            )
              ? [
                  {
                    id: item.id,
                    position: item.position,
                    name:
                      item.observedName === null
                        ? null
                        : item.observedName.slice(0, 120),
                  },
                ]
              : []
          ),
        }
      );
      setEdit(null);
      await send(next.command!);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Your table answers could not be retained safely."
      );
    }
  }
  async function save() {
    if (locked || !edit || !localDirty) return;
    await saveOperations(operations(edit));
  }
  async function markUnknown() {
    if (locked || dirty || !columns.data || !table || !member) return;
    const delta: Operation[] = columns.data.items.flatMap((item) => {
      if (item.kind !== "COLUMN") return [];
      const values: ColumnAnswers = {};
      if (!item.description?.meaningState) values.meaningState = "UNKNOWN";
      if (!item.description?.semanticType) values.semanticType = "UNKNOWN";
      if (!item.description?.unitState) values.unitState = "UNKNOWN";
      return Object.keys(values).length
        ? [
            {
              operation: "SET_COLUMN" as const,
              memberId: member.id,
              tableId: table.id,
              columnId: item.id,
              changes: values,
            },
          ]
        : [];
    });
    if (!delta.length) return;
    await saveOperations(delta);
  }
  return (
    <section
      aria-label="Tables and columns"
      className="col-span-full min-w-0 space-y-4 border-t border-border pt-5"
    >
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Tables &amp; columns</h2>
        <p className="text-sm text-muted-foreground">
          Choose a stored file to describe its inspected tables. Headers and
          counts come from backend checks; meanings and units are your
          declarations. This does not inspect unseen full data.
        </p>
      </div>
      {!actorId && (
        <p role="status" className="text-sm">
          Sign in to save table definitions.
        </p>
      )}
      {plan && plan.remaining.length > 0 && (
        <p className="break-words text-sm font-medium [overflow-wrap:anywhere]">
          Answers entered for{" "}
          {plan.subject.component === "SAMPLE" ? "Sample" : "Full dataset"} ·{" "}
          {plan.subject.fileName} · {plan.subject.tableName}
        </p>
      )}
      {(pending || plan?.command) && (
        <div role="status" className="space-y-2 text-sm">
          <p>
            A table change is not confirmed. Retry the same saved request before
            continuing.
          </p>
          <DashboardButton
            type="button"
            disabled={writing}
            onClick={() =>
              void (plan?.command ? send(plan.command, true) : retry())
            }
          >
            Confirm table change
          </DashboardButton>
        </div>
      )}
      {plan && plan.remaining.length > 0 && !plan.command && !pending && (
        <div role="status" className="space-y-2 text-sm">
          <p>
            {plan.remaining.length} table or column changes are retained in this
            browser tab. Continue saving to finish this page.
          </p>
          {retainedStale && (
            <p role="alert">
              The saved Dataset changed. Your remaining answers are retained;
              review the current table before starting a new page save.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <DashboardButton
              type="button"
              disabled={!active || !canChange || writing || retainedStale}
              onClick={() => {
                try {
                  const next = prepareTablePageCommand(
                    plan,
                    basis,
                    (operations, requestId) =>
                      buildCommand(basis, operations, requestId)
                  );
                  void send(next.command!);
                } catch (failure) {
                  setError(
                    failure instanceof Error
                      ? failure.message
                      : "Your retained answers could not be saved."
                  );
                }
              }}
            >
              Save remaining column answers
            </DashboardButton>
            <DashboardButton
              type="button"
              variant="outline"
              disabled={writing}
              onClick={() => {
                try {
                  clearTablePagePlan(plan);
                  setEdit(null);
                  setError("");
                } catch (failure) {
                  setError(
                    failure instanceof Error
                      ? failure.message
                      : "Your retained answers could not be reset."
                  );
                }
              }}
            >
              Discard remaining unsaved answers
            </DashboardButton>
          </div>
          <p className="text-xs text-muted-foreground">
            Discarding these answers keeps changes the backend has already
            confirmed.
          </p>
        </div>
      )}
      {plan && plan.remaining.length > 0 && (
        <details className="min-w-0 text-sm">
          <summary>Review retained table answers</summary>
          <ol className="list-decimal space-y-3 break-words pl-5 [overflow-wrap:anywhere]">
            {plan.remaining.map((operation, index) => (
              <li key={index}>
                <p className="font-medium">
                  {operation.operation === "SET_TABLE"
                    ? "Table answers"
                    : (() => {
                        const observed = plan.subject.columns.find(
                          (column) => column.id === operation.columnId
                        )!;
                        return `Column ${observed.position}: ${observed.name === null ? "No header" : observed.name || "Blank header"}`;
                      })()}
                </p>
                <dl>
                  {Object.entries(operation.changes).map(([name, value]) => (
                    <div key={name}>
                      <dt className="text-muted-foreground">
                        {{
                          displayName: "Table name",
                          recordUnit: "Record meaning",
                          missingConventionState: "Missing-value conventions",
                          missingConventionDetails: "Missing-value details",
                          meaningState: "Meaning",
                          description: "Column meaning",
                          semanticType: "Declared type",
                          unitState: "Units",
                          unit: "Unit of measurement",
                        }[name] ?? name}
                      </dt>
                      <dd>{value ?? "Cleared"}</dd>
                    </div>
                  ))}
                </dl>
              </li>
            ))}
          </ol>
        </details>
      )}
      {stale && (
        <p role="alert" className="text-sm text-destructive">
          Saved files changed. Your unsaved table answers are retained. Reset
          these answers and review the current table before editing again.
        </p>
      )}
      {(error || restored.error || tables.error || columns.error) && (
        <p role="alert" className="break-words text-sm text-destructive">
          {error || restored.error || columns.error || tables.error}
        </p>
      )}
      <label className="block space-y-2 text-sm">
        <span className="font-medium">File to describe</span>
        <select
          aria-label="File to describe"
          className={preparationControl}
          value={member?.id ?? ""}
          disabled={!active || navigationLocked}
          onChange={(event) => {
            setMember(
              members.find((item) => item.id === event.target.value) ?? null
            );
            setSelection(null);
            setColumnSelection("");
            setEdit(null);
            setError("");
          }}
        >
          <option value="">Choose a file from the current files page</option>
          {member && !members.some((item) => item.id === member.id) && (
            <option value={member.id}>
              {fileLabel(member)} (selected on another page)
            </option>
          )}
          {members.map((item) => (
            <option value={item.id} key={item.id}>
              {fileLabel(item)}
            </option>
          ))}
        </select>
      </label>
      {member && (
        <>
          <p className="break-words text-sm text-muted-foreground [overflow-wrap:anywhere]">
            {fileLabel(member)}
          </p>
          {tables.loading && (
            <p role="status" className="text-sm">
              Loading inspected tables…
            </p>
          )}
          {tables.data && !tables.data.items.length && (
            <p className="text-sm text-muted-foreground">
              No inspected table structure is available for this file. Continue
              its relevant Dataset details; a filename alone does not establish
              a table.
            </p>
          )}
          {tables.data && tables.data.items.length > 0 && (
            <>
              <label className="block space-y-2 text-sm">
                <span className="font-medium">Inspected table</span>
                <select
                  aria-label="Inspected table"
                  className={preparationControl}
                  value={tableId ?? ""}
                  disabled={navigationLocked || !active}
                  onChange={(event) => {
                    const row = tables.data?.items.find(
                      (item): item is Table =>
                        item.kind === "TABLE" && item.id === event.target.value
                    );
                    setSelection(
                      row
                        ? {
                            memberId: member.id,
                            id: row.id,
                            label: tableLabel(row),
                          }
                        : null
                    );
                    setColumnSelection("");
                    setEdit(null);
                  }}
                >
                  <option value="">Choose a table</option>
                  {selection?.memberId === member.id &&
                    !tables.data.items.some(
                      (item) => item.id === selection.id
                    ) && (
                      <option value={selection.id}>{selection.label}</option>
                    )}
                  {tables.data.items.map(
                    (item) =>
                      item.kind === "TABLE" && (
                        <option key={item.id} value={item.id}>
                          {tableLabel(item)} · {item.columnCount} columns
                          {item.applicability.definitionsRequired
                            ? " · definitions required"
                            : " · companion"}
                        </option>
                      )
                  )}
                </select>
              </label>
              <Pages
                page={tables}
                name="tables"
                disabled={navigationLocked || !active}
              />
            </>
          )}
        </>
      )}
      {(table || edit) && (
        <>
          {table && (
            <div className="space-y-1 border-t border-border pt-4 text-sm">
              <h3 className="break-words font-medium [overflow-wrap:anywhere]">
                {tableLabel(table)}
              </h3>
              <p className="text-muted-foreground">
                Backend-observed: {table.dataRecordCount} data records ·{" "}
                {table.columnCount} columns ·{" "}
                {table.headerConvention === "PRESENT"
                  ? "declared header row"
                  : "no header row"}
                .
              </p>
              <p className="text-xs text-muted-foreground">
                CSV/TSV values are stored as text. The declared type below
                explains their meaning; it is not a backend inference.
              </p>
              <p className="text-sm">
                {table.applicability.definitionsRequired
                  ? "These are primary or sensor records. Complete definitions for every inspected table and column before submitting, including other pages."
                  : "This is companion material according to your file purpose or exact entry relationship. Table definitions are optional; complete any definitions you choose to start before submitting."}
              </p>
            </div>
          )}
          <div className="grid min-w-0 gap-4 sm:grid-cols-2">
            <PreparationField
              label="Table display name"
              value={tableAnswers.displayName}
              maxLength={200}
              multiline={false}
              disabled={locked}
              onChange={(value) => updateTable("displayName", value)}
            />
            <PreparationField
              label="What does one record represent?"
              value={tableAnswers.recordUnit}
              maxLength={1000}
              multiline={false}
              disabled={locked}
              help="For example: one participant visit, one transaction, or one sensor reading."
              onChange={(value) => updateTable("recordUnit", value)}
            />
            <PreparationSelect
              label="Missing-value conventions"
              value={tableAnswers.missingConventionState}
              options={states}
              disabled={locked}
              onChange={(value) => updateTable("missingConventionState", value)}
            />
            <PreparationField
              label="Missing-value details"
              value={tableAnswers.missingConventionDetails}
              maxLength={2000}
              disabled={
                locked || tableAnswers.missingConventionState !== "KNOWN"
              }
              help="For example: an empty cell means the measurement was not taken."
              onChange={(value) =>
                updateTable("missingConventionDetails", value)
              }
            />
          </div>
          {columns.loading && (
            <p role="status" className="text-sm">
              Loading columns…
            </p>
          )}
          {column && (
            <div className="min-w-0 space-y-4 border-t border-border pt-4">
              <label className="block space-y-2 text-sm">
                <span className="font-medium">Column to describe</span>
                <select
                  aria-label="Column to describe"
                  className={preparationControl}
                  value={column.id}
                  disabled={
                    writing || pending || retainedDirty || stale || !active
                  }
                  onChange={(event) => {
                    setColumnSelection(event.target.value);
                  }}
                >
                  {columns.data?.items.map(
                    (item) =>
                      item.kind === "COLUMN" && (
                        <option key={item.id} value={item.id}>
                          Column {item.position}:{" "}
                          {item.observedName === null
                            ? "No header"
                            : item.observedName === ""
                              ? "Blank header"
                              : item.observedName}
                        </option>
                      )
                  )}
                </select>
              </label>
              <p className="break-words text-sm text-muted-foreground [overflow-wrap:anywhere]">
                Observed column {column.position}:{" "}
                {column.observedName === null
                  ? "No header declared"
                  : column.observedName === ""
                    ? "Blank header"
                    : column.observedName}
                . Duplicate names keep their original positions.
              </p>
              <div className="grid min-w-0 gap-4 sm:grid-cols-2">
                <PreparationSelect
                  label="Column meaning"
                  value={columnAnswers.meaningState}
                  options={states.slice(0, 2)}
                  disabled={locked}
                  onChange={(value) => updateColumn("meaningState", value)}
                />
                <PreparationSelect
                  label="Declared column type"
                  value={columnAnswers.semanticType}
                  options={types}
                  disabled={locked}
                  onChange={(value) => updateColumn("semanticType", value)}
                />
                <div className="sm:col-span-2">
                  <PreparationField
                    label="What does this column mean?"
                    value={columnAnswers.description}
                    maxLength={2000}
                    disabled={locked || columnAnswers.meaningState !== "KNOWN"}
                    onChange={(value) => updateColumn("description", value)}
                  />
                </div>
                <PreparationSelect
                  label="Column units"
                  value={columnAnswers.unitState}
                  options={states}
                  disabled={locked}
                  onChange={(value) => updateColumn("unitState", value)}
                />
                <PreparationField
                  label="Unit of measurement"
                  value={columnAnswers.unit}
                  maxLength={200}
                  multiline={false}
                  disabled={locked || columnAnswers.unitState !== "KNOWN"}
                  help="For example: milliseconds, INR, or degrees Celsius."
                  onChange={(value) => updateColumn("unit", value)}
                />
              </div>
              <Pages
                page={columns}
                name="columns"
                disabled={navigationLocked || !active}
              />
              <DashboardButton
                type="button"
                variant="outline"
                disabled={locked || dirty}
                onClick={() => void markUnknown()}
              >
                Use unknown on this page
              </DashboardButton>
              <p className="text-xs text-muted-foreground">
                This applies only to unanswered fields on this page. Existing
                answers and other pages are preserved.
              </p>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
            <DashboardButton
              type="button"
              disabled={locked || !localDirty}
              onClick={() => void save()}
            >
              Save table descriptions
            </DashboardButton>
            <DashboardButton
              type="button"
              variant="outline"
              disabled={!localDirty || writing || pending || retainedDirty}
              onClick={() => {
                setEdit(null);
                setError("");
              }}
            >
              Reset unsaved table answers
            </DashboardButton>
            {localDirty && (
              <span role="status" className="text-sm text-muted-foreground">
                Unsaved table answers · you can describe other columns on this
                page. Save before changing the file, table or page.
              </span>
            )}
          </div>
        </>
      )}
      {member && !dirty && !pending && (
        <DashboardButton
          type="button"
          variant="outline"
          disabled={!active || writing}
          onClick={() => {
            tables.refresh();
            columns.refresh();
          }}
        >
          Refresh tables
        </DashboardButton>
      )}
    </section>
  );
}
