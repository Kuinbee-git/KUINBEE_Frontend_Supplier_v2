"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  type DatasetFilesContextBody,
  type DatasetFilesContextResponse,
  type DatasetFilesInventoryPageResponse,
  type DatasetPreparationResponse,
} from "@kuinbee/dataset-preparation-contracts";
import { DashboardButton } from "@/components/dashboard";
import { useComponentRequest } from "@/hooks/useComponentRequest";
import { usePreparationUploads } from "@/hooks/usePreparationUploads";
import { datasetFilesApi } from "@/lib/api/dataset-files";
import { PreparationApiError } from "@/lib/api/dataset-preparations";
import { datasetActionError } from "@/lib/datasets/dataset-action-error";
import { PreparationGrid, PreparationSection } from "./PreparationFields";
import { PreparationUploadPanel } from "./PreparationUploadPanel";
import { PreparationOrganization } from "./PreparationOrganization";
import { PreparationTables } from "./PreparationTables";

type Member = DatasetFilesInventoryPageResponse["items"][number];
const purpose: Record<Member["role"], string> = {
  PRIMARY: "Primary data",
  TRANSCRIPT: "Transcript",
  ANNOTATION: "Annotation",
  SENSOR: "Sensor data",
  CALIBRATION: "Calibration",
  DOCUMENTATION: "Documentation",
};
function decimalSize(value: string) {
  const bytes = BigInt(value);
  const unit =
    bytes >= BigInt(1_000_000_000)
      ? "GB"
      : bytes >= BigInt(1_000_000)
        ? "MB"
        : "bytes";
  if (unit === "bytes") return `${bytes.toLocaleString()} bytes`;
  const divisor = BigInt(unit === "GB" ? 1_000_000_000 : 1_000_000);
  const hundredths = (bytes * BigInt(100)) / divisor;
  return `${hundredths / BigInt(100)}.${(hundredths % BigInt(100)).toString().padStart(2, "0")} ${unit}`;
}
function FilesRows({
  members,
  onRemove,
  disabled,
}: {
  members: Member[];
  onRemove: (member: Member) => void;
  disabled: boolean;
}) {
  if (!members.length)
    return (
      <p className="text-sm text-muted-foreground">
        No file references on this page.
      </p>
    );
  return (
    <ul
      className="min-w-0 divide-y divide-border"
      aria-label="Stored file references"
    >
      {members.map((member) => (
        <li
          key={member.id}
          className="grid min-w-0 gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,11rem)]"
        >
          <div className="min-w-0">
            <p className="break-words text-sm font-medium [overflow-wrap:anywhere]">
              {member.originalFileName ?? "Original filename unavailable"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {purpose[member.role]}
            </p>
            {member.relativePath && (
              <p className="mt-1 break-words text-xs text-muted-foreground [overflow-wrap:anywhere]">
                Path: {member.relativePath}
              </p>
            )}
            <p
              className="mt-1 text-xs"
              title={`${member.measuredSizeBytes} bytes`}
            >
              Measured size: {decimalSize(member.measuredSizeBytes)}
            </p>
            <DashboardButton
              type="button"
              variant="outline"
              className="mt-3"
              disabled={disabled}
              onClick={() => onRemove(member)}
            >
              Remove from{" "}
              {member.component === "FULL" ? "full dataset" : "sample"}
            </DashboardButton>
          </div>
          <p className="text-xs text-muted-foreground">Uploaded</p>
        </li>
      ))}
    </ul>
  );
}

export function PreparationFilesPanel({
  saved,
  active,
  metadataDirty,
  metadataBlocked,
  metadataUnsettled = false,
  onUncertainChange,
  onWritingChange,
  onMetadataChanged,
  onActivityChange,
  onInputsDirtyChange,
}: {
  saved: DatasetPreparationResponse | null;
  active: boolean;
  metadataDirty: boolean;
  metadataBlocked: boolean;
  metadataUnsettled?: boolean;
  onUncertainChange: (value: boolean) => void;
  onWritingChange: (value: boolean) => void;
  onMetadataChanged: () => void;
  onActivityChange: (value: boolean, pause?: () => void) => void;
  onInputsDirtyChange: (value: boolean) => void;
}) {
  const [context, setContext] = useState<DatasetFilesContextResponse | null>(
    null
  );
  const [inventory, setInventory] =
    useState<DatasetFilesInventoryPageResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [writing, setWriting] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const [uploadUncertain, setUploadUncertain] = useState(false);
  const [organizationDirty, setOrganizationDirty] = useState(false);
  const [tablesDirty, setTablesDirty] = useState(false);
  useEffect(
    () => onInputsDirtyChange(organizationDirty || tablesDirty),
    [organizationDirty, tablesDirty, onInputsDirtyChange]
  );
  useEffect(() => () => onInputsDirtyChange(false), [onInputsDirtyChange]);
  useEffect(
    () => onUncertainChange(uncertain || uploadUncertain),
    [uncertain, uploadUncertain, onUncertainChange]
  );
  const [error, setError] = useState("");
  const [readFailed, setReadFailed] = useState(true);
  const [history, setHistory] = useState<Array<string | undefined>>([
    undefined,
  ]);
  const [pageIndex, setPageIndex] = useState(0);
  const epoch = useRef(0);
  const reader = useRef<AbortController | null>(null);
  const pending = useRef<{ id: string; body: DatasetFilesContextBody } | null>(
    null
  );
  const writeBusy = useRef(false);
  useLayoutEffect(() => {
    if (metadataUnsettled) {
      epoch.current++;
      reader.current?.abort();
    }
  }, [metadataUnsettled]);
  useEffect(
    () => () => {
      epoch.current++;
      reader.current?.abort();
    },
    []
  );

  const read = useCallback(
    async (
      afterId?: string,
      index = 0,
      pinned?: { contentId: string; contentGeneration: number }
    ) => {
      if (!saved || metadataUnsettled || pending.current || writeBusy.current)
        return false;
      const generation = ++epoch.current;
      reader.current?.abort();
      const controller = new AbortController();
      reader.current = controller;
      setLoading(true);
      setError("");
      setInventory(null);
      try {
        const next = await datasetFilesApi.context(saved.id, controller.signal);
        if (generation !== epoch.current) return false;
        setContext(next);
        if (next.preparationGeneration !== saved.generation) {
          setReadFailed(true);
          onMetadataChanged();
          setError(
            "Saved details changed in another tab. Review the latest saved draft before changing its files."
          );
          return false;
        }
        if (
          pinned &&
          (next.contentId !== pinned.contentId ||
            next.contentGeneration !== pinned.contentGeneration)
        ) {
          setReadFailed(true);
          setError(
            "The file inventory changed. Refresh files to restart from its first page."
          );
          return false;
        }
        if (
          next.contentId &&
          next.contentGeneration !== null &&
          next.editable &&
          !next.synchronizationRequired
        ) {
          const page = await datasetFilesApi.page(
            saved.id,
            {
              expectedPreparationGeneration: saved.generation,
              contentId: next.contentId,
              contentGeneration: next.contentGeneration,
              afterId,
              limit: 20,
            },
            controller.signal
          );
          if (generation !== epoch.current) return false;
          setInventory(page);
        }
        setPageIndex(index);
        setReadFailed(false);
        if (index === 0) setHistory([undefined]);
        return true;
      } catch (failure) {
        if (generation !== epoch.current || controller.signal.aborted)
          return false;
        setReadFailed(true);
        setError(
          datasetActionError(
            failure,
            "The saved file inventory could not be loaded."
          )
        );
        return false;
      } finally {
        if (generation === epoch.current) setLoading(false);
      }
    },
    [saved, onMetadataChanged, metadataUnsettled]
  );
  useComponentRequest(
    read,
    [saved?.id, saved?.generation, active, metadataUnsettled],
    Boolean(saved && active && !metadataUnsettled)
  );

  const current = Boolean(
    saved &&
    context &&
    context.preparationId === saved.id &&
    context.preparationGeneration === saved.generation &&
    !readFailed
  );
  const choice = current ? context!.serverUploadChoice : null;
  // The first metadata Save can create content before its empty storage ledger.
  // Keep an explicit setup action available even when metadata is synchronized.
  const storageSetupRequired =
    current && context?.usage.state === "RECONCILING";
  const hasFull = choice === "FULL_ONLY" || choice === "FULL_AND_SAMPLE";
  const hasSample = choice === "SAMPLE_ONLY" || choice === "FULL_AND_SAMPLE";
  const usableInventory =
    current &&
    context &&
    inventory &&
    inventory.contentId === context.contentId &&
    inventory.contentGeneration === context.contentGeneration &&
    inventory.preparationGeneration === saved!.generation &&
    !context.synchronizationRequired
      ? inventory
      : null;
  const onFilesChanged = useCallback(() => read(), [read]);
  const uploads = usePreparationUploads({
    saved,
    context: current ? context : null,
    active,
    metadataDirty,
    metadataUnsettled,
    blocked: metadataBlocked || writing || uncertain || loading,
    onWritingChange,
    onUncertainChange: setUploadUncertain,
    onActivityChange,
    onFilesChanged,
  });

  async function synchronize() {
    if (
      !saved ||
      writeBusy.current ||
      metadataBlocked ||
      (!pending.current &&
        (!current || !context?.editable || !choice || metadataDirty))
    )
      return;
    writeBusy.current = true;
    epoch.current++;
    reader.current?.abort();
    setLoading(false);
    setWriting(true);
    onWritingChange(true);
    setError("");
    try {
      if (!pending.current)
        pending.current = {
          id: saved.id,
          body: {
            requestId: crypto.randomUUID(),
            expectedPreparationGeneration: saved.generation,
            expectedContentId: context!.contentId,
            expectedContentGeneration: context!.contentGeneration,
          },
        };
      await datasetFilesApi.synchronize(
        pending.current.id,
        pending.current.body
      );
      pending.current = null;
      setUncertain(false);
      // The original acknowledgement can predate another save. Read current
      // context rather than promoting the receipt to a latest inventory.
      writeBusy.current = false;
      await read();
    } catch (failure) {
      const ambiguous =
        failure instanceof PreparationApiError &&
        (["NETWORK_ERROR", "INCOMPATIBLE_RESPONSE"].includes(failure.code) ||
          (failure.status ?? 0) >= 500);
      if (!ambiguous) pending.current = null;
      if (!ambiguous) setReadFailed(true);
      setUncertain(Boolean(ambiguous && pending.current));
      setError(datasetActionError(failure, "Files could not be updated."));
    } finally {
      writeBusy.current = false;
      setWriting(false);
      onWritingChange(false);
    }
  }

  const members = usableInventory?.items ?? [];
  const outside = members.filter((member) =>
    member.component === "FULL" ? !hasFull : !hasSample
  );
  const mutationDisabled =
    uploads.reconcileRequired ||
    metadataBlocked ||
    metadataDirty ||
    loading ||
    writing ||
    !current ||
    !context?.editable ||
    !choice;
  return (
    <PreparationGrid>
      <section
        aria-label="Files and contents"
        className="col-span-full space-y-3 border-b border-border pb-4"
      >
        <h2 className="text-lg font-semibold">Files &amp; contents</h2>
        {!saved ? (
          <p className="text-sm">
            Save your draft and choose what you are uploading in Basics before
            setting up files.
          </p>
        ) : (
          <>
            <div role="status" aria-live="polite" className="text-sm">
              {writing
                ? "Updating files…"
                : uncertain
                  ? "File change not confirmed — retry required"
                  : loading
                    ? "Loading saved files…"
                    : !current
                      ? "Files are not loaded."
                      : context?.synchronizationRequired
                        ? "Saved details changed. Update files to use your saved choices."
                        : storageSetupRequired
                          ? "Set up files to check storage before uploading."
                          : context?.contentId
                            ? "Files use your saved upload choice."
                            : "Set up files to start your inventory."}
            </div>
            {metadataDirty && (
              <p className="text-sm text-muted-foreground">
                You have unsaved Dataset details. Save them before setting up or
                updating files. The saved files below remain unchanged.
              </p>
            )}
            {error && (
              <p role="alert" className="break-words text-sm text-destructive">
                {error}
              </p>
            )}
            {uncertain && (
              <p className="text-sm text-muted-foreground">
                Retry confirms the same file change. Other saves are paused
                until it is confirmed.
              </p>
            )}
            {!loading && current && !choice && (
              <p className="text-sm">
                Choose what you are uploading in Basics, then save the draft.
              </p>
            )}
            {current && !context?.editable && (
              <p className="text-sm">
                Files cannot be edited in the current proposal state.
              </p>
            )}
            <div className="flex flex-wrap gap-3">
              {uncertain ? (
                <DashboardButton
                  type="button"
                  disabled={metadataBlocked || writing}
                  onClick={() => void synchronize()}
                >
                  Retry file change
                </DashboardButton>
              ) : current &&
                choice &&
                (!context?.contentId ||
                  context.synchronizationRequired ||
                  storageSetupRequired) ? (
                <DashboardButton
                  type="button"
                  disabled={mutationDisabled}
                  onClick={() => void synchronize()}
                >
                  {context?.contentId && !storageSetupRequired
                    ? "Update files"
                    : "Set up files"}
                </DashboardButton>
              ) : null}
              <DashboardButton
                type="button"
                variant="outline"
                disabled={writing || uncertain || metadataBlocked}
                onClick={() => void read()}
              >
                Refresh files
              </DashboardButton>
            </div>
          </>
        )}
        <dl className="grid gap-3 border-t border-border pt-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Dataset storage</dt>
            <dd
              title={
                current && context?.usage.dataset.chargedBytes !== null
                  ? `${context?.usage.dataset.chargedBytes} bytes`
                  : undefined
              }
            >
              {current && context?.usage.state === "ACCOUNTED"
                ? `${decimalSize(context.usage.dataset.chargedBytes!)} charged of 5 GB`
                : "Usage unavailable · 5 GB allowance"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Supplier storage</dt>
            <dd
              title={
                current && context?.usage.supplier.chargedBytes !== null
                  ? `${context?.usage.supplier.chargedBytes} bytes`
                  : undefined
              }
            >
              {current && context?.usage.state === "ACCOUNTED"
                ? `${decimalSize(context.usage.supplier.chargedBytes!)} charged of 100 GB`
                : "Usage unavailable · 100 GB allowance"}
            </dd>
          </div>
        </dl>
        <p className="text-xs text-muted-foreground">
          Retained files and reserved uploads count. Removing a reference does
          not free stored bytes.
        </p>
      </section>
      <PreparationUploadPanel
        model={{
          ...uploads,
          canAdmit: uploads.canAdmit && !tablesDirty,
          canChange: uploads.canChange && !tablesDirty,
        }}
        hasFull={hasFull}
        hasSample={hasSample}
        members={members}
      />
      {hasFull && (
        <PreparationSection
          title="Full dataset"
          className={hasSample ? "lg:col-span-6" : "lg:col-span-12"}
          help="All main files and companions for your defined collection boundary."
        >
          <section aria-label="Full material">
            {usableInventory ? (
              <FilesRows
                onRemove={(member) => {
                  if (usableInventory)
                    void uploads.removeMember(member, usableInventory);
                }}
                disabled={!uploads.canChange || tablesDirty}
                members={members.filter(
                  (member) => member.component === "FULL"
                )}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                {context?.synchronizationRequired
                  ? "Update files to review retained file references."
                  : "Set up files to view their inventory."}
              </p>
            )}
          </section>
          {!uploads.config?.admission.enabled && (
            <DashboardButton type="button" variant="outline" disabled>
              Upload full files — unavailable
            </DashboardButton>
          )}
        </PreparationSection>
      )}
      {hasSample && (
        <PreparationSection
          title="Sample"
          className={hasFull ? "lg:col-span-6" : "lg:col-span-12"}
          help="Buyer display material and its needed companions. A sample reference cannot expose an entire full archive."
        >
          <section aria-label="Sample material">
            {usableInventory ? (
              <FilesRows
                onRemove={(member) => {
                  if (usableInventory)
                    void uploads.removeMember(member, usableInventory);
                }}
                disabled={!uploads.canChange || tablesDirty}
                members={members.filter(
                  (member) => member.component === "SAMPLE"
                )}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                {context?.synchronizationRequired
                  ? "Update files to review retained file references."
                  : "Set up files to view their inventory."}
              </p>
            )}
          </section>
          {!uploads.config?.admission.enabled && (
            <DashboardButton type="button" variant="outline" disabled>
              Upload sample files — unavailable
            </DashboardButton>
          )}
        </PreparationSection>
      )}
      {outside.length > 0 && (
        <PreparationSection
          title="Retained files outside the saved upload choice"
          className="lg:col-span-12"
          help="Changing the upload choice did not delete these references or their stored bytes. They must be resolved before submission becomes available."
        >
          <FilesRows
            members={outside}
            onRemove={(member) => {
              if (usableInventory)
                void uploads.removeMember(member, usableInventory);
            }}
            disabled={!uploads.canChange || tablesDirty}
          />
        </PreparationSection>
      )}
      {usableInventory && (
        <div className="col-span-full flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <p className="text-sm text-muted-foreground">
            File references · page {pageIndex + 1}
          </p>
          <div className="flex flex-wrap gap-3">
            <DashboardButton
              type="button"
              variant="outline"
              disabled={
                pageIndex === 0 ||
                loading ||
                writing ||
                uncertain ||
                metadataBlocked
              }
              onClick={() =>
                void read(history[pageIndex - 1], pageIndex - 1, {
                  contentId: usableInventory.contentId,
                  contentGeneration: usableInventory.contentGeneration,
                })
              }
            >
              Previous files page
            </DashboardButton>
            <DashboardButton
              type="button"
              variant="outline"
              disabled={
                !usableInventory.nextCursor ||
                loading ||
                writing ||
                uncertain ||
                metadataBlocked
              }
              onClick={() => {
                const next = usableInventory.nextCursor?.afterId;
                if (!next) return;
                setHistory((previous) => [
                  ...previous.slice(0, pageIndex + 1),
                  next,
                ]);
                void read(next, pageIndex + 1, {
                  contentId: usableInventory.contentId,
                  contentGeneration: usableInventory.contentGeneration,
                });
              }}
            >
              Next files page
            </DashboardButton>
          </div>
        </div>
      )}
      {context?.contentId && context.contentGeneration !== null && (
        <PreparationOrganization
          basis={{
            preparationId: context.preparationId,
            preparationGeneration: context.preparationGeneration,
            contentId: context.contentId,
            contentGeneration: context.contentGeneration,
          }}
          active={Boolean(
            active &&
            current &&
            context.editable &&
            !context.synchronizationRequired
          )}
          canChange={uploads.canChange && !tablesDirty}
          hasFull={hasFull}
          hasSample={hasSample}
          mutate={uploads.organize}
          onDirtyChange={setOrganizationDirty}
        />
      )}
      {context?.contentId && context.contentGeneration !== null && (
        <PreparationTables
          basis={{
            preparationId: context.preparationId,
            preparationGeneration: context.preparationGeneration,
            contentId: context.contentId,
            contentGeneration: context.contentGeneration,
          }}
          members={members}
          active={Boolean(
            active &&
            current &&
            context.editable &&
            !context.synchronizationRequired &&
            !metadataUnsettled
          )}
          canChange={uploads.canChange && !organizationDirty}
          pending={
            uploads.pending?.kind === "TABLES" ||
            uploads.pending?.kind === "REFERENCES"
          }
          referencePending={uploads.pending?.kind === "REFERENCES"}
          buildReferenceCommand={uploads.buildReferenceCommand}
          sendReferenceCommand={uploads.sendReferenceCommand}
          buildCommand={uploads.buildTableCommand}
          sendCommand={uploads.sendTableCommand}
          retry={uploads.retry}
          onDirtyChange={setTablesDirty}
        />
      )}
    </PreparationGrid>
  );
}
