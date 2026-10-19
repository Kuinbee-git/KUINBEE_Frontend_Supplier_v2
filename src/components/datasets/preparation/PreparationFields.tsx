"use client";

import { PreparationNativeSelect } from "./PreparationNativeSelect";

import { useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import {
  DashboardButton,
  DashboardField,
  DashboardInput,
  DashboardSection,
  DashboardTextarea,
} from "@/components/dashboard";
import {
  DatasetDeclaredMetricSchema,
  isDatasetPreparationProfileFieldApplicable,
  type DatasetPreparationMetadata,
  type DatasetPreparationProfiles,
  type DatasetDeclaredMeasurement,
} from "@kuinbee/dataset-preparation-contracts";

export const preparationControl =
  "dashboard-field-control h-10 w-full rounded-lg border px-3 py-2 text-sm text-foreground transition-colors focus-visible:border-[var(--dashboard-focus-ring)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dashboard-focus-ring)] disabled:cursor-not-allowed disabled:opacity-50";
export function PreparationField({
  field,
  label,
  ariaLabel,
  value,
  onChange,
  help,
  multiline = true,
  maxLength = 4000,
  disabled = false,
}: {
  field?: string;
  label: string;
  ariaLabel?: string;
  value?: string | null;
  onChange: (value: string | null) => void;
  help?: string;
  multiline?: boolean;
  maxLength?: number;
  disabled?: boolean;
}) {
  const id = useId();
  const props = {
    id,
    "data-dataset-field": field,
    "aria-label": ariaLabel,
    value: value ?? "",
    maxLength,
    disabled,
    "aria-describedby": help ? `${id}-help` : undefined,
    onChange: (
      event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => onChange(event.target.value || null),
  };
  return (
    <DashboardField id={id} label={label} description={help}>
      {(controlProps) =>
        multiline ? (
          <DashboardTextarea {...props} {...controlProps} rows={3} />
        ) : (
          <DashboardInput {...props} {...controlProps} />
        )
      }
    </DashboardField>
  );
}
export function PreparationSelect({
  field,
  label,
  ariaLabel,
  value,
  onChange,
  options,
  help,
  disabled = false,
  allowEmpty = true,
}: {
  field?: string;
  label: string;
  ariaLabel?: string;
  value?: string | null;
  onChange: (value: string | null) => void;
  options: ReadonlyArray<readonly [string, string]>;
  help?: string;
  disabled?: boolean;
  allowEmpty?: boolean;
}) {
  const id = useId();
  return (
    <DashboardField id={id} label={label} description={help}>
      {(controlProps) => (
        <PreparationNativeSelect
          {...controlProps}
          data-dataset-field={field}
          aria-label={ariaLabel}
          className={preparationControl}
          disabled={disabled}
          value={value ?? ""}
          onChange={(event) => onChange(event.target.value || null)}
        >
          {allowEmpty && <option value="">Choose later</option>}
          {options.map(([key, text]) => (
            <option key={key} value={key}>
              {text}
            </option>
          ))}
        </PreparationNativeSelect>
      )}
    </DashboardField>
  );
}
export function PreparationSection({
  field,
  title,
  children,
  help,
  className,
}: {
  field?: string;
  title: string;
  children: ReactNode;
  help?: string;
  className?: string;
}) {
  return (
    <DashboardSection
      title={title}
      description={help}
      surface="plain"
      data-proposal-tile="true"
      className={`@container col-span-full min-w-0 rounded-xl border border-border p-5 sm:p-6 ${className ?? "lg:col-span-6"}`}
    >
      <div data-dataset-field={field} className="space-y-5 sm:space-y-6">
        {children}
      </div>
    </DashboardSection>
  );
}

export function PreparationGrid({
  children,
  connected = false,
}: {
  children: ReactNode;
  connected?: boolean;
}) {
  return (
    <div
      data-preparation-grid={connected ? undefined : "true"}
      className={`grid min-w-0 grid-cols-1 lg:grid-cols-12 ${connected ? "dataset-frozen-board" : "gap-5 sm:gap-6"}`}
    >
      {children}
    </div>
  );
}

export type PreparationUpdate = (
  change: (metadata: DatasetPreparationMetadata) => DatasetPreparationMetadata
) => void;
const metricLabels: Record<DatasetDeclaredMeasurement["metric"], string> = {
  RECORD_COUNT: "Records",
  ROW_COUNT: "Table rows",
  COLUMN_COUNT: "Table columns",
  AUDIO_DURATION: "Audio duration",
  IMAGE_COUNT: "Images",
  VIDEO_DURATION: "Video stream duration",
  DOCUMENT_COUNT: "Documents",
  SESSION_COUNT: "Sessions",
  PARTICIPANT_COUNT: "Participants",
  STREAM_COUNT: "Streams",
  BYTE_SIZE: "Declared bytes",
};
export function formatDeclaredMeasurement(row: DatasetDeclaredMeasurement) {
  const unit =
    row.unit === "COUNT"
      ? "count"
      : row.unit === "BYTE"
        ? "bytes"
        : row.unit.toLowerCase() + "s";
  return row.state === "UNKNOWN"
    ? `${metricLabels[row.metric]}: unknown`
    : `${metricLabels[row.metric]}: ${row.value} ${unit} (${row.state === "ESTIMATED" ? "supplier estimate" : "supplier-declared"})`;
}
type MeasurementField =
  | "collectionMeasurements"
  | "fullMeasurements"
  | "sampleMeasurements";
export function PreparationQuantities({
  field,
  metadata,
  onUpdate,
  label,
  help,
  className,
}: {
  field: MeasurementField;
  metadata: DatasetPreparationMetadata;
  onUpdate: PreparationUpdate;
  label: string;
  help?: string;
  className?: string;
}) {
  const rows = metadata[field] ?? [];
  const addControl = useRef<HTMLSelectElement>(null);
  const remove = (metric: DatasetDeclaredMeasurement["metric"]) => {
    onUpdate((previous) => ({
      ...previous,
      [field]: (previous[field] ?? []).filter((row) => row.metric !== metric),
    }));
    requestAnimationFrame(() => addControl.current?.focus());
  };
  const write = (
    index: number,
    updater: (row: DatasetDeclaredMeasurement) => DatasetDeclaredMeasurement
  ) =>
    onUpdate((previous) => ({
      ...previous,
      [field]: (previous[field] ?? []).map((row, i) =>
        i === index ? updater(row) : row
      ),
    }));
  return (
    <PreparationSection
      field={field}
      title={label}
      className={className}
      help={help}
    >
      {rows.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No quantities added yet. Choose what you want to measure below.
        </p>
      )}
      {rows.map((row, index) => (
        <fieldset
          key={row.metric}
          className="space-y-4 border-t border-border pt-5 first:border-t-0 first:pt-0"
        >
          <legend className="sr-only">{metricLabels[row.metric]}</legend>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm font-semibold">
              {metricLabels[row.metric]}
            </span>
            <DashboardButton
              type="button"
              variant="outline"
              className="shrink-0"
              aria-label={`Remove ${metricLabels[row.metric]} from ${label.toLowerCase()}`}
              onClick={() => remove(row.metric)}
            >
              <X aria-hidden="true" />
              Remove
            </DashboardButton>
          </div>
          <div className="grid gap-4 @min-[16rem]:grid-cols-2">
            <div className="col-span-full">
              <PreparationSelect
                label="Do you know the amount?"
                ariaLabel={`${label}: ${metricLabels[row.metric]} answer`}
                value={row.state}
                allowEmpty={false}
                help="Choose Known or Estimate to enter an amount, or leave it as Unknown."
                onChange={(state) => {
                  if (!state) return;
                  write(index, (old) =>
                    state === "UNKNOWN"
                      ? { metric: old.metric, unit: old.unit, state: "UNKNOWN" }
                      : {
                          ...old,
                          state: state as "KNOWN" | "ESTIMATED",
                          value: old.state === "UNKNOWN" ? "" : old.value,
                        }
                  );
                }}
                options={[
                  ["KNOWN", "Known"],
                  ["ESTIMATED", "Estimate"],
                  ["UNKNOWN", "Unknown"],
                ]}
              />
            </div>
            {row.state !== "UNKNOWN" && (
              <>
                <PreparationField
                  label="Amount"
                  ariaLabel={`${label}: ${metricLabels[row.metric]} value`}
                  multiline={false}
                  maxLength={24}
                  value={row.value}
                  onChange={(value) =>
                    write(index, (old) =>
                      old.state === "UNKNOWN"
                        ? old
                        : { ...old, value: value ?? "" }
                    )
                  }
                  help={
                    row.metric.endsWith("DURATION")
                      ? "Decimals are allowed."
                      : "Use a whole number."
                  }
                />
                <PreparationSelect
                  label="Unit"
                  ariaLabel={`${label}: ${metricLabels[row.metric]} unit`}
                  value={row.unit}
                  allowEmpty={false}
                  onChange={(unit) => {
                    if (unit)
                      write(index, (old) => ({
                        ...old,
                        unit: unit as DatasetDeclaredMeasurement["unit"],
                      }));
                  }}
                  options={
                    row.metric.endsWith("DURATION")
                      ? [
                          ["SECOND", "Seconds"],
                          ["MINUTE", "Minutes"],
                          ["HOUR", "Hours"],
                        ]
                      : row.metric === "BYTE_SIZE"
                        ? [["BYTE", "Bytes"]]
                        : [["COUNT", "Count"]]
                  }
                />
              </>
            )}
          </div>
        </fieldset>
      ))}
      <label className="block space-y-2 text-sm font-medium">
        <span className="block">Add a quantity</span>
        <PreparationNativeSelect
          ref={addControl}
          aria-label={`Add a quantity to ${label}`}
          className={preparationControl}
          value=""
          onChange={(event) => {
            const metric = event.target
              .value as DatasetDeclaredMeasurement["metric"];
            if (!metric) return;
            onUpdate((previous) => ({
              ...previous,
              [field]: [
                ...(previous[field] ?? []),
                {
                  metric,
                  unit: metric.endsWith("DURATION")
                    ? "HOUR"
                    : metric === "BYTE_SIZE"
                      ? "BYTE"
                      : "COUNT",
                  state: "UNKNOWN",
                },
              ],
            }));
          }}
        >
          <option value="">Choose what to measure</option>
          {DatasetDeclaredMetricSchema.options
            .filter((metric) => !rows.some((row) => row.metric === metric))
            .map((metric) => (
              <option key={metric} value={metric}>
                {metricLabels[metric]}
              </option>
            ))}
        </PreparationNativeSelect>
      </label>
    </PreparationSection>
  );
}

type ProfileKey = keyof DatasetPreparationProfiles;
type SensorChannel = NonNullable<
  NonNullable<DatasetPreparationProfiles["sensors"]>["channels"]
>[number];

function PreparationSensorChannels({
  channels,
  onUpdate,
}: {
  channels: SensorChannel[];
  onUpdate: PreparationUpdate;
}) {
  const change = (update: (rows: SensorChannel[]) => SensorChannel[]) =>
    onUpdate((previous) => ({
      ...previous,
      profiles: {
        ...(previous.profiles ?? {}),
        sensors: {
          ...(previous.profiles?.sensors ?? {}),
          channels: update(previous.profiles?.sensors?.channels ?? []),
        },
      },
    }));
  const edit = (index: number, values: Partial<SensorChannel>) =>
    change((rows) =>
      rows.map((row, position) =>
        position === index ? { ...row, ...values } : row
      )
    );
  return (
    <details
      data-dataset-field="profiles.sensors.channels"
      className="space-y-4 border-t border-border pt-4"
    >
      <summary className="cursor-pointer text-sm font-medium">
        Individual channel descriptions ({channels.length})
      </summary>
      <p className="text-xs text-muted-foreground">
        Optional detail about channels in the represented collection. Name each
        channel you add before saving; meaning and units can be completed later.
        State Unknown or Not applicable where appropriate. For actual uploaded
        tables, use the exact file and column definitions in Files &amp;
        contents. These declarations do not prove that a channel is included in
        either uploaded component.
      </p>
      {channels.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No individual channels described. You can still use the channel notes
          below.
        </p>
      )}
      {channels.map((channel, index) => (
        <fieldset
          key={index}
          className="min-w-0 space-y-3 border-t border-border pt-4"
        >
          <legend className="px-1 text-sm font-medium">
            Channel {index + 1}
          </legend>
          <div className="grid min-w-0 gap-3 @md:grid-cols-2">
            <PreparationField
              field={`profiles.sensors.channels.${index}.name`}
              label={`Channel ${index + 1} name`}
              multiline={false}
              value={channel.name}
              maxLength={200}
              onChange={(name) => edit(index, { name: name ?? "" })}
              help={
                !channel.name.trim()
                  ? "A channel name is needed before saving this added row."
                  : undefined
              }
            />
            <PreparationField
              field={`profiles.sensors.channels.${index}.unit`}
              label={`Channel ${index + 1} unit`}
              multiline={false}
              value={channel.unit}
              maxLength={500}
              onChange={(unit) => edit(index, { unit })}
              help="For example, m/s². Unknown or Not applicable can be stated explicitly; no unit is inferred."
            />
          </div>
          <PreparationField
            field={`profiles.sensors.channels.${index}.meaning`}
            label={`Channel ${index + 1} meaning`}
            value={channel.meaning}
            maxLength={4000}
            onChange={(meaning) => edit(index, { meaning })}
            help="Explain what this reading represents, including any uncertainty."
          />
          <DashboardButton
            type="button"
            size="compact"
            variant="outline"
            aria-label={`Remove channel description ${index + 1}`}
            onClick={() =>
              change((rows) => rows.filter((_, position) => position !== index))
            }
          >
            Remove channel description
          </DashboardButton>
        </fieldset>
      ))}
      <div className="flex flex-wrap items-center gap-3">
        <DashboardButton
          type="button"
          size="compact"
          variant="outline"
          disabled={channels.length >= 100}
          onClick={() =>
            change((rows) =>
              rows.length >= 100
                ? rows
                : [...rows, { name: "", meaning: null, unit: null }]
            )
          }
        >
          Add a channel description
        </DashboardButton>
        <span className="text-xs text-muted-foreground">
          {channels.length} of 100 channel descriptions
        </span>
      </div>
    </details>
  );
}
type Definition = {
  key: string;
  label: string;
  help?: string;
  kind?:
    | "availability"
    | "languages"
    | "channels"
    | "audio"
    | "sync"
    | "textContent"
    | "transcriptTiming"
    | "videoReferences";
};
const availability = [
  ["PRESENT", "Available in the represented collection"],
  ["ABSENT", "Not available in the represented collection"],
  ["UNKNOWN", "Unknown"],
] as const;
const profileOptions = {
  availability,
  audio: [
    ["SPEECH", "Speech"],
    ["NON_SPEECH", "Other sounds"],
    ["MIXED", "Speech and other sounds"],
    ["UNKNOWN", "Unknown"],
  ],
  sync: [
    ["NO_CLAIM", "No synchronization claimed"],
    ["DESCRIBED", "Describe synchronization"],
    ["UNKNOWN", "Unknown"],
  ],
  textContent: [
    ["HUMAN_LANGUAGE", "Human language"],
    ["NON_LANGUAGE", "Other content, such as codes or numbers"],
    ["MIXED", "Human language and other content"],
    ["UNKNOWN", "Unknown"],
  ],
  transcriptTiming: [
    ["UNTIMED", "Untimed transcripts"],
    ["TIMED", "Timed transcripts"],
    ["UNKNOWN", "Timing not assessed"],
  ],
  videoReferences: [
    ["WHOLE_ITEM", "Whole clips or items"],
    ["TIME_OR_FRAME", "Times or frames within a video"],
    ["UNKNOWN", "References not assessed"],
  ],
} as const;
const definitions: Record<ProfileKey, { title: string; fields: Definition[] }> =
  {
    tabular: {
      title: "Tables and spreadsheets",
      fields: [
        {
          key: "recordUnit",
          label: "What does one record represent?",
          help: "For example: one transaction. No table counts are required for audio or images.",
        },
        { key: "columnMeaningNotes", label: "Column meanings" },
        { key: "unitNotes", label: "Column units" },
        { key: "missingValueConventions", label: "Missing-value conventions" },
        {
          key: "tableRelationshipNotes",
          label: "Relationships between tables",
          help: "Independent tables do not need an invented join.",
        },
        {
          key: "dictionaryAvailability",
          label: "Data dictionary availability",
          kind: "availability",
        },
      ],
    },
    audio: {
      title: "Speech and other audio",
      fields: [
        {
          key: "content",
          label: "What kind of audio does the collection contain?",
          kind: "audio",
        },
        {
          key: "languages",
          label: "Spoken languages",
          kind: "languages",
          help: "Separate languages with commas; explicitly enter Unknown if unassessed.",
        },
        {
          key: "recordingContext",
          label: "Recording context",
          help: "Speech, music and environmental recordings need different context. Unknown is an honest answer.",
        },
        {
          key: "transcriptAvailability",
          label: "Transcript availability",
          kind: "availability",
          help: "Describe the collection, including unseen material. Actual Full/Sample inclusion is established separately by the selected files and their links.",
        },
        {
          key: "transcriptMeaning",
          label: "Transcript meaning and conventions",
          help: "Required when available. Explain the conventions or state what is undocumented; technical checks do not verify transcription accuracy.",
        },
        {
          key: "transcriptTiming",
          label: "Are the available transcripts timed?",
          kind: "transcriptTiming",
          help: "Untimed transcripts need no invented timestamps. Timing not assessed makes no exact alignment claim.",
        },
        {
          key: "alignmentNotes",
          label: "Transcript timing and matching",
          help: "Explain only alignment that is actually claimed.",
        },
        {
          key: "annotationAvailability",
          label: "Other audio annotation availability",
          kind: "availability",
        },
        {
          key: "annotationMeaning",
          label: "Audio label meanings",
        },
        {
          key: "speakerCoverage",
          label: "Speaker coverage",
          help: "Optional aggregate information. No names or invented demographics.",
        },
      ],
    },
    images: {
      title: "Images",
      fields: [
        { key: "subject", label: "What do the images show?" },
        { key: "captureContext", label: "Image capture context" },
        {
          key: "annotationAvailability",
          label: "Image annotation availability",
          kind: "availability",
        },
        {
          key: "annotationMeaning",
          label: "Image annotation type and meaning",
          help: "Required when available. Explain labels, boxes, masks or other annotations; state which meanings are undocumented.",
        },
        {
          key: "classDefinitions",
          label: "Class or label-code definitions",
        },
        {
          key: "coverage",
          label: "Image coverage",
          help: "Label unknown coverage; a label file does not prove complete annotation.",
        },
      ],
    },
    video: {
      title: "Video",
      fields: [
        { key: "content", label: "What do the videos show?" },
        {
          key: "viewpoint",
          label: "Camera viewpoint",
          help: "First person, external, overhead, mixed or unknown.",
        },
        {
          key: "audioContext",
          label: "Audio in the videos",
          help: "State absent or unknown where appropriate. Silent videos need no transcript.",
        },
        {
          key: "annotationAvailability",
          label: "Video annotation availability",
          kind: "availability",
        },
        {
          key: "annotationMeaning",
          label: "Video annotation meanings",
        },
        {
          key: "annotationReferences",
          label: "What do the available video annotations refer to?",
          kind: "videoReferences",
          help: "A whole-clip label needs no frame or timestamp convention. Unassessed references make no precise alignment claim.",
        },
        {
          key: "timingConvention",
          label: "Annotation time or frame convention",
        },
      ],
    },
    text: {
      title: "Text and documents",
      fields: [
        {
          key: "recordUnit",
          label: "What does one document or text record represent?",
        },
        {
          key: "languageContent",
          label: "Do the text records contain human language?",
          kind: "textContent",
          help: "Human-language text needs known languages or an explicit Unknown answer. Codes or numbers need no invented human language.",
        },
        {
          key: "languages",
          label: "Text languages",
          kind: "languages",
          help: "Separate known languages with commas; Unknown is allowed.",
        },
        {
          key: "annotationAvailability",
          label: "Text annotation availability",
          kind: "availability",
        },
        {
          key: "annotationMeaning",
          label: "Text annotation meanings",
        },
        {
          key: "recordConvention",
          label: "Record, span or offset convention",
        },
      ],
    },
    sensors: {
      title: "Sensor readings",
      fields: [
        {
          key: "channels",
          label: "Individual channel descriptions",
          kind: "channels",
        },
        {
          key: "channelNotes",
          label: "Sensor channels and units",
          help: "Explain the readings; state which meanings or units are unknown.",
        },
        {
          key: "sessionRelationships",
          label: "Relationships between streams or sessions",
          help: "Only where needed. Static data does not need a session.",
        },
        {
          key: "timestampMeaning",
          label: "Timestamp field and units",
          help: "If untimed, state not applicable. Do not invent timestamps.",
        },
        { key: "timeOrigin", label: "Time origin or clock" },
        {
          key: "synchronization",
          label: "Synchronization between streams",
          kind: "sync",
        },
        {
          key: "synchronizationNotes",
          label: "How are streams synchronized?",
        },
        {
          key: "calibrationAvailability",
          label: "Calibration availability",
          kind: "availability",
        },
        {
          key: "calibrationMeaning",
          label: "Calibration meaning",
        },
        {
          key: "coordinateConventions",
          label: "Coordinate or axis conventions",
        },
      ],
    },
    egocentric: {
      title: "Egocentric capture context",
      fields: [
        { key: "mounting", label: "Camera mounting position" },
        { key: "activities", label: "Activities covered" },
        { key: "environment", label: "Capture environment" },
        {
          key: "additionalStreams",
          label: "Additional streams",
          help: "IMU, synchronization and calibration are not required just because footage is first person.",
        },
      ],
    },
    healthcare: {
      title: "Healthcare context",
      fields: [
        {
          key: "recordMeaning",
          label: "What do the healthcare records represent?",
        },
        { key: "setting", label: "Clinical capture or record setting" },
        {
          key: "identifierHandling",
          label: "How were personal identifiers handled?",
          help: "Private review information. Describe the handling process; do not enter patient names or identifiers. This remains a supplier declaration.",
        },
        {
          key: "participantCoverage",
          label: "Aggregate participant coverage",
          help: "Optional; unknown is allowed. A file count is not a patient count.",
        },
      ],
    },
  };
