"use client";

import { PreparationNativeSelect } from "./PreparationNativeSelect";

import {
  DashboardButton,
  DashboardField,
  DashboardInput,
} from "@/components/dashboard";
import type { PreparationWorkflow } from "@/hooks/usePreparationWorkflow";
import type { DatasetPreparationResponse } from "@kuinbee/dataset-preparation-contracts";
import {
  PreparationGrid,
  PreparationSection,
  preparationControl,
} from "./PreparationFields";

export function PreparationWorkflowPanel({
  workflow,
  saved,
  metadataDirty,
  uploadsActive,
  filesUnapplied = false,
  onSave,
  onRetry,
  onIssue,
}: {
  workflow: PreparationWorkflow;
  saved: DatasetPreparationResponse | null;
  metadataDirty: boolean;
  uploadsActive: boolean;
  filesUnapplied?: boolean;
  onSave: () => Promise<unknown>;
  onRetry: () => Promise<unknown>;
  onIssue: (field?: string) => void;
}) {
  const { snapshot, price, priceDirty, fresh, loading, blocked } = workflow;
  const sampleOnly = saved?.metadata.uploadChoice === "SAMPLE_ONLY";
  const pricingEditable = fresh && Boolean(snapshot?.pricingContext.editable);
  const pricingLocked =
    blocked ||
    !pricingEditable ||
    workflow.priceConflict ||
    workflow.reconciliationRequired;
  const currentPricing = snapshot?.state.pricing;
  const priceCanSubmit =
    currentPricing &&
    ["DRAFT", "CHANGES_REQUESTED", "REJECTED"].includes(currentPricing.status);
  // A stale workflow snapshot cannot describe today's submission requirements.
  // Older exact save replays may retain the original preparation-only messages;
  // keep those acknowledgements intact while omitting obsolete availability copy.
  const issues = fresh
    ? (snapshot?.readiness.issues ?? [])
    : (saved?.readiness.issues ?? []).filter(
        (issue) =>
          !["FILES_NOT_ENABLED", "SUBMISSION_NOT_ENABLED"].includes(issue.code)
      );
  return (
    <div data-workflow-panel="true" className="min-w-0 space-y-4">
      {(workflow.error || workflow.notice || workflow.pending) && (
        <div
          className="space-y-3 border-b border-border pb-4 text-sm"
          aria-live="polite"
        >
          {workflow.error && <p role="alert">{workflow.error}</p>}
          {workflow.notice && <p role="status">{workflow.notice}</p>}
          {workflow.pending && (
            <>
              <p>
                Confirm the previous request before editing or submitting again.
                Retry uses the same request; it does not create a second
                submission.
              </p>
              <DashboardButton
                type="button"
                variant="outline"
                disabled={workflow.writing}
                onClick={() => void onRetry()}
              >
                Retry proposal request
              </DashboardButton>
            </>
          )}
        </div>
      )}
      <PreparationGrid>
        <PreparationSection
          field="pricing"
          title="Access & pricing"
          className="lg:col-span-5"
          help="Pricing keeps its existing separate admin review. License agreements and negotiation remain outside Kuinbee."
        >
          {!saved ? (
            <p className="text-sm">Save your draft before setting pricing.</p>
          ) : !price ? (
            <p className="text-sm text-muted-foreground">
              {loading
                ? "Loading current pricing…"
                : "Current pricing is unavailable. Save an older draft normally to connect it, then refresh the review checks."}
            </p>
          ) : (
            <>
              {sampleOnly && (
                <p className="text-sm">
                  This proposal displays a sample. There is no on-platform
                  sample purchase. Full data remains private until the existing
                  purchase and access process grants it.
                </p>
              )}
              {currentPricing && (
                <p className="text-sm">
                  Pricing status:{" "}
                  <strong>
                    {currentPricing.status.replaceAll("_", " ").toLowerCase()}
                  </strong>
                </p>
              )}
              {currentPricing?.notes && (
                <p className="whitespace-pre-wrap text-sm">
                  Admin notes: {currentPricing.notes}
                </p>
              )}
              {currentPricing?.rejectionReason && (
                <p className="whitespace-pre-wrap text-sm">
                  Pricing correction: {currentPricing.rejectionReason}
                </p>
              )}
              {workflow.priceConflict && (
                <div
                  role="alert"
                  className="space-y-3 border-t border-border pt-3 text-sm"
                >
                  <p>
                    Pricing changed in another save. Your input is retained.
                    Current saved pricing:{" "}
                    {currentPricing?.isPaid
                      ? `${currentPricing.currency} ${currentPricing.price}`
                      : "Free access"}
                    .
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <DashboardButton
                      type="button"
                      variant="outline"
                      disabled={blocked || !fresh}
                      onClick={() => workflow.resolvePriceConflict(true)}
                    >
                      Use current pricing
                    </DashboardButton>
                    <DashboardButton
                      type="button"
                      variant="outline"
                      className="h-auto min-h-10 whitespace-normal"
                      disabled={blocked || !fresh}
                      onClick={() => workflow.resolvePriceConflict(false)}
                    >
                      Keep my pricing against current save
                    </DashboardButton>
                  </div>
                </div>
              )}
              <fieldset
                disabled={pricingLocked}
                className="min-w-0 space-y-4"
                data-pricing-form="true"
              >
                <legend className="sr-only">Current draft pricing</legend>
                <div className="flex flex-wrap gap-4 text-sm">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="dataset-access-price"
                      checked={!price.isPaid}
                      onChange={() => workflow.changePrice({ isPaid: false })}
                    />
                    Free access
                  </label>
                  {!sampleOnly && (
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="dataset-access-price"
                        checked={price.isPaid}
                        onChange={() => workflow.changePrice({ isPaid: true })}
                      />
                      Paid access
                    </label>
                  )}
                </div>
                {price.isPaid && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <DashboardField
                      id="dataset-price"
                      label="Dataset price"
                      description="Enter a positive amount with up to two decimal places."
                    >
                      {(props) => (
                        <DashboardInput
                          {...props}
                          inputMode="decimal"
                          maxLength={11}
                          value={price.price}
                          onChange={(event) =>
                            workflow.changePrice({ price: event.target.value })
                          }
                        />
                      )}
                    </DashboardField>
                    <DashboardField id="dataset-currency" label="Currency">
                      {(props) => (
                        <PreparationNativeSelect
                          {...props}
                          className={preparationControl}
                          value={price.currency}
                          onChange={(event) =>
                            workflow.changePrice({
                              currency: event.target
                                .value as typeof price.currency,
                            })
                          }
                        >
                          {["INR", "USD", "EUR", "GBP"].map((value) => (
                            <option key={value}>{value}</option>
                          ))}
                        </PreparationNativeSelect>
                      )}
                    </DashboardField>
                  </div>
                )}
              </fieldset>
              {priceDirty && (
                <p className="text-sm" role="status">
                  Pricing has unsaved changes.
                </p>
              )}
              <div className="flex flex-wrap gap-3">
                <DashboardButton
                  type="button"
                  variant="outline"
                  disabled={pricingLocked || !priceDirty}
                  onClick={() => void onSave()}
                >
                  Save pricing
                </DashboardButton>
                <DashboardButton
                  type="button"
                  variant="outline"
                  className="h-auto min-h-10 whitespace-normal"
                  disabled={
                    pricingLocked ||
                    (metadataDirty && !workflow.readOnly) ||
                    priceDirty ||
                    !priceCanSubmit
                  }
                  onClick={() => void workflow.submitPricing()}
                >
                  Submit pricing for review
                </DashboardButton>
              </div>
              {!pricingEditable && fresh && (
                <p className="text-sm text-muted-foreground">
                  Pricing is read-only in its current review state.
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Saving is separate from submitting pricing. A paid proposal
                needs pricing submitted for review before proposal Submit. Free
                draft pricing can satisfy the pricing check without a separate
                submission.
              </p>
            </>
          )}
        </PreparationSection>
        <PreparationSection
          title={
            workflow.readOnly ? "Submitted proposal" : "Ready for admin review?"
          }
          className="lg:col-span-7"
          help="Kuinbee checks your saved answers, selected files and storage limits before submission. Uploading a file or saving a draft does not submit your proposal."
        >
          <div className="flex flex-wrap items-center gap-3">
            <DashboardButton
              type="button"
              variant="outline"
              disabled={!saved || loading || blocked}
              onClick={() => void workflow.refresh()}
            >
              {loading ? "Checking proposal…" : "Refresh review checks"}
            </DashboardButton>
            <p className="text-sm text-muted-foreground">
              {!saved
                ? "Save a draft to see its checks."
                : !fresh
                  ? "Current review checks are not confirmed."
                  : workflow.readOnly
                    ? `Content review: ${snapshot?.state.verificationStatus.replaceAll("_", " ").toLowerCase()}`
                    : snapshot?.readiness.canSubmit
                      ? "The saved proposal passed the current submission checks."
                      : "Complete the items below before submitting."}
            </p>
          </div>
          {metadataDirty && (
            <p className="text-sm">
              Save your changed answers to refresh these checks.
            </p>
          )}
          {saved && !fresh && !workflow.readOnly && (
            <p className="text-sm text-muted-foreground">
              The items below cover saved answers only. Refresh review checks to
              include selected files, pricing and the current review state.
            </p>
          )}
          {uploadsActive && (
            <p className="text-sm">
              Finish or pause the active file transfer before submitting.
              Received files still need their backend checks and selection.
            </p>
          )}
          {!workflow.readOnly && issues.length > 0 && (
            <ul className="divide-y divide-border text-sm">
              {issues.map((issue, index) => (
                <li className="py-3 first:pt-0" key={`${issue.code}-${index}`}>
                  <p>{issue.message}</p>
                  {issue.field && (
                    <DashboardButton
                      type="button"
                      variant="link"
                      size="compact"
                      className="mt-1 h-auto whitespace-normal p-0 text-left"
                      disabled={blocked}
                      onClick={() => onIssue(issue.field)}
                    >
                      Go to this section
                    </DashboardButton>
                  )}
                </li>
              ))}
            </ul>
          )}
          {!workflow.readOnly && (
            <>
              {filesUnapplied && (
                <p role="status" className="text-sm text-muted-foreground">
                  Apply or discard the file organization input in Files &amp;
                  contents before submitting.
                </p>
              )}
              <DashboardButton
                type="button"
                className="h-auto min-h-10 whitespace-normal"
                disabled={!workflow.canSubmit || filesUnapplied}
                onClick={() => void workflow.submit()}
              >
                Submit proposal for admin review
              </DashboardButton>
            </>
          )}
          <p className="text-sm text-muted-foreground">
            {workflow.readOnly
              ? "The submitted contents are frozen for review. Any permitted pricing correction is a separate action."
              : "Submit freezes this saved proposal for admin review. Admin approval and publication remain separate steps."}
          </p>
        </PreparationSection>
      </PreparationGrid>
    </div>
  );
}
