"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  DATASET_MODALITIES,
  DATASET_UPLOAD_CHOICES,
  type DatasetDeclaredMeasurement,
} from "@kuinbee/dataset-preparation-contracts";
import { DashboardButton } from "@/components/dashboard";
import { DATASET_TYPES } from "@/constants/dataset.constants";
import {
  datasetWorkflowApi,
  type DatasetFrozenInventory,
  type DatasetSubmission,
} from "@/lib/api/dataset-workflow";
import {
  PreparationGrid,
  PreparationSection,
  formatDeclaredMeasurement,
  getPreparationProfileSummary,
  preparationControl,
} from "./PreparationFields";

type FileMember = Extract<
  DatasetFrozenInventory,
  { inventory: "FILES" }
>["items"][number];
type Relationship = Extract<
  DatasetFrozenInventory,
  { inventory: "RELATIONSHIPS" }
>["items"][number];
type InventoryKind = DatasetFrozenInventory["inventory"];
type ComponentFilter = "ALL" | "FULL" | "SAMPLE";
type InventorySelection = {
  context: string;
  inventory: InventoryKind;
  component: ComponentFilter;
  cursors: Array<string | undefined>;
};
const roles: Record<FileMember["role"], string> = {
  PRIMARY: "Primary data",
  TRANSCRIPT: "Transcript",
  ANNOTATION: "Annotation",
  SENSOR: "Sensor data",
  CALIBRATION: "Calibration",
  DOCUMENTATION: "Documentation",
};
const relationships: Record<Relationship["kind"], string> = {
  TRANSCRIPT_FOR: "Transcript for",
  ANNOTATION_FOR: "Annotation for",
  CALIBRATION_FOR: "Calibration for",
  SYNCHRONIZED_WITH: "Synchronized with",
  DOCUMENTATION_FOR: "Documentation for",
};
const securityStates: Record<
  FileMember["inspection"]["securityState"],
  string
> = {
  QUARANTINED: "In quarantine",
  PROCESSING: "Checks in progress",
  ACCEPTED: "Accepted in the stored security record",
  BLOCKED: "Blocked",
  FAILED: "Checks failed",
  CANCELLED: "Cancelled",
  UNRECONCILED: "Awaiting reconciliation",
  UNKNOWN: "Unknown",
};
const words = (value: string) => value.toLowerCase().replaceAll("_", " ");
const componentLabel = (component: "FULL" | "SAMPLE") =>
  component === "FULL" ? "Full dataset" : "Sample";
const priceLabel = (
  price: DatasetSubmission["submittedContent"]["pricingAtSubmission"]
) => (price.isPaid ? `${price.currency} ${price.price}` : "Free access");
const displayDate = (value: string) => new Date(value).toLocaleString();

