"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type {
  DatasetFilesInventoryPageResponse,
  DatasetTableReferenceDefinition,
  DatasetTableReferencesMutationBody,
  DatasetTableReferencesPageResponse,
  DatasetTableReferenceTargetsResponse,
} from "@kuinbee/dataset-preparation-contracts";
import { DashboardButton } from "@/components/dashboard";
import { useAuthStore } from "@/store/auth.store";
import { useReferencePlan } from "@/hooks/useReferencePlan";
import { datasetReferencesApi } from "@/lib/api/dataset-references";
import { datasetTablesApi } from "@/lib/api/dataset-tables";
import { datasetFilesApi } from "@/lib/api/dataset-files";
import {
  clearReferencePlan,
  storeReferencePlan,
  type ReferencePlan,
  type ReferenceSubject,
} from "@/lib/datasets/dataset-reference-plan";
import {
  tablePageBasisMatches,
  type TablePageBasis,
} from "@/lib/datasets/dataset-table-page-commands";
import type { DatasetReferenceCommand } from "@/lib/datasets/dataset-upload-commands";
import {
  PreparationField,
  PreparationSelect,
  preparationControl,
} from "./PreparationFields";

type Definition = DatasetTableReferenceDefinition;
type Label = ReferencePlan["labels"][number];
type Member = DatasetFilesInventoryPageResponse["items"][number];
export type ReferenceMemberLoader = (
  basis: TablePageBasis,
  component: "FULL" | "SAMPLE",
  afterId: string | undefined,
  signal: AbortSignal
) => Promise<{ items: Member[]; nextCursor: { afterId?: string } | null }>;
export type ReferenceEditorCommands = {
  buildReferenceCommand: (
    basis: TablePageBasis,
    operations: DatasetTableReferencesMutationBody["operations"],
    requestId: string
  ) => DatasetReferenceCommand;
  sendReferenceCommand: (
    command: DatasetReferenceCommand,
    replay?: boolean
  ) => Promise<unknown>;
  loadReferenceMembers?: ReferenceMemberLoader;
};
type Props = ReferenceEditorCommands & {
  basis: TablePageBasis;
  subject: ReferenceSubject | null;
  active: boolean;
  canChange: boolean;
  pending: boolean;
  canInitializeFrozen?: boolean;
  onDirtyChange: (value: boolean) => void;
};
const options = {
  retry: false as const,
  gcTime: 0,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
};
const queryBasis = (basis: TablePageBasis) => ({
  contentId: basis.contentId,
  contentGeneration: basis.contentGeneration,
  expectedPreparationGeneration: basis.preparationGeneration,
});
const columnLabel = (column: Label) =>
  `Column ${column.position}: ${column.namePreview === null ? "No header" : column.namePreview || "Blank header"}${column.nameTruncated ? "…" : ""}`;
const locationLabel = (
  locator: DatasetTableReferenceTargetsResponse["items"][number]["locator"]
) =>
  locator?.kind === "ARCHIVE_ENTRY"
    ? locator.path
    : locator?.kind === "WORKBOOK_SHEET"
      ? locator.sheetName
      : "Uploaded file";
const definitionName = (definition: Definition) =>
  definition.kind === "KEY"
    ? definition.keyKind === "PRIMARY"
      ? "Primary key"
      : definition.keyKind === "UNIQUE"
        ? "Unique key"
        : "Key"
    : definition.kind === "JOIN"
      ? "Relationship to another table"
      : "Data dictionary";
const emptyDefinition = (kind: Definition["kind"]): Definition =>
  kind === "KEY"
    ? { kind, keyKind: null, columnIds: [], label: null, notes: null }
    : kind === "JOIN"
      ? {
          kind,
          target: null,
          pairs: [],
          cardinality: null,
          label: null,
          notes: null,
        }
      : { kind, state: null, target: null, notes: null };
const selectedIds = (definition: Definition) =>
  new Set(
    definition.kind === "KEY"
      ? definition.columnIds
      : definition.kind === "JOIN"
        ? definition.pairs.flatMap((pair) => [
            pair.sourceColumnId,
            pair.targetColumnId,
          ])
        : []
  );
