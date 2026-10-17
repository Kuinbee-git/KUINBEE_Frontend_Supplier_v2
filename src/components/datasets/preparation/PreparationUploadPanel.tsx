"use client";

import { useId, useState } from "react";
import type {
  DatasetFilesInventoryPageResponse,
  DatasetInspectionLeafProfile,
  DatasetInspectionProfile,
  DatasetIntakeCapability,
  DatasetMaterialComponent,
  DatasetUploadAttemptStatusResponse,
} from "@kuinbee/dataset-preparation-contracts";
import { DashboardButton, DashboardProgress } from "@/components/dashboard";
import type { usePreparationUploads } from "@/hooks/usePreparationUploads";
import { PreparationSection, preparationControl } from "./PreparationFields";

type Model = ReturnType<typeof usePreparationUploads>;
type ProfileId = DatasetIntakeCapability["profileId"];
const formats: Record<ProfileId, string> = {
  UTF8_CSV_SYNTAX_V1: "CSV · UTF-8 text",
  UTF8_TSV_SYNTAX_V1: "TSV · UTF-8 text",
  UTF8_JSONL_SYNTAX_V1: "JSON Lines · UTF-8 text",
  RIFF_INTEGER_PCM_WAVE_V1: "WAV audio",
  PNG_STATIC_8BIT_V1: "PNG image",
  ZIP32_CONTAINER_V1: "ZIP archive",
  JPEG_BASELINE_STRUCTURE_V1: "JPEG image",
  MPEG_AUDIO_UPLOAD_V1: "MP3 audio",
  ISO_BMFF_VIDEO_UPLOAD_V1: "MP4 video container",
  UTF8_TEXT_UPLOAD_V1: "Text and sidecar files · UTF-8",
};
const stateLabels: Record<DatasetUploadAttemptStatusResponse["state"], string> =
  {
    ADMITTED: "Preparing upload",
    RECEIVING: "Receiving file bytes",
    FINALIZING: "Finalizing file receipt",
    RECEIVED: "Finishing upload",
    CHECKING: "Preparing file",
    ACCEPTED: "Uploaded · ready to select",
    REJECTED: "This file could not be added",
    CANCEL_REQUESTED: "Cleanup requested · storage still counts",
    RECONCILIATION_REQUIRED: "Backend reconciliation required",
    CLOSED: "Upload closed",
  };
