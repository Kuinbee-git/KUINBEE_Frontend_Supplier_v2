"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useAuthStore } from "@/store/auth.store";
import {
  DatasetPricingValuesSchema,
  type DatasetPreparationResponse,
  type DatasetWorkflowState,
} from "@kuinbee/dataset-preparation-contracts";
import {
  datasetWorkflowApi,
  type DatasetEditBase,
  type DatasetEditContext,
  type DatasetProposalReadiness,
  type DatasetSubmission,
} from "@/lib/api/dataset-workflow";
import {
  preparationApi,
  PreparationApiError,
} from "@/lib/api/dataset-preparations";
import {
  ambiguousDatasetWorkflowFailure,
  clearDatasetWorkflowCommand,
  dispatchDatasetWorkflowCommand,
  readDatasetWorkflowCommand,
  storeDatasetWorkflowCommand,
  type DatasetWorkflowCommand,
} from "@/lib/datasets/dataset-workflow-commands";

export type PreparationPriceInput = {
  isPaid: boolean;
  price: string;
  currency: "INR" | "USD" | "EUR" | "GBP";
};
type Snapshot = {
  state: DatasetWorkflowState;
  metadataContext: DatasetEditContext;
  pricingContext: DatasetEditContext;
  base: DatasetEditBase | null;
  readiness: DatasetProposalReadiness;
  submission: DatasetSubmission | null;
};
type Options = {
  saved: DatasetPreparationResponse | null;
  metadataUnsettled: boolean;
  metadataDirty: boolean;
  filesUnsettled: boolean;
  uploadsActive: boolean;
  onSaved: (saved: DatasetPreparationResponse) => void;
  onBase: (base: DatasetEditBase, saved: DatasetPreparationResponse) => void;
};
const message = (error: unknown) =>
  error instanceof Error
    ? error.message
    : "The proposal request could not be confirmed.";
const priceInput = (
  state: DatasetWorkflowState
): PreparationPriceInput | null =>
  state.pricing
    ? {
        isPaid: state.pricing.isPaid,
        price: state.pricing.price ?? "",
        currency: state.pricing.currency,
      }
    : null;
const samePrice = (
  left: PreparationPriceInput | null,
  right: PreparationPriceInput | null
) =>
  left !== null &&
  right !== null &&
  left.isPaid === right.isPaid &&
  left.currency === right.currency &&
  (!left.isPaid || left.price === right.price);
async function currentPreparation(id: string, signal?: AbortSignal) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener("abort", abort, { once: true });
  if (signal?.aborted) abort();
  const timer = setTimeout(abort, 30_000);
  try {
    return await preparationApi.get(id, controller.signal);
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", abort);
  }
}
function compatible(snapshot: Snapshot, saved: DatasetPreparationResponse) {
  const {
    state,
    metadataContext,
    pricingContext,
    base,
    readiness,
    submission,
  } = snapshot;
  return (
    state.preparationGeneration === saved.generation &&
    [metadataContext, pricingContext, ...(base ? [base.context] : [])].every(
      (context) =>
        context.preparationGeneration === state.preparationGeneration &&
        context.workflowRevision === state.workflowRevision
    ) &&
    readiness.state.workflowRevision === state.workflowRevision &&
    readiness.state.preparationGeneration === state.preparationGeneration &&
    (!submission ||
      submission.state.workflowRevision === state.workflowRevision)
  );
}