function Problem({ error }: { error: unknown }) {
  return error ? (
    <p role="alert" className="break-words text-sm text-destructive">
      {error instanceof Error
        ? error.message
        : "This exact page could not be loaded. Your saved selections are preserved."}
    </p>
  ) : null;
}
function Pager({
  name,
  cursors,
  next,
  disabled,
  onChange,
}: {
  name: string;
  cursors: (string | undefined)[];
  next?: string;
  disabled?: boolean;
  onChange: (cursors: (string | undefined)[]) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <DashboardButton
        type="button"
        variant="outline"
        disabled={disabled || cursors.length < 2}
        onClick={() => onChange(cursors.slice(0, -1))}
      >
        Previous {name}
      </DashboardButton>
      <DashboardButton
        type="button"
        variant="outline"
        disabled={disabled || !next}
        onClick={() => onChange([...cursors, next])}
      >
        Next {name}
      </DashboardButton>
    </div>
  );
}

function ColumnPicker({
  basis,
  memberId,
  tableId,
  name,
  disabled,
  onChoose,
}: {
  basis: TablePageBasis;
  memberId: string;
  tableId: string;
  name: string;
  disabled: boolean;
  onChoose: (column: Label) => void;
}) {
  const actorId = useAuthStore((state) => state.user?.id);
  const [cursors, setCursors] = useState<(string | undefined)[]>([undefined]);
  const page = useQuery({
    ...options,
    queryKey: [
      "dataset-reference-columns",
      actorId,
      basis,
      memberId,
      tableId,
      cursors.at(-1),
    ],
    enabled: !disabled && Boolean(actorId),
    queryFn: ({ signal }) =>
      datasetTablesApi.page(
        basis.preparationId,
        {
          ...queryBasis(basis),
          memberId,
          tableId,
          afterId: cursors.at(-1),
          limit: 20,
        },
        signal
      ),
  });
  return (
    <div className="min-w-0 space-y-2">
      <label className="block space-y-2 text-sm">
        <span className="font-medium">{name}</span>
        <select
          className={preparationControl}
          value=""
          disabled={disabled || !page.data}
          onChange={(event) => {
            const row = page.data?.items.find(
              (item) => item.kind === "COLUMN" && item.id === event.target.value
            );
            if (row?.kind === "COLUMN") {
              const chars =
                row.observedName === null ? null : Array.from(row.observedName);
              onChoose({
                id: row.id,
                position: row.position,
                namePreview: chars?.slice(0, 96).join("") ?? null,
                nameTruncated: Boolean(chars && chars.length > 96),
              });
            }
          }}
        >
          <option value="">Choose a column</option>
          {page.data?.items.map(
            (row) =>
              row.kind === "COLUMN" && (
                <option key={row.id} value={row.id}>
                  Column {row.position}:{" "}
                  {row.observedName === null
                    ? "No header"
                    : row.observedName || "Blank header"}
                </option>
              )
          )}
        </select>
      </label>
      <Problem error={page.error} />
      <Pager
        name={name.toLowerCase()}
        cursors={cursors}
        next={page.data?.nextCursor?.afterId}
        disabled={disabled || page.isFetching}
        onChange={setCursors}
      />
    </div>
  );
}

