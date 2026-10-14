"use client";

import { useId, type ReactNode } from "react";
import {
  DatasetDeclaredMetricSchema,
  type DatasetPreparationMetadata,
  type DatasetPreparationProfiles,
  type DatasetDeclaredMeasurement,
} from "@kuinbee/dataset-preparation-contracts";

export const preparationControl =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60";
export function PreparationField({
  label,
  value,
  onChange,
  help,
  multiline = true,
  maxLength = 4000,
}: {
  label: string;
  value?: string | null;
  onChange: (value: string | null) => void;
  help?: string;
  multiline?: boolean;
  maxLength?: number;
}) {
  const id = useId();
  const props = {
    id,
    value: value ?? "",
    className: preparationControl,
    maxLength,
    "aria-describedby": help ? `${id}-help` : undefined,
    onChange: (
      event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => onChange(event.target.value || null),
  };
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      {multiline ? <textarea {...props} rows={3} /> : <input {...props} />}
      {help && (
        <p id={`${id}-help`} className="text-xs text-muted-foreground">
          {help}
        </p>
      )}
    </div>
  );
}
export function PreparationSelect({
  label,
  value,
  onChange,
  options,
  help,
}: {
  label: string;
  value?: string | null;
  onChange: (value: string | null) => void;
  options: ReadonlyArray<readonly [string, string]>;
  help?: string;
}) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <select
        id={id}
        className={preparationControl}
        value={value ?? ""}
        aria-describedby={help ? `${id}-help` : undefined}
        onChange={(event) => onChange(event.target.value || null)}
      >
        <option value="">Choose later</option>
        {options.map(([key, text]) => (
          <option key={key} value={key}>
            {text}
          </option>
        ))}
      </select>
      {help && (
        <p id={`${id}-help`} className="text-xs text-muted-foreground">
          {help}
        </p>
      )}
    </div>
  );
}
export function PreparationSection({
  title,
  children,
  help,
}: {
  title: string;
  children: ReactNode;
  help?: string;
}) {
  return (
    <section className="space-y-4 rounded-xl border border-border bg-card p-4 sm:p-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      {help && <p className="text-sm text-muted-foreground">{help}</p>}
      {children}
    </section>
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
}: {
  field: MeasurementField;
  metadata: DatasetPreparationMetadata;
  onUpdate: PreparationUpdate;
  label: string;
}) {
  const rows = metadata[field] ?? [];
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
      title={label}
      help="These are your declarations, not measured uploads or storage usage. Unknown has no numeric value. Each quantity applies only to the scope named above."
    >
      {rows.map((row, index) => (
        <fieldset
          key={row.metric}
          className="space-y-3 rounded-lg border border-border p-3"
        >
          <legend className="px-1 text-sm font-medium">
            {metricLabels[row.metric]}
          </legend>
          <div className="grid gap-3 sm:grid-cols-3">
            <PreparationSelect
              label={`${label}: ${metricLabels[row.metric]} answer`}
              value={row.state}
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
            {row.state !== "UNKNOWN" && (
              <PreparationField
                label={`${label}: ${metricLabels[row.metric]} value`}
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
                help="Use a nonnegative number. Counts and bytes must be whole numbers."
              />
            )}
            <PreparationSelect
              label={`${label}: ${metricLabels[row.metric]} unit`}
              value={row.unit}
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
          </div>
          <button
            type="button"
            className="text-sm underline"
            onClick={() =>
              onUpdate((previous) => ({
                ...previous,
                [field]: (previous[field] ?? []).filter((_, i) => i !== index),
              }))
            }
          >
            Remove {metricLabels[row.metric]} from {label.toLowerCase()}
          </button>
        </fieldset>
      ))}
      <label className="block text-sm font-medium">
        Add a quantity
        <select
          aria-label={`Add a quantity to ${label}`}
          className={`${preparationControl} mt-1`}
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
          <option value="">Select a meaningful quantity</option>
          {DatasetDeclaredMetricSchema.options
            .filter((metric) => !rows.some((row) => row.metric === metric))
            .map((metric) => (
              <option key={metric} value={metric}>
                {metricLabels[metric]}
              </option>
            ))}
        </select>
      </label>
    </PreparationSection>
  );
}

