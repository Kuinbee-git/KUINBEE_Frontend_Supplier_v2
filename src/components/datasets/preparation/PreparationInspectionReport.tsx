"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type {
  DatasetFilesInventoryPageResponse,
  DatasetUploadAttemptStatusResponse,
  DatasetInspectionReportPageQuery,
} from "@kuinbee/dataset-preparation-contracts";
import { DashboardButton } from "@/components/dashboard";
import { useAuthStore } from "@/store/auth.store";
import { datasetInspectionReportsApi } from "@/lib/api/dataset-inspection-reports";
import { PreparationApiError } from "@/lib/api/dataset-preparations";
import {
  recordedFormatLabel,
  recordedResultLabel,
  recordedMeasurements,
} from "@/lib/datasets/dataset-inspection-presentation";

type Basis = Pick<
  DatasetFilesInventoryPageResponse,
  "preparationId" | "preparationGeneration" | "contentId" | "contentGeneration"
>;
type Subject =
  | { kind: "UPLOAD"; status: DatasetUploadAttemptStatusResponse }
  | {
      kind: "MEMBER";
      basis: Basis;
      member: DatasetFilesInventoryPageResponse["items"][number];
    };
type Props = { draftId: string; subject: Subject; enabled?: boolean };
export function PreparationInspectionReport(props: Props) {
  const actorId = useAuthStore((state) => state.user?.id);
  const id =
    props.subject.kind === "UPLOAD"
      ? props.subject.status.id
      : props.subject.member.id;
  return (
    <InspectionReport
      key={JSON.stringify([actorId, props.draftId, props.subject.kind, id])}
      {...props}
      actorId={actorId}
    />
  );
}
function InspectionReport({
  draftId,
  subject,
  enabled = true,
  actorId,
}: Props & { actorId?: string }) {
  const [open, setOpen] = useState(false);
  const key = JSON.stringify([actorId, draftId, subject]);
  const [navigation, setNavigation] = useState<{
    key: string;
    pages: DatasetInspectionReportPageQuery[];
  }>({ key, pages: [{ limit: 5 }] });
  const pages = navigation.key === key ? navigation.pages : [{ limit: 5 }];
  const query = pages.at(-1)!;
  const result = useQuery({
    queryKey: ["supplier-recorded-file-checks", key, query],
    enabled: open && enabled && Boolean(actorId),
    retry: false,
    gcTime: 0,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    queryFn: async ({ signal }) => {
      if (subject.kind === "UPLOAD") {
        const value = await datasetInspectionReportsApi.upload(
          draftId,
          subject.status.id,
          {
            ...query,
            expectedAttemptRevision: subject.status.revision,
            expectedRecoveryEpoch: subject.status.recoveryEpoch,
          },
          signal
        );
        if (
          value.component !== subject.status.component ||
          (subject.status.uploadObjectId &&
            value.page.uploadObjectId !== subject.status.uploadObjectId)
        )
          throw new PreparationApiError(
            "The recorded file changed. Refresh its status.",
            "INCOMPATIBLE_RESPONSE"
          );
        return value.page;
      }
      const value = await datasetInspectionReportsApi.member(
        draftId,
        subject.member.id,
        {
          ...query,
          contentId: subject.basis.contentId,
          contentGeneration: subject.basis.contentGeneration,
          expectedPreparationGeneration: subject.basis.preparationGeneration,
        },
        signal
      );
      if (
        value.component !== subject.member.component ||
        value.page.uploadObjectId !== subject.member.uploadObjectId
      )
        throw new PreparationApiError(
          "The selected file changed. Refresh the file list.",
          "INCOMPATIBLE_RESPONSE"
        );
      return value.page;
    },
  });
  const page = result.data;
  const fileName =
    subject.kind === "UPLOAD"
      ? subject.status.originalName
      : (subject.member.originalFileName ?? "selected file");
  return (
    <details
      className="min-w-0 text-sm"
      aria-label={`Recorded checks for ${fileName}`}
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary className="cursor-pointer font-medium">
        View recorded file checks
      </summary>
      {open && (
        <div className="mt-3 min-w-0 space-y-3">
          <p className="text-xs text-muted-foreground">
            These results describe this uploaded file or the exact archive entry
            shown. They do not measure an unseen collection, infer a domain or
            intended use, or establish current access eligibility.
          </p>
          {!enabled || !actorId ? (
            <p>Refresh the file context before opening its checks.</p>
          ) : result.isPending ? (
            <p role="status">Loading recorded checks…</p>
          ) : result.isError ? (
            <div className="space-y-2">
              <p role="alert" className="break-words text-destructive">
                {result.error instanceof Error
                  ? result.error.message
                  : "File checks could not be loaded."}
              </p>
              <p className="text-xs text-muted-foreground">
                Refresh the upload status or selected file list if this file
                changed. Your draft answers remain unchanged.
              </p>
              <DashboardButton
                type="button"
                variant="outline"
                onClick={() => void result.refetch()}
              >
                Retry recorded checks
              </DashboardButton>
            </div>
          ) : (
            page && (
              <>
                {page.state === "NOT_RECEIVED" ? (
                  <p>
                    File receipt has not produced a stored object yet. Format
                    measurements are not available.
                  </p>
                ) : page.state === "NOT_RECORDED" ? (
                  <p>
                    No current inspection has been recorded for this stored file
                    yet.
                  </p>
                ) : page.state === "STALE" ? (
                  <p>
                    The stored inspection no longer matches this file’s current
                    security state. Backend reconciliation or new checks are
                    needed.
                  </p>
                ) : (
                  <>
                    <p className="text-xs text-muted-foreground">
                      Recorded check outcome:{" "}
                      {page.inspection?.recordedOutcome
                        .toLowerCase()
                        .replaceAll("_", " ")}
                      . File state:{" "}
                      {page.inspection?.securityState
                        .toLowerCase()
                        .replaceAll("_", " ")}
                      . Selection and delivery are checked separately.
                    </p>
                    {!page.items.length && (
                      <p>
                        No format measurements were recorded in this evidence.
                        Missing measurements are not zero.
                      </p>
                    )}
                    <ul className="min-w-0 divide-y divide-border">
                      {page.items.map((row) => (
                        <li key={row.id} className="min-w-0 space-y-2 py-3">
                          <p className="break-words font-medium [overflow-wrap:anywhere]">
                            {recordedFormatLabel(row.profileId)} ·{" "}
                            {recordedResultLabel(row.result)}
                          </p>
                          <p className="break-words text-xs text-muted-foreground [overflow-wrap:anywhere]">
                            {row.source.kind === "PHYSICAL_OBJECT"
                              ? "Exact uploaded file"
                              : row.source.locator.kind === "ARCHIVE_ENTRY"
                                ? `Archive entry: ${row.source.locator.path}`
                                : `Workbook sheet: ${row.source.locator.sheetName}`}
                          </p>
                          <p className="text-xs">
                            Measured bytes: {row.measuredSizeBytes} · Backend
                            observed
                          </p>
                          <dl className="grid min-w-0 gap-x-4 gap-y-2 sm:grid-cols-2">
                            {recordedMeasurements(row.facts).map(
                              (measurement) => (
                                <div key={measurement.key} className="min-w-0">
                                  <dt className="text-xs text-muted-foreground">
                                    {measurement.label}
                                  </dt>
                                  <dd className="break-words text-sm [overflow-wrap:anywhere]">
                                    {measurement.value}
                                  </dd>
                                </div>
                              )
                            )}
                          </dl>
                          {row.facts.headerConvention === "PRESENT" && (
                            <p className="text-xs text-muted-foreground">
                              Data records exclude the declared header. Observed
                              columns do not establish semantic types, keys or
                              uniqueness.
                            </p>
                          )}
                          <details className="min-w-0 text-xs">
                            <summary className="cursor-pointer">
                              Exact measurement details
                            </summary>
                            <p className="mt-2 break-all">
                              Recorded profile: {row.profileId}
                            </p>
                            <p className="break-all">
                              SHA256: {row.checksumSha256}
                            </p>
                            <dl className="mt-2 space-y-2">
                              {Object.entries(row.facts).map(
                                ([name, value]) => (
                                  <div key={name} className="min-w-0">
                                    <dt className="break-words font-medium">
                                      {name}
                                    </dt>
                                    <dd className="break-words [overflow-wrap:anywhere]">
                                      {value === null
                                        ? "Not measured"
                                        : typeof value === "boolean"
                                          ? value
                                            ? "Yes"
                                            : "No"
                                          : String(value)}
                                    </dd>
                                  </div>
                                )
                              )}
                            </dl>
                          </details>
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs text-muted-foreground">
                      {page.items.length} of {page.total} format results on this
                      page. Archive entries describe packaging contents; they
                      are not separate download entitlements.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <DashboardButton
                        type="button"
                        variant="outline"
                        disabled={result.isFetching || pages.length < 2}
                        onClick={() =>
                          setNavigation({ key, pages: pages.slice(0, -1) })
                        }
                      >
                        Previous check results
                      </DashboardButton>
                      <DashboardButton
                        type="button"
                        variant="outline"
                        disabled={result.isFetching || !page.nextCursor}
                        onClick={() => {
                          if (page.nextCursor)
                            setNavigation({
                              key,
                              pages: [
                                ...pages.map((item) => ({
                                  ...item,
                                  expectedEvidenceId: page.evidenceId!,
                                })),
                                page.nextCursor,
                              ],
                            });
                        }}
                      >
                        Next check results
                      </DashboardButton>
                    </div>
                  </>
                )}
              </>
            )
          )}
        </div>
      )}
    </details>
  );
}