// Backend snapshots authorize actions. A command is retained before dispatch;
// uncertainty requires explicit replay, never a new UUID or a hidden write.
export function usePreparationWorkflow(options: Options) {
  const latest = useRef(options);
  useLayoutEffect(() => {
    latest.current = options;
  }, [options]);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const snapshotRef = useRef<Snapshot | null>(null);
  const [price, setPrice] = useState<PreparationPriceInput | null>(null);
  const priceRef = useRef<PreparationPriceInput | null>(null);
  const priceBase = useRef<PreparationPriceInput | null>(null);
  const [priceBaseline, setPriceBaseline] =
    useState<PreparationPriceInput | null>(null);
  const priceReference = useRef<{ id: string; revision: number } | null>(null);
  const priceConflictRef = useRef(false);
  const [priceConflict, setPriceConflict] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadedFresh, setFresh] = useState(false);
  const [writing, setWriting] = useState(false);
  const [pending, setPending] = useState<DatasetWorkflowCommand | null>(null);
  const pendingRef = useRef<DatasetWorkflowCommand | null>(null);
  const [storageReady, setStorageReady] = useState(false);
  const [error, setError] = useState("");
  const [unbound, setUnbound] = useState(false);
  const [notice, setNotice] = useState("");
  const [reconciliationRequired, setReconciliationRequired] = useState(false);
  const reconciliationRef = useRef(false);
  const initialized = useRef<string | null>(null);
  const busy = useRef(false);
  const reconciling = useRef(false);
  const [reconcilingNow, setReconciling] = useState(false);
  const epoch = useRef(0);
  const reader = useRef<AbortController | null>(null);
  const alive = useRef(true);
  const priceDirty = price !== null && !samePrice(price, priceBaseline);
  const fresh =
    loadedFresh &&
    snapshot?.state.datasetId === options.saved?.id &&
    snapshot?.state.preparationGeneration === options.saved?.generation &&
    !options.metadataUnsettled &&
    !options.filesUnsettled;

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      reader.current?.abort();
    };
  }, []);
  useLayoutEffect(() => {
    if (options.metadataUnsettled || options.filesUnsettled) {
      epoch.current++;
      reader.current?.abort();
    }
  }, [options.metadataUnsettled, options.filesUnsettled]);
  const invalidate = useCallback(() => {
    epoch.current++;
    reader.current?.abort();
    setFresh(false);
  }, []);

  const refresh = useCallback(
    async (supplied?: DatasetPreparationResponse, preservePrice = true) => {
      const current = latest.current;
      let saved = supplied ?? current.saved;
      if (
        !saved ||
        (!supplied && (current.metadataUnsettled || current.filesUnsettled)) ||
        busy.current
      )
        return null;
      const token = ++epoch.current;
      reader.current?.abort();
      const controller = new AbortController();
      const recovering =
        !supplied &&
        initialized.current === saved.id &&
        reconciliationRef.current;
      if (recovering) {
        reconciling.current = true;
        setReconciling(true);
      }
      reader.current = controller;
      setLoading(true);
      setFresh(false);
      setError("");
      if (initialized.current !== saved.id) {
        setUnbound(false);
        reconciliationRef.current = false;
        setReconciliationRequired(false);
        snapshotRef.current = null;
        setSnapshot(null);
        priceBase.current = null;
        setPriceBaseline(null);
        priceReference.current = null;
        priceConflictRef.current = false;
        setPriceConflict(false);
        priceRef.current = null;
        setPrice(null);
        try {
          const restored = readDatasetWorkflowCommand(saved.id);
          pendingRef.current = restored;
          setPending(restored);
          initialized.current = saved.id;
          setStorageReady(true);
          if (restored)
            setNotice(
              "A pricing or submission request needs confirmation. Retry the same request before making another change."
            );
        } catch {
          setStorageReady(false);
          setError(
            "This browser could not recover its saved proposal request. Pricing and Submit are paused to avoid a duplicate request."
          );
        }
      }
      try {
        if (recovering) {
          saved = await currentPreparation(saved.id, controller.signal);
          if (token !== epoch.current || !alive.current) return null;
          latest.current.onSaved(saved);
        }
        const [response, metadataContext, pricingContext] = await Promise.all([
          datasetWorkflowApi.state(saved.id, controller.signal),
          datasetWorkflowApi.editContext(
            saved.id,
            "METADATA",
            controller.signal
          ),
          datasetWorkflowApi.editContext(
            saved.id,
            "PRICING",
            controller.signal
          ),
        ]);
        const state = response.state;
        const [base, readiness, submission] = await Promise.all([
          metadataContext.editable
            ? datasetWorkflowApi.editBase(
                saved.id,
                "METADATA",
                controller.signal
              )
            : Promise.resolve(null),
          datasetWorkflowApi.readiness(
            saved.id,
            saved.generation,
            controller.signal
          ),
          state.reviewedContentId
            ? datasetWorkflowApi.submission(saved.id, controller.signal)
            : Promise.resolve(null),
        ]);
        const result = {
          state,
          metadataContext,
          pricingContext,
          base,
          readiness,
          submission,
        };
        if (!compatible(result, saved))
          throw new PreparationApiError(
            "The saved proposal changed while loading its review. Refresh before continuing; your input is retained.",
            "DRAFT_CHANGED",
            409
          );
        if (token !== epoch.current || !alive.current) return null;
        snapshotRef.current = result;
        setUnbound(false);
        setSnapshot(result);
        setFresh(true);
        setReconciliationRequired(false);
        reconciliationRef.current = false;
        if (base) latest.current.onBase(base, saved);
        const next = priceInput(state);
        const dirtyPrice =
          priceRef.current !== null &&
          !samePrice(priceRef.current, priceBase.current);
        if (
          preservePrice &&
          dirtyPrice &&
          priceReference.current &&
          (priceReference.current.id !== state.pricing?.id ||
            priceReference.current.revision !== state.pricing?.revision)
        ) {
          priceConflictRef.current = true;
          setPriceConflict(true);
        } else if (!preservePrice || !dirtyPrice) {
          priceRef.current = next;
          setPrice(next);
          priceBase.current = next;
          setPriceBaseline(next);
          priceReference.current = state.pricing
            ? { id: state.pricing.id, revision: state.pricing.revision }
            : null;
          priceConflictRef.current = false;
          setPriceConflict(false);
        }
        return result;
      } catch (failure) {
        if (token === epoch.current && alive.current) {
          setUnbound(
            !snapshotRef.current &&
              failure instanceof PreparationApiError &&
              failure.status === 404
          );
          setError(message(failure));
        }
        return null;
      } finally {
        if (token === epoch.current && alive.current) setLoading(false);
        if (recovering) {
          reconciling.current = false;
          setReconciling(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    if (
      !options.saved ||
      options.metadataUnsettled ||
      options.filesUnsettled ||
      reconciling.current
    )
      return;
    void refresh();
  }, [
    options.saved,
    options.metadataUnsettled,
    options.filesUnsettled,
    refresh,
  ]);

  function changePrice(change: Partial<PreparationPriceInput>) {
    if (busy.current || pendingRef.current || !priceRef.current) return;
    const value = { ...priceRef.current, ...change };
    if (!value.isPaid) value.price = "";
    priceRef.current = value;
    setPrice(value);
    setNotice("");
  }

  function resolvePriceConflict(useCurrent: boolean) {
    const current = snapshotRef.current;
    if (!fresh || !current?.state.pricing || busy.current || pendingRef.current)
      return;
    const value = priceInput(current.state);
    priceBase.current = value;
    setPriceBaseline(value);
    priceReference.current = {
      id: current.state.pricing.id,
      revision: current.state.pricing.revision,
    };
    if (useCurrent) {
      priceRef.current = value;
      setPrice(value);
    }
    priceConflictRef.current = false;
    setPriceConflict(false);
    setError("");
    setNotice(
      useCurrent
        ? "Using the current saved pricing."
        : "Your pricing input is retained against the current saved pricing. Save it explicitly to apply it."
    );
  }

  async function execute(command: DatasetWorkflowCommand) {
    if (busy.current) return false;
    busy.current = true;
    reconciling.current = true;
    setReconciling(true);
    setWriting(true);
    setFresh(false);
    setError("");
    setNotice("");
    reader.current?.abort();
    epoch.current++;
    let confirmed = false;
    try {
      storeDatasetWorkflowCommand(command);
      pendingRef.current = command;
      setPending(command);
      const actorId = useAuthStore.getState().user?.id;
      await dispatchDatasetWorkflowCommand(command);
      if (useAuthStore.getState().user?.id !== actorId)
        throw new PreparationApiError(
          "Your account changed. Return with the original supplier account to confirm this request.",
          "SESSION_CHANGED",
          401
        );
      confirmed = true;
      setReconciliationRequired(true);
      reconciliationRef.current = true;
      clearDatasetWorkflowCommand(command);
      pendingRef.current = null;
      setPending(null);
      if (command.kind === "PRICING_SAVE") {
        const values = command.body.changes;
        const acknowledged = { ...values, price: values.price ?? "" };
        priceRef.current = acknowledged;
        priceBase.current = acknowledged;
        setPriceBaseline(acknowledged);
        setPrice(acknowledged);
      }
      setNotice(
        command.kind === "SUBMIT"
          ? "Submission acknowledged. Refreshing the exact submitted proposal…"
          : command.kind === "PRICING_SUBMIT"
            ? "Pricing submitted for its separate review. Your proposal is not submitted by this action."
            : "Pricing save acknowledged. Your proposal is not submitted."
      );
    } catch (failure) {
      if (!confirmed && !ambiguousDatasetWorkflowFailure(failure)) {
        try {
          clearDatasetWorkflowCommand(command);
          pendingRef.current = null;
          setPending(null);
        } catch {
          /* Keep the same command when local reconciliation is uncertain. */
        }
      }
      setError(message(failure));
    } finally {
      busy.current = false;
      setWriting(false);
    }
    if (!confirmed || pendingRef.current) {
      reconciling.current = false;
      setReconciling(false);
      return false;
    }
    // An immutable receipt may be old. Re-read the preparation as a pricing-first
    // correction can restore its exact frozen base and advance its generation.
    try {
      const saved = await currentPreparation(command.draftId);
      if (!alive.current) return false;
      latest.current.onSaved(saved);
      const current = await refresh(saved, command.kind !== "PRICING_SAVE");
      if (!current) {
        setError(
          "The request was acknowledged, but the current proposal could not be refreshed. Refresh before continuing."
        );
        return false;
      }
      return true;
    } catch (failure) {
      setError(
        `The request was acknowledged. ${message(failure)} Refresh before continuing.`
      );
      return false;
    } finally {
      reconciling.current = false;
      setReconciling(false);
    }
  }

  async function savePricing(saved?: DatasetPreparationResponse) {
    const current = latest.current;
    if (
      pendingRef.current ||
      busy.current ||
      !storageReady ||
      current.filesUnsettled ||
      (!saved && current.metadataUnsettled)
    )
      return false;
    if (!priceRef.current || samePrice(priceRef.current, priceBase.current))
      return true;
    const prepared = saved ?? current.saved;
    if (!prepared) return false;
    reconciling.current = true;
    setReconciling(true);
    try {
      const result = await refresh(prepared);
      if (
        !result?.pricingContext.editable ||
        !result.state.pricing ||
        priceConflictRef.current
      )
        return false;
      const changes = DatasetPricingValuesSchema.parse({
        ...priceRef.current,
        price: priceRef.current!.isPaid ? priceRef.current!.price : null,
      });
      if (prepared.metadata.uploadChoice === "SAMPLE_ONLY" && changes.isPaid)
        throw new Error(
          "Samples are displayed without an on-platform sample purchase. Choose free access."
        );
      const state = result.state;
      return await execute({
        kind: "PRICING_SAVE",
        draftId: prepared.id,
        body: {
          requestId: crypto.randomUUID(),
          expectedPreparationGeneration: state.preparationGeneration,
          expectedWorkflowRevision: state.workflowRevision,
          expectedPricingReference: {
            id: state.pricing!.id,
            revision: state.pricing!.revision,
          },
          changes,
          ...(result.pricingContext.precondition
            ? { editContext: result.pricingContext.precondition }
            : {}),
        },
      });
    } catch (failure) {
      setError(
        failure instanceof Error && "issues" in failure
          ? "Enter a positive price with at most two decimal places, or choose free access. Your draft answers remain saved."
          : message(failure)
      );
      return false;
    } finally {
      reconciling.current = false;
      setReconciling(false);
    }
  }

  async function submitPricing() {
    const current = latest.current,
      result = snapshotRef.current;
    if (
      !fresh ||
      !result ||
      !storageReady ||
      pendingRef.current ||
      busy.current ||
      (current.metadataDirty && result.metadataContext.editable) ||
      current.metadataUnsettled ||
      current.filesUnsettled ||
      !samePrice(priceRef.current, priceBase.current) ||
      priceConflictRef.current ||
      !result.pricingContext.editable ||
      !result.state.pricing
    )
      return false;
    const state = result.state;
    return execute({
      kind: "PRICING_SUBMIT",
      draftId: state.datasetId,
      body: {
        requestId: crypto.randomUUID(),
        expectedPreparationGeneration: state.preparationGeneration,
        expectedWorkflowRevision: state.workflowRevision,
        expectedPricingReference: {
          id: state.pricing!.id,
          revision: state.pricing!.revision,
        },
        ...(result.pricingContext.precondition
          ? { editContext: result.pricingContext.precondition }
          : {}),
      },
    });
  }

  async function submit() {
    const current = latest.current,
      result = snapshotRef.current;
    if (
      !fresh ||
      !result ||
      !storageReady ||
      pendingRef.current ||
      busy.current ||
      current.metadataDirty ||
      current.metadataUnsettled ||
      current.filesUnsettled ||
      current.uploadsActive ||
      !samePrice(priceRef.current, priceBase.current) ||
      priceConflictRef.current ||
      !result.readiness.canSubmit ||
      !result.readiness.contentId ||
      result.readiness.contentGeneration === null ||
      !result.readiness.dependencyFingerprint ||
      !result.state.pricing
    )
      return false;
    const state = result.state,
      ready = result.readiness;
    return execute({
      kind: "SUBMIT",
      draftId: state.datasetId,
      body: {
        requestId: crypto.randomUUID(),
        expectedPreparationGeneration: state.preparationGeneration,
        expectedWorkflowRevision: state.workflowRevision,
        expectedPricingReference: {
          id: state.pricing!.id,
          revision: state.pricing!.revision,
        },
        expectedContentId: ready.contentId!,
        expectedContentGeneration: ready.contentGeneration!,
        expectedDependencyFingerprint: ready.dependencyFingerprint!,
      },
    });
  }

  const blocked =
    options.metadataUnsettled ||
    options.filesUnsettled ||
    writing ||
    reconcilingNow ||
    Boolean(pending);
  return {
    snapshot,
    price,
    priceDirty,
    unbound,
    priceConflict,
    loading,
    fresh,
    writing: writing || reconcilingNow,
    pending,
    storageReady,
    error,
    notice,
    reconciliationRequired,
    blocked,
    readOnly: snapshot?.metadataContext.editable === false,
    managed: snapshot?.metadataContext.managementContext === "MANAGED",
    canSubmit:
      fresh &&
      storageReady &&
      !blocked &&
      !reconciliationRequired &&
      !options.metadataDirty &&
      !priceDirty &&
      !priceConflict &&
      !options.uploadsActive &&
      Boolean(snapshot?.readiness.canSubmit),
    changePrice,
    invalidate,
    resolvePriceConflict,
    refresh,
    savePricing,
    submitPricing,
    submit,
    retry: () =>
      pendingRef.current ? execute(pendingRef.current) : Promise.resolve(false),
  };
}

export type PreparationWorkflow = ReturnType<typeof usePreparationWorkflow>;
