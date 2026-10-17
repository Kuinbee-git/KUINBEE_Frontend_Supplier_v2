"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type {
  DatasetFilesContextResponse,
  DatasetFilesInventoryPageResponse,
  DatasetFilesMutationBody,
  DatasetInspectionProfile,
  DatasetIntakeConfigResponse,
  DatasetMaterialComponent,
  DatasetPreparationResponse,
  DatasetUploadActionBody,
  DatasetUploadAttemptStatusResponse,
  DatasetUploadsPageResponse,
} from "@kuinbee/dataset-preparation-contracts";
import { useComponentRequest } from "@/hooks/useComponentRequest";
import { datasetIntakeApi } from "@/lib/api/dataset-intake";
import { PreparationApiError } from "@/lib/api/dataset-preparations";
import {
  ambiguousDatasetUploadFailure,
  clearDatasetUploadCommand,
  dispatchDatasetUploadCommand,
  readDatasetUploadCommand,
  storeDatasetUploadCommand,
  type DatasetUploadCommand,
} from "@/lib/datasets/dataset-upload-commands";
import {
  receiveDatasetFile,
  type DatasetFileReceiptProgress,
} from "@/lib/datasets/receive-dataset-file";
import { useAuthStore } from "@/store/auth.store";
import {
  readTablePagePlan,
  recordTablePageAcknowledgement,
  recordTablePageRejection,
  tablePageBasisMatches,
  type TablePageBasis,
  type TablePageCommand,
  type TablePageOperation,
} from "@/lib/datasets/dataset-table-page-commands";
import {
  readReferencePlan,
  recordReferenceAcknowledgement,
  recordReferenceRejection,
} from "@/lib/datasets/dataset-reference-plan";
import type { DatasetReferenceCommand } from "@/lib/datasets/dataset-upload-commands";
import { datasetActionError } from "@/lib/datasets/dataset-action-error";

type Member = DatasetFilesInventoryPageResponse["items"][number];
type Status = DatasetUploadAttemptStatusResponse;
interface Options {
  saved: DatasetPreparationResponse | null;
  context: DatasetFilesContextResponse | null;
  active: boolean;
  metadataDirty: boolean;
  metadataUnsettled: boolean;
  blocked: boolean;
  onWritingChange: (value: boolean) => void;
  onUncertainChange: (value: boolean) => void;
  onActivityChange: (value: boolean, pause?: () => void) => void;
  onFilesChanged: () => Promise<boolean>;
}
const message = (failure: unknown) =>
  datasetActionError(failure, "The file request could not be completed.");
const receiving = (status: Status) =>
  status.state === "ADMITTED" || status.state === "RECEIVING";