const size = (bytes: string | number) => {
  const value = Number(bytes);
  return value >= 1_000_000_000
    ? `${(value / 1_000_000_000).toFixed(2)} GB`
    : value >= 1_000_000
      ? `${(value / 1_000_000).toFixed(2)} MB`
      : `${value.toLocaleString()} bytes`;
};
export function PreparationUploadPanel({
  model,
  hasFull,
  hasSample,
  members,
}: {
  model: Model;
  hasFull: boolean;
  hasSample: boolean;
  members: DatasetFilesInventoryPageResponse["items"];
}) {
  const id = useId();
  const [file, setFile] = useState<File | null>(null);
  const [component, setComponent] = useState<DatasetMaterialComponent | null>(
    null
  );
  const [role, setRole] = useState<
    | "PRIMARY"
    | "TRANSCRIPT"
    | "ANNOTATION"
    | "SENSOR"
    | "CALIBRATION"
    | "DOCUMENTATION"
  >("PRIMARY");
  const [format, setFormat] = useState<ProfileId | "">("");
  const [header, setHeader] = useState<"PRESENT" | "ABSENT" | "">("");
  const [recordKind, setRecordKind] = useState<
    "OBJECT" | "OBJECT_OR_ARRAY" | ""
  >("");
  const [zipKinds, setZipKinds] = useState<ProfileId[]>([]);
  const capability = model.config?.capabilities.find(
    (item) => item.profileId === format
  );
  const packagedZip =
    capability?.profileId === "ZIP32_CONTAINER_V1" &&
    capability.archiveContents === "PACKAGED_FILE";
  const leafCapabilities =
    model.config?.capabilities.filter(
      (item) => item.profileId !== "ZIP32_CONTAINER_V1"
    ) ?? [];
  const selectedZipCapabilities = leafCapabilities.filter((item) =>
    zipKinds.includes(item.profileId)
  );
  const needsHeader =
    format === "UTF8_CSV_SYNTAX_V1" ||
    format === "UTF8_TSV_SYNTAX_V1" ||
    (format === "ZIP32_CONTAINER_V1" &&
      !packagedZip &&
      selectedZipCapabilities.some(
        (item) =>
          item.profileId === "UTF8_CSV_SYNTAX_V1" ||
          item.profileId === "UTF8_TSV_SYNTAX_V1"
      ));
  const needsRecordKind =
    format === "UTF8_JSONL_SYNTAX_V1" ||
    (format === "ZIP32_CONTAINER_V1" &&
      !packagedZip &&
      selectedZipCapabilities.some(
        (item) => item.profileId === "UTF8_JSONL_SYNTAX_V1"
      ));
  const actualComponent =
    hasFull && hasSample ? (component ?? "FULL") : hasFull ? "FULL" : "SAMPLE";
  const profile = (): DatasetInspectionProfile | null => {
    if (
      !capability ||
      (needsHeader && !header) ||
      (needsRecordKind && !recordKind)
    )
      return null;
    if (
      capability.profileId === "MPEG_AUDIO_UPLOAD_V1" ||
      capability.profileId === "ISO_BMFF_VIDEO_UPLOAD_V1" ||
      capability.profileId === "UTF8_TEXT_UPLOAD_V1"
    )
      return { profileId: capability.profileId };
    const leaf = (
      profileId: ProfileId
    ): DatasetInspectionLeafProfile | null => {
      if (
        profileId === "UTF8_CSV_SYNTAX_V1" ||
        profileId === "UTF8_TSV_SYNTAX_V1"
      )
        return header ? { profileId, header } : null;
      if (profileId === "UTF8_JSONL_SYNTAX_V1")
        return recordKind ? { profileId, recordKind } : null;
      if (
        profileId === "RIFF_INTEGER_PCM_WAVE_V1" ||
        profileId === "PNG_STATIC_8BIT_V1" ||
        profileId === "JPEG_BASELINE_STRUCTURE_V1"
      )
        return { profileId };
      return null;
    };
    if (capability.profileId !== "ZIP32_CONTAINER_V1")
      return leaf(capability.profileId);
    if (packagedZip)
      return { profileId: "ZIP32_CONTAINER_V1", leafProfiles: [] };
    if (!selectedZipCapabilities.length) return null;
    const entryDefaults = selectedZipCapabilities.flatMap((item) =>
      item.extensions.map((extension) => ({
        extension,
        profile: leaf(item.profileId)!,
      }))
    );
    if (entryDefaults.length > 8) return null;
    return { profileId: "ZIP32_CONTAINER_V1", leafProfiles: [], entryDefaults };
  };
  const selectedProfile = profile();
  const validSize = Boolean(
    file &&
    capability &&
    file.size > 0 &&
    file.size <= Number(capability.maximumObjectBytes)
  );
  const validExtension = Boolean(
    file &&
    capability?.extensions.some((extension) =>
      file.name.toLowerCase().endsWith(extension)
    )
  );
  const hasUploads = Boolean(model.page?.items.length);
  const showForm = Boolean(model.config?.admission.enabled);
  const controlsBusy =
    model.loading ||
    model.writing ||
    Boolean(model.pending) ||
    Boolean(model.activeAttempt);

  // Keep older releases' read-only inventory uncluttered when their byte intake
  // routes do not exist. The existing component buttons explain unavailability.
  if (
    !model.config &&
    !model.hasUploadForm &&
    !hasUploads &&
    !model.pending &&
    !model.error
  )
    return null;
  return (
    <PreparationSection
      title="Upload files"
      className="lg:col-span-12"
      help="Upload your full dataset files and samples, then add them to the draft."
    >
      {!showForm && (
        <p className="text-sm text-muted-foreground">
          New uploads are currently unavailable. Existing files and saved draft
          details remain available.
        </p>
      )}
      {model.pending &&
        (model.writing ? (
          <p role="status" className="text-sm">
            Saving file change…
          </p>
        ) : (
          <div role="status" className="space-y-3 border-b border-border pb-4">
            <p className="text-sm">
              A file change needs confirmation. Retry confirms the original
              request; it does not start another upload.
            </p>
            <DashboardButton
              type="button"
              disabled={model.writing}
              onClick={() => void model.retry()}
            >
              Retry upload request
            </DashboardButton>
          </div>
        ))}
      {model.error && (
        <p role="alert" className="break-words text-sm text-destructive">
          {model.error}
        </p>
      )}
      {model.notice && (
        <p role="status" className="text-sm" aria-live="polite">
          {model.notice}
        </p>
      )}
      {(model.hasUploadForm || model.page?.items.some(model.receiving)) && (
        <div
          className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          hidden={!showForm && !model.page?.items.some(model.receiving)}
        >
          <div
            key="local-file-picker"
            className="col-span-full grid min-w-0 gap-2 text-sm font-medium"
          >
            <label htmlFor={`${id}-file`}>
              {showForm
                ? "File to upload or resume"
                : "Original file to resume"}
            </label>
            <input
              id={`${id}-file`}
              type="file"
              className={`${preparationControl} h-auto min-h-10 py-2`}
              aria-describedby={`${id}-file-help`}
              disabled={controlsBusy || !model.ready}
              accept={model.config?.capabilities
                .flatMap((item) => item.extensions)
                .join(",")}
              onChange={(event) => {
                const picked = event.target.files?.[0] ?? null;
                setFile(picked);
                if (showForm && picked) {
                  const suggested = model.config?.capabilities.filter((item) =>
                    item.extensions.some((extension) =>
                      picked.name.toLowerCase().endsWith(extension)
                    )
                  );
                  const nextFormat =
                    suggested?.length === 1 ? suggested[0].profileId : "";
                  setFormat(nextFormat);
                  if (file || nextFormat !== format) {
                    setHeader("");
                    setRecordKind("");
                    setZipKinds([]);
                  }
                }
              }}
            />
            <span
              id={`${id}-file-help`}
              className="text-xs font-normal text-muted-foreground"
            >
              One file at a time · up to 2 GB per file, 5 GB per Dataset. To
              resume, reselect the original file; its received bytes are
              verified before transfer continues.
            </span>
            {packagedZip && (
              <span className="text-xs font-normal text-muted-foreground">
                This ZIP is uploaded and delivered as one file. Describe the
                collection and its contents in Dataset details.
              </span>
            )}
          </div>
          {showForm && (
            <>
              <div className="grid gap-2 text-sm font-medium">
                <label htmlFor={`${id}-component`}>Upload to</label>
                <select
                  id={`${id}-component`}
                  className={preparationControl}
                  value={actualComponent}
                  disabled={!model.canAdmit}
                  onChange={(event) =>
                    setComponent(event.target.value as DatasetMaterialComponent)
                  }
                >
                  {hasFull && <option value="FULL">Full dataset</option>}
                  {hasSample && (
                    <option value="SAMPLE">Sample · displayed to buyers</option>
                  )}
                </select>
              </div>
              <div className="grid gap-2 text-sm font-medium">
                <label htmlFor={`${id}-role`}>File purpose</label>
                <select
                  id={`${id}-role`}
                  className={preparationControl}
                  value={role}
                  disabled={!model.canAdmit}
                  onChange={(event) =>
                    setRole(event.target.value as typeof role)
                  }
                >
                  <option value="PRIMARY">Primary data</option>
                  <option value="TRANSCRIPT">Transcript</option>
                  <option value="ANNOTATION">Annotation</option>
                  <option value="SENSOR">Sensor data</option>
                  <option value="CALIBRATION">Calibration</option>
                  <option value="DOCUMENTATION">Documentation</option>
                </select>
              </div>
              <div className="grid gap-2 text-sm font-medium">
                <label htmlFor={`${id}-format`}>File format</label>
                <select
                  id={`${id}-format`}
                  className={preparationControl}
                  value={format}
                  disabled={!model.canAdmit}
                  onChange={(event) =>
                    setFormat(event.target.value as ProfileId | "")
                  }
                >
                  <option value="">Select a supported format</option>
                  {model.config?.capabilities.map((item) => (
                    <option key={item.profileId} value={item.profileId}>
                      {formats[item.profileId]}
                    </option>
                  ))}
                </select>
              </div>
              {format === "ZIP32_CONTAINER_V1" && !packagedZip && (
                <fieldset
                  className="col-span-full min-w-0 space-y-2 border-t border-border pt-4"
                  disabled={!model.canAdmit}
                >
                  <legend className="text-sm font-medium">
                    File types inside this ZIP
                  </legend>
                  <p className="text-sm text-muted-foreground">
                    Choose the types you included. Describe each entry&apos;s
                    bytes. Unselected or unsupported entries cannot be accepted.
                  </p>
                  <div className="flex flex-wrap gap-x-6 gap-y-3">
                    {leafCapabilities.map((item) => (
                      <label
                        className="flex items-center gap-2 text-sm"
                        key={item.profileId}
                      >
                        <input
                          type="checkbox"
                          checked={zipKinds.includes(item.profileId)}
                          onChange={(event) =>
                            setZipKinds((previous) =>
                              event.target.checked
                                ? [...previous, item.profileId]
                                : previous.filter(
                                    (value) => value !== item.profileId
                                  )
                            )
                          }
                        />
                        {formats[item.profileId]}
                      </label>
                    ))}
                  </div>
                </fieldset>
              )}
              {needsHeader && (
                <div className="grid gap-2 text-sm font-medium">
                  <label htmlFor={`${id}-header`}>CSV / TSV first row</label>
                  <select
                    id={`${id}-header`}
                    className={preparationControl}
                    value={header}
                    disabled={!model.canAdmit}
                    aria-describedby={
                      format === "ZIP32_CONTAINER_V1"
                        ? `${id}-header-help`
                        : undefined
                    }
                    onChange={(event) =>
                      setHeader(event.target.value as typeof header)
                    }
                  >
                    <option value="">
                      Choose whether it contains column names
                    </option>
                    <option value="PRESENT">Column names</option>
                    <option value="ABSENT">Data · no header row</option>
                  </select>
                  {format === "ZIP32_CONTAINER_V1" && (
                    <span
                      id={`${id}-header-help`}
                      className="text-xs font-normal text-muted-foreground"
                    >
                      Applies to all selected CSV / TSV entries. Upload files
                      separately when their conventions differ.
                    </span>
                  )}
                </div>
              )}
              {needsRecordKind && (
                <div className="grid gap-2 text-sm font-medium">
                  <label htmlFor={`${id}-record`}>JSON Lines records</label>
                  <select
                    id={`${id}-record`}
                    className={preparationControl}
                    value={recordKind}
                    disabled={!model.canAdmit}
                    onChange={(event) =>
                      setRecordKind(event.target.value as typeof recordKind)
                    }
                  >
                    <option value="">Choose the record structure</option>
                    <option value="OBJECT">One object per line</option>
                    <option value="OBJECT_OR_ARRAY">
                      One object or array per line
                    </option>
                  </select>
                </div>
              )}
            </>
          )}
          {showForm && (
            <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-1">
              <DashboardButton
                type="button"
                disabled={
                  !model.canAdmit ||
                  !selectedProfile ||
                  !validSize ||
                  !validExtension
                }
                onClick={() =>
                  selectedProfile &&
                  void model.admit(file, actualComponent, role, selectedProfile)
                }
              >
                Upload file
              </DashboardButton>
            </div>
          )}
          {file &&
            showForm &&
            (!validSize || !validExtension) &&
            capability && (
              <p
                role="status"
                className="col-span-full text-sm text-muted-foreground"
              >
                {!validSize
                  ? `This format allows a nonempty file up to ${size(capability.maximumObjectBytes)}.`
                  : "Choose a file matching the selected format."}
              </p>
            )}
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <p className="text-sm font-medium">
          Upload activity · page {model.pageIndex + 1}
        </p>
        <DashboardButton
          type="button"
          variant="outline"
          disabled={model.loading || model.writing}
          onClick={() => void model.refresh()}
        >
          Refresh upload status
        </DashboardButton>
      </div>
      {model.page && !hasUploads && (
        <p className="text-sm text-muted-foreground">
          No uploads on this page.
        </p>
      )}
      <ul
        aria-label="Dataset uploads"
        className="min-w-0 divide-y divide-border"
      >
        {model.page?.items.map((status) => {
          const selected = members.some(
            (member) =>
              member.uploadObjectId === status.uploadObjectId &&
              member.component === status.component
          );
          const receiving = model.receiving(status);
          const completeBytes =
            receiving &&
            status.retainedBytes === status.expectedBytes &&
            status.reservedBytes === "0";
          const progress =
            model.progress?.attemptId === status.id
              ? model.progress.value
              : null;
          const active = model.activeAttempt === status.id;
          const progressBytes =
            active && progress
              ? progress.phase === "VERIFYING"
                ? progress.verifiedBytes
                : progress.receivedBytes
              : Number(status.retainedBytes);
          const percent =
            progressBytes === Number(status.expectedBytes)
              ? 100
              : Math.min(
                  99,
                  Math.floor(
                    (progressBytes * 100) / Number(status.expectedBytes)
                  )
                );
          const inChoice = status.component === "FULL" ? hasFull : hasSample;
          return (
            <li
              key={status.id}
              className="grid min-w-0 gap-4 py-4 lg:grid-cols-[minmax(0,1fr)_auto]"
              data-upload-attempt={status.id}
            >
              <div className="min-w-0 space-y-2">
                <p className="break-words text-sm font-medium [overflow-wrap:anywhere]">
                  {status.originalName}
                </p>
                <p
                  className={`text-xs ${status.state === "REJECTED" ? "text-destructive" : "text-muted-foreground"}`}
                >
                  {status.component === "FULL" ? "Full dataset" : "Sample"} ·{" "}
                  {size(status.expectedBytes)} · {stateLabels[status.state]}
                </p>
                {status.state !== "CLOSED" && (
                  <>
                    <DashboardProgress
                      label={
                        active && progress?.phase === "VERIFYING"
                          ? "Verifying received bytes"
                          : "File bytes received"
                      }
                      max={100}
                      value={percent}
                    />
                    <p
                      className="text-xs text-muted-foreground"
                      title={`${active && progress ? progress.receivedBytes : status.retainedBytes} of ${status.expectedBytes} bytes received`}
                    >
                      {size(
                        active && progress
                          ? progress.receivedBytes
                          : status.retainedBytes
                      )}{" "}
                      received of {size(status.expectedBytes)}. File
                      availability and draft selection follow receipt.
                    </p>
                  </>
                )}
              </div>
              <div className="flex flex-wrap items-start gap-2 lg:max-w-72 lg:justify-end">
                {active ? (
                  <DashboardButton
                    type="button"
                    variant="outline"
                    onClick={model.pause}
                  >
                    Pause upload
                  </DashboardButton>
                ) : (
                  <>
                    {receiving && !completeBytes && (
                      <DashboardButton
                        type="button"
                        variant="outline"
                        disabled={!model.canAdmit || !file}
                        onClick={() => void model.resume(status.id, file)}
                      >
                        Resume upload
                      </DashboardButton>
                    )}
                    {completeBytes && (
                      <DashboardButton
                        type="button"
                        disabled={!model.canChange}
                        onClick={() => void model.finalize(status)}
                      >
                        Finish upload
                      </DashboardButton>
                    )}
                    {status.state === "ACCEPTED" &&
                      inChoice &&
                      (selected ? (
                        <span className="text-sm text-muted-foreground">
                          Selected in this draft
                        </span>
                      ) : (
                        <DashboardButton
                          type="button"
                          disabled={!model.canChange}
                          onClick={() =>
                            void model.select(status, status.component)
                          }
                        >
                          {status.component === "FULL"
                            ? "Use in full dataset"
                            : "Use as sample"}
                        </DashboardButton>
                      ))}
                    {receiving && (
                      <DashboardButton
                        type="button"
                        variant="outline"
                        disabled={controlsBusy || !model.ready}
                        onClick={() => void model.cleanup(status, false)}
                      >
                        Cancel upload
                      </DashboardButton>
                    )}
                    {["RECEIVED", "ACCEPTED", "REJECTED"].includes(
                      status.state
                    ) && (
                      <DashboardButton
                        type="button"
                        variant="outline"
                        disabled={controlsBusy || !model.ready || selected}
                        onClick={() => {
                          if (
                            window.confirm(
                              "Delete this stored file? It must first be removed from editable selections. Files needed for active review, approval, publication or purchases cannot be deleted. Storage stays charged until cleanup completes."
                            )
                          )
                            void model.cleanup(status, true);
                        }}
                      >
                        Delete stored file
                      </DashboardButton>
                    )}
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {model.page && (
        <div className="flex flex-wrap gap-3 border-t border-border pt-4">
          <DashboardButton
            type="button"
            variant="outline"
            disabled={controlsBusy || model.pageIndex === 0}
            onClick={model.previousPage}
          >
            Previous uploads page
          </DashboardButton>
          <DashboardButton
            type="button"
            variant="outline"
            disabled={controlsBusy || !model.page.nextCursor}
            onClick={model.nextPage}
          >
            Next uploads page
          </DashboardButton>
        </div>
      )}
    </PreparationSection>
  );
}