type ProfileKey = keyof DatasetPreparationProfiles;
type Definition = {
  key: string;
  label: string;
  help?: string;
  kind?: "availability" | "languages" | "audio" | "sync";
  condition?: (values: Record<string, unknown>) => boolean;
};
const availability = [
  ["PRESENT", "Available / planned to be included"],
  ["ABSENT", "Not available / not included"],
  ["UNKNOWN", "Unknown"],
] as const;
const included = (key: string) => (value: Record<string, unknown>) =>
  value[key] === "PRESENT";
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
          condition: (value) => value.content !== "NON_SPEECH",
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
        },
        {
          key: "transcriptMeaning",
          label: "Transcript meaning and conventions",
          condition: included("transcriptAvailability"),
        },
        {
          key: "alignmentNotes",
          label: "Transcript timing and matching",
          help: "Explain only alignment that is actually claimed.",
          condition: included("transcriptAvailability"),
        },
        {
          key: "annotationAvailability",
          label: "Other audio annotation availability",
          kind: "availability",
        },
        {
          key: "annotationMeaning",
          label: "Audio label meanings",
          condition: included("annotationAvailability"),
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
          condition: included("annotationAvailability"),
        },
        {
          key: "classDefinitions",
          label: "Class or label-code definitions",
          condition: included("annotationAvailability"),
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
          condition: included("annotationAvailability"),
        },
        {
          key: "timingConvention",
          label: "Annotation time or frame convention",
          condition: included("annotationAvailability"),
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
          condition: included("annotationAvailability"),
        },
        {
          key: "recordConvention",
          label: "Record, span or offset convention",
          condition: included("annotationAvailability"),
        },
      ],
    },
    sensors: {
      title: "Sensor readings",
      fields: [
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
          condition: (value) => value.synchronization === "DESCRIBED",
        },
        {
          key: "calibrationAvailability",
          label: "Calibration availability",
          kind: "availability",
        },
        {
          key: "calibrationMeaning",
          label: "Calibration meaning",
          condition: included("calibrationAvailability"),
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
    PRESENT: "Available / planned to be included",
    ABSENT: "Not available / not included",
    UNKNOWN: "Unknown",
    SPEECH: "Speech",
    NON_SPEECH: "Other sounds",
    MIXED: "Speech and other sounds",
    NO_CLAIM: "No synchronization claimed",
    DESCRIBED: "Described by supplier",
  };
  return active.map((name) => {
    const values = (metadata.profiles?.[name] ?? {}) as Record<string, unknown>;
    return {
      title: definitions[name].title,
      fields: definitions[name].fields
        .filter((field) => !field.condition || field.condition(values))
        .map((field) => {
          const raw = values[field.key];
          const value = Array.isArray(raw)
            ? raw.filter(Boolean).join(", ")
            : typeof raw === "string" && raw
              ? (display[raw] ?? raw)
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
            title={group.title}
            help="Describe the represented collection. Optional answers can remain incomplete in a saved draft; these are declarations, not inspected file facts."
          >
            {group.fields
              .filter((field) => !field.condition || field.condition(values))
              .map((field) => {
                if (field.kind === "languages")
                  return (
                    <PreparationField
                      key={field.key}
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
                      label={field.label}
                      value={
                        typeof values[field.key] === "string"
                          ? (values[field.key] as string)
                          : null
                      }
                      onChange={(value) => write(field.key, value)}
                      help={field.help}
                      options={
                        field.kind === "availability"
                          ? availability
                          : field.kind === "audio"
                            ? [
                                ["SPEECH", "Speech"],
                                ["NON_SPEECH", "Other sounds"],
                                ["MIXED", "Speech and other sounds"],
                                ["UNKNOWN", "Unknown"],
                              ]
                            : [
                                ["NO_CLAIM", "No synchronization claimed"],
                                ["DESCRIBED", "Describe synchronization"],
                                ["UNKNOWN", "Unknown"],
                              ]
                      }
                    />
                  );
                return (
                  <PreparationField
                    key={field.key}
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
