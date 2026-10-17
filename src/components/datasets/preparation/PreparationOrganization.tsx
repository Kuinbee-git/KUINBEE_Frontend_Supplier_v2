"use client";

import { useEffect, useId, useMemo, useState } from "react";
import {
  DatasetMaterialMutationResponseSchema,
  type DatasetFilesInventoryPageResponse,
  type DatasetFilesMutationBody,
  type DatasetFilesOrganizationPageResponse,
  type DatasetFilesOrganizationQuery,
} from "@kuinbee/dataset-preparation-contracts";
import { DashboardButton, DashboardInput } from "@/components/dashboard";
import { datasetFilesApi } from "@/lib/api/dataset-files";
import { preparationControl } from "./PreparationFields";

type Basis = Pick<
  DatasetFilesInventoryPageResponse,
  "preparationId" | "preparationGeneration" | "contentId" | "contentGeneration"
>;
type Item = DatasetFilesOrganizationPageResponse["items"][number];
type Member = Extract<Item, { kind: "MEMBER" }>;
type Group = Extract<Item, { kind: "GROUP" }>;
type Entry = Extract<Item, { kind: "ENTRY" }>;
type Relationship = Extract<Item, { kind: "RELATIONSHIP" }>;
type Area = "FULL" | "SAMPLE";
const roles = {
  PRIMARY: "Primary data",
  TRANSCRIPT: "Transcript",
  ANNOTATION: "Annotation",
  SENSOR: "Sensor data",
  CALIBRATION: "Calibration",
  DOCUMENTATION: "Documentation",
};
const relationships = {
  TRANSCRIPT_FOR: "Transcript for",
  ANNOTATION_FOR: "Annotation for",
  CALIBRATION_FOR: "Calibration for",
  SYNCHRONIZED_WITH: "Synchronized with",
  DOCUMENTATION_FOR: "Documentation for",
};
const keyOf = (basis: Basis) =>
  JSON.stringify([
    basis.preparationId,
    basis.preparationGeneration,
    basis.contentId,
    basis.contentGeneration,
  ]);
const fileName = (member: Member) =>
  member.relativePath ??
  member.originalFileName ??
  `File reference ${member.id.slice(-6)}`;
const entryName = (entry: Entry) =>
  entry.locator.kind === "ARCHIVE_ENTRY"
    ? entry.locator.path
    : `Sheet: ${entry.locator.sheetName}`;
function referenceName(value: Relationship["source"]) {
  const file =
    value.displayName ?? `File reference ${value.memberId.slice(-6)}`;
  const logical = value.logicalEntry?.locator;
  return logical
    ? `${file} / ${logical.kind === "ARCHIVE_ENTRY" ? logical.path : `Sheet: ${logical.sheetName}`}`
    : file;
}