export function usePreparationUploads(options: Options) {
  const latest = useRef(options);
  useLayoutEffect(() => {
    latest.current = options;
  }, [options]);
  const { onUncertainChange } = options;
  const [config, setConfig] = useState<DatasetIntakeConfigResponse | null>(
    null
  );
  const [hasUploadForm, setHasUploadForm] = useState(false);
  const [page, setPage] = useState<DatasetUploadsPageResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [writing, setWriting] = useState(false);
  const [pending, setPending] = useState<DatasetUploadCommand | null>(null);
  const [ready, setReady] = useState(false);
  const [reconcileRequired, setReconcileRequired] = useState(false);
  const reconcileRef = useRef(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [activeAttempt, setActiveAttempt] = useState<string | null>(null);
  const [progress, setProgress] = useState<{
    attemptId: string;
    value: DatasetFileReceiptProgress;
  } | null>(null);
  const [history, setHistory] = useState<Array<string | undefined>>([
    undefined,
  ]);
  const [pageIndex, setPageIndex] = useState(0);
  const pendingRef = useRef<DatasetUploadCommand | null>(null);
  const busy = useRef(false);
  const transfer = useRef<AbortController | null>(null);
  const reader = useRef<AbortController | null>(null);
  const epoch = useRef(0);
  const initializedId = useRef<string | null>(null);
  const alive = useRef(true);
  const cursor = useRef<string | undefined>(undefined);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      reader.current?.abort();
      transfer.current?.abort();
    };
  }, []);
  useEffect(
    () => onUncertainChange(Boolean(pending) || reconcileRequired),
    [pending, reconcileRequired, onUncertainChange]
  );

  const refresh = useCallback(async (afterId?: string, index = 0) => {
    const { saved } = latest.current;
    if (!saved) return false;
    const generation = ++epoch.current;
    reader.current?.abort();
    const controller = new AbortController();
    reader.current = controller;
    setLoading(true);
    if (initializedId.current !== saved.id) {
      try {
        const restored = readDatasetUploadCommand(saved.id);
        pendingRef.current = restored;
        setPending(restored);
        initializedId.current = saved.id;
        setReady(true);
        reconcileRef.current = false;
        setReconcileRequired(false);
        if (restored)
          setNotice(
            "A file request still needs confirmation. Retry it before making another file change."
          );
      } catch {
        setReady(false);
        setError(
          "This browser could not recover its saved file request. New file changes are paused to avoid making a duplicate."
        );
      }
    }
    const results = await Promise.allSettled([
      latest.current.metadataUnsettled
        ? Promise.resolve(null)
        : datasetIntakeApi.config(
            saved.id,
            saved.generation,
            controller.signal
          ),
      datasetIntakeApi.uploads(
        saved.id,
        { afterId, limit: 20 },
        controller.signal
      ),
    ]);
    if (
      !alive.current ||
      generation !== epoch.current ||
      controller.signal.aborted
    )
      return false;
    if (
      latest.current.saved?.id !== saved.id ||
      latest.current.saved.generation !== saved.generation
    )
      return false;
    if (results[0].status === "fulfilled") {
      setConfig(results[0].value);
      if (results[0].value?.admission.enabled) setHasUploadForm(true);
    } else setConfig(null);
    if (results[1].status === "fulfilled") {
      setPage(results[1].value);
      cursor.current = afterId;
      setPageIndex(index);
      if (index === 0) setHistory([undefined]);
    } else setPage(null);
    // Older staging releases do not expose intake routes yet. Their existing
    // inventory stays usable; do not advertise any candidate capability.
    const failure = results.find(
      (result) =>
        result.status === "rejected" &&
        !(
          result.reason instanceof PreparationApiError &&
          result.reason.status === 404
        )
    );
    if (failure?.status === "rejected") setError(message(failure.reason));
    setLoading(false);
    return (
      results.every((result) => result.status === "fulfilled") &&
      !latest.current.metadataUnsettled
    );
  }, []);
  useComponentRequest(
    () => refresh(),
    [
      options.saved?.id,
      options.saved?.generation,
      options.metadataUnsettled,
      options.context?.contentId,
      options.context?.contentGeneration,
      options.active,
    ],
    Boolean(options.saved && options.active)
  );

  // Bounded polling is status-only: never retry a write or infer acceptance
  // from received bytes. Manual refresh remains after the bounded window.
  const awaiting = page?.items.some((item) =>
    ["FINALIZING", "RECEIVED", "CHECKING", "CANCEL_REQUESTED"].includes(
      item.state
    )
  );
  useEffect(() => {
    if (!options.active || !awaiting || pending || writing || activeAttempt)
      return;
    let count = 0;
    const timer = setInterval(() => {
      if (++count > 60) {
        clearInterval(timer);
        return;
      }
      void refresh(cursor.current, pageIndex);
    }, 4000);
    return () => clearInterval(timer);
  }, [
    options.active,
    awaiting,
    pending,
    writing,
    activeAttempt,
    refresh,
    pageIndex,
  ]);

  const configCurrent =
    config &&
    options.saved &&
    options.context &&
    config.context.preparationId === options.saved.id &&
    config.context.preparationGeneration === options.saved.generation &&
    config.context.contentId === options.context.contentId &&
    config.context.contentGeneration === options.context.contentGeneration;
  const canChange = Boolean(
    ready &&
    !options.blocked &&
    !options.metadataDirty &&
    !loading &&
    !writing &&
    !pending &&
    !reconcileRequired &&
    !activeAttempt &&
    options.saved &&
    options.context?.editable &&
    options.context.contentId &&
    !options.context.synchronizationRequired &&
    options.context.preparationGeneration === options.saved.generation
  );
  const canAdmit = Boolean(
    canChange && configCurrent && config?.admission.enabled
  );
  const actionContext = (): Omit<DatasetUploadActionBody, "requestId"> => {
    // Mutation preconditions belong to the rendered view that supplied the
    // action. Never upgrade an old click to a newer unseen inventory.
    const { saved, context } = options;
    if (
      !saved ||
      !context?.editable ||
      !context.contentId ||
      context.contentGeneration === null ||
      context.synchronizationRequired ||
      context.preparationGeneration !== saved.generation
    ) {
      throw new PreparationApiError(
        "Save your details, then update Files before continuing.",
        "DRAFT_CHANGED"
      );
    }
    return {
      expectedPreparationGeneration: saved.generation,
      expectedContentId: context.contentId,
      expectedContentGeneration: context.contentGeneration,
    };
  };

  async function perform(command: DatasetUploadCommand, replay = false) {
    if (
      busy.current ||
      (!replay && (pendingRef.current || reconcileRef.current))
    )
      return null;
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
    latest.current.onWritingChange(true);
    setError("");
    setNotice("");
    let dispatched = false;
    let acknowledged = false;
    let acceptedResponse: Awaited<
      ReturnType<typeof dispatchDatasetUploadCommand>
    > | null = null;
    const actorId = useAuthStore.getState().user?.id;
    try {
      storeDatasetUploadCommand(command);
      pendingRef.current = command;
      setPending(command);
      dispatched = true;
      const response = await dispatchDatasetUploadCommand(command);
      if (command.kind === "TABLES")
        recordTablePageAcknowledgement(actorId, command, response);
      if (command.kind === "REFERENCES")
        recordReferenceAcknowledgement(actorId, command, response);
      clearDatasetUploadCommand(command);
      pendingRef.current = null;
      setPending(null);
      acknowledged = true;
      acceptedResponse = response;
      reconcileRef.current = true;
      setReconcileRequired(true);
      if (alive.current) {
        setNotice(
          command.kind === "REFERENCES"
            ? "Keys, relationships and dictionary information saved."
            : command.kind === "TABLES"
              ? "Table and column descriptions saved. Observed structure and stored bytes are unchanged."
              : command.kind === "MEMBERS"
                ? "File selection and organization saved. Stored bytes are unchanged."
                : command.kind === "FINALIZE"
                  ? "Receipt finalization requested. Check the file's current status below before selecting it."
                  : command.kind === "CANCEL" || command.kind === "REMOVE"
                    ? "Cleanup requested. Storage stays charged until the backend confirms cleanup."
                    : "Upload reserved. File transfer is next."
        );
        const refreshed = await refresh();
        const inventoryFresh = await latest.current.onFilesChanged();
        if (!refreshed || !inventoryFresh)
          throw new Error("Saved file context needs refresh");
        reconcileRef.current = false;
        setReconcileRequired(false);
      }
      return response;
    } catch (failure) {
      if (acknowledged) {
        if (alive.current)
          setError(
            "Your change was saved, but the current file list could not be refreshed. Use Refresh upload status before editing or submitting. The saved request will not be sent again."
          );
        return acceptedResponse;
      }
      if (dispatched && !ambiguousDatasetUploadFailure(failure, command.kind)) {
        try {
          if (command.kind === "TABLES")
            recordTablePageRejection(actorId, command);
          if (command.kind === "REFERENCES")
            recordReferenceRejection(actorId, command);
          clearDatasetUploadCommand(command);
          pendingRef.current = null;
          setPending(null);
        } catch {
          /* Keep the exact persisted command for recovery. */
        }
      }
      if (alive.current) setError(message(failure));
      return null;
    } finally {
      busy.current = false;
      if (alive.current) {
        setWriting(false);
        latest.current.onWritingChange(false);
      }
    }
  }
  async function resume(attemptId: string, file: File | null) {
    if (
      !canAdmit ||
      busy.current ||
      transfer.current ||
      pendingRef.current ||
      reconcileRef.current
    )
      return;
    if (!file) {
      setError("Select the original file above, then resume this upload.");
      return;
    }
    const controller = new AbortController();
    transfer.current = controller;
    setActiveAttempt(attemptId);
    setError("");
    setNotice("");
    latest.current.onActivityChange(true, () => controller.abort());
    try {
      await receiveDatasetFile({
        draftId: latest.current.saved!.id,
        attemptId,
        file,
        context: actionContext(),
        signal: controller.signal,
        onProgress: (value) => {
          if (alive.current) setProgress({ attemptId, value });
        },
      });
      if (alive.current)
        setNotice(
          "All file bytes were received. Choose Finish upload to start backend checks."
        );
    } catch (failure) {
      if (alive.current) {
        if (controller.signal.aborted)
          setNotice(
            "Transfer paused. Refresh, then reselect the same file to verify received bytes and resume."
          );
        else setError(message(failure));
      }
    } finally {
      transfer.current = null;
      if (alive.current) {
        setActiveAttempt(null);
        latest.current.onActivityChange(false);
        await refresh();
        await latest.current.onFilesChanged();
      }
    }
  }
  async function admit(
    file: File | null,
    component: DatasetMaterialComponent,
    role: Member["role"],
    profile: DatasetInspectionProfile
  ) {
    if (!canAdmit || !file || busy.current || pendingRef.current) return;
    if (
      !Number.isSafeInteger(file.size) ||
      file.size < 1 ||
      file.size > 2_000_000_000
    ) {
      setError("Choose a nonempty file no larger than 2 GB.");
      return;
    }
    const response = await perform({
      kind: "ADMIT",
      draftId: latest.current.saved!.id,
      body: {
        requestId: crypto.randomUUID(),
        ...actionContext(),
        component,
        role,
        originalName: file.name,
        expectedBytes: String(file.size),
        inspectionProfile: profile,
      },
    });
    if (response && "id" in response) await resume(response.id, file);
  }
  async function finalize(status: Status) {
    if (!canChange || busy.current) return;
    await perform({
      kind: "FINALIZE",
      draftId: latest.current.saved!.id,
      attemptId: status.id,
      body: { requestId: crypto.randomUUID(), ...actionContext() },
    });
  }
  async function cleanup(status: Status, remove: boolean) {
    if (!ready || busy.current || pendingRef.current || activeAttempt) return;
    setError("");
    try {
      const fresh = await datasetIntakeApi.status(
        latest.current.saved!.id,
        status.id
      );
      await perform({
        kind: remove ? "REMOVE" : "CANCEL",
        draftId: latest.current.saved!.id,
        attemptId: status.id,
        body: {
          requestId: crypto.randomUUID(),
          expectedAttemptRevision: fresh.revision,
          expectedRecoveryEpoch: fresh.recoveryEpoch,
        },
      });
    } catch (failure) {
      setError(message(failure));
    }
  }
  async function select(status: Status, component: DatasetMaterialComponent) {
    if (
      !canChange ||
      busy.current ||
      status.state !== "ACCEPTED" ||
      !status.uploadObjectId
    )
      return;
    const scope = actionContext();
    await perform({
      kind: "MEMBERS",
      draftId: latest.current.saved!.id,
      body: {
        requestId: crypto.randomUUID(),
        expectedPreparationGeneration: scope.expectedPreparationGeneration,
        expectedContentId: scope.expectedContentId,
        expectedGeneration: scope.expectedContentGeneration,
        operations: [
          {
            operation: "ADD_MEMBER",
            uploadObjectId: status.uploadObjectId,
            component,
            role: status.role,
          },
        ],
      },
    });
  }
  async function removeMember(
    member: Member,
    inventory: DatasetFilesInventoryPageResponse
  ) {
    if (!canChange || busy.current) return;
    if (
      member.contentId !== inventory.contentId ||
      inventory.preparationId !== options.saved?.id ||
      !inventory.items.some((item) => item.id === member.id)
    )
      return;
    await perform({
      kind: "MEMBERS",
      draftId: inventory.preparationId,
      body: {
        requestId: crypto.randomUUID(),
        expectedPreparationGeneration: inventory.preparationGeneration,
        expectedContentId: inventory.contentId,
        expectedGeneration: inventory.contentGeneration,
        operations: [{ operation: "REMOVE_MEMBER", memberId: member.id }],
      },
    });
  }
  function nextPage() {
    const afterId = page?.nextCursor?.afterId;
    if (!afterId || loading || busy.current) return;
    setHistory((previous) => [...previous.slice(0, pageIndex + 1), afterId]);
    void refresh(afterId, pageIndex + 1);
  }
  async function organize(
    basis: Pick<
      DatasetFilesInventoryPageResponse,
      | "preparationId"
      | "preparationGeneration"
      | "contentId"
      | "contentGeneration"
    >,
    operations: DatasetFilesMutationBody["operations"]
  ) {
    if (!canChange || busy.current || basis.preparationId !== options.saved?.id)
      return null;
    // Keep the rendered inventory's exact basis; never rebase an old selection
    // onto the newest context. The server repeats every ownership/state check.
    return perform({
      kind: "MEMBERS",
      draftId: basis.preparationId,
      body: {
        requestId: crypto.randomUUID(),
        expectedPreparationGeneration: basis.preparationGeneration,
        expectedContentId: basis.contentId,
        expectedGeneration: basis.contentGeneration,
        operations,
      },
    });
  }
  return {
    config: configCurrent ? config : null,
    hasUploadForm,
    page,
    loading,
    writing,
    pending,
    ready,
    reconcileRequired,
    error,
    notice,
    activeAttempt,
    progress,
    canAdmit,
    canChange,
    pageIndex,
    refresh: async () => {
      const refreshed = await refresh(
        reconcileRequired ? undefined : cursor.current,
        reconcileRequired ? 0 : pageIndex
      );
      if (!reconcileRequired) return refreshed;
      try {
        const inventoryFresh = await latest.current.onFilesChanged();
        if (refreshed && inventoryFresh) {
          reconcileRef.current = false;
          setReconcileRequired(false);
          setError("");
          return true;
        }
      } catch {
        /* Keep the acknowledged-save refresh barrier in place. */
      }
      return false;
    },
    retry: () =>
      pendingRef.current
        ? perform(pendingRef.current, true)
        : Promise.resolve(null),
    admit,
    resume,
    finalize,
    cleanup,
    select,
    removeMember,
    organize,
    buildReferenceCommand: (
      basis: TablePageBasis,
      operations: DatasetReferenceCommand["body"]["operations"],
      requestId: string
    ): DatasetReferenceCommand => {
      const actorId = useAuthStore.getState().user?.id;
      if (!actorId) throw new Error("Sign in before saving references.");
      return {
        kind: "REFERENCES",
        actorId,
        draftId: basis.preparationId,
        body: {
          requestId,
          expectedContentId: basis.contentId,
          expectedGeneration: basis.contentGeneration,
          expectedPreparationGeneration: basis.preparationGeneration,
          operations,
        },
      };
    },
    sendReferenceCommand: (
      command: DatasetReferenceCommand,
      replay = false
    ) => {
      const actorId = useAuthStore.getState().user?.id;
      const plan = actorId ? readReferencePlan(actorId, command.draftId) : null;
      if (
        !plan?.command ||
        JSON.stringify(plan.command) !== JSON.stringify(command) ||
        command.draftId !== latest.current.saved?.id
      )
        throw new Error(
          "The retained reference changed. Keep its original answers and refresh."
        );
      if (
        !replay &&
        (!canChange ||
          !latest.current.context?.contentId ||
          !tablePageBasisMatches(plan.basis, {
            preparationId: latest.current.saved.id,
            preparationGeneration: latest.current.saved.generation,
            contentId: latest.current.context.contentId,
            contentGeneration: latest.current.context.contentGeneration!,
          }))
      )
        return Promise.resolve(null);
      return perform(command, replay);
    },
    buildTableCommand: (
      basis: TablePageBasis,
      operations: TablePageOperation[],
      requestId: string
    ): TablePageCommand => ({
      kind: "TABLES",
      actorId: useAuthStore.getState().user?.id,
      draftId: basis.preparationId,
      body: {
        requestId,
        expectedContentId: basis.contentId,
        expectedGeneration: basis.contentGeneration,
        expectedPreparationGeneration: basis.preparationGeneration,
        operations,
      },
    }),
    sendTableCommand: (command: TablePageCommand, replay = false) => {
      const actorId = useAuthStore.getState().user?.id;
      const plan = actorId ? readTablePagePlan(actorId, command.draftId) : null;
      if (
        !plan?.command ||
        JSON.stringify(plan.command) !== JSON.stringify(command) ||
        command.draftId !== latest.current.saved?.id
      )
        throw new Error(
          "The retained table page changed. Refresh before continuing."
        );
      if (
        !replay &&
        (!canChange ||
          !latest.current.context?.contentId ||
          !tablePageBasisMatches(plan.expectedBasis, {
            preparationId: latest.current.saved.id,
            preparationGeneration: latest.current.saved.generation,
            contentId: latest.current.context.contentId,
            contentGeneration: latest.current.context.contentGeneration!,
          }))
      )
        return Promise.resolve(null);
      return perform(command, replay);
    },
    pause: () => transfer.current?.abort(),
    nextPage,
    previousPage: () => {
      if (pageIndex > 0 && !loading && !busy.current)
        void refresh(history[pageIndex - 1], pageIndex - 1);
    },
    receiving,
  };
}
