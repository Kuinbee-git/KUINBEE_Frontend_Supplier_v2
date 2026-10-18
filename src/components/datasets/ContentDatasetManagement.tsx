"use client";

import {
  useCallback,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import Link from "next/link";
import {
  DashboardButton,
  DashboardLoadingState,
  DashboardCard,
  DashboardSection,
} from "@/components/dashboard";
import { useComponentRequest } from "@/hooks/useComponentRequest";
import { useAuthStore } from "@/store/auth.store";
import { DATASET_PREPARATION_ENABLED } from "@/lib/dataset-preparation-environment";
import { PreparationApiError } from "@/lib/api/dataset-preparations";
import {
  datasetWorkflowApi,
  type DatasetSubmission,
} from "@/lib/api/dataset-workflow";
import {
  datasetPublicationApi,
  DatasetPublicationCommandSchema,
  type DatasetPublicationCommand,
  type SupplierDatasetPublication,
} from "@/lib/api/dataset-publication";
import {
  DatasetWorkspace,
  DatasetPageHeader,
  DatasetErrorBanner,
} from "./workspace";
import { PublishStatusBadge } from "./shared";
import { PreparationFrozenSubmission } from "./preparation/PreparationFrozenSubmission";
import { MyDatasetDetail } from "./MyDatasetDetail";

const managementCommandEvent = "kuinbee-dataset-management-change";
function managementCommandChanged() {
  window.dispatchEvent(new Event(managementCommandEvent));
}
function subscribeManagementCommand(notify: () => void) {
  window.addEventListener("storage", notify);
  window.addEventListener(managementCommandEvent, notify);
  return () => {
    window.removeEventListener("storage", notify);
    window.removeEventListener(managementCommandEvent, notify);
  };
}

function ManagementSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <DashboardSection
      surface="plain"
      title={title}
      description={description}
      className="px-4 py-5 sm:px-6"
    >
      {children}
    </DashboardSection>
  );
}

