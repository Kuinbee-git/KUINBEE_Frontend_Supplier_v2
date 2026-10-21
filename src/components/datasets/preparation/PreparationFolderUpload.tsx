"use client";

import { useId, useState } from "react";
import { useComponentRequest } from "@/hooks/useComponentRequest";
import { DashboardButton } from "@/components/dashboard";
import type { usePreparationUploads } from "@/hooks/usePreparationUploads";
import { useAuthStore } from "@/store/auth.store";
import {
  clearDatasetFolderPlan,
  folderFilePath,
  prepareDatasetFolderPlan,
  readDatasetFolderPlan,
  saveDatasetFolderPlan,
  type DatasetFolderPlan,
} from "@/lib/datasets/folder-upload";
import { PreparationNativeSelect } from "./PreparationNativeSelect";
import { preparationControl } from "./PreparationFields";

type Props = {
  model: ReturnType<typeof usePreparationUploads>;
  hasFull: boolean;
  hasSample: boolean;
};
export function PreparationFolderUpload(props: Props) {
  const actorId = useAuthStore((state) => state.user?.id);
  return (
    <FolderUpload
      key={`${actorId}:${props.model.draftId}`}
      {...props}
      actorId={actorId}
    />
  );
}
function FolderUpload({
  model,
  hasFull,
  hasSample,
  actorId,
}: Props & { actorId?: string }) {
  const id = useId();
  const [restored, setRestored] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [plan, setPlan] = useState<DatasetFolderPlan | null>(null);
  const [error, setError] = useState("");
  const [component, setComponent] = useState<"FULL" | "SAMPLE">("FULL");
  const [role, setRole] =
    useState<DatasetFolderPlan["items"][number]["role"]>("PRIMARY");
  const [header, setHeader] = useState<"PRESENT" | "ABSENT" | "">("");
  const [recordKind, setRecordKind] = useState<
    "OBJECT" | "OBJECT_OR_ARRAY" | ""
  >("");
  useComponentRequest(async () => {
    if (!actorId || !model.draftId) return;
    try {
      setPlan(readDatasetFolderPlan(actorId, model.draftId));
      setRestored(true);
    } catch {
      setError(
        "This browser could not recover its folder queue. Keep the pending request and refresh before continuing."
      );
    }
  }, [actorId, model.draftId]);
  const busy = model.writing || Boolean(model.activeAttempt);
  const retained = Boolean(
    (plan && plan.items.some((item) => item.state !== "QUEUED")) ||
    plan?.command
  );
  const actualComponent =
    hasFull && hasSample ? component : hasFull ? "FULL" : "SAMPLE";
  const needsHeader = files.some((file) => /\.(csv|tsv)$/i.test(file.name));
  const needsRecord = files.some((file) => /\.jsonl$/i.test(file.name));
  const picked = (list: FileList | null) => {
    setError("");
    if (!list?.length) return;
    if (list.length > 1_000) {
      setError("Select at most 1,000 files at a time. No files were uploaded.");
      return;
    }
    try {
      const next = Array.from(list);
      next.forEach(folderFilePath);
      setFiles(next);
      if (!retained) setPlan(null);
    } catch {
      setError(
        "A selected path cannot be preserved safely. Rename unsupported paths before uploading. No files were uploaded."
      );
    }
  };
  async function start() {
    setError("");
    try {
      if (!restored)
        throw Error("Wait for this browser's saved queue before uploading.");
      if (!actorId || !model.draftId || !model.config)
        throw Error("Save the draft and refresh Files before uploading.");
      const next =
        retained && plan
          ? plan
          : prepareDatasetFolderPlan({
              actorId,
              draftId: model.draftId,
              config: model.config,
              files,
              component: actualComponent,
              role,
              header,
              recordKind,
            });
      saveDatasetFolderPlan(next);
      setPlan(next);
      await model.uploadFolder(next, files, setPlan);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "The folder upload could not start."
      );
    }
  }
  const complete = plan?.items.every((item) => item.state === "SELECTED");
  return (
    <div
      className="space-y-5 border-b border-border pb-6"
      aria-labelledby={`${id}-title`}
    >
      <div className="space-y-1">
        <h3 id={`${id}-title`} className="font-medium">
          Upload files or a folder
        </h3>
        <p className="text-sm text-muted-foreground">
          Select several files together or choose a folder. Folder paths stay
          with the files. Empty folders are not stored. All files share the 5 GB
          Dataset allowance.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium">
          Choose files
          <input
            type="file"
            multiple
            className={`${preparationControl} h-auto py-2`}
            disabled={busy || !model.ready}
            onChange={(event) => picked(event.target.files)}
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Choose folder
          <input
            type="file"
            multiple
            {...{ webkitdirectory: "", directory: "" }}
            className={`${preparationControl} h-auto py-2`}
            disabled={busy || !model.ready}
            onChange={(event) => picked(event.target.files)}
          />
        </label>
      </div>
      {(files.length > 0 || plan) && (
        <>
          {retained ? (
            <p className="text-sm">
              Continuing the saved{" "}
              {plan?.component === "SAMPLE" ? "sample" : "full dataset"} queue.
              Reselect the original files or folder after reopening this page.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium">
                <span id={`${id}-component-label`}>Add these files to</span>
                <PreparationNativeSelect
                  aria-labelledby={`${id}-component-label`}
                  value={actualComponent}
                  disabled={busy}
                  onChange={(event) =>
                    setComponent(event.target.value as typeof component)
                  }
                >
                  {hasFull && <option value="FULL">Full dataset</option>}
                  {hasSample && <option value="SAMPLE">Sample</option>}
                </PreparationNativeSelect>
              </label>
              <label className="grid gap-2 text-sm font-medium">
                <span id={`${id}-role-label`}>Role for these files</span>
                <PreparationNativeSelect
                  aria-labelledby={`${id}-role-label`}
                  value={role}
                  disabled={busy}
                  onChange={(event) =>
                    setRole(event.target.value as typeof role)
                  }
                >
                  {(
                    [
                      "PRIMARY",
                      "TRANSCRIPT",
                      "ANNOTATION",
                      "SENSOR",
                      "CALIBRATION",
                      "DOCUMENTATION",
                    ] as const
                  ).map((value) => (
                    <option key={value} value={value}>
                      {value === "PRIMARY"
                        ? "Main data"
                        : value[0] + value.slice(1).toLowerCase()}
                    </option>
                  ))}
                </PreparationNativeSelect>
                <span className="text-xs font-normal text-muted-foreground">
                  For mixed roles, upload the main data first, then select the
                  companion files in another queue.
                </span>
              </label>
              {needsHeader && (
                <label className="grid gap-2 text-sm font-medium">
                  <span id={`${id}-header-label`}>CSV / TSV first row</span>
                  <PreparationNativeSelect
                    aria-labelledby={`${id}-header-label`}
                    value={header}
                    disabled={busy}
                    onChange={(event) =>
                      setHeader(event.target.value as typeof header)
                    }
                  >
                    <option value="">Choose column names</option>
                    <option value="PRESENT">Contains column names</option>
                    <option value="ABSENT">Contains data</option>
                  </PreparationNativeSelect>
                </label>
              )}
              {needsRecord && (
                <label className="grid gap-2 text-sm font-medium">
                  <span id={`${id}-record-label`}>JSON Lines records</span>
                  <PreparationNativeSelect
                    aria-labelledby={`${id}-record-label`}
                    value={recordKind}
                    disabled={busy}
                    onChange={(event) =>
                      setRecordKind(event.target.value as typeof recordKind)
                    }
                  >
                    <option value="">Choose record structure</option>
                    <option value="OBJECT">Objects</option>
                    <option value="OBJECT_OR_ARRAY">Objects or arrays</option>
                  </PreparationNativeSelect>
                </label>
              )}
            </div>
          )}
          <div className="max-h-64 overflow-auto rounded-lg border border-border">
            <ul className="divide-y divide-border text-sm">
              {(retained && plan
                ? plan.items.map((item) => ({
                    path: item.path,
                    bytes: item.bytes,
                    state: item.state,
                  }))
                : files.map((file) => ({
                    path: folderFilePath(file),
                    bytes: file.size,
                    state: "QUEUED",
                  }))
              ).map((item, index) => (
                <li
                  key={`${item.path}:${index}`}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="break-all">{item.path}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.bytes.toLocaleString()} bytes ·{" "}
                      {item.state === "SELECTED"
                        ? "Added to draft"
                        : item.state === "ACCEPTED"
                          ? "Uploaded"
                          : item.state === "QUEUED"
                            ? "Waiting to upload"
                            : "In progress"}
                    </p>
                  </div>
                  {!retained && (
                    <DashboardButton
                      type="button"
                      variant="outline"
                      disabled={busy}
                      onClick={() =>
                        setFiles((value) => value.filter((_, i) => i !== index))
                      }
                    >
                      Remove
                    </DashboardButton>
                  )}
                </li>
              ))}
            </ul>
          </div>
          {plan && (
            <p role="status" className="text-sm">
              {plan.items.filter((item) => item.state === "SELECTED").length} of{" "}
              {plan.items.length} files added to the draft.
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            {!complete && (
              <DashboardButton
                type="button"
                disabled={
                  busy ||
                  (!model.canAdmit && !plan?.command) ||
                  (!files.length &&
                    !plan?.items.every((item) =>
                      ["ACCEPTED", "SELECTED"].includes(item.state)
                    ))
                }
                onClick={() => void start()}
              >
                {retained
                  ? "Continue upload queue"
                  : `Upload ${files.length} files`}
              </DashboardButton>
            )}
            {busy && (
              <DashboardButton
                type="button"
                variant="outline"
                onClick={model.pause}
              >
                Pause upload queue
              </DashboardButton>
            )}
            {plan && (
              <DashboardButton
                type="button"
                variant="outline"
                disabled={busy || Boolean(plan.command)}
                onClick={() => {
                  try {
                    clearDatasetFolderPlan(plan);
                    setPlan(null);
                    setFiles([]);
                  } catch (failure) {
                    setError(String(failure));
                  }
                }}
              >
                Clear queue
              </DashboardButton>
            )}
          </div>
          {plan && (
            <p className="text-xs text-muted-foreground">
              Clearing this queue keeps uploaded files. Use the file inventory
              to manage them. Uploading never submits your proposal.
            </p>
          )}
        </>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive break-words">
          {error}
        </p>
      )}
    </div>
  );
}
