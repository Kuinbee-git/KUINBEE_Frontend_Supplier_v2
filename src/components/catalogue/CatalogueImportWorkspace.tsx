"use client";
import {
  Children,
  isValidElement,
  type ReactNode,
  useId,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import {
  CATALOGUE_IMPORT_LIMITS,
  type CatalogueImportUploadBody,
  type CatalogueImportReviseBody,
  type CatalogueImportCommitBody,
} from "@kuinbee/dataset-preparation-contracts";
import {
  type CatalogueApi,
  type CatalogueBatch,
  type CatalogueCandidates,
  CatalogueRetainedRequestSchema,
  catalogueError,
  catalogueRequestUncertain,
  downloadCatalogueFile,
  readCatalogueFile,
} from "@/lib/catalogue-imports";
import { CatalogueImportSteps } from "./CatalogueImportSteps";
import {
  DashboardButton,
  DashboardInput,
  DashboardCheckbox,
  DashboardInlineAlert,
  DashboardWorkspace,
  DashboardRegion,
  DashboardSelect,
  DashboardSelectTrigger,
  DashboardSelectValue,
  DashboardSelectContent,
  DashboardSelectItem,
} from "@/components/dashboard";
import {
  DatasetWorkspace,
  DatasetPageHeader,
} from "@/components/datasets/workspace/DatasetWorkspace";
import { CATALOGUE_IMPORT_GUIDE_PATH } from "@/lib/datasets/catalogue-import-guidance";

const section = "min-w-0 space-y-5 px-4 py-5 md:px-6 md:py-6";
function CatalogueSelect({
  id,
  value,
  onValueChange,
  disabled,
  children,
}: {
  id: string;
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  const options = Children.toArray(children).filter(
    isValidElement<{ value: string; children: ReactNode }>
  );
  return (
    <DashboardSelect
      value={value || "__none"}
      onValueChange={(next) => onValueChange(next === "__none" ? "" : next)}
      disabled={disabled}
    >
      <DashboardSelectTrigger id={id}>
        <DashboardSelectValue />
      </DashboardSelectTrigger>
      <DashboardSelectContent>
        {options.map((option) => (
          <DashboardSelectItem
            key={option.props.value || "__none"}
            value={option.props.value || "__none"}
          >
            {option.props.children}
          </DashboardSelectItem>
        ))}
      </DashboardSelectContent>
    </DashboardSelect>
  );
}
const label = "grid min-w-0 gap-2 text-sm font-medium";
const uuid = () => crypto.randomUUID();
const display = (value: unknown): string =>
  value === null || value === undefined || value === ""
    ? "Not declared"
    : typeof value === "string"
      ? value
      : JSON.stringify(value);
const activeStates = ["VALIDATING", "RUNNING"];
const revisableStates = [
  "READY",
  "NEEDS_CORRECTION",
  "PAUSED",
  "COMPLETED_WITH_ERRORS",
];
type RowChoice = CatalogueImportReviseBody["rows"][number];
type Pending =
  | { action: "preview"; body: CatalogueImportUploadBody }
  | { action: "revise"; id: string; body: CatalogueImportReviseBody }
  | { action: "commit"; id: string; body: CatalogueImportCommitBody }
  | { action: "cancel"; id: string; body: { requestId: string } };

export function CatalogueImportWorkspace({
  api,
  ownerLabel,
  storageKey,
  canImport = true,
}: {
  api: CatalogueApi;
  ownerLabel: string;
  storageKey: string;
  canImport?: boolean;
}) {
  const fieldId = useId();
  const [batch, setBatch] = useState<CatalogueBatch | null>(null);
  const [history, setHistory] = useState<Omit<CatalogueBatch, "rows">[]>([]);
  const [mode, setMode] =
    useState<CatalogueImportUploadBody["mode"]>("CREATE_MISSING");
  const [files, setFiles] = useState<File[]>([]);
  const [template, setTemplate] = useState<Awaited<
    ReturnType<CatalogueApi["template"]>
  > | null>(null);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const [pending, setPending] = useState<Pending | null>(null);
  const [choices, setChoices] = useState<Record<string, RowChoice>>({});
  const [acknowledgeUnmatched, setAcknowledgeUnmatched] = useState(false);
  const [candidates, setCandidates] = useState<CatalogueCandidates | null>(
    null
  );
  const [search, setSearch] = useState(""),
    [page, setPage] = useState(1),
    [filter, setFilter] = useState("ALL");
  const fileInput = useRef<HTMLInputElement>(null);
  const refreshHistory = useCallback(async () => {
    const result = await api.list();
    setHistory(result.items);
  }, [api]);
  const acceptBatch = useCallback((result: CatalogueBatch) => {
    setBatch(result);
    setChoices({});
    setAcknowledgeUnmatched(false);
    setPage(1);
    const url = new URL(window.location.href);
    url.searchParams.set("batch", result.id);
    window.history.replaceState(window.history.state, "", url);
  }, []);
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        try {
          const stored = sessionStorage.getItem(storageKey);
          if (stored) {
            const value = CatalogueRetainedRequestSchema.safeParse(
              JSON.parse(stored)
            );
            if (value.success && !cancelled) setPending(value.data);
            else sessionStorage.removeItem(storageKey);
          }
        } catch {
          /* Storage may be unavailable; owner-scoped history still recovers accepted batches. */
        }
        await refreshHistory();
        const id = new URL(window.location.href).searchParams.get("batch");
        if (id) {
          const result = await api.get(id);
          if (!cancelled) acceptBatch(result);
        }
      } catch (e) {
        if (!cancelled) setError(catalogueError(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [api, storageKey, refreshHistory, acceptBatch]);
  const currentBatchId = batch?.id,
    currentBatchStatus = batch?.status;
  useEffect(() => {
    if (
      !currentBatchId ||
      !currentBatchStatus ||
      !activeStates.includes(currentBatchStatus)
    )
      return;
    const controller = new AbortController();
    let inFlight = false;
    const timer = setInterval(() => {
      if (inFlight) return;
      inFlight = true;
      void api
        .progress(currentBatchId, controller.signal)
        .then((result) => {
          const progressById = new Map(result.rows.map((row) => [row.id, row]));
          setBatch((current) =>
            current?.id === result.id
              ? {
                  ...current,
                  ...result,
                  rows: current.rows.map((row) => ({
                    ...row,
                    ...progressById.get(row.id),
                  })),
                }
              : current
          );
          if (!activeStates.includes(result.status))
            void refreshHistory().catch(() => {});
        })
        .catch((e) => {
          if (!controller.signal.aborted) setError(catalogueError(e));
        })
        .finally(() => {
          inFlight = false;
        });
    }, 2000);
    return () => {
      clearInterval(timer);
      controller.abort();
    };
  }, [api, currentBatchId, currentBatchStatus, refreshHistory]);
  async function perform(command: Pending) {
    setBusy(true);
    setError("");
    setNotice("");
    setPending(command);
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(command));
    } catch {
      setNotice(
        "Keep this page open until the request is confirmed. The browser could not retain the pending request."
      );
    }
    try {
      const result =
        command.action === "preview"
          ? await api.preview(command.body)
          : command.action === "revise"
            ? await api.revise(command.id, command.body)
            : command.action === "commit"
              ? await api.commit(command.id, command.body)
              : await api.cancel(command.id, command.body);
      acceptBatch(result);
      setPending(null);
      try {
        sessionStorage.removeItem(storageKey);
      } catch {
        /* Accepted result remains visible. */
      }
      setNotice(
        command.action === "preview" || command.action === "revise"
          ? "Preview ready. Drafts have not been changed."
          : command.action === "cancel"
            ? "Cancellation requested. Already saved drafts are preserved."
            : "Private draft import accepted. Progress and row results appear below."
      );
      void refreshHistory().catch(() => {});
    } catch (e) {
      setError(catalogueError(e));
      if (!catalogueRequestUncertain(e)) {
        setPending(null);
        try {
          sessionStorage.removeItem(storageKey);
        } catch {
          /* Accepted result remains visible. */
        }
      }
    } finally {
      setBusy(false);
    }
  }
  async function preview() {
    setError("");
    if (!files.length) {
      setError("Choose a catalogue CSV or Excel workbook first.");
      return;
    }
    if (
      files.length > 3 ||
      files.reduce((total, file) => total + file.size, 0) >
        CATALOGUE_IMPORT_LIMITS.uploadBytes
    ) {
      setError(
        "Choose at most three files, with a combined size of 32 MB or less."
      );
      return;
    }
    setBusy(true);
    try {
      const encoded = await Promise.all(files.map(readCatalogueFile));
      await perform({
        action: "preview",
        body: {
          requestId: uuid(),
          version: "private-catalogue-v1",
          mode,
          files: encoded,
        },
      });
    } catch (e) {
      setError(catalogueError(e));
      setBusy(false);
    }
  }
  async function readAction(action: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (e) {
      setError(catalogueError(e));
    } finally {
      setBusy(false);
    }
  }
  function choose(rowId: string, change: Partial<RowChoice>) {
    setChoices((previous) => ({
      ...previous,
      [rowId]: { ...previous[rowId], rowId, ...change },
    }));
  }
  const changed = Object.keys(choices).length > 0;
  const canRevise = Boolean(batch && revisableStates.includes(batch.status));
  const visibleRows =
    batch?.rows.filter(
      (row) =>
        filter === "ALL" ||
        (filter === "ISSUES"
          ? row.errors.length > 0 ||
            ["CONFLICT", "FAILED", "INVALID"].includes(row.status)
          : row.warnings.length > 0)
    ) ?? [];
  const rows = visibleRows.slice((page - 1) * 25, page * 25);
  const completed =
    batch &&
    ["COMPLETED", "CANCELLED", "FAILED", "EXPIRED"].includes(batch.status);
  return (
    <DatasetWorkspace className="dataset-proposal-workspace">
      <DatasetPageHeader
        title="Import private catalogue"
        breadcrumbs={<Link href="/dashboard/datasets">My drafts</Link>}
        description="Prepare collection metadata from an Excel or CSV template. Preview every change before saving private drafts."
        meta={
          <span className="text-sm text-muted-foreground">{ownerLabel}</span>
        }
        action={
          <DashboardButton asChild variant="outline">
            <Link href={CATALOGUE_IMPORT_GUIDE_PATH}>File import guide</Link>
          </DashboardButton>
        }
      />
      <DashboardWorkspace data-catalogue-import="true">
        <DashboardRegion>
          <CatalogueImportSteps
            currentStep={
              batch
                ? batch.counts.applied > 0 ||
                  batch.status === "RUNNING" ||
                  batch.status === "COMPLETED"
                  ? 3
                  : 2
                : 1
            }
          />
          <p className="mt-4 text-sm text-muted-foreground">
            Saving keeps collections private. Submission, review, publication
            and buyer access require separate actions.
          </p>
        </DashboardRegion>
        {error && (
          <DashboardRegion>
            <DashboardInlineAlert
              tone="danger"
              title="Import could not be completed"
              message={error}
            />
          </DashboardRegion>
        )}
        {notice && (
          <p role="status" className="rounded-lg border p-4 text-sm">
            {notice}
          </p>
        )}
        {pending && (
          <section className={section} aria-label="Pending import request">
            <h2 className="font-semibold">Confirm the previous request</h2>
            <p className="text-sm">
              Retry the retained request before making another change. The same
              request identifier prevents repeating a completed operation.
            </p>
            <DashboardButton
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => void perform(pending)}
            >
              Retry previous request
            </DashboardButton>
          </section>
        )}
        {canImport && (
          <section className={section} aria-label="Catalogue file preparation">
            <h2 className="text-lg font-semibold">
              1. Prepare your metadata file
            </h2>
            <p className="text-sm text-muted-foreground">
              Use our template and its field dictionary. Catalogue identifier
              and title are required. Leave undocumented metadata unconfirmed.
              Format gaps do not block valid private drafts.
            </p>
            <div className="space-y-2 border-l-2 border-primary pl-4 text-sm">
              <h3 className="font-semibold">
                Use the provided Excel or CSV format
              </h3>
              <p className="max-w-3xl text-muted-foreground">
                Download our template first and copy your metadata into its
                columns. Keep the column headers and Excel worksheet names
                unchanged. Use an .xlsx workbook or UTF-8 CSV files. CSV
                filenames must be catalogue.csv, measurements.csv and
                sensor_channels.csv; only catalogue.csv is required. Enter
                values only, without formulas, macros or external workbook
                links.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {(["csv", "xlsx"] as const).map((format) => (
                <DashboardButton
                  type="button"
                  key={format}
                  variant="outline"
                  disabled={busy}
                  onClick={() =>
                    void readAction(async () =>
                      setTemplate(await api.template(format))
                    )
                  }
                >
                  Get {format === "csv" ? "CSV templates" : "Excel template"}
                </DashboardButton>
              ))}
            </div>
            {template && (
              <div className="space-y-4">
                <p role="status" className="text-sm">
                  Template ready. Choose the Download links below, complete your
                  file, then select it under Catalogue file.
                </p>
                <ul className="space-y-2" aria-label="Template downloads">
                  {template.files.map((file) => (
                    <li key={file.name}>
                      <DashboardButton
                        type="button"
                        variant="link"
                        className="h-auto whitespace-normal px-0"
                        onClick={() => downloadCatalogueFile(file)}
                      >
                        Download {file.name}
                      </DashboardButton>
                    </li>
                  ))}
                </ul>
                {Boolean(template.fields?.length) && (
                  <details className="rounded-lg border border-border p-4">
                    <summary className="min-h-8 cursor-pointer text-sm font-semibold">
                      Field dictionary and required columns
                    </summary>
                    <p className="my-3 text-sm text-muted-foreground">
                      Copy your existing metadata into these template columns.
                      There is no separate column-mapping screen. Lists use
                      semicolons. Blank optional cells leave new answers
                      undeclared and preserve existing answers when matched.
                    </p>
                    <div className="max-h-96 overflow-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-border">
                            <th scope="col" className="p-2">
                              Template column
                            </th>
                            <th scope="col" className="p-2">
                              Required
                            </th>
                            <th scope="col" className="p-2">
                              What to enter
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {template.fields?.map((field) => (
                            <tr
                              key={field.field}
                              className="border-b border-border last:border-0"
                            >
                              <th
                                scope="row"
                                className="max-w-60 break-words p-2 font-mono font-medium [overflow-wrap:anywhere]"
                              >
                                {field.field}
                              </th>
                              <td className="p-2 align-top">
                                {field.required ? "Yes" : "Optional"}
                              </td>
                              <td className="min-w-48 p-2 align-top text-muted-foreground">
                                {field.help}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </details>
                )}
                {Boolean(template.instructions?.length) && (
                  <details className="rounded-lg border border-border p-4">
                    <summary className="min-h-8 cursor-pointer text-sm font-semibold">
                      Template instructions
                    </summary>
                    <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground [overflow-wrap:anywhere]">
                      {template.instructions?.map((instruction) => (
                        <li key={instruction}>{instruction}</li>
                      ))}
                    </ul>
                  </details>
                )}
                {template.lookups && (
                  <details className="rounded-lg border border-border p-4">
                    <summary className="min-h-8 cursor-pointer text-sm font-semibold">
                      Category and source IDs
                    </summary>
                    <p className="mt-3 text-sm text-muted-foreground">
                      Use these IDs in primaryCategoryId and sourceId. Leave
                      optional values blank when they are not documented.
                    </p>
                    <div className="mt-3 grid gap-4 sm:grid-cols-2">
                      {(
                        [
                          ["Categories", template.lookups.categories],
                          ["Your sources", template.lookups.sources],
                        ] as const
                      ).map(([title, values]) => (
                        <div key={title} className="min-w-0 text-sm">
                          <h4 className="font-semibold">{title}</h4>
                          {values.length ? (
                            <dl className="mt-2 max-h-64 space-y-3 overflow-auto">
                              {values.map((value) => (
                                <div key={value.id}>
                                  <dt>{value.name}</dt>
                                  <dd className="break-all font-mono text-xs text-muted-foreground">
                                    {value.id}
                                  </dd>
                                </div>
                              ))}
                            </dl>
                          ) : (
                            <p className="mt-2 text-muted-foreground">
                              None available.
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            )}
            <label htmlFor={`${fieldId}-control-3`} className={label}>
              Catalogue file
              <DashboardInput
                id={`${fieldId}-control-3`}
                ref={fileInput}
                type="file"
                accept=".csv,.xlsx"
                multiple
                disabled={busy || Boolean(pending)}
                onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
              />
            </label>
            <p className="text-xs text-muted-foreground">
              One Excel workbook, or catalogue.csv with optional
              measurements.csv and sensor_channels.csv. Up to 1,000 collections
              and 32 MB combined. Arabic text and text identifiers are
              supported.
            </p>
            {files.length > 0 && (
              <p className="break-words text-sm" role="status">
                Selected: {files.map((file) => file.name).join(", ")}. Choose
                Validate and preview next; this will not save dataset drafts.
              </p>
            )}
            <label htmlFor={`${fieldId}-control-4`} className={label}>
              How to handle matching identifiers
              <CatalogueSelect
                id={`${fieldId}-control-4`}
                value={mode}
                disabled={busy || Boolean(pending)}
                onValueChange={(value) =>
                  setMode(value as CatalogueImportUploadBody["mode"])
                }
              >
                <option value="CREATE_MISSING">
                  Create missing drafts; preserve matched metadata
                </option>
                <option value="UPDATE_EXISTING">
                  Create missing drafts and preview updates to matched drafts
                </option>
              </CatalogueSelect>
            </label>
            <p className="text-sm text-muted-foreground">
              Matching uses your catalogue identifier. Blank cells preserve
              existing answers. Review exact matches and changes before saving.
            </p>
            <DashboardButton
              type="button"
              variant={batch ? "outline" : "default"}
              disabled={busy || Boolean(pending) || !files.length}
              onClick={() => void preview()}
            >
              {busy ? "Working…" : "Validate and preview"}
            </DashboardButton>
          </section>
        )}
        {batch && (
          <section className={section} aria-label="Import preview">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">2. Review catalogue</h2>
                <p className="mt-1 break-all text-xs text-muted-foreground">
                  Batch {batch.id} ·{" "}
                  {batch.status.replaceAll("_", " ").toLowerCase()} · revision{" "}
                  {batch.revision}
                </p>
              </div>
              <DashboardButton
                type="button"
                variant="outline"
                disabled={busy || changed}
                onClick={() =>
                  void readAction(async () =>
                    acceptBatch(await api.get(batch.id))
                  )
                }
              >
                Refresh progress
              </DashboardButton>
            </div>
            <dl className="grid grid-cols-2 border-y border-border sm:grid-cols-4">
              {(
                [
                  ["Collections", batch.counts.total],
                  ["Create", batch.counts.creates],
                  ["Bind existing", batch.counts.bindings],
                  ["Update", batch.counts.updates],
                  ["Unchanged", batch.counts.unchanged],
                  ["Saved", batch.counts.applied],
                  [
                    "Errors / conflicts",
                    batch.counts.invalid +
                      batch.counts.conflicts +
                      batch.counts.failed,
                  ],
                  ["Warnings", batch.counts.warnings],
                ] as const
              ).map(([name, value]) => (
                <div
                  key={name}
                  className="min-w-0 border-b border-r border-border px-3 py-4"
                >
                  <dt className="text-xs text-muted-foreground">{name}</dt>
                  <dd className="mt-1 text-xl font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
            {canRevise && canImport && (
              <div className="grid items-end gap-3 sm:grid-cols-[1fr_auto]">
                <label htmlFor={`${fieldId}-control-5`} className={label}>
                  Find an existing draft to match
                  <DashboardInput
                    id={`${fieldId}-control-5`}
                    value={search}
                    placeholder="Search by identifier or title"
                    disabled={busy || Boolean(pending)}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </label>
                <DashboardButton
                  type="button"
                  variant="outline"
                  disabled={busy || Boolean(pending)}
                  onClick={() =>
                    void readAction(async () =>
                      setCandidates(await api.candidates(search))
                    )
                  }
                >
                  Find drafts
                </DashboardButton>
                {candidates && (
                  <div className="flex flex-wrap items-center gap-3 text-xs sm:col-span-2">
                    <span>
                      {candidates.total} eligible drafts · page{" "}
                      {candidates.page}
                    </span>
                    <DashboardButton
                      type="button"
                      variant="outline"
                      disabled={busy || candidates.page <= 1}
                      onClick={() =>
                        void readAction(async () =>
                          setCandidates(
                            await api.candidates(search, candidates.page - 1)
                          )
                        )
                      }
                    >
                      Previous drafts
                    </DashboardButton>
                    <DashboardButton
                      type="button"
                      variant="outline"
                      disabled={
                        busy ||
                        candidates.page * candidates.limit >= candidates.total
                      }
                      onClick={() =>
                        void readAction(async () =>
                          setCandidates(
                            await api.candidates(search, candidates.page + 1)
                          )
                        )
                      }
                    >
                      More drafts
                    </DashboardButton>
                  </div>
                )}
              </div>
            )}
            <label htmlFor={`${fieldId}-control-6`} className={label}>
              Show rows
              <CatalogueSelect
                id={`${fieldId}-control-6`}
                value={filter}
                onValueChange={(value) => {
                  setFilter(value);
                  setPage(1);
                }}
              >
                <option value="ALL">All collections</option>
                <option value="ISSUES">Errors and conflicts</option>
                <option value="WARNINGS">Metadata warnings</option>
              </CatalogueSelect>
            </label>
            <div className="space-y-3">
              {rows.map((row) => {
                const choice = choices[row.id];
                return (
                  <article
                    key={row.id}
                    className="min-w-0 space-y-3 rounded-lg border p-4"
                    aria-label={`Collection ${row.catalogueIdentifier || row.rowNumber}`}
                  >
                    <div className="flex flex-wrap justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="break-words font-medium">
                          {row.catalogueIdentifier || "Missing identifier"} ·{" "}
                          {row.title || "Missing title"}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Row {row.rowNumber} ·{" "}
                          {row.operation.replaceAll("_", " ").toLowerCase()} ·{" "}
                          {row.status.toLowerCase()}
                          {row.draftId ? ` · Draft ${row.draftId}` : ""}
                        </p>
                      </div>
                      {canRevise && canImport && (
                        <label
                          htmlFor={`${fieldId}-control-7-${row.id}`}
                          className="flex items-center gap-2 text-sm"
                        >
                          <DashboardCheckbox
                            id={`${fieldId}-control-7-${row.id}`}
                            checked={choice?.excluded ?? row.excluded}
                            disabled={
                              busy ||
                              Boolean(pending) ||
                              row.status === "APPLIED"
                            }
                            onCheckedChange={(checked) =>
                              choose(row.id, { excluded: checked === true })
                            }
                          />
                          Exclude from this batch
                        </label>
                      )}
                    </div>
                    {row.errors.length > 0 && (
                      <ul
                        className="space-y-1 text-sm text-destructive"
                        aria-label="Row errors"
                      >
                        {row.errors.map((message, i) => (
                          <li key={i}>{message}</li>
                        ))}
                      </ul>
                    )}
                    {row.warnings.length > 0 && (
                      <ul
                        className="space-y-1 text-sm text-muted-foreground"
                        aria-label="Metadata warnings"
                      >
                        {row.warnings.map((message, i) => (
                          <li key={i}>{message}</li>
                        ))}
                      </ul>
                    )}
                    {row.changes.length > 0 && (
                      <details>
                        <summary className="cursor-pointer text-sm underline underline-offset-4">
                          Review {row.changes.length} field changes
                        </summary>
                        <dl className="mt-3 space-y-3">
                          {row.changes.map((change) => (
                            <div
                              key={change.field}
                              className="min-w-0 rounded-md bg-muted/50 p-3 text-sm"
                            >
                              <dt className="break-words font-medium">
                                {change.field}
                              </dt>
                              <dd className="mt-1 grid min-w-0 gap-2 sm:grid-cols-2">
                                <div className="whitespace-pre-wrap break-words">
                                  <span className="text-xs text-muted-foreground">
                                    Saved:{" "}
                                  </span>
                                  {display(change.before)}
                                </div>
                                <div className="whitespace-pre-wrap break-words">
                                  <span className="text-xs text-muted-foreground">
                                    Import:{" "}
                                  </span>
                                  {display(change.after)}
                                </div>
                              </dd>
                            </div>
                          ))}
                        </dl>
                      </details>
                    )}
                    {canRevise && canImport && row.status !== "APPLIED" && (
                      <div className="grid gap-3">
                        <label
                          htmlFor={`${fieldId}-control-8-${row.id}`}
                          className={label}
                        >
                          Match this identifier to an existing draft
                          <CatalogueSelect
                            id={`${fieldId}-control-8-${row.id}`}
                            value={choice?.draftId ?? ""}
                            disabled={busy || Boolean(pending)}
                            onValueChange={(value) => {
                              if (value) choose(row.id, { draftId: value });
                            }}
                          >
                            <option value="">
                              {row.draftId
                                ? "Keep current match"
                                : "Keep current matching result"}
                            </option>
                            {candidates?.items.map((candidate) => (
                              <option key={candidate.id} value={candidate.id}>
                                {candidate.catalogueIdentifier
                                  ? `${candidate.catalogueIdentifier} · `
                                  : ""}
                                {candidate.title} · {candidate.id}
                              </option>
                            ))}
                          </CatalogueSelect>
                        </label>
                        {row.changes.some((change) =>
                          change.field.includes("channels")
                        ) && (
                          <label
                            htmlFor={`${fieldId}-control-9-${row.id}`}
                            className="flex items-start gap-2 text-sm"
                          >
                            <DashboardCheckbox
                              id={`${fieldId}-control-9-${row.id}`}
                              className="mt-1"
                              disabled={busy || Boolean(pending)}
                              checked={choice?.replaceChannels ?? false}
                              onCheckedChange={(checked) =>
                                choose(row.id, {
                                  replaceChannels: checked === true,
                                })
                              }
                            />
                            Replace the entire declared sensor channel list with
                            the imported list
                          </label>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
            {!rows.length && (
              <p className="text-sm text-muted-foreground">
                No collections match this view.
              </p>
            )}
            {visibleRows.length > 25 && (
              <nav
                className="flex items-center justify-between gap-3"
                aria-label="Preview pagination"
              >
                <DashboardButton
                  type="button"
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous rows
                </DashboardButton>
                <span className="text-sm">
                  Page {page} of {Math.ceil(visibleRows.length / 25)}
                </span>
                <DashboardButton
                  type="button"
                  variant="outline"
                  disabled={page * 25 >= visibleRows.length}
                  onClick={() => setPage(page + 1)}
                >
                  Next rows
                </DashboardButton>
              </nav>
            )}
            <div className="space-y-2 border-t border-border pt-5">
              <h3 className="text-lg font-semibold">3. Save private drafts</h3>
              <p className="max-w-3xl text-sm text-muted-foreground">
                Apply any matching or exclusion choices with Update preview,
                resolve selected errors, then choose Save private drafts. Saved
                collections appear in{" "}
                <Link
                  href="/dashboard/datasets"
                  className="font-medium underline underline-offset-4"
                >
                  My drafts
                </Link>
                . Submission for review and publication are separate actions.
              </p>
            </div>
            {batch.counts.creates > 0 &&
              batch.unmatchedExistingDrafts > 0 &&
              canImport && (
                <div className="space-y-3 rounded-lg border border-border p-4">
                  <p className="text-sm">
                    {batch.unmatchedExistingDrafts} existing private drafts have
                    not been matched to catalogue identifiers. Use Find drafts
                    and match the corresponding rows before creating collections
                    that may already exist.
                  </p>
                  <label
                    htmlFor={`${fieldId}-control-10`}
                    className="flex items-start gap-2 text-sm"
                  >
                    <DashboardCheckbox
                      id={`${fieldId}-control-10`}
                      className="mt-1"
                      checked={acknowledgeUnmatched}
                      disabled={busy || Boolean(pending) || changed}
                      onCheckedChange={(checked) =>
                        setAcknowledgeUnmatched(checked === true)
                      }
                    />
                    I have reviewed the unmatched drafts. The proposed new
                    collections are separate entries and should be created.
                  </label>
                </div>
              )}
            <div className="flex flex-wrap gap-3">
              {changed && (
                <DashboardButton
                  type="button"
                  variant="outline"
                  disabled={busy || Boolean(pending)}
                  onClick={() => setChoices({})}
                >
                  Discard preview choices
                </DashboardButton>
              )}
              {canImport && canRevise && (
                <DashboardButton
                  type="button"
                  variant="outline"
                  disabled={busy || Boolean(pending) || !changed}
                  onClick={() =>
                    void perform({
                      action: "revise",
                      id: batch.id,
                      body: {
                        requestId: uuid(),
                        expectedRevision: batch.revision,
                        rows: Object.values(choices),
                      },
                    })
                  }
                >
                  Update preview
                </DashboardButton>
              )}
              {canImport && (
                <DashboardButton
                  type="button"
                  variant="default"
                  disabled={
                    busy ||
                    Boolean(pending) ||
                    changed ||
                    !["READY", "PAUSED"].includes(batch.status) ||
                    (batch.counts.creates > 0 &&
                      batch.unmatchedExistingDrafts > 0 &&
                      !acknowledgeUnmatched)
                  }
                  onClick={() =>
                    void perform({
                      action: "commit",
                      id: batch.id,
                      body: {
                        requestId: uuid(),
                        expectedRevision: batch.revision,
                        fingerprint: batch.fingerprint,
                        ...(acknowledgeUnmatched
                          ? { acknowledgeUnmatchedDrafts: true }
                          : {}),
                      },
                    })
                  }
                >
                  {batch.status === "PAUSED"
                    ? "Resume saving private drafts"
                    : "Save private drafts"}
                </DashboardButton>
              )}
              {canImport && !completed && (
                <DashboardButton
                  type="button"
                  variant="outline"
                  disabled={busy || Boolean(pending)}
                  onClick={() =>
                    void perform({
                      action: "cancel",
                      id: batch.id,
                      body: { requestId: uuid() },
                    })
                  }
                >
                  Cancel remaining rows
                </DashboardButton>
              )}
              <DashboardButton
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() =>
                  void readAction(async () => {
                    for (const file of (await api.report(batch.id)).files)
                      downloadCatalogueFile(file);
                  })
                }
              >
                Download row report
              </DashboardButton>
            </div>
            <p className="text-xs text-muted-foreground">
              Warnings may remain in private drafts. Unresolved selected errors
              must be corrected or excluded. Cancellation preserves rows already
              saved. Draft import does not replace the later submission checks.
            </p>
          </section>
        )}
        <section className={section} aria-label="Catalogue import history">
          <div className="flex flex-wrap justify-between gap-3">
            <h2 className="text-lg font-semibold">Import history</h2>
            <DashboardButton
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => void readAction(refreshHistory)}
            >
              Refresh history
            </DashboardButton>
          </div>
          <p className="text-sm text-muted-foreground">
            Open a batch to continue reviewing results or resume interrupted
            work.
          </p>
          {history.length ? (
            <ul className="divide-y">
              {history.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"
                >
                  <div>
                    <p>
                      {new Date(item.createdAt).toLocaleString()} ·{" "}
                      {item.counts.total} collections
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.status.replaceAll("_", " ").toLowerCase()} ·{" "}
                      {item.counts.applied} saved
                    </p>
                  </div>
                  <DashboardButton
                    type="button"
                    variant="outline"
                    disabled={busy || Boolean(pending) || changed}
                    onClick={() =>
                      void readAction(async () =>
                        acceptBatch(await api.get(item.id))
                      )
                    }
                  >
                    Open batch
                  </DashboardButton>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              No import batches found.
            </p>
          )}
        </section>
      </DashboardWorkspace>
    </DatasetWorkspace>
  );
}