function Facts({ rows }: { rows: Array<readonly [string, ReactNode]> }) {
  return (
    <dl className="grid min-w-0 gap-4 sm:grid-cols-2">
      {rows.map(([label, value]) => (
        <div key={label} className="min-w-0">
          <dt className="text-sm font-medium">{label}</dt>
          <dd className="mt-1 whitespace-pre-wrap break-words text-sm text-muted-foreground [overflow-wrap:anywhere]">
            {value === null || value === undefined || value === ""
              ? "Not recorded at submission"
              : value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function DeclaredQuantities({
  label,
  measurements,
}: {
  label: string;
  measurements?: DatasetDeclaredMeasurement[];
}) {
  return (
    <div className="min-w-0">
      <h3 className="text-sm font-medium">{label}</h3>
      {measurements?.length ? (
        <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
          {measurements.map((measurement) => (
            <li key={measurement.metric}>
              {formatDeclaredMeasurement(measurement)}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">
          No quantity declared.
        </p>
      )}
    </div>
  );
}

function RelationshipTarget({ target }: { target: Relationship["source"] }) {
  return (
    <span className="break-words [overflow-wrap:anywhere]">
      File reference {target.memberId}
      {target.logicalEntry && (
        <>
          {" "}
          ·{" "}
          {target.logicalEntry.locator.kind === "ARCHIVE_ENTRY"
            ? "Archive entry"
            : "Workbook sheet"}
          :{" "}
          {target.logicalEntry.locator.kind === "ARCHIVE_ENTRY"
            ? target.logicalEntry.locator.path
            : target.logicalEntry.locator.sheetName}
        </>
      )}
    </span>
  );
}

function InventoryRows({ page }: { page: DatasetFrozenInventory }) {
  if (!page.items.length)
    return (
      <p className="text-sm text-muted-foreground">
        No matching {words(page.inventory)} in this submitted proposal.
      </p>
    );
  if (page.inventory === "FILES")
    return (
      <ul
        className="min-w-0 divide-y divide-border"
        aria-label="Submitted file references"
      >
        {page.items.map((member) => (
          <li
            key={member.id}
            className="grid min-w-0 gap-3 py-4 sm:grid-cols-2"
          >
            <div className="min-w-0 space-y-1">
              <p className="break-words text-sm font-medium [overflow-wrap:anywhere]">
                {member.originalFileName ?? "Original filename not recorded"}
              </p>
              <p className="text-sm text-muted-foreground">
                {componentLabel(member.component)} · {roles[member.role]}
              </p>
              <p className="text-sm text-muted-foreground">
                Measured size:{" "}
                {BigInt(member.measuredSizeBytes).toLocaleString()} bytes
              </p>
              {member.relativePath && (
                <p className="break-words text-sm text-muted-foreground [overflow-wrap:anywhere]">
                  Path: {member.relativePath}
                </p>
              )}
              <p className="break-words text-xs text-muted-foreground [overflow-wrap:anywhere]">
                File reference: {member.id}
              </p>
              {member.groupId && (
                <p className="break-words text-xs text-muted-foreground [overflow-wrap:anywhere]">
                  Group reference: {member.groupId}
                </p>
              )}
            </div>
            <dl className="min-w-0 space-y-2 text-sm">
              <div>
                <dt className="font-medium">
                  Inspection reference at submission
                </dt>
                <dd className="break-words text-xs text-muted-foreground [overflow-wrap:anywhere]">
                  {member.inspectionAtSubmissionId}
                </dd>
              </div>
              <div>
                <dt className="font-medium">Present recorded security state</dt>
                <dd className="text-muted-foreground">
                  {securityStates[member.inspection.securityState]}
                </dd>
              </div>
              <div>
                <dt className="font-medium">Present recorded inspection</dt>
                <dd className="text-muted-foreground">
                  {member.inspection.recordedOutcome === "NONE"
                    ? "No recorded result"
                    : words(member.inspection.recordedOutcome)}{" "}
                  ·{" "}
                  {member.inspection.current
                    ? "current evidence reference"
                    : "not a current evidence reference"}
                </dd>
                {member.inspection.currentEvidenceId && (
                  <dd className="break-words text-xs text-muted-foreground [overflow-wrap:anywhere]">
                    {member.inspection.currentEvidenceId}
                  </dd>
                )}
              </div>
              <div>
                <dt className="font-medium">Access eligibility</dt>
                <dd className="text-xs text-muted-foreground">
                  Not evaluated by this inventory.
                </dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
    );
  if (page.inventory === "GROUPS")
    return (
      <ul
        className="min-w-0 divide-y divide-border"
        aria-label="Submitted file groups"
      >
        {page.items.map((group) => (
          <li key={group.id} className="space-y-1 py-4">
            <p className="break-words text-sm font-medium [overflow-wrap:anywhere]">
              {group.label}
            </p>
            <p className="text-sm text-muted-foreground">
              {componentLabel(group.component)}
            </p>
            <p className="break-words text-xs text-muted-foreground [overflow-wrap:anywhere]">
              Group reference: {group.id}
            </p>
          </li>
        ))}
      </ul>
    );
  return (
    <ul
      className="min-w-0 divide-y divide-border"
      aria-label="Submitted file relationships"
    >
      {page.items.map((relationship) => (
        <li key={relationship.id} className="min-w-0 space-y-2 py-4">
          <p className="text-sm font-medium">
            {relationships[relationship.kind]} ·{" "}
            {componentLabel(relationship.component)}
          </p>
          <p className="text-sm text-muted-foreground">
            {relationship.required ? "Declared required" : "Declared optional"}
          </p>
          <dl className="grid min-w-0 gap-3 text-sm sm:grid-cols-2">
            <div className="min-w-0">
              <dt className="font-medium">Source</dt>
              <dd className="mt-1 text-muted-foreground">
                <RelationshipTarget target={relationship.source} />
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="font-medium">Target</dt>
              <dd className="mt-1 text-muted-foreground">
                <RelationshipTarget target={relationship.target} />
              </dd>
            </div>
          </dl>
        </li>
      ))}
    </ul>
  );
}

export function PreparationFrozenSubmission({
  submission,
  active,
  onRefresh,
  disabled = false,
}: {
  submission: DatasetSubmission;
  active: boolean;
  onRefresh: () => void;
  disabled?: boolean;
}) {
  const { state, submittedContent: frozen } = submission;
  const { common, metadata } = frozen;
  const context = JSON.stringify([
    state.datasetId,
    state.workflowRevision,
    frozen.id,
    frozen.generation,
    frozen.frozenAt,
  ]);
  const [selection, setSelection] = useState<InventorySelection>({
    context,
    inventory: "FILES",
    component: "ALL",
    cursors: [undefined],
  });
  const [refresh, setRefresh] = useState(0);
  const chosen =
    selection.context === context
      ? selection
      : {
          context,
          inventory: "FILES" as const,
          component: "ALL" as const,
          cursors: [undefined],
        };
  const { inventory, component, cursors } = chosen;
  const afterId = cursors.at(-1);
  const requestKey = JSON.stringify([
    context,
    inventory,
    component,
    afterId ?? null,
    refresh,
  ]);
  const [loaded, setLoaded] = useState<{
    key: string;
    page: DatasetFrozenInventory;
  } | null>(null);
  const [failure, setFailure] = useState<{
    key: string;
    message: string;
  } | null>(null);
  const shown =
    active && !disabled && loaded?.key === requestKey ? loaded.page : null;
  const error = failure?.key === requestKey ? failure.message : null;
  const loading = active && !disabled && !shown && !error;

  useEffect(() => {
    const controller = new AbortController();
    if (!active || disabled) return () => controller.abort();
    async function load() {
      setLoaded(null);
      setFailure(null);
      try {
        const page = await datasetWorkflowApi.inventory(
          state.datasetId,
          {
            expectedWorkflowRevision: state.workflowRevision,
            contentId: frozen.id,
            contentGeneration: frozen.generation,
            inventory,
            ...(component === "ALL" ? {} : { component }),
            ...(afterId ? { afterId } : {}),
            limit: 20,
          },
          controller.signal
        );
        if (page.frozenAt !== frozen.frozenAt)
          throw new Error(
            "The submitted proposal changed while loading its files. Refresh the submission before continuing."
          );
        if (!controller.signal.aborted) setLoaded({ key: requestKey, page });
      } catch (problem) {
        if (!controller.signal.aborted)
          setFailure({
            key: requestKey,
            message:
              problem instanceof Error
                ? problem.message
                : "The submitted inventory could not be loaded. Refresh before continuing.",
          });
      }
    }
    void load();
    return () => {
      controller.abort();
      setLoaded(null);
      setFailure(null);
    };
  }, [
    active,
    disabled,
    requestKey,
    state.datasetId,
    state.workflowRevision,
    frozen.id,
    frozen.generation,
    frozen.frozenAt,
    inventory,
    component,
    afterId,
  ]);

  const hasFull = frozen.uploadChoice !== "SAMPLE_ONLY";
  const hasSample = frozen.uploadChoice !== "FULL_ONLY";
  const profileSummary = getPreparationProfileSummary({
    ...metadata,
    title: common.title,
  });
  const primaryCategory = common.categories.find(
    (category) => category.id === common.primaryCategoryId
  )!;
  const secondaryCategories = common.secondaryCategoryIds.map(
    (id) => common.categories.find((category) => category.id === id)!.name
  );
  const filterChanged = (
    change: Partial<Pick<InventorySelection, "inventory" | "component">>
  ) => setSelection({ ...chosen, ...change, cursors: [undefined] });

  return (
    <div className="min-w-0 space-y-4" data-frozen-submission={frozen.id}>
      {frozen.dependenciesChanged && (
        <p role="alert" className="break-words text-sm text-destructive">
          Category or source facts have changed since submission. The captured
          labels below remain the submitted facts. Refresh the current proposal
          status before taking another action.
        </p>
      )}
      <PreparationGrid>
        <PreparationSection
          title="Submitted proposal"
          className="lg:col-span-8"
          help="This is the frozen submission, including the category and source facts captured at that time. Later draft edits do not change these answers."
        >
          <Facts
            rows={[
              ["Dataset title", common.title],
              [
                "What was uploaded",
                DATASET_UPLOAD_CHOICES.find(
                  (choice) => choice.value === frozen.uploadChoice
                )?.label,
              ],
              ["Primary category at submission", primaryCategory.name],
              [
                "Other categories at submission",
                secondaryCategories.join(", ") || "None recorded",
              ],
              ["Data source at submission", common.source.name],
              ["Source description at submission", common.source.description],
              [
                "Source website recorded at submission",
                common.source.websiteUrl,
              ],
              [
                "Source verification at submission",
                common.source.isVerifiedAtFreeze
                  ? "Recorded as verified"
                  : "Not recorded as verified",
              ],
              ["Dataset license", common.license],
              ["Collection boundary", metadata.collectionBoundary],
              ["Short summary", common.overview],
              ["Detailed description", common.description],
              ["Quality statement", common.dataQuality],
              [
                "Main types of data",
                metadata.modalities
                  ?.map(
                    (value) =>
                      DATASET_MODALITIES.find((item) => item.value === value)
                        ?.label
                  )
                  .join(", "),
              ],
              [
                "Capture and domain context",
                metadata.contexts
                  ?.map((value) =>
                    value === "HEALTHCARE"
                      ? "Healthcare"
                      : "Egocentric / first-person capture"
                  )
                  .join(", "),
              ],
              [
                "Statistical study structure",
                DATASET_TYPES.find((type) => type.value === common.superType)
                  ?.label,
              ],
              ["Known collection limitations", metadata.limitations],
              ["Collection or preparation method", metadata.collectionMethod],
              ["Possible uses", metadata.possibleUses],
              ["Common use cases", common.useCases],
              ["Common limitations", common.limitations],
              ["Common methodology", common.methodology],
              ["Tags", common.tags.join(", ")],
            ]}
          />
          {profileSummary.map((group) => (
            <div
              key={group.title}
              className="space-y-3 border-t border-border pt-4"
            >
              <h3 className="text-sm font-medium">{group.title}</h3>
              <Facts
                rows={group.fields.map(
                  (field) => [field.label, field.value] as const
                )}
              />
            </div>
          ))}
        </PreparationSection>
        <PreparationSection
          title="Submission record"
          className="lg:col-span-4"
          help="The frozen price is separate from the current pricing and review status."
        >
          <Facts
            rows={[
              ["Dataset number", state.datasetUniqueId],
              ["Frozen at", displayDate(frozen.frozenAt)],
              [
                "Selected file references",
                frozen.selectedFiles.toLocaleString(),
              ],
              ["Price at submission", priceLabel(frozen.pricingAtSubmission)],
              [
                "Pricing revision at submission",
                frozen.pricingReference.revision,
              ],
            ]}
          />
          <div className="space-y-3 border-t border-border pt-4">
            <h3 className="text-sm font-medium">Current recorded status</h3>
            <Facts
              rows={[
                ["Dataset status", words(state.datasetStatus)],
                ["Admin review status", words(state.verificationStatus)],
                ["Admin review feedback", submission.reviewFeedback?.notes],
                [
                  "Rejection reason",
                  submission.reviewFeedback?.rejectionReason,
                ],
                [
                  "Current pricing",
                  state.pricing
                    ? priceLabel(state.pricing)
                    : "No current pricing record",
                ],
                [
                  "Current pricing status",
                  state.pricing ? words(state.pricing.status) : null,
                ],
                ["Current pricing revision", state.pricing?.revision],
              ]}
            />
            <p className="text-xs text-muted-foreground">
              Submission is not approval or publication. A recorded inspection
              does not grant access.
            </p>
          </div>
        </PreparationSection>
        <PreparationSection
          title="Submitted scoped declarations"
          className="lg:col-span-12"
          help="These quantities and coverage answers are supplier declarations. They do not measure unseen full material or certify file checks."
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <DeclaredQuantities
              label="Represented collection"
              measurements={metadata.collectionMeasurements}
            />
            {hasFull && (
              <DeclaredQuantities
                label="Prepared full material"
                measurements={metadata.fullMeasurements}
              />
            )}
            {hasSample && (
              <DeclaredQuantities
                label="Prepared sample"
                measurements={metadata.sampleMeasurements}
              />
            )}
          </div>
          {hasFull && (
            <p className="text-sm text-muted-foreground">
              {metadata.fullCompleteness === true
                ? "Supplier declared that the full material covers the defined collection boundary."
                : metadata.fullCompleteness === false
                  ? "Supplier did not confirm full collection completeness."
                  : "Full collection completeness was not recorded."}
            </p>
          )}
          {hasSample && (
            <Facts
              rows={[
                ["Sample selection method", metadata.sample?.selectionMethod],
                ["Sample coverage", metadata.sample?.coverage],
                [
                  "Sample omissions",
                  metadata.sample?.omissions === "DESCRIBED"
                    ? metadata.sample.omissionNotes
                    : metadata.sample?.omissions === "NONE_KNOWN"
                      ? "None known (supplier declaration)"
                      : metadata.sample?.omissions === "UNKNOWN"
                        ? "Unknown"
                        : null,
                ],
                [
                  "Sample changes from source",
                  metadata.sample?.transformations === "DESCRIBED"
                    ? metadata.sample.transformationNotes
                    : metadata.sample?.transformations === "NONE_DECLARED"
                      ? "No changes declared"
                      : metadata.sample?.transformations === "UNKNOWN"
                        ? "Unknown"
                        : null,
                ],
                [
                  "Sample relationship to full material",
                  metadata.sample?.relationshipNotes,
                ],
              ]}
            />
          )}
        </PreparationSection>
        <PreparationSection
          title="Submitted files and relationships"
          className="lg:col-span-12"
          help="Each page belongs to this exact frozen submission. File membership is frozen; present recorded security and inspection status can change. Archive entries are references inside a file, not separate download rights."
        >
          <div data-frozen-inventory="true" className="min-w-0 space-y-4">
            <div className="flex flex-wrap items-end gap-3">
              <label className="min-w-0 flex-1 space-y-1 text-sm">
                <span className="font-medium">Inventory</span>
                <select
                  aria-label="Inventory"
                  className={preparationControl}
                  value={inventory}
                  disabled={disabled || !active}
                  onChange={(event) =>
                    filterChanged({
                      inventory: event.target.value as InventoryKind,
                    })
                  }
                >
                  <option value="FILES">Files</option>
                  <option value="GROUPS">Groups</option>
                  <option value="RELATIONSHIPS">Relationships</option>
                </select>
              </label>
              <label className="min-w-0 flex-1 space-y-1 text-sm">
                <span className="font-medium">Material</span>
                <select
                  aria-label="Material"
                  className={preparationControl}
                  value={component}
                  disabled={disabled || !active}
                  onChange={(event) =>
                    filterChanged({
                      component: event.target.value as ComponentFilter,
                    })
                  }
                >
                  <option value="ALL">Full dataset and sample</option>
                  <option value="FULL">Full dataset</option>
                  <option value="SAMPLE">Sample</option>
                </select>
              </label>
              <DashboardButton
                variant="outline"
                disabled={disabled || !active}
                onClick={() => {
                  setLoaded(null);
                  setFailure(null);
                  setSelection({ ...chosen, cursors: [undefined] });
                  setRefresh((value) => value + 1);
                  onRefresh();
                }}
              >
                Refresh submission
              </DashboardButton>
            </div>
            {!active || disabled ? (
              <p className="text-sm text-muted-foreground">
                Submitted inventory is paused while the proposal context is
                unavailable.
              </p>
            ) : loading ? (
              <p role="status" className="text-sm text-muted-foreground">
                Loading submitted {words(inventory)}…
              </p>
            ) : error ? (
              <p role="alert" className="break-words text-sm text-destructive">
                {error}
              </p>
            ) : shown ? (
              <>
                <p className="text-sm text-muted-foreground">
                  Page {cursors.length} · {shown.items.length} shown ·{" "}
                  {shown.total} matching {words(inventory)}. At most 20 items
                  per page.
                </p>
                <InventoryRows page={shown} />
              </>
            ) : null}
            <nav
              className="flex flex-wrap gap-2"
              aria-label="Submitted inventory pages"
            >
              <DashboardButton
                variant="outline"
                disabled={!shown || loading || cursors.length < 2}
                onClick={() =>
                  setSelection({ ...chosen, cursors: cursors.slice(0, -1) })
                }
              >
                Previous page
              </DashboardButton>
              <DashboardButton
                variant="outline"
                disabled={!shown?.nextCursor || loading}
                onClick={() => {
                  if (shown?.nextCursor)
                    setSelection({
                      ...chosen,
                      cursors: [...cursors, shown.nextCursor.afterId],
                    });
                }}
              >
                Next page
              </DashboardButton>
            </nav>
          </div>
        </PreparationSection>
      </PreparationGrid>
    </div>
  );
}