function TargetPicker({
  plan,
  disabled,
  loadMembers,
  onChoose,
}: {
  plan: ReferencePlan;
  disabled: boolean;
  loadMembers?: ReferenceMemberLoader;
  onChoose: (definition: Definition, label: string | null) => void;
}) {
  const [cursors, setCursors] = useState<(string | undefined)[]>([undefined]);
  const [member, setMember] = useState<Member | null>(null);
  const [targetCursors, setTargetCursors] = useState<(string | undefined)[]>([
    undefined,
  ]);
  const definition = plan.definition;
  const kind = definition.kind === "JOIN" ? "JOIN" : "DICTIONARY";
  const members = useQuery({
    ...options,
    queryKey: [
      "dataset-reference-members",
      plan.actorId,
      plan.basis,
      plan.subject.component,
      cursors.at(-1),
    ],
    enabled: !disabled,
    queryFn: ({ signal }) =>
      loadMembers
        ? loadMembers(
            plan.basis,
            plan.subject.component,
            cursors.at(-1),
            signal
          )
        : datasetFilesApi.page(
            plan.draftId,
            {
              ...queryBasis(plan.basis),
              component: plan.subject.component,
              afterId: cursors.at(-1),
              limit: 20,
            },
            signal
          ),
  });
  const targets = useQuery({
    ...options,
    queryKey: [
      "dataset-reference-targets",
      plan.actorId,
      plan.basis,
      plan.subject,
      kind,
      member?.id,
      targetCursors.at(-1),
    ],
    enabled: !disabled && Boolean(member),
    queryFn: ({ signal }) =>
      datasetReferencesApi.targets(
        plan.draftId,
        {
          ...queryBasis(plan.basis),
          memberId: plan.subject.memberId,
          tableId: plan.subject.tableId,
          targetMemberId: member!.id,
          kind,
          afterId: targetCursors.at(-1),
          limit: 20,
        },
        signal
      ),
  });
  if (definition.kind === "KEY") return null;
  return (
    <div className="space-y-3">
      <p className="break-words text-sm">
        Current target: {plan.targetLabel ?? "Not selected"}
      </p>
      <label className="block space-y-2 text-sm">
        <span className="font-medium">
          Target file in this{" "}
          {plan.subject.component === "FULL" ? "full dataset" : "sample"}
        </span>
        <select
          className={preparationControl}
          disabled={disabled}
          value={member?.id ?? ""}
          onChange={(event) => {
            setMember(
              members.data?.items.find(
                (row) => row.id === event.target.value
              ) ?? null
            );
            setTargetCursors([undefined]);
          }}
        >
          <option value="">Choose a file to browse</option>
          {members.data?.items.map((row) => (
            <option key={row.id} value={row.id}>
              {row.relativePath ?? row.originalFileName ?? "Unnamed file"} ·{" "}
              {row.role.toLowerCase()}
            </option>
          ))}
        </select>
      </label>
      <Problem error={members.error} />
      <Pager
        name="target files"
        cursors={cursors}
        next={members.data?.nextCursor?.afterId}
        disabled={disabled || members.isFetching}
        onChange={setCursors}
      />
      {member && (
        <>
          <label className="block space-y-2 text-sm">
            <span className="font-medium">
              {kind === "JOIN"
                ? "Inspected target table"
                : "Dictionary file or inspected archive entry"}
            </span>
            <select
              className={preparationControl}
              disabled={disabled || !targets.data}
              value=""
              onChange={(event) => {
                const row = targets.data?.items.find(
                  (row) => row.id === event.target.value
                );
                if (!row) return;
                const label =
                  `${member.relativePath ?? member.originalFileName ?? "Unnamed file"} · ${row.kind === "TABLE" ? (row.displayName ?? locationLabel(row.locator)) : locationLabel(row.locator)}`.slice(
                    0,
                    1_024
                  );
                if (definition.kind === "JOIN" && row.kind === "TABLE")
                  onChoose(
                    {
                      ...definition,
                      target: { memberId: member.id, tableId: row.id },
                      pairs: [],
                    },
                    label
                  );
                if (
                  definition.kind === "DICTIONARY" &&
                  row.kind === "DICTIONARY_FILE"
                )
                  onChoose(
                    {
                      ...definition,
                      state: "INCLUDED",
                      target: {
                        memberId: member.id,
                        logicalEntryId: row.logicalEntryId,
                      },
                    },
                    label
                  );
              }}
            >
              <option value="">Choose an exact target</option>
              {targets.data?.items.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.kind === "TABLE"
                    ? (row.displayName ?? locationLabel(row.locator))
                    : locationLabel(row.locator)}
                </option>
              ))}
            </select>
          </label>
          <Problem error={targets.error} />
          {targets.data?.items.length === 0 && (
            <p className="text-sm text-muted-foreground">
              {kind === "DICTIONARY"
                ? "No eligible dictionary in this file. Set the file purpose to documentation, or add its exact documentation relationship in Files & contents first. A ZIP by itself is packaging."
                : "This file has no eligible inspected tables."}
            </p>
          )}
          <Pager
            name="targets"
            cursors={targetCursors}
            next={targets.data?.nextCursor?.afterId}
            disabled={disabled || targets.isFetching}
            onChange={setTargetCursors}
          />
        </>
      )}
    </div>
  );
}