// Every page is a read of one acknowledged basis. Old asynchronous results and
// continuation cursors are discarded when the basis/filter changes. No union of
// pages is ever sent back as a replacement selection.
function useOrganizationPage(
  basis: Basis,
  filters: Omit<
    DatasetFilesOrganizationQuery,
    | "contentId"
    | "contentGeneration"
    | "expectedPreparationGeneration"
    | "limit"
  >,
  enabled: boolean
) {
  const base = JSON.stringify({
    id: basis.preparationId,
    query: {
      ...filters,
      expectedPreparationGeneration: basis.preparationGeneration,
      contentId: basis.contentId,
      contentGeneration: basis.contentGeneration,
      limit: 20,
    },
  });
  const [navigation, setNavigation] = useState<{
    base: string;
    cursors: (string | undefined)[];
    index: number;
  }>({ base, cursors: [undefined], index: 0 });
  const index = navigation.base === base ? navigation.index : 0;
  const cursor =
    navigation.base === base ? navigation.cursors[index] : undefined;
  const requestKey = enabled
    ? JSON.stringify({ ...JSON.parse(base), afterId: cursor })
    : "null";
  const request = useMemo(
    () =>
      JSON.parse(requestKey) as {
        id: string;
        query: DatasetFilesOrganizationQuery;
        afterId?: string;
      } | null,
    [requestKey]
  );
  const [revision, setRevision] = useState(0);
  const viewKey = `${requestKey}:${revision}`;
  const [snapshot, setSnapshot] = useState<{
    key: string;
    loading: boolean;
    data: DatasetFilesOrganizationPageResponse | null;
    error: string;
  } | null>(null);
  useEffect(() => {
    if (!request) return;
    const controller = new AbortController();
    void datasetFilesApi
      .organization(
        request.id,
        {
          ...request.query,
          ...(request.afterId ? { afterId: request.afterId } : {}),
        },
        controller.signal
      )
      .then((data) => {
        if (!controller.signal.aborted)
          setSnapshot({ key: viewKey, loading: false, data, error: "" });
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setSnapshot({
            key: viewKey,
            loading: false,
            data: null,
            error:
              error instanceof Error
                ? error.message
                : "This file view could not be loaded.",
          });
      });
    return () => controller.abort();
  }, [request, viewKey]);
  const current = enabled && snapshot?.key === viewKey ? snapshot : null;
  return {
    data: current?.data ?? null,
    loading: enabled && (!current || current.loading),
    error: current?.error ?? "",
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
type Page = ReturnType<typeof useOrganizationPage>;
function PageControls({
  page,
  name,
  disabled,
}: {
  page: Page;
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
      {page.loading && <span role="status">Loading…</span>}
      {page.error && (
        <>
          <span role="alert" className="text-destructive">
            {page.error}
          </span>
          <DashboardButton
            type="button"
            variant="outline"
            disabled={disabled}
            onClick={page.refresh}
            aria-label={`Retry ${name}`}
          >
            Retry
          </DashboardButton>
        </>
      )}
    </div>
  );
}
function Select({
  label,
  value,
  options,
  onChange,
  disabled,
  selectedLabel,
  emptyLabel = "Choose…",
}: {
  label: string;
  value: string;
  options: { id: string; label: string }[];
  onChange: (id: string) => void;
  disabled: boolean;
  selectedLabel?: string;
  emptyLabel?: string;
}) {
  const id = useId();
  return (
    <div className="min-w-0 space-y-2">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <select
        id={id}
        className={preparationControl}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">{emptyLabel}</option>
        {value && !options.some((item) => item.id === value) && (
          <option value={value}>
            {selectedLabel ?? "Selected from another page"}
          </option>
        )}
        {options
          .filter((item) => item.id !== "")
          .map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
      </select>
    </div>
  );
}

type Location = { logicalEntryId: string | null; valid: boolean };
function ContainerTarget({
  basis,
  area,
  member,
  label,
  enabled,
  onChange,
}: {
  basis: Basis;
  area: Area;
  member: Member | null;
  label: string;
  enabled: boolean;
  onChange: (value: Location) => void;
}) {
  const prefix = useId();
  const [inside, setInside] = useState(false);
  const [inventory, setInventory] = useState("");
  const [inventoryLabel, setInventoryLabel] = useState("");
  const [selectedEntry, setSelectedEntry] = useState<{
    id: string;
    label: string;
  } | null>(null);
  const inventories = useOrganizationPage(
    basis,
    { section: "INVENTORIES", component: area, memberId: member?.id },
    enabled && inside && Boolean(member)
  );
  const entries = useOrganizationPage(
    basis,
    {
      section: "ENTRIES",
      component: area,
      memberId: member?.id,
      inventoryId: inventory || undefined,
    },
    enabled && inside && Boolean(member && inventory)
  );
  return (
    <div className="space-y-3">
      <label htmlFor={prefix} className="flex items-start gap-2 text-sm">
        <input
          id={prefix}
          type="checkbox"
          checked={inside}
          disabled={!enabled || !member}
          onChange={(event) => {
            setInside(event.target.checked);
            setInventory("");
            setSelectedEntry(null);
            onChange({ logicalEntryId: null, valid: !event.target.checked });
          }}
        />
        Select an item inside the {label.toLowerCase()} file
      </label>
      {inside && (
        <>
          <Select
            label={`${label} container inventory`}
            value={inventory}
            selectedLabel={inventoryLabel}
            disabled={!enabled || inventories.loading}
            options={(inventories.data?.items ?? []).flatMap((item) =>
              item.kind === "INVENTORY"
                ? [
                    {
                      id: item.id,
                      label: `Inspected ${new Date(item.sealedAt).toLocaleString()} · ${item.structuralDigest.slice(0, 8)}`,
                    },
                  ]
                : []
            )}
            onChange={(value) => {
              const selected = inventories.data?.items.find(
                (item) => item.kind === "INVENTORY" && item.id === value
              );
              setInventory(value);
              setInventoryLabel(
                selected?.kind === "INVENTORY"
                  ? `Inspected ${new Date(selected.sealedAt).toLocaleString()} · ${selected.structuralDigest.slice(0, 8)}`
                  : ""
              );
              setSelectedEntry(null);
              onChange({ logicalEntryId: null, valid: false });
            }}
          />
          <PageControls
            page={inventories}
            name={`${label.toLowerCase()} inventories`}
            disabled={!enabled}
          />
          {inventory && (
            <>
              <Select
                label={`${label} container item`}
                value={selectedEntry?.id ?? ""}
                selectedLabel={selectedEntry?.label}
                disabled={!enabled || entries.loading}
                options={(entries.data?.items ?? []).flatMap((item) =>
                  item.kind === "ENTRY"
                    ? [{ id: item.id, label: entryName(item) }]
                    : []
                )}
                onChange={(id) => {
                  const item = entries.data?.items.find(
                    (value) => value.kind === "ENTRY" && value.id === id
                  );
                  setSelectedEntry(
                    item?.kind === "ENTRY"
                      ? { id, label: entryName(item) }
                      : null
                  );
                  onChange({
                    logicalEntryId: id || null,
                    valid: Boolean(item),
                  });
                }}
              />
              <PageControls
                page={entries}
                name={`${label.toLowerCase()} entries`}
                disabled={!enabled}
              />
            </>
          )}
          {!inventories.loading && inventories.data?.items.length === 0 && (
            <p className="text-xs text-muted-foreground">
              No sealed container inventory is available for this file.
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            This identifies a relationship inside the file. Download access
            still applies to the complete uploaded file.
          </p>
        </>
      )}
    </div>
  );
}

export function PreparationOrganization({
  basis,
  active,
  canChange,
  hasFull,
  hasSample,
  mutate,
  onDirtyChange,
}: {
  basis: Basis;
  active: boolean;
  canChange: boolean;
  hasFull: boolean;
  hasSample: boolean;
  onDirtyChange: (value: boolean) => void;
  mutate: (
    basis: Basis,
    operations: DatasetFilesMutationBody["operations"]
  ) => Promise<unknown>;
}) {
  const [editingKey, setEditingKey] = useState(() => keyOf(basis));
  const [area, setArea] = useState<Area>(hasFull ? "FULL" : "SAMPLE");
  const [sourceId, setSourceId] = useState("");
  const [targetId, setTargetId] = useState("");
  const [selectedRole, setSelectedRole] = useState<Member["role"]>("PRIMARY");
  const [fileGroupId, setFileGroupId] = useState("");
  const [groupId, setGroupId] = useState("");
  const [groupHint, setGroupHint] = useState<{
    id: string;
    label: string;
    scope: string;
  } | null>(null);
  const [fileGroupHint, setFileGroupHint] = useState<typeof groupHint>(null);
  const [fileBaseline, setFileBaseline] = useState<{
    role: Member["role"];
    groupId: string;
  } | null>(null);
  const [resetNonce, setResetNonce] = useState(0);
  const [newGroup, setNewGroup] = useState("");
  const [renameGroup, setRenameGroup] = useState("");
  const [kind, setKind] = useState<Relationship["relationship"] | "">("");
  const [required, setRequired] = useState(true);
  const [sourceLocation, setSourceLocation] = useState<Location>({
    logicalEntryId: null,
    valid: true,
  });
  const [targetLocation, setTargetLocation] = useState<Location>({
    logicalEntryId: null,
    valid: true,
  });
  const hasIntent = Boolean(sourceId || targetId || groupId || newGroup);
  // The saved upload choice arrives asynchronously. Correct only an unused
  // default; never move a supplier's unapplied organization to another area.
  if (
    !hasIntent &&
    (hasFull || hasSample) &&
    (area === "FULL" ? !hasFull : !hasSample)
  )
    setArea(hasFull ? "FULL" : "SAMPLE");
  const changed = hasIntent && editingKey !== keyOf(basis);
  const enabled = active && !changed;
  const groups = useOrganizationPage(
    basis,
    { section: "GROUPS", component: area },
    enabled
  );
  const sources = useOrganizationPage(
    basis,
    { section: "MEMBERS", component: area },
    enabled
  );
  const targets = useOrganizationPage(
    basis,
    { section: "MEMBERS", component: area },
    enabled && Boolean(sourceId)
  );
  const sourcePage = useOrganizationPage(
    basis,
    { section: "MEMBERS", component: area, memberId: sourceId || undefined },
    enabled && Boolean(sourceId)
  );
  const targetPage = useOrganizationPage(
    basis,
    { section: "MEMBERS", component: area, memberId: targetId || undefined },
    enabled && Boolean(targetId)
  );
  const links = useOrganizationPage(
    basis,
    {
      section: "RELATIONSHIPS",
      component: area,
      memberId: sourceId || undefined,
    },
    enabled && Boolean(sourceId)
  );
  const source = sourcePage.data?.items.find(
    (item) => item.kind === "MEMBER" && item.id === sourceId
  );
  const target = targetPage.data?.items.find(
    (item) => item.kind === "MEMBER" && item.id === targetId
  );
  const sourceFile = source?.kind === "MEMBER" ? source : null;
  const targetFile = target?.kind === "MEMBER" ? target : null;
  const groupRows = (groups.data?.items ?? []).filter(
    (item): item is Group => item.kind === "GROUP"
  );
  const knownGroups = [...groupRows];
  for (const value of [
    sourceFile?.group,
    groupHint?.scope === keyOf(basis) ? groupHint : null,
    fileGroupHint?.scope === keyOf(basis) ? fileGroupHint : null,
  ])
    if (value && !knownGroups.some((item) => item.id === value.id))
      knownGroups.push({ ...value, kind: "GROUP", component: area });
  const canWrite = active && canChange && !changed;
  const currentGroup = knownGroups.find((item) => item.id === groupId);
  const selectedGroup = knownGroups.find((item) => item.id === fileGroupId);
  const baseline = sourceFile
    ? { role: sourceFile.role, groupId: sourceFile.group?.id ?? "" }
    : fileBaseline;
  const fileDirty = Boolean(
    sourceId &&
    baseline &&
    (selectedRole !== baseline.role || fileGroupId !== baseline.groupId)
  );
  const relationshipDirty = Boolean(
    kind || targetId || !sourceLocation.valid || sourceLocation.logicalEntryId
  );
  const renameDirty = Boolean(
    groupId && renameGroup !== (currentGroup?.label ?? groupHint?.label ?? "")
  );
  const unsaved = Boolean(
    newGroup || fileDirty || relationshipDirty || renameDirty
  );
  useEffect(() => {
    onDirtyChange(unsaved);
  }, [onDirtyChange, unsaved]);
  useEffect(() => () => onDirtyChange(false), [onDirtyChange]);
  function confirmDiscard(condition: boolean) {
    return (
      !condition ||
      window.confirm(
        "Discard the unapplied file organization changes before changing this selection?"
      )
    );
  }
  async function run(operations: DatasetFilesMutationBody["operations"]) {
    if (!canWrite) return null;
    const result = await mutate(basis, operations);
    if (!result) return null;
    const ack = DatasetMaterialMutationResponseSchema.parse(result);
    const acknowledgedKey = keyOf({
      ...basis,
      contentId: ack.contentId,
      contentGeneration: ack.generation,
    });
    setEditingKey(acknowledgedKey);
    for (const [hint, setHint] of [
      [groupHint, setGroupHint],
      [fileGroupHint, setFileGroupHint],
    ] as const)
      if (hint?.scope === keyOf(basis))
        setHint({ ...hint, scope: acknowledgedKey });
    if (
      operations.some(
        (item) =>
          item.operation === "SET_MEMBER_ROLE" ||
          item.operation === "SET_MEMBER_GROUP"
      )
    )
      setFileBaseline({ role: selectedRole, groupId: fileGroupId });
    return ack;
  }
  function resetTargets() {
    setSourceId("");
    setTargetId("");
    setGroupId("");
    setGroupHint(null);
    setFileGroupId("");
    setFileGroupHint(null);
    setFileBaseline(null);
    setKind("");
    setRequired(true);
    setResetNonce((value) => value + 1);
    setSourceLocation({ logicalEntryId: null, valid: true });
    setTargetLocation({ logicalEntryId: null, valid: true });
  }
  const options = (page: Page) =>
    (page.data?.items ?? []).flatMap((item) => {
      if (item.kind !== "MEMBER") return [];
      const duplicate =
        page.data!.items.filter(
          (other) =>
            other.kind === "MEMBER" && fileName(other) === fileName(item)
        ).length > 1;
      return [
        {
          id: item.id,
          label: `${fileName(item)}${duplicate ? ` · ${item.id.slice(-6)}` : ""}`,
        },
      ];
    });
  const sameTarget =
    sourceId === targetId &&
    sourceLocation.logicalEntryId === targetLocation.logicalEntryId;
  const groupNameId = useId(),
    renameId = useId(),
    requiredId = useId();
  return (
    <section
      aria-label="Organize selected files"
      className="col-span-full min-w-0 space-y-5 border-t border-border pt-5"
    >
      <div className="space-y-2">
        <h3 className="text-base font-semibold">Organize selected files</h3>
        <p className="text-sm text-muted-foreground">
          Use groups when files belong to a session or set. Connect transcripts,
          annotations and calibration files to the material they describe.
        </p>
        {changed && (
          <div role="status" className="space-y-2 text-sm">
            <p>
              The file view changed. Your unapplied input is kept. Load the
              current view and check the selected files and groups before
              applying it.
            </p>
            <DashboardButton
              type="button"
              variant="outline"
              disabled={!active || !canChange}
              onClick={() => {
                setEditingKey(keyOf(basis));
              }}
            >
              Use refreshed file view
            </DashboardButton>
          </div>
        )}
        <Select
          label="Organize area"
          value={area}
          disabled={!canWrite}
          options={[
            ...(hasFull ? [{ id: "FULL", label: "Full dataset" }] : []),
            ...(hasSample ? [{ id: "SAMPLE", label: "Sample" }] : []),
          ]}
          onChange={(value) => {
            if (!confirmDiscard(fileDirty || relationshipDirty || renameDirty))
              return;
            setEditingKey(keyOf(basis));
            setArea(value as Area);
            resetTargets();
            setRenameGroup("");
          }}
        />
        {unsaved && (
          <div
            className="flex flex-wrap items-center gap-3 text-sm"
            role="status"
          >
            <p>
              File organization input is not applied yet. Use its action below
              before submitting.
            </p>
            <DashboardButton
              type="button"
              variant="outline"
              onClick={() => {
                if (!confirmDiscard(true)) return;
                resetTargets();
                setNewGroup("");
                setRenameGroup("");
                setEditingKey(keyOf(basis));
              }}
            >
              Discard organization input
            </DashboardButton>
          </div>
        )}
      </div>
      <div className="grid min-w-0 gap-5 lg:grid-cols-2">
        <div className="min-w-0 space-y-3">
          <h4 className="text-sm font-semibold">File groups</h4>
          <div className="space-y-2">
            <label htmlFor={groupNameId} className="text-sm">
              New group name
            </label>
            <DashboardInput
              id={groupNameId}
              value={newGroup}
              maxLength={200}
              disabled={!canWrite}
              onChange={(event) => {
                setEditingKey(keyOf(basis));
                setNewGroup(event.target.value);
              }}
            />
            <DashboardButton
              type="button"
              variant="outline"
              disabled={!canWrite || !newGroup.trim()}
              onClick={() => {
                void (async () => {
                  const label = newGroup.trim();
                  const ack = await run([
                    { operation: "ADD_GROUP", component: area, label },
                  ]);
                  if (ack) {
                    const id = ack.results[0]!.id;
                    setGroupId(id);
                    setGroupHint({
                      id,
                      label,
                      scope: keyOf({
                        ...basis,
                        contentGeneration: ack.generation,
                      }),
                    });
                    setRenameGroup(label);
                    setNewGroup("");
                  }
                })();
              }}
            >
              Add group
            </DashboardButton>
          </div>
          <Select
            label="Existing group"
            value={groupId}
            selectedLabel={
              groupHint?.id === groupId ? groupHint.label : undefined
            }
            disabled={!canWrite || groups.loading}
            options={groupRows.map((item) => ({
              id: item.id,
              label: item.label,
            }))}
            onChange={(id) => {
              if (!confirmDiscard(renameDirty)) return;
              setEditingKey(keyOf(basis));
              setGroupId(id);
              const group = groupRows.find((item) => item.id === id);
              setGroupHint(group ? { ...group, scope: keyOf(basis) } : null);
              setRenameGroup(group?.label ?? "");
            }}
          />
          <PageControls page={groups} name="groups" disabled={!canWrite} />
          {groupId && (
            <div className="space-y-2">
              <label htmlFor={renameId} className="text-sm">
                Group name
              </label>
              <DashboardInput
                id={renameId}
                value={renameGroup}
                maxLength={200}
                disabled={!canWrite}
                onChange={(event) => setRenameGroup(event.target.value)}
              />
              <div className="flex flex-wrap gap-2">
                <DashboardButton
                  type="button"
                  variant="outline"
                  disabled={
                    !canWrite ||
                    !currentGroup ||
                    !renameGroup.trim() ||
                    renameGroup === currentGroup.label
                  }
                  onClick={() => {
                    void (async () => {
                      const label = renameGroup.trim();
                      const ack = await run([
                        { operation: "RENAME_GROUP", groupId, label },
                      ]);
                      if (ack) {
                        const hint = {
                          id: groupId,
                          label,
                          scope: keyOf({
                            ...basis,
                            contentGeneration: ack.generation,
                          }),
                        };
                        setGroupHint(hint);
                        setRenameGroup(label);
                        if (fileGroupHint?.id === groupId)
                          setFileGroupHint(hint);
                      }
                    })();
                  }}
                >
                  Rename group
                </DashboardButton>
                <DashboardButton
                  type="button"
                  variant="outline"
                  disabled={!canWrite || !currentGroup}
                  onClick={() => {
                    void (async () => {
                      if (await run([{ operation: "REMOVE_GROUP", groupId }])) {
                        setGroupId("");
                        setGroupHint(null);
                        setRenameGroup("");
                      }
                    })();
                  }}
                >
                  Remove group
                </DashboardButton>
              </div>
              <p className="text-xs text-muted-foreground">
                Clear the group on each assigned file before removing it.
              </p>
            </div>
          )}
        </div>
        <div className="min-w-0 space-y-3">
          <h4 className="text-sm font-semibold">File purpose and group</h4>
          <Select
            label="File to organize"
            value={sourceId}
            selectedLabel={sourceFile ? fileName(sourceFile) : undefined}
            options={options(sources)}
            disabled={!canWrite || sources.loading}
            onChange={(id) => {
              if (!confirmDiscard(fileDirty || relationshipDirty)) return;
              setEditingKey(keyOf(basis));
              const member = sources.data?.items.find(
                (item) => item.kind === "MEMBER" && item.id === id
              );
              setSourceId(id);
              setTargetId("");
              setKind("");
              setResetNonce((value) => value + 1);
              setSourceLocation({ logicalEntryId: null, valid: true });
              setTargetLocation({ logicalEntryId: null, valid: true });
              if (member?.kind === "MEMBER") {
                setSelectedRole(member.role);
                setFileGroupId(member.group?.id ?? "");
                setFileGroupHint(
                  member.group ? { ...member.group, scope: keyOf(basis) } : null
                );
                setFileBaseline({
                  role: member.role,
                  groupId: member.group?.id ?? "",
                });
              }
            }}
          />
          <PageControls
            page={sources}
            name="source files"
            disabled={!canWrite}
          />
          {sourcePage.error && (
            <p role="alert" className="text-sm text-destructive">
              {sourcePage.error}
            </p>
          )}
          {sourceFile && (
            <>
              <Select
                label="Selected file purpose"
                value={selectedRole}
                disabled={!canWrite || sourcePage.loading}
                options={Object.entries(roles).map(([id, label]) => ({
                  id,
                  label,
                }))}
                onChange={(role) => setSelectedRole(role as Member["role"])}
              />
              <Select
                label="Selected file group"
                value={fileGroupId}
                emptyLabel="No group"
                selectedLabel={selectedGroup?.label ?? fileGroupHint?.label}
                disabled={!canWrite || sourcePage.loading}
                options={knownGroups.map((item) => ({
                  id: item.id,
                  label: item.label,
                }))}
                onChange={(id) => {
                  setFileGroupId(id);
                  const group = knownGroups.find((item) => item.id === id);
                  setFileGroupHint(
                    group ? { ...group, scope: keyOf(basis) } : null
                  );
                }}
              />
              <DashboardButton
                type="button"
                variant="outline"
                disabled={
                  !canWrite ||
                  sourcePage.loading ||
                  Boolean(fileGroupId && !selectedGroup) ||
                  (selectedRole === sourceFile.role &&
                    fileGroupId === (sourceFile.group?.id ?? ""))
                }
                onClick={() => {
                  const operations: DatasetFilesMutationBody["operations"] = [];
                  if (selectedRole !== sourceFile.role)
                    operations.push({
                      operation: "SET_MEMBER_ROLE",
                      memberId: sourceFile.id,
                      role: selectedRole,
                    });
                  if (fileGroupId !== (sourceFile.group?.id ?? ""))
                    operations.push({
                      operation: "SET_MEMBER_GROUP",
                      memberId: sourceFile.id,
                      groupId: fileGroupId || null,
                    });
                  if (operations.length) void run(operations);
                }}
              >
                Save file details
              </DashboardButton>
            </>
          )}
        </div>
      </div>
      {sourceId && (
        <div className="space-y-4 border-t border-border pt-4">
          <h4 className="text-sm font-semibold">Companion relationships</h4>
          <p className="text-sm text-muted-foreground">
            Both sides must be included in{" "}
            {area === "FULL" ? "Full dataset" : "Sample"}. Changing a purpose
            can leave relationships to correct before submission.
          </p>
          <div className="grid min-w-0 gap-5 lg:grid-cols-2">
            <div className="min-w-0 space-y-3">
              <p className="break-words text-sm font-medium">
                From:{" "}
                {sourceFile
                  ? fileName(sourceFile)
                  : `File reference ${sourceId.slice(-6)}`}
              </p>
              <ContainerTarget
                key={`source-${sourceId}-${resetNonce}`}
                basis={basis}
                area={area}
                member={sourceFile}
                label="Source"
                enabled={canWrite && !sourcePage.loading && Boolean(sourceFile)}
                onChange={setSourceLocation}
              />
              <Select
                label="Relationship purpose"
                value={kind}
                options={Object.entries(relationships).map(([id, label]) => ({
                  id,
                  label,
                }))}
                disabled={!canWrite}
                onChange={(value) => setKind(value as typeof kind)}
              />
            </div>
            <div className="min-w-0 space-y-3">
              <Select
                label="Related material"
                value={targetId}
                selectedLabel={targetFile ? fileName(targetFile) : undefined}
                options={options(targets)}
                disabled={!canWrite || targets.loading}
                onChange={(id) => {
                  setTargetId(id);
                  setTargetLocation({ logicalEntryId: null, valid: true });
                }}
              />
              <PageControls
                page={targets}
                name="related files"
                disabled={!canWrite}
              />
              {targetPage.error && (
                <p role="alert" className="text-sm text-destructive">
                  {targetPage.error}
                </p>
              )}
              {targetId && (
                <ContainerTarget
                  key={`target-${targetId}-${resetNonce}`}
                  basis={basis}
                  area={area}
                  member={targetFile}
                  label="Related"
                  enabled={
                    canWrite && !targetPage.loading && Boolean(targetFile)
                  }
                  onChange={setTargetLocation}
                />
              )}
            </div>
          </div>
          <label
            htmlFor={requiredId}
            className="flex items-start gap-2 text-sm"
          >
            <input
              id={requiredId}
              type="checkbox"
              checked={required}
              disabled={!canWrite}
              onChange={(event) => setRequired(event.target.checked)}
            />
            Required to interpret the main data
          </label>
          <p className="text-xs text-muted-foreground">
            Turn this off for optional context. The connected files remain
            included in this area.
          </p>
          {targetFile && sameTarget && (
            <p className="text-sm text-muted-foreground">
              Choose another file or a different item inside the container.
            </p>
          )}
          <DashboardButton
            type="button"
            variant="outline"
            disabled={
              !canWrite ||
              !kind ||
              !sourceFile ||
              !targetFile ||
              sourcePage.loading ||
              targetPage.loading ||
              !sourceLocation.valid ||
              !targetLocation.valid ||
              sameTarget
            }
            onClick={() => {
              if (kind && sourceFile && targetFile)
                void (async () => {
                  const ack = await run([
                    {
                      operation: "ADD_LINK",
                      component: area,
                      kind,
                      required,
                      source: {
                        memberId: sourceFile.id,
                        logicalEntryId: sourceLocation.logicalEntryId,
                      },
                      target: {
                        memberId: targetFile.id,
                        logicalEntryId: targetLocation.logicalEntryId,
                      },
                    },
                  ]);
                  if (ack) {
                    setKind("");
                    setTargetId("");
                    setSourceLocation({ logicalEntryId: null, valid: true });
                    setTargetLocation({ logicalEntryId: null, valid: true });
                    setResetNonce((value) => value + 1);
                  }
                })();
            }}
          >
            Add relationship
          </DashboardButton>
          <ul
            className="divide-y divide-border"
            aria-label="Selected file relationships"
          >
            {(links.data?.items ?? []).flatMap((item) =>
              item.kind === "RELATIONSHIP"
                ? [
                    <li
                      key={item.id}
                      className="flex min-w-0 flex-wrap items-start justify-between gap-3 py-3"
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="text-sm font-medium">
                          {relationships[item.relationship]} ·{" "}
                          {item.required ? "Required" : "Optional"}
                        </p>
                        <p className="break-words text-sm text-muted-foreground [overflow-wrap:anywhere]">
                          {referenceName(item.source)} →{" "}
                          {referenceName(item.target)}
                        </p>
                      </div>
                      <DashboardButton
                        type="button"
                        variant="outline"
                        disabled={!canWrite || links.loading}
                        onClick={() => {
                          void run([
                            { operation: "REMOVE_LINK", linkId: item.id },
                          ]);
                        }}
                      >
                        Remove relationship
                      </DashboardButton>
                    </li>,
                  ]
                : []
            )}
          </ul>
          {!links.loading && links.data?.items.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No relationships for this file.
            </p>
          )}
          <PageControls
            page={links}
            name="relationships"
            disabled={!canWrite}
          />
        </div>
      )}
    </section>
  );
}
