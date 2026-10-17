"use client";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type {
  DatasetFilesInventoryPageResponse,
  DatasetPreparationResponse,
  DatasetTableDescriptionsMutationBody,
} from "@kuinbee/dataset-preparation-contracts";
import { DashboardButton } from "@/components/dashboard";
import type { DatasetEditBase } from "@/lib/api/dataset-workflow";
import { datasetTableMetadataApi } from "@/lib/api/dataset-table-metadata";
import {
  readDatasetUploadCommand,
  storeDatasetUploadCommand,
  clearDatasetUploadCommand,
  dispatchDatasetUploadCommand,
  ambiguousDatasetUploadFailure,
  type DatasetUploadCommand,
} from "@/lib/datasets/dataset-upload-commands";
import { useAuthStore } from "@/store/auth.store";
import { PreparationTables } from "./PreparationTables";
import { preparationControl } from "./PreparationFields";

type Basis = Pick<
  DatasetFilesInventoryPageResponse,
  "preparationId" | "preparationGeneration" | "contentId" | "contentGeneration"
>;
export function PreparationManagedTables({
  saved,
  base,
  active,
  blocked,
  metadataDirty,
  onWritingChange,
  onUncertainChange,
  onDirtyChange,
  onAccepted,
}: {
  saved: DatasetPreparationResponse;
  base: DatasetEditBase | null;
  active: boolean;
  blocked: boolean;
  metadataDirty: boolean;
  onWritingChange: (value: boolean) => void;
  onUncertainChange: (value: boolean) => void;
  onDirtyChange: (value: boolean) => void;
  onAccepted: () => Promise<void>;
}) {
  const actorId = useAuthStore((state) => state.user?.id);
  const [restored] = useState(() => {
    try {
      return { command: readDatasetUploadCommand(saved.id), ready: true };
    } catch {
      return { command: null, ready: false };
    }
  });
  const [pending, setPending] = useState<DatasetUploadCommand | null>(
    restored.command
  );
  const pendingRef = useRef<DatasetUploadCommand | null>(restored.command),
    busy = useRef(false);
  const [writing, setWriting] = useState(false),
    [reconcile, setReconcile] = useState(false),
    [dirty, setDirty] = useState(false);
  const [error, setError] = useState(
    restored.ready
      ? ""
      : "This browser could not recover its saved file request. Table changes are paused."
  );
  const [notice, setNotice] = useState("");
  const [acknowledgement, setAcknowledgement] =
    useState<DatasetTableDescriptionsMutationBody | null>(null);
  const [chosenArea, setArea] = useState<"FULL" | "SAMPLE">("FULL");
  const allowed: ("FULL" | "SAMPLE")[] =
    base?.metadata.uploadChoice === "SAMPLE_ONLY"
      ? ["SAMPLE"]
      : base?.metadata.uploadChoice === "FULL_ONLY"
        ? ["FULL"]
        : ["FULL", "SAMPLE"];
  const area = allowed.includes(chosenArea) ? chosenArea : allowed[0];
  const reference = base?.contentReference;
  const basis: Basis | null = reference
    ? {
        preparationId: saved.id,
        preparationGeneration: base!.context.preparationGeneration,
        contentId: reference.contentId,
        contentGeneration: reference.generation,
      }
    : null;
  const key = JSON.stringify([
    actorId,
    basis,
    base?.context.workflowRevision,
    area,
  ]);
  const [navigation, setNavigation] = useState<{
    key: string;
    cursors: (string | undefined)[];
  }>({ key, cursors: [undefined] });
  const cursors = navigation.key === key ? navigation.cursors : [undefined];
  const fresh = Boolean(
    base &&
    basis &&
    base.context.datasetId === saved.id &&
    base.context.editable &&
    base.context.preparationGeneration === saved.generation
  );
  const members = useQuery({
    queryKey: ["dataset-managed-table-members", key, cursors.at(-1)],
    enabled: active && fresh && !reconcile && !pending,
    retry: false,
    gcTime: 0,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    queryFn: ({ signal }) =>
      datasetTableMetadataApi.editMembers(
        saved.id,
        {
          scope: "EDIT_BASE",
          editOperation: "METADATA",
          component: area,
          contentId: basis!.contentId,
          contentGeneration: basis!.contentGeneration,
          expectedWorkflowRevision: base!.context.workflowRevision,
          afterId: cursors.at(-1),
          limit: 20,
        },
        signal
      ),
  });
  useEffect(
    () => onUncertainChange(Boolean(pending) || reconcile),
    [pending, reconcile, onUncertainChange]
  );
  useEffect(() => onDirtyChange(dirty), [dirty, onDirtyChange]);
  useEffect(
    () => () => {
      onDirtyChange(false);
      onUncertainChange(false);
    },
    [onDirtyChange, onUncertainChange]
  );
  async function refreshSaved() {
    setReconcile(true);
    setError("");
    try {
      await onAccepted();
      setReconcile(false);
    } catch (problem) {
      setError(
        problem instanceof Error
          ? problem.message
          : "Saved table context could not be refreshed."
      );
    }
  }
  async function perform(command: DatasetUploadCommand, replay = false) {
    if (busy.current || (!replay && pendingRef.current)) return null;
    busy.current = true;
    setWriting(true);
    onWritingChange(true);
    setError("");
    let sent = false;
    try {
      storeDatasetUploadCommand(command);
      pendingRef.current = command;
      setPending(command);
      sent = true;
      const response = await dispatchDatasetUploadCommand(command);
      clearDatasetUploadCommand(command);
      pendingRef.current = null;
      setPending(null);
      if (command.kind === "TABLES") setAcknowledgement(command.body);
      setNotice(
        command.kind === "TABLES"
          ? "Table descriptions saved. The Dataset files are unchanged."
          : "The previous file request is confirmed. This update permits metadata edits only."
      );
      await refreshSaved();
      return response;
    } catch (problem) {
      if (sent && !ambiguousDatasetUploadFailure(problem, command.kind))
        try {
          clearDatasetUploadCommand(command);
          pendingRef.current = null;
          setPending(null);
        } catch {
          /* Keep exact recovery data when browser storage fails. */
        }
      setError(
        problem instanceof Error
          ? problem.message
          : "The saved request could not be confirmed."
      );
      return null;
    } finally {
      busy.current = false;
      setWriting(false);
      onWritingChange(false);
    }
  }
  const canChange =
    active &&
    fresh &&
    restored.ready &&
    !blocked &&
    !metadataDirty &&
    !writing &&
    !pending &&
    !reconcile &&
    !members.isPending &&
    !members.isError;
  return (
    <div className="min-w-0 space-y-4">
      <p className="text-sm text-muted-foreground">
        This update keeps the Dataset files unchanged. You can edit their table
        definitions for the existing review process.
      </p>
      {metadataDirty && (
        <p className="text-sm text-muted-foreground">
          Save your Dataset details before changing table definitions.
        </p>
      )}
      {error && (
        <p role="alert" className="break-words text-sm text-destructive">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="text-sm">
          {notice}
        </p>
      )}
      {pending && (pending.kind !== "TABLES" || !basis) && (
        <DashboardButton
          type="button"
          disabled={writing}
          onClick={() => void perform(pending, true)}
        >
          {pending.kind === "TABLES"
            ? "Confirm table change"
            : "Confirm saved file request"}
        </DashboardButton>
      )}
      {reconcile && (
        <DashboardButton
          type="button"
          disabled={writing}
          onClick={() => void refreshSaved()}
        >
          Refresh saved table context
        </DashboardButton>
      )}
      <label className="block space-y-2 text-sm">
        <span className="font-medium">Table definitions material</span>
        <select
          aria-label="Table definitions material"
          className={preparationControl}
          value={area}
          disabled={dirty || writing || Boolean(pending)}
          onChange={(event) => setArea(event.target.value as typeof area)}
        >
          {allowed.map((component) => (
            <option key={component} value={component}>
              {component === "FULL" ? "Full dataset" : "Sample"}
            </option>
          ))}
        </select>
      </label>
      {members.isError && (
        <p role="alert" className="text-sm">
          {members.error instanceof Error
            ? members.error.message
            : "Files could not be loaded."}
        </p>
      )}
      {basis && (
        <PreparationTables
          key={basis.contentId}
          basis={basis}
          members={members.data?.items ?? []}
          active={active && fresh && !reconcile}
          canInitializeFrozen={
            base?.context.precondition?.mode === "INITIALIZE"
          }
          canChange={canChange}
          pending={pending?.kind === "TABLES"}
          acknowledgement={acknowledgement}
          onDirtyChange={setDirty}
          retry={() =>
            pendingRef.current
              ? perform(pendingRef.current, true)
              : Promise.resolve(null)
          }
          mutate={(rendered, operations) => {
            if (
              !canChange ||
              !base?.context.precondition ||
              !basis ||
              JSON.stringify(rendered) !== JSON.stringify(basis)
            )
              return Promise.resolve(null);
            return perform({
              kind: "TABLES",
              draftId: saved.id,
              body: {
                requestId: crypto.randomUUID(),
                expectedContentId: rendered.contentId,
                expectedGeneration: rendered.contentGeneration,
                expectedPreparationGeneration: rendered.preparationGeneration,
                editContext: base.context.precondition,
                operations,
              },
            });
          }}
        />
      )}
      <div className="flex flex-wrap gap-2">
        <DashboardButton
          type="button"
          variant="outline"
          disabled={dirty || writing || Boolean(pending) || cursors.length < 2}
          onClick={() => setNavigation({ key, cursors: cursors.slice(0, -1) })}
        >
          Previous definition files
        </DashboardButton>
        <DashboardButton
          type="button"
          variant="outline"
          disabled={
            dirty || writing || Boolean(pending) || !members.data?.nextCursor
          }
          onClick={() => {
            const after = members.data?.nextCursor?.afterId;
            if (after) setNavigation({ key, cursors: [...cursors, after] });
          }}
        >
          Next definition files
        </DashboardButton>
      </div>
    </div>
  );
}