export function PreparationReferences(props: Props) {
  const actorId = useAuthStore((state) => state.user?.id);
  return (
    <ReferenceEditor
      key={actorId ?? "signed-out"}
      {...props}
      actorId={actorId}
    />
  );
}
function ReferenceEditor({
  basis,
  subject,
  active,
  canChange,
  pending,
  canInitializeFrozen,
  onDirtyChange,
  buildReferenceCommand,
  sendReferenceCommand,
  loadReferenceMembers,
  actorId,
}: Props & { actorId?: string }) {
  const restored = useReferencePlan(actorId, basis.preparationId);
  // Keep the raw field text while typing (including spaces), even when browser
  // storage rejects a write. Only the exact normalized saved plan is dispatched.
  const [buffer, setBuffer] = useState<ReferencePlan | null>(null);
  const plan =
    buffer &&
    restored.plan?.planId === buffer.planId &&
    restored.plan.phase === "EDITING"
      ? buffer
      : restored.plan;
  const [error, setError] = useState("");
  const [writing, setWriting] = useState(false);
  const [navigation, setNavigation] = useState<{
    key: string;
    cursors: (string | undefined)[];
  }>({ key: "", cursors: [undefined] });
  const [pairSource, setPairSource] = useState<Label | null>(null);
  const key = JSON.stringify([
    actorId,
    basis,
    subject?.memberId,
    subject?.tableId,
  ]);
  const cursors = navigation.key === key ? navigation.cursors : [undefined];
  const page = useQuery({
    ...options,
    queryKey: ["dataset-editable-references", key, cursors.at(-1)],
    enabled: active && Boolean(actorId && subject) && !plan,
    queryFn: ({ signal }) =>
      datasetReferencesApi.page(
        basis.preparationId,
        {
          ...queryBasis(basis),
          memberId: subject!.memberId,
          tableId: subject!.tableId,
          component: subject!.component,
          afterId: cursors.at(-1),
          limit: 5,
        },
        signal
      ),
  });
  const dirty = Boolean(plan || restored.error);
  useEffect(() => onDirtyChange(dirty), [dirty, onDirtyChange]);
  useEffect(() => () => onDirtyChange(false), [onDirtyChange]);
  const stale = Boolean(plan && !tablePageBasisMatches(plan.basis, basis));
  const locked =
    !active ||
    !canChange ||
    !actorId ||
    pending ||
    writing ||
    stale ||
    Boolean(restored.error) ||
    plan?.phase !== "EDITING";
  function attempt(action: () => void) {
    try {
      action();
      setError("");
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Your reference answers could not be retained. Keep this page open."
      );
    }
  }
  function update(
    definition: Definition,
    extra: Label[] = [],
    targetLabel = plan?.targetLabel ?? null
  ) {
    if (!plan || locked) return;
    const ids = selectedIds(definition),
      labels = new Map([...plan.labels, ...extra].map((row) => [row.id, row]));
    const next = {
      ...plan,
      definition,
      labels: [...ids].map((id) => labels.get(id)!),
      targetLabel,
    };
    setBuffer(next);
    attempt(() => {
      storeReferencePlan(next);
    });
  }
  function begin(
    kind: Definition["kind"],
    row?: DatasetTableReferencesPageResponse["items"][number]
  ) {
    if (
      !actorId ||
      !subject ||
      !page.data ||
      !canChange ||
      pending ||
      plan ||
      (page.data.frozen && !canInitializeFrozen)
    )
      return;
    attempt(() => {
      storeReferencePlan({
        version: 1,
        planId: crypto.randomUUID(),
        actorId,
        draftId: basis.preparationId,
        basis,
        subject,
        referenceId: row?.id ?? null,
        definition: row?.definition ?? emptyDefinition(kind),
        labels: row?.columns ?? [],
        targetLabel: row?.targetLabel ?? null,
        phase: "EDITING",
        command: null,
        acknowledgement: null,
      });
      setBuffer(null);
      setPairSource(null);
    });
  }
  async function save(remove = false) {
    if (!plan || locked) return;
    let command: DatasetReferenceCommand;
    try {
      command = buildReferenceCommand(
        plan.basis,
        remove && plan.referenceId
          ? [{ operation: "REMOVE_REFERENCE", referenceId: plan.referenceId }]
          : [
              {
                operation: "PUT_REFERENCE",
                ...(plan.referenceId ? { referenceId: plan.referenceId } : {}),
                memberId: plan.subject.memberId,
                tableId: plan.subject.tableId,
                definition: plan.definition,
              },
            ],
        crypto.randomUUID()
      );
      command = storeReferencePlan({
        ...plan,
        phase: "PENDING",
        command,
      }).command!;
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Your answers could not be retained."
      );
      return;
    }
    await send(command);
  }
  async function send(command: DatasetReferenceCommand, replay = false) {
    setWriting(true);
    setError("");
    try {
      await sendReferenceCommand(command, replay);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "The reference save is unconfirmed. Keep the original request."
      );
    } finally {
      setWriting(false);
    }
  }
  const definition = plan?.definition;
  const labelFor = (id: string) => {
    const label = plan?.labels.find((row) => row.id === id);
    return label ? columnLabel(label) : "Selected column";
  };
  return (
    <div className="min-w-0 space-y-4 border-t border-border pt-4">
      <div>
        <h3 className="font-medium">Keys, relationships & data dictionary</h3>
        <p className="text-sm text-muted-foreground">
          Describe how these tables fit together, when applicable. These are
          your declarations; selecting a key does not prove uniqueness. Save
          progressively, then complete any started references before submitting.
        </p>
      </div>
      <Problem error={error || restored.error} />
      {!plan && (
        <>
          <Problem error={page.error} />
          {!subject && (
            <p className="text-sm text-muted-foreground">
              Choose an inspected table above to describe its keys and
              relationships.
            </p>
          )}
          {page.isFetching && (
            <p role="status" className="text-sm">
              Loading references…
            </p>
          )}
          {page.data?.items.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No references declared for this table.
            </p>
          )}
          <ul className="divide-y divide-border">
            {page.data?.items.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <span className="break-words text-sm">
                  {definitionName(row.definition)}
                  {row.definition.kind !== "DICTIONARY" && row.definition.label
                    ? ` · ${row.definition.label}`
                    : ""}
                  {row.targetLabel ? ` · ${row.targetLabel}` : ""}
                </span>
                <DashboardButton
                  type="button"
                  variant="outline"
                  disabled={
                    !canChange ||
                    pending ||
                    writing ||
                    (page.data!.frozen && !canInitializeFrozen)
                  }
                  onClick={() => begin(row.definition.kind, row)}
                >
                  Edit reference
                </DashboardButton>
              </li>
            ))}
          </ul>
          {subject && (
            <>
              <Pager
                name="references"
                cursors={cursors}
                next={page.data?.nextCursor?.afterId}
                disabled={pending || page.isFetching}
                onChange={(cursors) => setNavigation({ key, cursors })}
              />
              <div className="flex flex-wrap gap-2">
                {(["KEY", "JOIN", "DICTIONARY"] as const).map((kind) => (
                  <DashboardButton
                    key={kind}
                    type="button"
                    variant="outline"
                    disabled={
                      !canChange ||
                      !page.data ||
                      pending ||
                      writing ||
                      (page.data.frozen && !canInitializeFrozen)
                    }
                    onClick={() => begin(kind)}
                  >
                    Add{" "}
                    {kind === "KEY"
                      ? "key"
                      : kind === "JOIN"
                        ? "relationship"
                        : "dictionary answer"}
                  </DashboardButton>
                ))}
              </div>
            </>
          )}
        </>
      )}
      {plan && definition && (
        <div className="min-w-0 space-y-4">
          <p className="break-words text-sm font-medium">
            {plan.subject.component === "FULL" ? "Full dataset" : "Sample"} ·{" "}
            {plan.subject.fileName} · {plan.subject.tableName} ·{" "}
            {definitionName(definition)}
          </p>
          {stale && plan.phase === "EDITING" && (
            <p role="alert" className="text-sm">
              The Dataset changed. Your original answers remain here. Discard
              this unsaved edit and reopen the current table to make a new
              change.
            </p>
          )}
          {definition.kind === "KEY" && (
            <>
              <PreparationSelect
                label="Key type"
                value={definition.keyKind}
                options={[
                  ["PRIMARY", "Primary key"],
                  ["UNIQUE", "Unique key"],
                ]}
                disabled={locked}
                onChange={(value) =>
                  update({
                    ...definition,
                    keyKind: value as typeof definition.keyKind,
                  })
                }
              />
              <ol className="list-decimal space-y-2 pl-5">
                {definition.columnIds.map((id, index) => (
                  <li key={id} className="break-words text-sm">
                    {labelFor(id)}{" "}
                    <DashboardButton
                      type="button"
                      variant="outline"
                      disabled={locked}
                      onClick={() =>
                        update({
                          ...definition,
                          columnIds: definition.columnIds.filter(
                            (_, i) => i !== index
                          ),
                        })
                      }
                    >
                      Remove key column {index + 1}
                    </DashboardButton>
                  </li>
                ))}
              </ol>
              <ColumnPicker
                key={`${plan.planId}:key`}
                basis={plan.basis}
                memberId={plan.subject.memberId}
                tableId={plan.subject.tableId}
                name="Add key column in order"
                disabled={locked || definition.columnIds.length >= 16}
                onChoose={(column) => {
                  if (!definition.columnIds.includes(column.id))
                    update(
                      {
                        ...definition,
                        columnIds: [...definition.columnIds, column.id],
                      },
                      [column]
                    );
                }}
              />
            </>
          )}
          {definition.kind === "JOIN" && (
            <>
              <TargetPicker
                key={plan.planId}
                plan={plan}
                disabled={locked}
                loadMembers={loadReferenceMembers}
                onChoose={(value, label) => {
                  update(value, [], label);
                  setPairSource(null);
                }}
              />
              <PreparationSelect
                label="Relationship cardinality"
                value={definition.cardinality}
                options={[
                  ["ONE_TO_ONE", "One to one"],
                  ["ONE_TO_MANY", "One to many"],
                  ["MANY_TO_ONE", "Many to one"],
                  ["MANY_TO_MANY", "Many to many"],
                  ["UNKNOWN", "Unknown"],
                ]}
                disabled={locked}
                onChange={(value) =>
                  update({
                    ...definition,
                    cardinality: value as typeof definition.cardinality,
                  })
                }
              />
              <ol className="list-decimal space-y-2 pl-5">
                {definition.pairs.map((pair, index) => (
                  <li key={pair.sourceColumnId} className="break-words text-sm">
                    {labelFor(pair.sourceColumnId)} →{" "}
                    {labelFor(pair.targetColumnId)}{" "}
                    <DashboardButton
                      type="button"
                      variant="outline"
                      disabled={locked}
                      onClick={() =>
                        update({
                          ...definition,
                          pairs: definition.pairs.filter((_, i) => i !== index),
                        })
                      }
                    >
                      Remove pair {index + 1}
                    </DashboardButton>
                  </li>
                ))}
              </ol>
              {definition.target && (
                <div className="grid min-w-0 gap-4 sm:grid-cols-2">
                  <ColumnPicker
                    key={`${plan.planId}:source`}
                    basis={plan.basis}
                    memberId={plan.subject.memberId}
                    tableId={plan.subject.tableId}
                    name="Choose source column for next pair"
                    disabled={locked || definition.pairs.length >= 16}
                    onChoose={setPairSource}
                  />
                  <ColumnPicker
                    key={`${plan.planId}:${definition.target.memberId}:${definition.target.tableId}`}
                    basis={plan.basis}
                    memberId={definition.target.memberId}
                    tableId={definition.target.tableId}
                    name="Choose matching target column"
                    disabled={
                      locked || !pairSource || definition.pairs.length >= 16
                    }
                    onChoose={(target) => {
                      if (!pairSource) return;
                      if (
                        definition.pairs.some(
                          (pair) =>
                            pair.sourceColumnId === pairSource.id ||
                            pair.targetColumnId === target.id
                        )
                      ) {
                        setError(
                          "Each source and target column can appear once in a composite relationship."
                        );
                        return;
                      }
                      update(
                        {
                          ...definition,
                          pairs: [
                            ...definition.pairs,
                            {
                              sourceColumnId: pairSource.id,
                              targetColumnId: target.id,
                            },
                          ],
                        },
                        [pairSource, target]
                      );
                      setPairSource(null);
                    }}
                  />
                  {pairSource && (
                    <p role="status" className="text-sm sm:col-span-2">
                      Next source: {columnLabel(pairSource)}. Choose its
                      matching target column.
                    </p>
                  )}
                </div>
              )}
            </>
          )}
          {definition.kind === "DICTIONARY" && (
            <>
              <PreparationSelect
                label="Is a data dictionary included?"
                value={definition.state}
                options={[
                  ["INCLUDED", "Included"],
                  ["NOT_INCLUDED", "Not included"],
                ]}
                disabled={locked}
                onChange={(value) =>
                  update(
                    {
                      ...definition,
                      state: value as typeof definition.state,
                      target: null,
                    },
                    [],
                    null
                  )
                }
              />
              {definition.state === "INCLUDED" && (
                <TargetPicker
                  key={plan.planId}
                  plan={plan}
                  disabled={locked}
                  loadMembers={loadReferenceMembers}
                  onChoose={(value, label) => update(value, [], label)}
                />
              )}
            </>
          )}
          {definition.kind !== "DICTIONARY" && (
            <PreparationField
              label="Reference label"
              value={definition.label}
              maxLength={200}
              multiline={false}
              disabled={locked}
              onChange={(label) => update({ ...definition, label })}
            />
          )}
          <PreparationField
            label="Reference notes"
            value={definition.notes}
            maxLength={2000}
            disabled={locked}
            onChange={(notes) => update({ ...definition, notes })}
          />
          {plan.phase === "PENDING" && (
            <div className="space-y-2">
              <p role="status" className="text-sm">
                This save is unconfirmed. Confirm the original request before
                making another change.
              </p>
              <DashboardButton
                type="button"
                disabled={writing || !actorId}
                onClick={() => plan.command && void send(plan.command, true)}
              >
                Confirm reference save
              </DashboardButton>
            </div>
          )}
          {plan.phase === "ACKNOWLEDGED" && (
            <p role="status" className="text-sm">
              Reference change confirmed. Close this saved edit to browse the
              current references.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {plan.phase === "EDITING" && (
              <>
                <DashboardButton
                  type="button"
                  disabled={locked}
                  onClick={() => void save()}
                >
                  Save reference
                </DashboardButton>
                {plan.referenceId && (
                  <DashboardButton
                    type="button"
                    variant="outline"
                    disabled={locked}
                    onClick={() => void save(true)}
                  >
                    Remove this reference
                  </DashboardButton>
                )}
              </>
            )}
            {plan.phase !== "PENDING" && (
              <DashboardButton
                type="button"
                variant="outline"
                disabled={writing || pending}
                onClick={() =>
                  attempt(() => {
                    clearReferencePlan(plan);
                    setPairSource(null);
                    void page.refetch();
                  })
                }
              >
                {plan.phase === "ACKNOWLEDGED"
                  ? "Close saved reference"
                  : "Discard unsaved reference edit"}
              </DashboardButton>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Selections on other pages remain selected. Removing a reference
            changes that declaration only; it does not remove any files.
          </p>
        </div>
      )}
    </div>
  );
}
