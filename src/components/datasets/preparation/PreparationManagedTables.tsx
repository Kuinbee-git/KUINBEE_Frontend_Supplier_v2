"use client";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type {
  DatasetFilesInventoryPageResponse,
  DatasetPreparationResponse,
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
import { useTablePagePlan } from "@/hooks/useTablePagePlan";
import {
  readTablePagePlan,
  recordTablePageAcknowledgement,
  recordTablePageRejection,
} from "@/lib/datasets/dataset-table-page-commands";
import { PreparationTables } from "./PreparationTables";
import { preparationControl } from "./PreparationFields";
import {
  readReferencePlan,
  recordReferenceAcknowledgement,
  recordReferenceRejection,
} from "@/lib/datasets/dataset-reference-plan";

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
  const retained = useTablePagePlan(actorId, saved.id);
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
  const [chosenArea, setArea] = useState<"FULL" | "SAMPLE">("FULL");
  const allowed: ("FULL" | "SAMPLE")[] =
    base?.metadata.uploadChoice === "SAMPLE_ONLY"
      ? ["SAMPLE"]
      : base?.metadata.uploadChoice === "FULL_ONLY"
        ? ["FULL"]
        : ["FULL", "SAMPLE"];
  const area = retained.plan?.remaining.length
    ? retained.plan.subject.component
    : allowed.includes(chosenArea)
      ? chosenArea
      : allowed[0];
  const reference = base?.contentReference;
  const basis: Basis | null = reference
    ? {
        preparationId: saved.id,
        preparationGeneration: base!.context.preparationGeneration,
        contentId: reference.contentId,
        contentGeneration: reference.generation,
      }
    : (retained.plan?.expectedBasis ?? null);
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
    () =>
      onUncertainChange(
        Boolean(pending) || reconcile || Boolean(retained.error)
      ),
    [pending, reconcile, retained.error, onUncertainChange]
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
    if (
      (command.kind === "TABLES" || command.kind === "REFERENCES") &&
      command.actorId &&
      command.actorId !== useAuthStore.getState().user?.id
    ) {
      setError(
        "Sign in with the supplier account that started this table save to confirm it."
      );
      return null;
    }
    busy.current = true;
    setWriting(true);
    onWritingChange(true);
    setError("");
    let sent = false;
    const writingActorId = useAuthStore.getState().user?.id;
    try {
      storeDatasetUploadCommand(command);
      pendingRef.current = command;
      setPending(command);
      sent = true;
      const response = await dispatchDatasetUploadCommand(command);
      if (command.kind === "TABLES")
        recordTablePageAcknowledgement(writingActorId, command, response);
      if (command.kind === "REFERENCES")
        recordReferenceAcknowledgement(writingActorId, command, response);
      clearDatasetUploadCommand(command);
      pendingRef.current = null;
      setPending(null);
      setNotice(
        command.kind === "REFERENCES"
          ? "Reference saved. The Dataset files are unchanged."
          : command.kind === "TABLES"
            ? "Table descriptions saved. The Dataset files are unchanged."
            : "The previous file request is confirmed. This update permits metadata edits only."
      );
      await refreshSaved();
      return response;
    } catch (problem) {
      if (sent && !ambiguousDatasetUploadFailure(problem, command.kind))
        try {
          if (command.kind === "TABLES")
            recordTablePageRejection(writingActorId, command);
          if (command.kind === "REFERENCES")
            recordReferenceRejection(writingActorId, command);
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
      {!basis && retained.error && (
        <p role="alert" className="text-sm text-destructive">
          {retained.error}
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
          pending={pending?.kind === "TABLES" || pending?.kind === "REFERENCES"}
          referencePending={pending?.kind === "REFERENCES"}
          buildReferenceCommand={(rendered, operations, requestId) => {
            const actorId = useAuthStore.getState().user?.id;
            if (
              !actorId ||
              !base?.context.precondition ||
              JSON.stringify(rendered) !== JSON.stringify(basis)
            )
              throw new Error(
                "Refresh the exact saved reference context before continuing."
              );
            return {
              kind: "REFERENCES",
              actorId,
              draftId: saved.id,
              body: {
                requestId,
                expectedContentId: rendered.contentId,
                expectedGeneration: rendered.contentGeneration,
                expectedPreparationGeneration: rendered.preparationGeneration,
                editContext: base.context.precondition,
                operations,
              },
            };
          }}
          sendReferenceCommand={(command, replay = false) => {
            const ownerId = useAuthStore.getState().user?.id;
            const plan = ownerId ? readReferencePlan(ownerId, saved.id) : null;
            if (
              !plan?.command ||
              JSON.stringify(plan.command) !== JSON.stringify(command) ||
              command.draftId !== saved.id
            )
              throw new Error(
                "The retained reference changed. Keep its original answers and refresh."
              );
            if (!replay && !canChange) return Promise.resolve(null);
            return perform(command, replay);
          }}
          loadReferenceMembers={(rendered, component, afterId, signal) => {
            if (!base || JSON.stringify(rendered) !== JSON.stringify(basis))
              throw new Error("Refresh the saved reference context.");
            return datasetTableMetadataApi.editMembers(
              saved.id,
              {
                scope: "EDIT_BASE",
                editOperation: "METADATA",
                component,
                contentId: rendered.contentId,
                contentGeneration: rendered.contentGeneration,
                expectedWorkflowRevision: base.context.workflowRevision,
                afterId,
                limit: 20,
              },
              signal
            );
          }}
          buildCommand={(rendered, operations, requestId) => {
            if (
              !base?.context.precondition ||
              JSON.stringify(rendered) !== JSON.stringify(basis)
            )
              throw new Error(
                "Refresh the exact saved table context before continuing."
              );
            return {
              kind: "TABLES",
              actorId: useAuthStore.getState().user?.id,
              draftId: saved.id,
              body: {
                requestId,
                expectedContentId: rendered.contentId,
                expectedGeneration: rendered.contentGeneration,
                expectedPreparationGeneration: rendered.preparationGeneration,
                editContext: base.context.precondition,
                operations,
              },
            };
          }}
          sendCommand={(command, replay = false) => {
            const ownerId = useAuthStore.getState().user?.id;
            const plan = ownerId ? readTablePagePlan(ownerId, saved.id) : null;
            if (
              !plan?.command ||
              JSON.stringify(plan.command) !== JSON.stringify(command) ||
              command.draftId !== saved.id
            )
              throw new Error(
                "The retained table page changed. Refresh before continuing."
              );
            if (!replay && !canChange) return Promise.resolve(null);
            return perform(command, replay);
          }}
          onDirtyChange={setDirty}
          retry={() =>
            pendingRef.current
              ? perform(pendingRef.current, true)
              : Promise.resolve(null)
          }
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
