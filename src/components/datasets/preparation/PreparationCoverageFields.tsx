"use client";

import type {
  DatasetDeclaredDate,
  DatasetPreparationMetadata,
} from "@kuinbee/dataset-preparation-contracts";
import {
  PreparationField,
  PreparationSelect,
  type PreparationUpdate,
} from "./PreparationFields";

function declaredDate(value: string | null): DatasetDeclaredDate | null {
  if (!value) return null;
  const precision = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? "DAY"
    : /^\d{4}-\d{2}$/.test(value)
      ? "MONTH"
      : "YEAR";
  return { precision, value };
}
const states = [
  ["KNOWN", "Describe known coverage"],
  ["UNKNOWN", "Unknown"],
  ["NOT_APPLICABLE", "Not applicable"],
] as const;

export function PreparationCoverageFields({
  metadata,
  onUpdate,
}: {
  metadata: DatasetPreparationMetadata;
  onUpdate: PreparationUpdate;
}) {
  const geographic = metadata.geographicCoverage,
    period = metadata.collectionPeriod;
  const setPeriod = (
    changes: Partial<
      Extract<
        NonNullable<DatasetPreparationMetadata["collectionPeriod"]>,
        { state: "KNOWN" }
      >
    >
  ) =>
    onUpdate((previous) => ({
      ...previous,
      collectionPeriod: {
        ...(previous.collectionPeriod?.state === "KNOWN"
          ? previous.collectionPeriod
          : {}),
        state: "KNOWN",
        ...changes,
      },
    }));
  return (
    <div className="space-y-4 border-t border-border pt-5">
      <div>
        <h3 className="text-sm font-semibold">Collection coverage</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Optional supplier declarations about the collection you described.
          They are separate from uploaded sample coverage, storage location and
          file timestamps.
        </p>
      </div>
      <PreparationSelect
        label="Geographic coverage"
        value={geographic?.state}
        options={states}
        onChange={(state) =>
          onUpdate((previous) => ({
            ...previous,
            geographicCoverage: !state
              ? null
              : state === "KNOWN"
                ? previous.geographicCoverage?.state === "KNOWN"
                  ? previous.geographicCoverage
                  : { state: "KNOWN" }
                : { state: state as "UNKNOWN" | "NOT_APPLICABLE" },
          }))
        }
        help="Use Unknown when coverage is not known. Use Not applicable for location-independent data; no country is required."
      />
      {geographic?.state === "KNOWN" && (
        <PreparationField
          label="Places or regions represented"
          maxLength={2000}
          value={geographic.description}
          onChange={(description) =>
            onUpdate((previous) => ({
              ...previous,
              geographicCoverage: { state: "KNOWN", description },
            }))
          }
          help="For example: India, mainly Maharashtra; multiple countries; or global coverage. Describe the collection, rather than Kuinbee's storage region."
        />
      )}
      <PreparationSelect
        label="Collection or capture period"
        value={period?.state}
        options={states}
        onChange={(state) =>
          onUpdate((previous) => ({
            ...previous,
            collectionPeriod: !state
              ? null
              : state === "KNOWN"
                ? previous.collectionPeriod?.state === "KNOWN"
                  ? previous.collectionPeriod
                  : { state: "KNOWN" }
                : { state: state as "UNKNOWN" | "NOT_APPLICABLE" },
          }))
        }
        help="Provide dates only at the precision you know. Upload dates and file modification dates do not establish when the data was captured."
      />
      {period?.state === "KNOWN" && (
        <>
          <div className="grid gap-4 @md:grid-cols-2">
            <PreparationField
              label="Collection start"
              multiline={false}
              maxLength={10}
              value={period.start?.value}
              onChange={(value) => setPeriod({ start: declaredDate(value) })}
              help="Use YYYY, YYYY-MM or YYYY-MM-DD. Leave blank if the start was not provided."
            />
            <PreparationField
              label="Collection end"
              multiline={false}
              maxLength={10}
              value={period.end?.value}
              onChange={(value) => setPeriod({ end: declaredDate(value) })}
              help="Use only the known precision. A blank end does not imply ongoing collection."
            />
          </div>
          <PreparationField
            label="Collection period notes"
            maxLength={1000}
            value={period.notes}
            onChange={(notes) => setPeriod({ notes })}
            help="Optional qualifications about the capture period. A known period needs at least one valid date before submission."
          />
        </>
      )}
    </div>
  );
}
