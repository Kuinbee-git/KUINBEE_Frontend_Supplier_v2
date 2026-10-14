"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import Link from "next/link";
import {
  DATASET_UPLOAD_CHOICES,
  DATASET_MODALITIES,
  DatasetPreparationMetadataSchema,
  type DatasetPreparationMetadata,
  type DatasetPreparationResponse,
  type DatasetPreparationCreateBody,
  type DatasetPreparationPatchBody,
} from "@kuinbee/dataset-preparation-contracts";
import { useComponentRequest } from "@/hooks/useComponentRequest";
import {
  preparationApi,
  PreparationApiError,
} from "@/lib/api/dataset-preparations";
import {
  DashboardButton,
  DashboardCard,
  DashboardFormActions,
} from "@/components/dashboard";
import {
  DatasetPageHeader,
  DatasetWorkspace,
} from "@/components/datasets/workspace/DatasetWorkspace";
import { DATASET_TYPES } from "@/constants/dataset.constants";
import { PreparationCatalogPicker } from "./PreparationCatalogPicker";
import { PreparationReview } from "./PreparationReview";
import {
  PreparationField,
  PreparationProfileFields,
  PreparationQuantities,
  PreparationSection,
  PreparationSelect,
  type PreparationUpdate,
} from "./PreparationFields";

const steps = ["Basics", "Files & contents", "Dataset details", "Review draft"];
const equal = (a: unknown, b: unknown) =>
  JSON.stringify(a) === JSON.stringify(b);
const subscribeHydration = () => () => {};
const browserReady = () => true;
const serverNotReady = () => false;
function changesBetween(
  before: DatasetPreparationMetadata,
  after: DatasetPreparationMetadata
) {
  return Object.fromEntries(
    Object.entries(after).filter(
      ([key, value]) =>
        !equal(before[key as keyof DatasetPreparationMetadata], value)
    )
  ) as Partial<DatasetPreparationMetadata>;
}
function reapplyLocal(
  before: unknown,
  local: unknown,
  latest: unknown
): unknown {
  if (equal(before, local)) return latest;
  if (local && typeof local === "object" && !Array.isArray(local)) {
    const base =
      before && typeof before === "object" && !Array.isArray(before)
        ? (before as Record<string, unknown>)
        : {};
    const next = local as Record<string, unknown>;
    const result =
      latest && typeof latest === "object" && !Array.isArray(latest)
        ? { ...(latest as Record<string, unknown>) }
        : {};
    for (const [key, value] of Object.entries(next))
      if (!equal(base[key], value))
        result[key] = reapplyLocal(base[key], value, result[key]);
    return result;
  }
  return local;
}
function metadataForSave(metadata: DatasetPreparationMetadata) {
  const profiles = metadata.profiles
    ? { ...metadata.profiles }
    : metadata.profiles;
  for (const key of ["audio", "text"] as const) {
    const profile = profiles?.[key];
    if (profile?.languages)
      profiles![key] = {
        ...profile,
        languages: profile.languages
          .map((language) => language.trim())
          .filter(Boolean),
      };
  }
  return DatasetPreparationMetadataSchema.parse({ ...metadata, profiles });
}
type Pending =
  | { kind: "create"; body: DatasetPreparationCreateBody }
  | { kind: "patch"; id: string; body: DatasetPreparationPatchBody };