export function ContentDatasetManagement({
  datasetId,
  isDark,
}: {
  datasetId: string;
  isDark: boolean;
}) {
  const actorId = useAuthStore((state) => state.user?.id);
  const [publication, setPublication] =
    useState<SupplierDatasetPublication | null>(null);
  const [submission, setSubmission] = useState<DatasetSubmission | null>(null);
  const [loading, setLoading] = useState(true),
    [legacy, setLegacy] = useState(false);
  const [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const [writing, setWriting] = useState(false);
  const [confirmation, setConfirmation] = useState<"DELIST" | "ARCHIVE" | null>(
    null
  );
  const [visibility, setVisibility] = useState<
    "PUBLIC" | "PRIVATE" | "UNLISTED"
  >("PUBLIC");
  const busy = useRef(false),
    readSequence = useRef(0);
  const storageKey = actorId
    ? `kuinbee-dataset-management-v1:${actorId}:${datasetId}`
    : null;
  const stored = useSyncExternalStore(
    subscribeManagementCommand,
    () => {
      try {
        return storageKey ? (sessionStorage.getItem(storageKey) ?? "") : "";
      } catch {
        return "\u0000";
      }
    },
    () => ""
  );
  const restored = useMemo(() => {
    try {
      if (!stored) return { command: null, error: "" };
      if (stored.length > 16_384) throw new Error("Saved action is too large");
      const command = DatasetPublicationCommandSchema.parse(JSON.parse(stored));
      if (command.actorId !== actorId || command.datasetId !== datasetId)
        throw new Error("Saved action has a different owner");
      return { command, error: "" };
    } catch {
      return {
        command: null,
        error:
          "The saved action could not be verified. Keep this tab and refresh before continuing.",
      };
    }
  }, [stored, actorId, datasetId]);
  const pending = restored.command,
    confirmed = Boolean(storageKey) && !restored.error;
  const load = useCallback(async () => {
    const sequence = ++readSequence.current;
    setLoading(true);
    setError("");
    try {
      const next = await datasetPublicationApi.get(datasetId);
      const frozen = await datasetWorkflowApi
        .submission(datasetId)
        .catch((failure) => {
          if (failure instanceof PreparationApiError && failure.status === 404)
            return null;
          throw failure;
        });
      if (sequence !== readSequence.current) return;
      setLegacy(false);
      setPublication(next);
      setSubmission(frozen);
      setVisibility(next.visibility);
    } catch (failure) {
      if (sequence !== readSequence.current) return;
      if (failure instanceof PreparationApiError && failure.status === 404)
        setLegacy(true);
      else
        setError(
          failure instanceof Error
            ? failure.message
            : "Dataset management could not be loaded."
        );
    } finally {
      if (sequence === readSequence.current) setLoading(false);
    }
  }, [datasetId]);
  useComponentRequest(load, [datasetId], DATASET_PREPARATION_ENABLED);

  async function send(command: DatasetPublicationCommand) {
    if (
      busy.current ||
      !storageKey ||
      command.actorId !== actorId ||
      command.datasetId !== datasetId
    )
      return;
    busy.current = true;
    setWriting(true);
    setError("");
    setNotice("");
    try {
      sessionStorage.setItem(
        storageKey,
        JSON.stringify(DatasetPublicationCommandSchema.parse(command))
      );
      managementCommandChanged();
      await datasetPublicationApi.send(command);
      sessionStorage.removeItem(storageKey);
      managementCommandChanged();
      setConfirmation(null);
      setNotice("Your action was saved.");
      await load();
    } catch (failure) {
      // Known rejected transactions can be corrected. An uncertain network or
      // incompatible acknowledgement retains the original exact request.
      if (
        failure instanceof PreparationApiError &&
        failure.status &&
        failure.status >= 400 &&
        failure.status < 500
      ) {
        sessionStorage.removeItem(storageKey);
        managementCommandChanged();
        setConfirmation(null);
      }
      setError(
        failure instanceof Error
          ? failure.message
          : "The action could not be confirmed."
      );
    } finally {
      busy.current = false;
      setWriting(false);
    }
  }
  if (!DATASET_PREPARATION_ENABLED || legacy)
    return <MyDatasetDetail datasetId={datasetId} isDark={isDark} />;
  if (loading && !publication)
    return (
      <DatasetWorkspace>
        <DashboardLoadingState label="Loading dataset management" />
      </DatasetWorkspace>
    );
  const state = publication?.state;
  const disabled =
    loading ||
    writing ||
    !!pending ||
    !actorId ||
    !confirmed ||
    !!error ||
    !!restored.error;
  const lifecycle = () => ({
    requestId: crypto.randomUUID(),
    expectedWorkflowRevision: state!.workflowRevision,
    expectedPublishedContentId: state!.publishedContentId,
    expectedPublicationId: publication!.publication?.id ?? null,
  });
  function publish() {
    if (
      !publication?.canPublish ||
      !publication.state.pricing ||
      !publication.reviewedAssessment ||
      !actorId
    )
      return;
    void send({
      kind: "PUBLISH",
      actorId,
      datasetId,
      body: {
        requestId: crypto.randomUUID(),
        expectedWorkflowRevision: publication.state.workflowRevision,
        expectedContentId: publication.contentId!,
        expectedContentGeneration: publication.contentGeneration!,
        expectedPricingReference: {
          id: publication.state.pricing.id,
          revision: publication.state.pricing.revision,
        },
        expectedAssessmentId: publication.reviewedAssessment.id,
        expectedDependencyFingerprint: publication.dependencyFingerprint!,
      },
    });
  }
  return (
    <DatasetWorkspace>
      <DatasetPageHeader
        title={
          submission?.submittedContent.common.title ?? "Dataset management"
        }
        description="Manage publication and visibility. Proposal corrections keep the existing admin review process."
        breadcrumbs={
          <Link
            href="/dashboard/my-datasets"
            className="text-sm text-muted-foreground hover:underline"
          >
            My datasets
          </Link>
        }
        action={
          <DashboardButton
            variant="outline"
            disabled={loading || writing}
            onClick={() => void load()}
          >
            Refresh dataset
          </DashboardButton>
        }
        meta={
          state && (
            <div className="flex flex-wrap items-center gap-3">
              <PublishStatusBadge status={state.datasetStatus} />
              <span className="font-mono text-xs">{state.datasetUniqueId}</span>
            </div>
          )
        }
      />
      {(error || restored.error) && (
        <DatasetErrorBanner
          title="Dataset action unavailable"
          message={error || restored.error}
          onRetry={() => void load()}
        />
      )}
      {notice && (
        <p role="status" className="text-sm text-muted-foreground">
          {notice}
        </p>
      )}
      <DashboardCard
        data-proposal-panel="true"
        className="divide-y divide-border overflow-hidden"
      >
        {pending && (
          <ManagementSection
            title="Confirm the previous action"
            description="The previous response was uncertain. Confirm its original request before making another change."
          >
            <DashboardButton
              disabled={writing || !confirmed}
              onClick={() => void send(pending)}
            >
              Confirm previous action
            </DashboardButton>
          </ManagementSection>
        )}
        {publication && state && (
          <ManagementSection
            title="Publication"
            description={
              state.datasetStatus === "PUBLISHED"
                ? "This approved content is published. Full files remain available only through the existing access process."
                : "Publishing is a separate supplier action after approval and the existing publication requirements."
            }
          >
            <div className="flex flex-wrap items-center gap-3">
              {publication.canPublish && (
                <DashboardButton disabled={disabled} onClick={publish}>
                  Publish dataset
                </DashboardButton>
              )}
              {state.datasetStatus === "PUBLISHED" && (
                <DashboardButton
                  variant="outline"
                  disabled={disabled}
                  onClick={() => setConfirmation("DELIST")}
                >
                  Delist dataset
                </DashboardButton>
              )}
              {state.datasetStatus !== "ARCHIVED" && (
                <DashboardButton
                  variant="outline"
                  disabled={disabled}
                  onClick={() => setConfirmation("ARCHIVE")}
                >
                  Archive dataset
                </DashboardButton>
              )}
              {state.datasetStatus !== "ARCHIVED" && (
                <Link
                  href={`/dashboard/datasets/drafts/${datasetId}`}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Review proposal and permitted edits
                </Link>
              )}
            </div>
            {confirmation && (
              <div className="mt-4 space-y-3 border-t border-border pt-4">
                <p className="text-sm">
                  {confirmation === "DELIST"
                    ? "Delist this dataset and start the existing correction process? It will leave the public catalogue."
                    : "Archive this dataset? It will leave the public catalogue and stop accepting new purchases."}
                </p>
                <div className="flex gap-3">
                  <DashboardButton
                    disabled={disabled}
                    onClick={() =>
                      actorId &&
                      void send({
                        kind: confirmation,
                        actorId,
                        datasetId,
                        body: lifecycle(),
                      })
                    }
                  >
                    Confirm {confirmation.toLowerCase()}
                  </DashboardButton>
                  <DashboardButton
                    variant="outline"
                    disabled={writing}
                    onClick={() => setConfirmation(null)}
                  >
                    Cancel
                  </DashboardButton>
                </div>
              </div>
            )}
            {state.datasetStatus === "PUBLISHED" && (
              <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-border pt-4">
                <label className="grid gap-2 text-sm font-medium">
                  Visibility
                  <select
                    aria-label="Visibility"
                    className="dashboard-control rounded-lg border border-border bg-background px-3 py-2"
                    value={visibility}
                    disabled={disabled}
                    onChange={(event) =>
                      setVisibility(event.target.value as typeof visibility)
                    }
                  >
                    <option value="PUBLIC">Public</option>
                    <option value="PRIVATE">Private</option>
                    <option value="UNLISTED">Unlisted</option>
                  </select>
                </label>
                <DashboardButton
                  variant="outline"
                  disabled={disabled || visibility === publication.visibility}
                  onClick={() =>
                    actorId &&
                    void send({
                      kind: "VISIBILITY",
                      actorId,
                      datasetId,
                      body: { ...lifecycle(), visibility },
                    })
                  }
                >
                  Save visibility
                </DashboardButton>
              </div>
            )}
            {!publication.canPublish &&
              ["VERIFIED", "DELISTED"].includes(state.datasetStatus) &&
              publication.issues.length > 0 && (
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  {publication.issues.map((issue) => (
                    <li key={issue.code}>{issue.message}</li>
                  ))}
                </ul>
              )}
            {publication.publication && (
              <p className="mt-4 text-sm text-muted-foreground">
                Published{" "}
                {new Date(publication.publication.publishedAt).toLocaleString()}
                .{" "}
                {publication.publication.pricingAtPublication.isPaid
                  ? `${publication.publication.pricingAtPublication.currency} ${publication.publication.pricingAtPublication.price}`
                  : "Free access"}{" "}
                at publication.
              </p>
            )}
          </ManagementSection>
        )}
        {submission && (
          <ManagementSection
            title="Latest submitted proposal"
            description={
              state?.publishedContentId &&
              state.publishedContentId !== submission.submittedContent.id
                ? "This submission differs from the currently published content. Publishing changes requires the existing review and approval process."
                : "The saved submission and selected file references are frozen for review."
            }
          >
            <PreparationFrozenSubmission
              submission={submission}
              active
              onRefresh={() => void load()}
              disabled={writing || loading}
            />
          </ManagementSection>
        )}
      </DashboardCard>
    </DatasetWorkspace>
  );
}