export function getPreparationProfileSummary(
  metadata: DatasetPreparationMetadata
) {
  const names: Partial<
    Record<
      NonNullable<DatasetPreparationMetadata["modalities"]>[number],
      ProfileKey
    >
  > = {
    TABULAR: "tabular",
    AUDIO: "audio",
    IMAGE: "images",
    VIDEO: "video",
    TEXT: "text",
    SENSOR: "sensors",
  };
  const active = (metadata.modalities ?? [])
    .map((modality) => names[modality])
    .filter((name): name is ProfileKey => Boolean(name));
  if (metadata.contexts?.includes("HEALTHCARE")) active.push("healthcare");
  if (metadata.contexts?.includes("EGOCENTRIC")) active.push("egocentric");
  const display: Record<string, string> = {
    PRESENT: "Available in the represented collection",
    ABSENT: "Not available in the represented collection",
    UNKNOWN: "Unknown",
    SPEECH: "Speech",
    NON_SPEECH: "Other sounds",
    MIXED: "Speech and other sounds",
    NO_CLAIM: "No synchronization claimed",
    DESCRIBED: "Described by supplier",
    HUMAN_LANGUAGE: "Human language",
    NON_LANGUAGE: "Other content, such as codes or numbers",
    UNTIMED: "Untimed transcripts",
    TIMED: "Timed transcripts",
    WHOLE_ITEM: "Whole clips or items",
    TIME_OR_FRAME: "Times or frames within a video",
  };
  return active.map((name) => {
    const values = (metadata.profiles?.[name] ?? {}) as Record<string, unknown>;
    return {
      title: definitions[name].title,
      fields: definitions[name].fields
        .filter((field) =>
          isDatasetPreparationProfileFieldApplicable(name, field.key, values)
        )
        .map((field) => {
          const raw = values[field.key];
          const value =
            field.kind === "channels" && Array.isArray(raw)
              ? raw.length
                ? (raw as SensorChannel[])
                    .map(
                      (channel, index) =>
                        `${index + 1}. ${channel.name.trim() || "Unnamed channel"} — ${channel.meaning?.trim() || "Meaning not specified"}; unit: ${channel.unit?.trim() || "Not specified"}`
                    )
                    .join("\n")
                : "No individual channel descriptions recorded"
              : Array.isArray(raw)
                ? raw.filter(Boolean).join(", ")
                : typeof raw === "string" && raw
                  ? field.key === "languageContent" && raw === "MIXED"
                    ? "Human language and other content"
                    : field.kind && Object.hasOwn(display, raw)
                      ? display[raw]
                      : raw
                  : "Not answered";
          return { label: field.label, value };
        }),
    };
  });
}
export function PreparationProfileFields({
  metadata,
  onUpdate,
}: {
  metadata: DatasetPreparationMetadata;
  onUpdate: PreparationUpdate;
}) {
  const groups: ProfileKey[] = [];
  const names: Partial<
    Record<
      NonNullable<DatasetPreparationMetadata["modalities"]>[number],
      ProfileKey
    >
  > = {
    TABULAR: "tabular",
    AUDIO: "audio",
    IMAGE: "images",
    VIDEO: "video",
    TEXT: "text",
    SENSOR: "sensors",
  };
  for (const modality of metadata.modalities ?? []) {
    const name = names[modality];
    if (name) groups.push(name);
  }
  if (metadata.contexts?.includes("EGOCENTRIC")) groups.push("egocentric");
  if (metadata.contexts?.includes("HEALTHCARE")) groups.push("healthcare");
  return (
    <>
      {groups.map((name) => {
        const group = definitions[name];
        const values = (metadata.profiles?.[name] ?? {}) as Record<
          string,
          unknown
        >;
        const write = (key: string, value: unknown) =>
          onUpdate((previous) => ({
            ...previous,
            profiles: {
              ...(previous.profiles ?? {}),
              [name]: { ...(previous.profiles?.[name] ?? {}), [key]: value },
            },
          }));
        return (
          <PreparationSection
            key={name}
            field={`profiles.${name}`}
            title={group.title}
            help="Describe the represented collection. Required answers may stay incomplete while saving a draft. Before Submit, complete applicable questions or state Unknown where allowed. Available does not mean included in the selected Full or Sample files."
          >
            {group.fields
              .filter((field) =>
                isDatasetPreparationProfileFieldApplicable(
                  name,
                  field.key,
                  values
                )
              )
              .map((field) => {
                if (field.kind === "channels")
                  return (
                    <PreparationSensorChannels
                      key={field.key}
                      channels={metadata.profiles?.sensors?.channels ?? []}
                      onUpdate={onUpdate}
                    />
                  );
                if (field.kind === "languages")
                  return (
                    <PreparationField
                      key={field.key}
                      field={`profiles.${name}.${field.key}`}
                      label={field.label}
                      multiline={false}
                      value={
                        Array.isArray(values[field.key])
                          ? (values[field.key] as string[]).join(",")
                          : ""
                      }
                      onChange={(value) =>
                        write(field.key, value ? value.split(",") : [])
                      }
                      help={field.help}
                    />
                  );
                if (field.kind)
                  return (
                    <PreparationSelect
                      key={field.key}
                      field={`profiles.${name}.${field.key}`}
                      label={field.label}
                      value={
                        typeof values[field.key] === "string"
                          ? (values[field.key] as string)
                          : null
                      }
                      onChange={(value) => write(field.key, value)}
                      help={field.help}
                      options={profileOptions[field.kind]}
                    />
                  );
                return (
                  <PreparationField
                    key={field.key}
                    field={`profiles.${name}.${field.key}`}
                    label={field.label}
                    value={
                      typeof values[field.key] === "string"
                        ? (values[field.key] as string)
                        : null
                    }
                    onChange={(value) => write(field.key, value)}
                    help={field.help}
                    maxLength={
                      ["mounting", "viewpoint"].includes(field.key) ? 500 : 4000
                    }
                  />
                );
              })}
          </PreparationSection>
        );
      })}
    </>
  );
}