export function DatasetPreparationEditor({
  draftId,
  onCreated,
  onExit,
}: {
  draftId?: string;
  onCreated?: (id: string) => void;
  onExit?: () => void;
}) {
  const hydrated = useSyncExternalStore(
    subscribeHydration,
    browserReady,
    serverNotReady
  );
  const [metadata, setMetadata] = useState<DatasetPreparationMetadata>({
    title: "",
  });
  const [saved, setSaved] = useState<DatasetPreparationResponse | null>(null);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(Boolean(draftId));
  const [saving, setSaving] = useState(false);
  const [retryPending, setRetryPending] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [latest, setLatest] = useState<DatasetPreparationResponse | null>(null);
  const [replayBase, setReplayBase] =
    useState<DatasetPreparationMetadata | null>(null);
  const [error, setError] = useState("");
  const pending = useRef<Pending | null>(null);
  const busy = useRef(false);
  const errorRef = useRef<HTMLDivElement>(null);
  const update: PreparationUpdate = (change) =>
    setMetadata((previous) => change(previous));
  const dirty = !saved
    ? Boolean(metadata.title || Object.keys(metadata).length > 1)
    : !equal(metadata, saved.metadata);
  const load = useCallback(async () => {
    if (!draftId) return;
    setLoading(true);
    setError("");
    try {
      const result = await preparationApi.get(draftId);
      setSaved(result);
      setMetadata(result.metadata);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "The saved draft could not be loaded."
      );
    } finally {
      setLoading(false);
    }
  }, [draftId]);
  useComponentRequest(load, [draftId], Boolean(draftId));
  useEffect(() => {
    if (!dirty && !retryPending) return;
    const guard = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    const guardLink = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const link =
        event.target instanceof Element
          ? (event.target.closest("a[href]") as HTMLAnchorElement | null)
          : null;
      if (!link || link.target === "_blank") return;
      const target = new URL(link.href, window.location.href);
      if (
        target.pathname === window.location.pathname &&
        target.search === window.location.search
      )
        return;
      if (!window.confirm("Leave without saving your current input?")) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", guard);
    document.addEventListener("click", guardLink, true);
    return () => {
      window.removeEventListener("beforeunload", guard);
      document.removeEventListener("click", guardLink, true);
    };
  }, [dirty, retryPending]);
  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  async function save(): Promise<DatasetPreparationResponse | null> {
    if (
      !hydrated ||
      busy.current ||
      loading ||
      conflict ||
      (draftId && saved?.id !== draftId)
    )
      return null;
    busy.current = true;
    setSaving(true);
    setError("");
    try {
      if (!pending.current) {
        const normalized = metadataForSave(metadata);
        if (saved) {
          const changes = changesBetween(saved.metadata, normalized);
          if (!Object.keys(changes).length) {
            setMetadata(saved.metadata);
            return saved;
          }
          pending.current = {
            kind: "patch",
            id: saved.id,
            body: {
              requestId: crypto.randomUUID(),
              expectedGeneration: saved.generation,
              changes,
            },
          };
        } else
          pending.current = {
            kind: "create",
            body: { requestId: crypto.randomUUID(), metadata: normalized },
          };
      }
      const operation = pending.current;
      const wasRetry = retryPending;
      const result =
        operation.kind === "create"
          ? await preparationApi.create(operation.body)
          : await preparationApi.patch(operation.id, operation.body);
      pending.current = null;
      setRetryPending(false);
      setSaved(result);
      setMetadata(result.metadata);
      if (operation.kind === "create") onCreated?.(result.id);
      if (wasRetry) {
        try {
          const current = await preparationApi.get(result.id);
          if (current.generation > result.generation) {
            setReplayBase(saved?.metadata ?? { title: "" });
            setLatest(current);
            setConflict(true);
            setError(
              "Your save was acknowledged, but a newer save also exists. Review the latest draft before continuing."
            );
            return null;
          }
        } catch {
          setError(
            "Your save was acknowledged. The current server version could not be refreshed; this screen shows your last acknowledgement."
          );
        }
      }
      return result;
    } catch (failure) {
      if (failure instanceof PreparationApiError) {
        if (failure.code === "DRAFT_CHANGED") {
          pending.current = null;
          setRetryPending(false);
          setReplayBase(null);
          setConflict(true);
        } else if (
          ["NETWORK_ERROR", "INCOMPATIBLE_RESPONSE"].includes(failure.code) ||
          (failure.status ?? 0) >= 500
        )
          setRetryPending(Boolean(pending.current));
        else {
          pending.current = null;
          setRetryPending(false);
        }
        setError(failure.message);
      } else {
        pending.current = null;
        const details =
          failure &&
          typeof failure === "object" &&
          "issues" in failure &&
          Array.isArray(failure.issues)
            ? (failure.issues[0] as {
                path?: (string | number)[];
                message?: string;
              })
            : null;
        if (details?.path?.[0] === "title") setStep(0);
        setError(
          details
            ? `${details.path?.join(".")}: ${details.message}`
            : "Some provided values need correction. Your input has been retained."
        );
      }
      return null;
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }
  async function reviewLatest() {
    if (!saved) return;
    setSaving(true);
    try {
      setLatest(await preparationApi.get(saved.id));
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Latest saved draft could not be loaded."
      );
    } finally {
      setSaving(false);
    }
  }
  const unavailableExisting = Boolean(draftId && saved?.id !== draftId);
  const locked =
    !hydrated || loading || saving || retryPending || unavailableExisting;
  const hasSample =
    metadata.uploadChoice === "SAMPLE_ONLY" ||
    metadata.uploadChoice === "FULL_AND_SAMPLE";
  const hasFull =
    metadata.uploadChoice === "FULL_ONLY" ||
    metadata.uploadChoice === "FULL_AND_SAMPLE";
  const setCommon = <K extends keyof DatasetPreparationMetadata>(
    key: K,
    value: DatasetPreparationMetadata[K]
  ) => update((previous) => ({ ...previous, [key]: value }));
  const sample = metadata.sample ?? {};
  const setSample = (
    key: keyof NonNullable<DatasetPreparationMetadata["sample"]>,
    value: string | null
  ) =>
    update((previous) => ({
      ...previous,
      sample: { ...(previous.sample ?? {}), [key]: value },
    }));
  const moveToField = (field?: string) => {
    setStep(
      !field
        ? 1
        : [
              "uploadChoice",
              "modalities",
              "contexts",
              "primaryCategoryId",
              "sourceId",
              "license",
            ].includes(field)
          ? 0
          : 2
    );
  };

  return (
    <DatasetWorkspace className="max-w-[70rem]">
      <DatasetPageHeader
        title={draftId || saved ? "Edit draft proposal" : "Create proposal"}
        description="Save a draft and complete it step by step. Saving does not submit it for review."
        action={
          <DashboardButton asChild variant="outline" size="compact">
            <Link href="/dashboard/datasets">Draft proposals</Link>
          </DashboardButton>
        }
      />
      <DashboardCard className="overflow-hidden" data-proposal-panel="true">
        <div
          role="status"
          aria-live="polite"
          data-preparation-status="true"
          data-saved-id={saved?.id}
          data-saved-generation={saved?.generation}
          className="border-b border-border px-4 py-3 text-sm sm:px-6"
        >
          {loading
            ? "Loading saved draft…"
            : saving
              ? "Saving draft…"
              : retryPending
                ? "Save not confirmed — retry required"
                : dirty
                  ? "Unsaved changes"
                  : saved
                    ? "Draft saved"
                    : "Not saved yet"}
          {saved && !loading && (
            <span className="ml-2 text-muted-foreground">
              Last saved {new Date(saved.updatedAt).toLocaleString()}
            </span>
          )}
        </div>
        <div className="border-b border-border bg-muted/20 px-4 py-3 text-sm sm:px-6">
          <strong>Draft testing release</strong>
          <p className="mt-1 text-muted-foreground">
            You can save information for all three upload choices. File intake,
            required file checks and admin submission are not available in this
            release. Nothing here is published.
          </p>
        </div>
        {error && (
          <div
            ref={errorRef}
            tabIndex={-1}
            role="alert"
            className="m-4 space-y-3 rounded-lg border border-destructive p-4 text-sm sm:mx-6"
          >
            <p>{error}</p>
            {!saved && draftId && (
              <DashboardButton variant="outline" type="button" onClick={load}>
                Reload saved draft
              </DashboardButton>
            )}
            {retryPending && (
              <p>
                Your input is retained. Retry uses the same save request;
                editing is paused until its result is confirmed.
              </p>
            )}
            {conflict && (
              <>
                <p>
                  Another save changed this draft. Your local answers have been
                  kept.
                </p>
                <DashboardButton
                  variant="outline"
                  type="button"
                  disabled={saving}
                  onClick={reviewLatest}
                >
                  Review latest saved draft
                </DashboardButton>
              </>
            )}
          </div>
        )}
        {latest && saved && (
          <PreparationSection
            title="Resolve the changed draft"
            help="Choose explicitly. Using your changes may replace the same fields changed in the newer draft; fields you did not edit are retained."
          >
            <p>
              Latest saved title: <strong>{latest.metadata.title}</strong>
            </p>
            <div className="flex flex-wrap gap-3">
              <DashboardButton
                variant="outline"
                type="button"
                onClick={() => {
                  setMetadata(latest.metadata);
                  setSaved(latest);
                  setLatest(null);
                  setReplayBase(null);
                  setConflict(false);
                  setError("");
                }}
              >
                Use latest saved draft
              </DashboardButton>
              <DashboardButton
                variant="outline"
                type="button"
                onClick={() => {
                  setMetadata(
                    DatasetPreparationMetadataSchema.parse(
                      reapplyLocal(
                        replayBase ?? saved.metadata,
                        metadata,
                        latest.metadata
                      )
                    )
                  );
                  setSaved(latest);
                  setLatest(null);
                  setReplayBase(null);
                  setConflict(false);
                  setError("");
                }}
              >
                Reapply my changes to latest draft
              </DashboardButton>
            </div>
          </PreparationSection>
        )}
        <nav
          aria-label="Proposal creation steps"
          className="grid grid-cols-2 gap-2 border-b border-border bg-muted/20 px-4 py-4 sm:grid-cols-4 sm:px-6"
        >
          {steps.map((label, index) => (
            <DashboardButton
              variant={step === index ? "default" : "outline"}
              type="button"
              key={label}
              aria-current={step === index ? "step" : undefined}
              className="h-auto min-h-10 whitespace-normal px-3 py-2 text-left"
              disabled={locked}
              onClick={() => setStep(index)}
            >
              {index + 1}. {label}
            </DashboardButton>
          ))}
        </nav>
        <fieldset disabled={locked} className="min-w-0 space-y-6 p-4 sm:p-6">
          <legend className="sr-only">{steps[step]}</legend>
          {step === 0 && (
            <>
              <PreparationSection
                title="Basics"
                help="Only a title is needed for the first save. Add your upload choice, main data types, category, source and stated license when you are ready."
              >
                <PreparationField
                  label="Dataset title"
                  multiline={false}
                  maxLength={200}
                  value={metadata.title}
                  onChange={(value) => setCommon("title", value ?? "")}
                />
                <fieldset className="space-y-2">
                  <legend className="mb-2 text-sm font-medium">
                    What are you uploading?
                  </legend>
                  {DATASET_UPLOAD_CHOICES.map((choice) => (
                    <label
                      key={choice.value}
                      className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3"
                    >
                      <input
                        type="radio"
                        className="mt-1 shrink-0 accent-[var(--dashboard-indicator)]"
                        name="upload-choice"
                        value={choice.value}
                        checked={metadata.uploadChoice === choice.value}
                        onChange={() => setCommon("uploadChoice", choice.value)}
                      />
                      <span>
                        <span className="block font-medium">
                          {choice.label}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {choice.help}
                        </span>
                      </span>
                    </label>
                  ))}
                </fieldset>
                <fieldset className="space-y-2">
                  <legend className="mb-2 text-sm font-medium">
                    Main types of data
                  </legend>
                  <p className="text-xs text-muted-foreground">
                    Choose one or more. Category and encoding are separate;
                    changing types keeps your earlier answers.
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {DATASET_MODALITIES.map((modality) => (
                      <label
                        key={modality.value}
                        className="flex items-start gap-2 rounded-lg border border-border p-3"
                      >
                        <input
                          type="checkbox"
                          className="mt-1 shrink-0 accent-[var(--dashboard-indicator)]"
                          checked={
                            metadata.modalities?.includes(modality.value) ??
                            false
                          }
                          onChange={(event) =>
                            update((previous) => ({
                              ...previous,
                              modalities: event.target.checked
                                ? [
                                    ...(previous.modalities ?? []),
                                    modality.value,
                                  ]
                                : (previous.modalities ?? []).filter(
                                    (value) => value !== modality.value
                                  ),
                            }))
                          }
                        />
                        <span>
                          <span className="block text-sm font-medium">
                            {modality.label}
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            {modality.help}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <fieldset className="space-y-2">
                  <legend className="text-sm font-medium">
                    Relevant capture or domain context
                  </legend>
                  <p className="text-xs text-muted-foreground">
                    A category does not automatically enable these questions or
                    specialist formats.
                  </p>
                  {(
                    [
                      ["HEALTHCARE", "Healthcare content"],
                      ["EGOCENTRIC", "Egocentric / first-person capture"],
                    ] as const
                  ).map(([value, label]) => (
                    <label key={value} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="shrink-0 accent-[var(--dashboard-indicator)]"
                        checked={metadata.contexts?.includes(value) ?? false}
                        onChange={(event) =>
                          update((previous) => ({
                            ...previous,
                            contexts: event.target.checked
                              ? [...(previous.contexts ?? []), value]
                              : (previous.contexts ?? []).filter(
                                  (item) => item !== value
                                ),
                          }))
                        }
                      />
                      {label}
                    </label>
                  ))}
                </fieldset>
                <div className="grid gap-5 sm:grid-cols-2">
                  <PreparationCatalogPicker
                    kind="categories"
                    value={metadata.primaryCategoryId}
                    onChange={(value) => setCommon("primaryCategoryId", value)}
                    disabled={locked}
                  />
                  <PreparationCatalogPicker
                    kind="sources"
                    value={metadata.sourceId}
                    onChange={(value) => setCommon("sourceId", value)}
                    disabled={locked}
                  />
                </div>
                <PreparationField
                  label="Dataset license"
                  multiline={false}
                  maxLength={1000}
                  value={metadata.license}
                  onChange={(value) => setCommon("license", value)}
                  help="Enter the supplier's stated standard license or existing license text. Agreements and negotiation stay outside Kuinbee; no license is selected for you."
                />
              </PreparationSection>
            </>
          )}
          {step === 1 && (
            <>
              <PreparationSection
                title="Files & contents"
                help="The confirmed allowance is 5 GB combined for full material, samples and companions, and 100 GB per supplier. No storage usage or file acceptance is claimed by this preparation form."
              >
                <p className="text-sm">
                  Uploads are unavailable in this testing release. No files have
                  been received through this draft editor.
                </p>
                {!metadata.uploadChoice && (
                  <p>
                    Choose what you are uploading in Basics to see the relevant
                    areas.
                  </p>
                )}
                {hasFull && (
                  <section
                    aria-label="Full material"
                    className="rounded-lg border border-border p-4"
                  >
                    <h3 className="font-medium">Full dataset</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Prepare all main files and companions for your defined
                      collection boundary. File selection and checks will be
                      connected in a later release.
                    </p>
                  </section>
                )}
                {hasSample && (
                  <section
                    aria-label="Sample material"
                    className="rounded-lg border border-border p-4"
                  >
                    <h3 className="font-medium">Sample</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Prepare a usable sample and its needed companions. A
                      sample inside a full archive cannot expose the full
                      archive to buyers.
                    </p>
                  </section>
                )}
              </PreparationSection>
              {hasFull && (
                <PreparationQuantities
                  field="fullMeasurements"
                  metadata={metadata}
                  onUpdate={update}
                  label="Declared amount in prepared full material"
                />
              )}
              {hasSample && (
                <PreparationQuantities
                  field="sampleMeasurements"
                  metadata={metadata}
                  onUpdate={update}
                  label="Declared amount in prepared sample"
                />
              )}
            </>
          )}
          {step === 2 && (
            <>
              <PreparationSection title="Dataset details">
                <PreparationField
                  label="What collection does this Dataset cover?"
                  value={metadata.collectionBoundary}
                  onChange={(value) => setCommon("collectionBoundary", value)}
                  help="Full means complete for this honestly defined boundary, not everything you own."
                />
                <PreparationField
                  label="Short summary"
                  value={metadata.overview}
                  onChange={(value) => setCommon("overview", value)}
                />
                <PreparationField
                  label="Detailed description"
                  value={metadata.description}
                  onChange={(value) => setCommon("description", value)}
                  help="Explain organization and interpretation, rather than repeating the summary."
                />
                <PreparationField
                  label="Quality checks and known quality"
                  value={metadata.dataQuality}
                  onChange={(value) => setCommon("dataQuality", value)}
                  help="Not assessed is an honest answer. File checks do not prove research quality."
                />
              </PreparationSection>
              <PreparationQuantities
                field="collectionMeasurements"
                metadata={metadata}
                onUpdate={update}
                label="Represented collection quantity"
              />
              <PreparationProfileFields metadata={metadata} onUpdate={update} />
              {hasSample && (
                <PreparationSection title="How the sample represents the collection">
                  <PreparationField
                    label="How was the sample selected?"
                    value={sample.selectionMethod}
                    onChange={(value) => setSample("selectionMethod", value)}
                  />
                  <PreparationField
                    label="What does the sample cover?"
                    value={sample.coverage}
                    onChange={(value) => setSample("coverage", value)}
                    help="Explain what is known or unknown about representativeness."
                  />
                  <PreparationSelect
                    label="What is missing from the sample?"
                    value={sample.omissions}
                    onChange={(value) => setSample("omissions", value)}
                    options={[
                      ["DESCRIBED", "Describe omissions"],
                      ["NONE_KNOWN", "None known"],
                      ["UNKNOWN", "Unknown"],
                    ]}
                  />
                  {sample.omissions === "DESCRIBED" && (
                    <PreparationField
                      label="Sample omissions"
                      value={sample.omissionNotes}
                      onChange={(value) => setSample("omissionNotes", value)}
                    />
                  )}
                  <PreparationSelect
                    label="How was the sample changed from its source?"
                    value={sample.transformations}
                    onChange={(value) => setSample("transformations", value)}
                    options={[
                      ["NONE_DECLARED", "No changes declared"],
                      ["DESCRIBED", "Describe changes"],
                      ["UNKNOWN", "Unknown"],
                    ]}
                  />
                  {sample.transformations === "DESCRIBED" && (
                    <PreparationField
                      label="Sample preparation or changes"
                      value={sample.transformationNotes}
                      onChange={(value) =>
                        setSample("transformationNotes", value)
                      }
                    />
                  )}
                  <PreparationField
                    label="Relationship to full material"
                    value={sample.relationshipNotes}
                    onChange={(value) => setSample("relationshipNotes", value)}
                    help="Optional correspondence declaration; this does not grant full-file access."
                  />
                </PreparationSection>
              )}
              {hasFull && (
                <PreparationSection title="Full collection boundary">
                  <label className="flex items-start gap-3 text-sm">
                    <input
                      type="checkbox"
                      className="mt-1 shrink-0 accent-[var(--dashboard-indicator)]"
                      checked={metadata.fullCompleteness === true}
                      onChange={(event) =>
                        setCommon("fullCompleteness", event.target.checked)
                      }
                    />
                    <span>
                      My planned full material will cover the collection
                      boundary I defined.
                      <span className="mt-1 block text-xs text-muted-foreground">
                        This is a supplier declaration. No received files or
                        verified completeness are implied.
                      </span>
                    </span>
                  </label>
                </PreparationSection>
              )}
              <PreparationSection title="Optional enrichment">
                <PreparationField
                  label="Known limitations"
                  value={metadata.limitations}
                  onChange={(value) => setCommon("limitations", value)}
                />
                <PreparationField
                  label="Collection or preparation method"
                  value={metadata.collectionMethod}
                  onChange={(value) => setCommon("collectionMethod", value)}
                />
                <PreparationField
                  label="Possible uses"
                  value={metadata.possibleUses}
                  onChange={(value) => setCommon("possibleUses", value)}
                />
                {metadata.modalities?.includes("TABULAR") && (
                  <PreparationSelect
                    label="Statistical study structure (if applicable)"
                    value={metadata.superType}
                    onChange={(value) =>
                      setCommon(
                        "superType",
                        value as DatasetPreparationMetadata["superType"]
                      )
                    }
                    options={DATASET_TYPES.map(
                      (type) => [type.value, type.label] as const
                    )}
                    help="Optional. Media suppliers do not need to invent a statistical type."
                  />
                )}
              </PreparationSection>
              {metadata.contexts?.includes("HEALTHCARE") && (
                <p className="text-sm text-muted-foreground">
                  DICOM and other specialist formats require separate
                  qualification. Selecting healthcare context does not enable
                  their upload.
                </p>
              )}
            </>
          )}
          {step === 3 && (
            <>
              {saved && <PreparationReview metadata={saved.metadata} />}
              <PreparationSection
                title="Preparation checklist"
                help={
                  dirty
                    ? "This checklist describes the last acknowledged save. Save your changes to refresh it."
                    : "This is preparation guidance, not final submission validation. File intake and review integration remain unavailable."
                }
              >
                {!saved ? (
                  <p>Save the draft to get the server preparation checklist.</p>
                ) : (
                  <>
                    <p className="text-sm">
                      Saved title: <strong>{saved.metadata.title}</strong>
                    </p>
                    <p className="text-sm">
                      Saved upload choice:{" "}
                      {DATASET_UPLOAD_CHOICES.find(
                        (choice) => choice.value === saved.metadata.uploadChoice
                      )?.label ?? "Not chosen"}
                    </p>
                    <ul className="space-y-3">
                      {saved.readiness.issues.map((issue, i) => (
                        <li
                          key={`${issue.code}-${issue.field ?? i}`}
                          className="rounded-lg border border-border p-3 text-sm"
                        >
                          <p>{issue.message}</p>
                          {issue.field && (
                            <DashboardButton
                              type="button"
                              variant="link"
                              size="compact"
                              className="mt-1 h-auto whitespace-normal p-0 text-left"
                              onClick={() => moveToField(issue.field)}
                            >
                              Go to this section
                            </DashboardButton>
                          )}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </PreparationSection>
              <PreparationSection title="Review remains a separate action">
                <p className="text-sm">
                  Pricing, file intake and admin submission will be connected
                  after their checks are qualified. Existing proposals retain
                  their existing explicit Submit workflow.
                </p>
                <DashboardButton
                  variant="outline"
                  type="button"
                  disabled
                  className="h-auto min-h-10 whitespace-normal"
                >
                  Submit for admin review — unavailable
                </DashboardButton>
              </PreparationSection>
            </>
          )}
        </fieldset>
        <DashboardFormActions
          className="bg-muted/20 px-4 sm:px-6"
          status={`Step ${step + 1} of ${steps.length} · All saves are private. Saving never submits.`}
        >
          <DashboardButton
            type="button"
            disabled={
              !hydrated || loading || saving || conflict || unavailableExisting
            }
            onClick={() => void save()}
          >
            {saving ? "Saving…" : retryPending ? "Retry save" : "Save draft"}
          </DashboardButton>
          <DashboardButton
            variant="outline"
            type="button"
            disabled={locked || conflict}
            onClick={async () => {
              if (await save()) setStep(Math.min(step + 1, 3));
            }}
          >
            Save and {step === 3 ? "stay on review" : "continue"}
          </DashboardButton>
          <DashboardButton
            variant="outline"
            type="button"
            disabled={locked || conflict}
            onClick={async () => {
              if (await save()) onExit?.();
            }}
          >
            Save and exit
          </DashboardButton>
        </DashboardFormActions>
      </DashboardCard>
    </DatasetWorkspace>
  );
}
