"use client";
import { useCallback, useState } from "react";
import {
  DATASET_MODALITIES,
  DATASET_UPLOAD_CHOICES,
  formatDatasetGeographicCoverage,
  formatDatasetCollectionPeriod,
  type DatasetPreparationMetadata,
  type DatasetPreparationCatalogLabelsResponse,
} from "@kuinbee/dataset-preparation-contracts";
import { useComponentRequest } from "@/hooks/useComponentRequest";
import { preparationApi } from "@/lib/api/dataset-preparations";
import { DATASET_TYPES } from "@/constants/dataset.constants";
import {
  PreparationSection,
  formatDeclaredMeasurement,
  getPreparationProfileSummary,
} from "./PreparationFields";
import { PreparationCategoryName } from "./PreparationDiscoveryFields";

export function PreparationReview({
  metadata,
  correctionBase = false,
}: {
  metadata: DatasetPreparationMetadata;
  correctionBase?: boolean;
}) {
  const [labels, setLabels] =
    useState<DatasetPreparationCatalogLabelsResponse | null>(null);
  const loadLabels = useCallback(async () => {
    const query = {
      ...(metadata.primaryCategoryId
        ? { primaryCategoryId: metadata.primaryCategoryId }
        : {}),
      ...(metadata.sourceId ? { sourceId: metadata.sourceId } : {}),
    };
    if (!Object.keys(query).length) return;
    try {
      setLabels(await preparationApi.labels(query));
    } catch {
      setLabels(null);
    }
  }, [metadata.primaryCategoryId, metadata.sourceId]);
  useComponentRequest(
    loadLabels,
    [metadata.primaryCategoryId, metadata.sourceId],
    Boolean(metadata.primaryCategoryId || metadata.sourceId)
  );
  const hasFull =
    metadata.uploadChoice === "FULL_ONLY" ||
    metadata.uploadChoice === "FULL_AND_SAMPLE";
  const hasSample =
    metadata.uploadChoice === "SAMPLE_ONLY" ||
    metadata.uploadChoice === "FULL_AND_SAMPLE";
  const rows = [
    ["Dataset title", metadata.title],
    [
      "What are you uploading?",
      DATASET_UPLOAD_CHOICES.find(
        (choice) => choice.value === metadata.uploadChoice
      )?.label,
    ],
    [
      "Primary category",
      metadata.primaryCategoryId
        ? labels?.primaryCategory?.id === metadata.primaryCategoryId
          ? labels.primaryCategory.name
          : "Current category label unavailable; selection retained"
        : null,
    ],
    [
      "Data source",
      metadata.sourceId
        ? labels?.source?.id === metadata.sourceId
          ? labels.source.name
          : "Current source label unavailable; selection retained"
        : null,
    ],
    ["Dataset license", metadata.license],
    ["Collection boundary", metadata.collectionBoundary],
    [
      "Geographic coverage · supplier declared",
      formatDatasetGeographicCoverage(metadata.geographicCoverage),
    ],
    [
      "Collection or capture period · supplier declared",
      formatDatasetCollectionPeriod(metadata.collectionPeriod),
    ],
    ["Tags", metadata.tags?.join(", ")],
    ["Short summary", metadata.overview],
    ["Detailed description", metadata.description],
    ["Quality statement", metadata.dataQuality],
    [
      "Main types of data",
      (metadata.modalities ?? [])
        .map(
          (value) =>
            DATASET_MODALITIES.find((item) => item.value === value)?.label
        )
        .join(", "),
    ],
    ...(metadata.modalities?.includes("TABULAR")
      ? [
          [
            "Statistical study structure",
            DATASET_TYPES.find((type) => type.value === metadata.superType)
              ?.label,
          ],
        ]
      : []),
    ["Known limitations", metadata.limitations],
    ["Collection or preparation method", metadata.collectionMethod],
    ["Possible uses", metadata.possibleUses],
  ];
  return (
    <>
      <PreparationSection
        title={
          correctionBase ? "Correction base summary" : "Saved draft summary"
        }
        className="lg:col-span-8"
        help={
          correctionBase
            ? "These are the answers from the proposal you are correcting. Your first saved change starts the correction draft. Category and source names reflect the current directory; the submitted record keeps the names from submission."
            : "This is your last saved draft. Category and source names reflect the current directory. The license and quantities are your stated details. Saving does not submit or publish your proposal."
        }
      >
        <dl className="grid gap-4 sm:grid-cols-2">
          {rows.map(([label, value]) => (
            <div key={label}>
              <dt className="text-sm font-medium">{label}</dt>
              <dd className="mt-1 whitespace-pre-wrap break-words text-sm text-muted-foreground">
                {value || "Not answered"}
              </dd>
            </div>
          ))}
          <div>
            <dt className="text-sm font-medium">
              Additional categories · current labels
            </dt>
            <dd className="mt-1 text-sm text-muted-foreground">
              {metadata.secondaryCategoryIds?.length ? (
                <ul className="space-y-1">
                  {metadata.secondaryCategoryIds.map((id) => (
                    <li key={id}>
                      <PreparationCategoryName id={id} />
                    </li>
                  ))}
                </ul>
              ) : (
                "None selected"
              )}
            </dd>
          </div>
        </dl>
      </PreparationSection>
      <PreparationSection
        title={
          correctionBase
            ? "Correction base quantities"
            : "Saved declared quantities"
        }
        className="lg:col-span-4"
        help="Collection, planned full material and planned sample remain separate; none is an observed upload measurement."
      >
        {[
          {
            label: "Represented collection",
            rows: metadata.collectionMeasurements,
          },
          ...(hasFull
            ? [
                {
                  label: "Prepared full material",
                  rows: metadata.fullMeasurements,
                },
              ]
            : []),
          ...(hasSample
            ? [{ label: "Prepared sample", rows: metadata.sampleMeasurements }]
            : []),
        ].map((scope) => (
          <div key={scope.label}>
            <h3 className="text-sm font-medium">{scope.label}</h3>
            {scope.rows?.length ? (
              <ul className="mt-1 space-y-1 text-sm">
                {scope.rows.map((row) => (
                  <li key={row.metric}>{formatDeclaredMeasurement(row)}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                No quantity declared.
              </p>
            )}
          </div>
        ))}
      </PreparationSection>
      {hasFull && (
        <PreparationSection
          title={
            correctionBase
              ? "Correction base full-material declaration"
              : "Saved full-material declaration"
          }
        >
          <p className="text-sm">
            {metadata.fullCompleteness === true
              ? "Supplier declares planned full material covers the defined collection boundary."
              : metadata.fullCompleteness === false
                ? "Supplier has not confirmed that planned full material covers the defined collection boundary."
                : "Completeness declaration not yet answered."}
          </p>
        </PreparationSection>
      )}
      {hasSample && (
        <PreparationSection
          title={
            correctionBase
              ? "Correction base sample coverage"
              : "Saved sample coverage"
          }
        >
          <dl className="space-y-3">
            {[
              ["Selection method", metadata.sample?.selectionMethod],
              ["Coverage", metadata.sample?.coverage],
              [
                "Omissions",
                metadata.sample?.omissions === "DESCRIBED"
                  ? metadata.sample.omissionNotes
                  : metadata.sample?.omissions === "NONE_KNOWN"
                    ? "None known (supplier declaration)"
                    : metadata.sample?.omissions === "UNKNOWN"
                      ? "Unknown"
                      : null,
              ],
              [
                "Changes from source",
                metadata.sample?.transformations === "DESCRIBED"
                  ? metadata.sample.transformationNotes
                  : metadata.sample?.transformations === "NONE_DECLARED"
                    ? "No changes declared"
                    : metadata.sample?.transformations === "UNKNOWN"
                      ? "Unknown"
                      : null,
              ],
              [
                "Relationship to full material",
                metadata.sample?.relationshipNotes,
              ],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-sm font-medium">{label}</dt>
                <dd className="whitespace-pre-wrap break-words text-sm text-muted-foreground">
                  {value || "Not answered"}
                </dd>
              </div>
            ))}
          </dl>
        </PreparationSection>
      )}
      {getPreparationProfileSummary(metadata).map((group) => (
        <PreparationSection
          key={group.title}
          title={`${correctionBase ? "Correction base" : "Saved"} ${group.title.toLowerCase()} answers`}
          help={
            group.title === "Healthcare context"
              ? "Private preparation/review information. No de-identification or clinical suitability is certified."
              : "Supplier declarations for the represented collection."
          }
        >
          <dl className="space-y-3">
            {group.fields.map((field) => (
              <div key={field.label}>
                <dt className="text-sm font-medium">{field.label}</dt>
                <dd className="whitespace-pre-wrap break-words text-sm text-muted-foreground">
                  {field.value}
                </dd>
              </div>
            ))}
          </dl>
        </PreparationSection>
      ))}
    </>
  );
}
