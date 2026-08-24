"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Archive,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  EyeOff,
  ExternalLink,
  FilePenLine,
  History,
  Globe2,
  ImagePlus,
  Loader2,
  RotateCcw,
  Send,
  ShieldCheck,
  UploadCloud,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import {
  DashboardButton as Button,
  DashboardCard as Card,
  DashboardCardContent as CardContent,
  DashboardCardHeader as CardHeader,
  DashboardCardTitle as CardTitle,
  DashboardDialog as Dialog,
  DashboardDialogContent as DialogContent,
  DashboardErrorState,
  DashboardInlineAlert,
  DashboardLoadingState,
  DashboardPage,
  DashboardPageHeader,
  DashboardStatusBadge,
  DashboardTextarea as Textarea,
  type DashboardTone,
} from "@/components/dashboard";
import { getSupplierProfile } from "@/lib/api/supplier";
import { customCollectionApi } from "@/lib/api/custom-collection";
import { cn } from "@/lib/utils";
import type {
  CustomCollectionReviewEvent,
  CustomCollectionRevision,
  CustomCollectionRevisionInput,
  CustomCollectionService,
} from "@/types/custom-collection.types";
import { CustomCollectionForm } from "./CustomCollectionForm";
import {
  COLLECTION_METHOD_OPTIONS,
  DATA_TYPE_OPTIONS,
  FORMAT_OPTIONS,
  GEOGRAPHY_OPTIONS,
  INDUSTRY_OPTIONS,
  LANGUAGE_OPTIONS,
  STATUS_CONFIG,
  formatDate,
  labelForOption,
  latestReviewNote,
  revisionToInput,
} from "./customCollectionUtils";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_COVER_SIZE = 5 * 1024 * 1024;

type RevisionView = "working" | "published";

const STATUS_TONES: Partial<
  Record<CustomCollectionRevision["status"], DashboardTone>
> = {
  DRAFT: "neutral",
  SUBMITTED: "info",
  UNDER_REVIEW: "warning",
  CHANGES_REQUESTED: "warning",
  RESUBMITTED: "info",
  APPROVED: "success",
  REJECTED: "danger",
  SUPERSEDED: "neutral",
};

export function CustomCollectionServiceDetail({
  serviceId,
}: {
  serviceId: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [service, setService] = useState<CustomCollectionService | null>(null);
  const [history, setHistory] = useState<CustomCollectionReviewEvent[]>([]);
  const [offlineContractDone, setOfflineContractDone] = useState<
    boolean | null
  >(null);
  const [revisionView, setRevisionView] = useState<RevisionView>("working");
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [action, setAction] = useState<
    "submit" | "publish" | "unpublish" | "archive" | "revision" | null
  >(null);
  const [archiveReason, setArchiveReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (showLoading = true) => {
      if (showLoading) setLoading(true);
      setError(null);
      try {
        const [detail, profile] = await Promise.all([
          customCollectionApi.get(serviceId),
          getSupplierProfile().catch(() => null),
        ]);
        setService(detail.service);
        setHistory(detail.history);
        setOfflineContractDone(profile?.profile?.isOfflineContractDone ?? null);
        if (
          !detail.service.workingRevision &&
          detail.service.publishedRevision
        ) {
          setRevisionView("published");
        }
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "This service could not be loaded."
        );
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [serviceId]
  );

  useEffect(() => {
    void load();
  }, [load]);

  const revision = useMemo(() => {
    if (!service) return null;
    return revisionView === "working"
      ? (service.workingRevision ?? service.publishedRevision)
      : (service.publishedRevision ?? service.workingRevision);
  }, [revisionView, service]);

  const revisionHistory = useMemo(
    () => history.filter((event) => event.revisionId === revision?.id),
    [history, revision?.id]
  );
  const formInitialValues = useMemo(
    () => (revision ? revisionToInput(revision) : undefined),
    [revision]
  );
  const formCategoryOptions = useMemo(
    () =>
      revision
        ? [revision.primaryCategory, ...revision.secondaryCategories]
        : [],
    [revision]
  );

  const draftEditable = Boolean(
    revision &&
    service?.workingRevision?.id === revision.id &&
    ["DRAFT", "CHANGES_REQUESTED"].includes(revision.status) &&
    !service.archivedAt
  );
  const editable = draftEditable;
  const canStartRevision = Boolean(
    service &&
    (service.publishedRevision ||
      service.workingRevision?.status === "REJECTED") &&
    (!service.workingRevision ||
      service.workingRevision.status === "REJECTED") &&
    !service.archivedAt
  );
  const submitReady = Boolean(
    editable && revision?.coverImage && offlineContractDone !== false
  );

  const save = async (values: CustomCollectionRevisionInput) => {
    if (!service?.workingRevision) return;

    setSaving(true);
    try {
      await customCollectionApi.patch(
        service.id,
        service.workingRevision.id,
        values
      );
      toast.success("Draft saved");
      setEditing(false);
      await load(false);
    } catch (saveError) {
      toast.error("Could not save the draft", {
        description:
          saveError instanceof Error ? saveError.message : "Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const uploadCover = async (file?: File) => {
    if (!file || !service?.workingRevision || !editable) return;
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error("Choose a JPEG, PNG, or WebP image.");
      return;
    }
    if (file.size > MAX_COVER_SIZE) {
      toast.error("The cover image must be 5 MB or smaller.");
      return;
    }

    setUploading(true);
    try {
      await customCollectionApi.uploadCover(
        service.id,
        service.workingRevision.id,
        file
      );
      toast.success("Cover image updated");
      await load(false);
    } catch (uploadError) {
      toast.error("Could not upload the cover", {
        description:
          uploadError instanceof Error
            ? uploadError.message
            : "Please try again.",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const submit = async () => {
    if (!service?.workingRevision) return;
    setSaving(true);
    try {
      await customCollectionApi.submit(service.id, service.workingRevision.id);
      toast.success(
        service.workingRevision.status === "CHANGES_REQUESTED"
          ? "Revision resubmitted"
          : "Service submitted for review"
      );
      setAction(null);
      await load(false);
    } catch (submitError) {
      toast.error("Could not submit the service", {
        description:
          submitError instanceof Error
            ? submitError.message
            : "Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const changeVisibility = async (publish: boolean) => {
    if (!service?.publishedRevision) return;
    setSaving(true);
    try {
      if (publish) {
        await customCollectionApi.publish(service.id);
      } else {
        await customCollectionApi.unpublish(service.id);
      }
      toast.success(publish ? "Service published" : "Service unpublished");
      setAction(null);
      await load(false);
    } catch (visibilityError) {
      toast.error(
        publish
          ? "Could not publish the service"
          : "Could not unpublish the service",
        {
          description:
            visibilityError instanceof Error
              ? visibilityError.message
              : "Please try again.",
        }
      );
    } finally {
      setSaving(false);
    }
  };

  const archive = async () => {
    if (!service || archiveReason.trim().length < 3) return;
    setSaving(true);
    try {
      await customCollectionApi.archive(service.id, archiveReason);
      toast.success("Service archived");
      setAction(null);
      await load(false);
    } catch (archiveError) {
      toast.error("Could not archive the service", {
        description:
          archiveError instanceof Error
            ? archiveError.message
            : "Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const createRevision = async () => {
    if (!service) return;
    setSaving(true);
    try {
      await customCollectionApi.createRevision(service.id);
      toast.success("New draft revision created");
      setAction(null);
      setRevisionView("working");
      setEditing(true);
      await load(false);
    } catch (revisionError) {
      toast.error("Could not create a new revision", {
        description:
          revisionError instanceof Error
            ? revisionError.message
            : "Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <DetailSkeleton />;

  if (!service || !revision) {
    return (
      <DashboardPage width="standard">
        <DashboardPageHeader
          title="Custom collection service"
          description="Review and manage this supplier service."
        />
        <DashboardErrorState
          title="Service unavailable"
          message={error || "The requested service could not be found."}
          onRetry={() => void load()}
        />
        <Button asChild variant="outline" className="self-center">
          <Link href="/dashboard/custom-collection-services">
            Back to services
          </Link>
        </Button>
      </DashboardPage>
    );
  }

  const status = STATUS_CONFIG[revision.status];
  const feedback = latestReviewNote(revisionHistory);
  const publicBaseUrl =
    process.env.NEXT_PUBLIC_USER_APP_URL ||
    process.env.NEXT_PUBLIC_MARKETPLACE_URL ||
    "http://localhost:5175";

  return (
    <DashboardPage width="wide">
      <header className="space-y-4">
        <Button asChild variant="ghost" size="compact" className="-ml-3">
          <Link href="/dashboard/custom-collection-services">
            <ArrowLeft /> Back to services
          </Link>
        </Button>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <DashboardStatusBadge
                status={revision.status}
                tone={STATUS_TONES[revision.status] ?? "neutral"}
              >
                {status.label}
              </DashboardStatusBadge>
              <span className="text-xs text-muted-foreground">
                Revision v{revision.version}
              </span>
              {service.publishedRevision && !service.archivedAt && (
                <DashboardStatusBadge
                  icon={service.isPublished ? Globe2 : EyeOff}
                  tone={service.isPublished ? "success" : "neutral"}
                >
                  {service.isPublished ? "Public" : "Private"}
                </DashboardStatusBadge>
              )}
              {service.archivedAt && (
                <DashboardStatusBadge icon={Archive} tone="neutral">
                  Archived
                </DashboardStatusBadge>
              )}
            </div>
            <h1 className="break-words text-2xl font-semibold tracking-tight sm:text-3xl">
              {revision.title}
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              {status.description}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {service.isPublished &&
              service.publishedRevision &&
              !service.archivedAt && (
                <Button asChild variant="outline">
                  <a
                    href={`${publicBaseUrl}/data-request/services/${service.slug}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLink /> View public page
                  </a>
                </Button>
              )}
            {service.publishedRevision && !service.archivedAt && (
              <Button
                variant={service.isPublished ? "outline" : "default"}
                onClick={() =>
                  setAction(service.isPublished ? "unpublish" : "publish")
                }
              >
                {service.isPublished ? <EyeOff /> : <Globe2 />}
                {service.isPublished ? "Unpublish" : "Publish"}
              </Button>
            )}
            {editable && !editing && (
              <Button variant="outline" onClick={() => setEditing(true)}>
                <FilePenLine /> Edit draft
              </Button>
            )}
            {canStartRevision && (
              <Button variant="outline" onClick={() => setAction("revision")}>
                <RotateCcw /> New revision
              </Button>
            )}
            {editable && (
              <Button
                onClick={() => setAction("submit")}
                disabled={!submitReady}
              >
                <Send />
                {revision.status === "CHANGES_REQUESTED"
                  ? "Resubmit"
                  : "Submit for review"}
              </Button>
            )}
            {!service.archivedAt && (
              <Button
                variant="outline"
                className="text-[var(--dashboard-danger-foreground)]"
                onClick={() => {
                  setArchiveReason("");
                  setAction("archive");
                }}
              >
                <Archive /> Archive
              </Button>
            )}
          </div>
        </div>
      </header>

      {error && (
        <DashboardInlineAlert
          tone="danger"
          icon={AlertTriangle}
          title="Some information could not be refreshed"
          message={error}
        />
      )}

      {!service.archivedAt &&
        service.publishedRevision &&
        !service.isPublished && (
          <DashboardInlineAlert
            tone="info"
            icon={Globe2}
            title="Approved and ready to publish"
          >
            This service is private and cannot be discovered or receive new
            buyer requests. Publish it when you are ready to make the approved
            revision public.
          </DashboardInlineAlert>
        )}

      {service.workingRevision && service.publishedRevision && (
        <div className="dashboard-glass-card inline-flex w-full rounded-xl border border-border p-1 sm:w-auto">
          <RevisionTab
            active={revisionView === "working"}
            onClick={() => {
              setRevisionView("working");
              setEditing(false);
            }}
          >
            Working revision v{service.workingRevision.version}
          </RevisionTab>
          <RevisionTab
            active={revisionView === "published"}
            onClick={() => {
              setRevisionView("published");
              setEditing(false);
            }}
          >
            Live revision v{service.publishedRevision.version}
          </RevisionTab>
        </div>
      )}

      {service.archivedAt && (
        <DashboardInlineAlert
          tone="neutral"
          icon={Archive}
          title="This service is archived"
        >
          It is no longer visible to buyers and cannot accept new requests or
          revisions. Archived on {formatDate(service.archivedAt)}.
        </DashboardInlineAlert>
      )}

      {revision.status === "CHANGES_REQUESTED" && feedback && (
        <DashboardInlineAlert
          tone="warning"
          icon={AlertTriangle}
          title="Reviewer changes requested"
          message={<span className="whitespace-pre-wrap">{feedback}</span>}
        />
      )}

      {revision.status === "REJECTED" && (
        <DashboardInlineAlert
          tone="danger"
          icon={XCircle}
          title="This revision was rejected"
        >
          <div className="space-y-2">
            {feedback && <p className="whitespace-pre-wrap">{feedback}</p>}
            {service.publishedRevision ? (
              <p>
                Your approved revision remains live. You can start a new draft
                when ready.
              </p>
            ) : (
              <p>
                The rejected revision stays in the history. Start a new draft
                revision if you want to address the decision and submit again.
              </p>
            )}
          </div>
        </DashboardInlineAlert>
      )}

      {editing && draftEditable ? (
        <div id="service-edit-form" className="scroll-mt-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">
                Edit revision v{revision.version}
              </h2>
              <p className="text-sm text-muted-foreground">
                Saving keeps the revision private. Submission is a separate
                action.
              </p>
            </div>
            <Button
              variant="ghost"
              onClick={() => setEditing(false)}
              disabled={saving}
            >
              Cancel
            </Button>
          </div>
          <CustomCollectionForm
            initialValues={formInitialValues}
            submitLabel="Save draft"
            busy={saving}
            categoryOptions={formCategoryOptions}
            loadCategories
            onSubmit={save}
          />
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
          <div className="space-y-6">
            <CoverCard
              revision={revision}
              editable={editable}
              uploading={uploading}
              fileInputRef={fileInputRef}
              onUpload={uploadCover}
            />
            <ServicePreview revision={revision} />
          </div>

          <aside className="space-y-6">
            {editable && (
              <SubmissionReadiness
                hasCover={Boolean(revision.coverImage)}
                offlineContractDone={offlineContractDone}
                onUpload={() => fileInputRef.current?.click()}
              />
            )}
            {service.publishedRevision && (
              <VisibilitySummary service={service} />
            )}
            <RevisionSummary revision={revision} />
            <ReviewTimeline
              history={history}
              selectedRevisionId={revision.id}
            />
          </aside>
        </div>
      )}

      <Dialog
        open={action === "submit"}
        onOpenChange={(open) => !open && setAction(null)}
      >
        <DialogContent
          title={
            revision.status === "CHANGES_REQUESTED"
              ? "Resubmit this revision?"
              : "Submit this service for review?"
          }
          description={`Revision v${revision.version} will become read-only while the Kuinbee team reviews it. Your existing approved revision, if any, keeps its current public or private visibility.`}
          footer={
            <>
              <Button
                variant="outline"
                onClick={() => setAction(null)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button onClick={submit} disabled={!submitReady || saving}>
                {saving && <Loader2 className="animate-spin" />}
                Confirm submission
              </Button>
            </>
          }
        >
          <div className="space-y-2 rounded-lg border border-border bg-muted/35 p-3 text-sm">
            <ChecklistItem complete={Boolean(revision.coverImage)}>
              Cover image added
            </ChecklistItem>
            <ChecklistItem complete={offlineContractDone === true}>
              Offline supplier contract completed
            </ChecklistItem>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={action === "publish" || action === "unpublish"}
        onOpenChange={(open) => !open && setAction(null)}
      >
        <DialogContent
          title={
            action === "publish"
              ? "Publish this service?"
              : "Unpublish this service?"
          }
          description={
            action === "publish"
              ? "The approved revision will become discoverable in the marketplace and buyers will be able to submit new requests."
              : "The service will be hidden from marketplace discovery and its public page will stop accepting new requests. You can publish it again later."
          }
          footer={
            <>
              <Button
                variant="outline"
                onClick={() => setAction(null)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                variant={action === "unpublish" ? "outline" : "default"}
                onClick={() => void changeVisibility(action === "publish")}
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="animate-spin" />
                ) : action === "publish" ? (
                  <Globe2 />
                ) : (
                  <EyeOff />
                )}
                {action === "publish" ? "Publish service" : "Unpublish service"}
              </Button>
            </>
          }
        />
      </Dialog>

      <Dialog
        open={action === "archive"}
        onOpenChange={(open) => !open && setAction(null)}
      >
        <DialogContent
          title="Archive this service?"
          description="The service will disappear from the marketplace and stop accepting new buyer requests. This action is intentionally not offered as a temporary visibility switch."
          footer={
            <>
              <Button
                variant="outline"
                onClick={() => setAction(null)}
                disabled={saving}
              >
                Keep service
              </Button>
              <Button
                variant="destructive"
                onClick={archive}
                disabled={archiveReason.trim().length < 3 || saving}
              >
                {saving && <Loader2 className="animate-spin" />}
                Archive service
              </Button>
            </>
          }
        >
          <div className="space-y-2">
            <label htmlFor="archiveReason" className="text-sm font-medium">
              Reason for archiving <span className="text-destructive">*</span>
            </label>
            <Textarea
              id="archiveReason"
              rows={4}
              maxLength={1000}
              value={archiveReason}
              onChange={(event) => setArchiveReason(event.target.value)}
              placeholder="Explain why this service is no longer offered."
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={action === "revision"}
        onOpenChange={(open) => !open && setAction(null)}
      >
        <DialogContent
          title="Start a new draft revision?"
          description={`We will copy the latest service details into a new editable revision.${
            service.publishedRevision
              ? " The current approved version keeps its existing visibility until the new revision is approved."
              : " The rejected revision remains unchanged in the review history."
          }`}
          footer={
            <>
              <Button
                variant="outline"
                onClick={() => setAction(null)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button onClick={createRevision} disabled={saving}>
                {saving && <Loader2 className="animate-spin" />}
                Create draft revision
              </Button>
            </>
          }
        />
      </Dialog>
    </DashboardPage>
  );
}

function CoverCard({
  revision,
  editable,
  uploading,
  fileInputRef,
  onUpload,
}: {
  revision: CustomCollectionRevision;
  editable: boolean;
  uploading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onUpload: (file?: File) => void;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-[16/7] min-h-52 border-b border-border bg-muted/45">
        {revision.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={revision.coverImage.url}
            alt={`${revision.title} cover`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center px-5 text-center text-muted-foreground">
            <ImagePlus className="mb-3 size-10" />
            <p className="font-medium text-foreground">
              Add a service cover image
            </p>
            <p className="mt-1 max-w-md text-sm">
              Use a clear, relevant 16:9-style image. JPEG, PNG, or WebP up to 5
              MB.
            </p>
          </div>
        )}
        {editable && (
          <div className="absolute inset-x-0 bottom-0 flex justify-end bg-gradient-to-t from-black/65 to-transparent p-4 pt-12">
            <Button
              type="button"
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <UploadCloud />
              )}
              {revision.coverImage ? "Replace cover" : "Upload cover"}
            </Button>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
          onChange={(event) => onUpload(event.target.files?.[0])}
        />
      </div>
    </Card>
  );
}

function ServicePreview({ revision }: { revision: CustomCollectionRevision }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Marketplace content</CardTitle>
      </CardHeader>
      <CardContent className="space-y-7">
        <div>
          <p className="text-lg font-medium">{revision.shortDescription}</p>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
            {revision.description}
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <InfoGroup
            title="Primary category"
            values={[revision.primaryCategory.name]}
          />
          <InfoGroup
            title="Secondary categories"
            values={revision.secondaryCategories.map(({ name }) => name)}
          />
          <InfoGroup
            title="Collection methods"
            values={withOther(
              revision.collectionMethods,
              revision.collectionMethodsOther,
              COLLECTION_METHOD_OPTIONS
            )}
          />
          <InfoGroup
            title="Data types"
            values={withOther(
              revision.dataTypes,
              revision.dataTypesOther,
              DATA_TYPE_OPTIONS
            )}
          />
          <InfoGroup
            title="Industries"
            values={withOther(
              revision.industries,
              revision.industriesOther,
              INDUSTRY_OPTIONS
            )}
          />
          <InfoGroup
            title="Geographies"
            values={withOther(
              revision.geographies,
              revision.geographiesOther,
              GEOGRAPHY_OPTIONS
            )}
          />
          <InfoGroup
            title="Languages"
            values={withOther(
              revision.languages,
              revision.languagesOther,
              LANGUAGE_OPTIONS
            )}
          />
          <InfoGroup
            title="Delivery formats"
            values={withOther(
              revision.supportedFormats,
              revision.supportedFormatsOther,
              FORMAT_OPTIONS
            )}
          />
        </div>
        <div className="grid gap-5 border-t pt-6 sm:grid-cols-2">
          <LongText
            title="Typical deliverables"
            value={revision.deliverables}
          />
          <LongText
            title="Quality assurance"
            value={revision.qualityAssurance}
          />
          {revision.complianceNotes && (
            <div className="sm:col-span-2">
              <LongText
                title="Compliance and privacy"
                value={revision.complianceNotes}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function SubmissionReadiness({
  hasCover,
  offlineContractDone,
  onUpload,
}: {
  hasCover: boolean;
  offlineContractDone: boolean | null;
  onUpload: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="size-5 text-primary" /> Submission readiness
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <ChecklistItem complete>
          Required service details complete
        </ChecklistItem>
        <ChecklistItem complete={hasCover}>Cover image added</ChecklistItem>
        <ChecklistItem
          complete={offlineContractDone === true}
          pending={offlineContractDone === null}
        >
          Offline supplier contract completed
        </ChecklistItem>
        {!hasCover && (
          <Button
            variant="outline"
            size="compact"
            className="mt-2 w-full"
            onClick={onUpload}
          >
            <ImagePlus /> Add cover image
          </Button>
        )}
        {offlineContractDone === false && (
          <p className="rounded-lg bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-800 dark:text-amber-200">
            You can keep editing this draft, but submission stays locked until
            Kuinbee records your offline supplier contract as complete. Check
            the{" "}
            <Link href="/dashboard/profile" className="font-semibold underline">
              Profile page
            </Link>{" "}
            for its status.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function RevisionSummary({ revision }: { revision: CustomCollectionRevision }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock3 className="size-5 text-primary" /> Revision details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <SummaryRow label="Version" value={`v${revision.version}`} />
        <SummaryRow
          label="Turnaround"
          value={`${revision.estimatedTurnaroundMinDays}–${revision.estimatedTurnaroundMaxDays} days`}
        />
        <SummaryRow label="Created" value={formatDate(revision.createdAt)} />
        <SummaryRow
          label="Submitted"
          value={formatDate(revision.submittedAt)}
        />
        <SummaryRow
          label="Published"
          value={formatDate(revision.publishedAt)}
        />
        {revision.reviewedBy && (
          <SummaryRow
            label="Reviewer"
            value={revision.reviewedBy.displayName}
          />
        )}
      </CardContent>
    </Card>
  );
}

function VisibilitySummary({ service }: { service: CustomCollectionService }) {
  const status = service.archivedAt
    ? "Archived"
    : service.isPublished
      ? "Public"
      : "Private";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {service.isPublished && !service.archivedAt ? (
            <Globe2 className="size-5 text-[var(--semantic-success)]" />
          ) : (
            <EyeOff className="size-5 text-primary" />
          )}
          Marketplace visibility
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <SummaryRow label="Status" value={status} />
        <SummaryRow
          label="Last published"
          value={formatDate(service.publishedAt)}
        />
        {service.unpublishedAt && (
          <SummaryRow
            label="Last unpublished"
            value={formatDate(service.unpublishedAt)}
          />
        )}
      </CardContent>
    </Card>
  );
}

function ReviewTimeline({
  history,
  selectedRevisionId,
}: {
  history: CustomCollectionReviewEvent[];
  selectedRevisionId: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="size-5 text-primary" /> Review history
        </CardTitle>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No review activity yet.
          </p>
        ) : (
          <ol className="space-y-0">
            {[...history].reverse().map((event, index, events) => {
              const selected = event.revisionId === selectedRevisionId;
              return (
                <li
                  key={event.id}
                  className="relative flex gap-3 pb-5 last:pb-0"
                >
                  {index < events.length - 1 && (
                    <span className="absolute left-[7px] top-4 h-full w-px bg-border" />
                  )}
                  <span
                    className={cn(
                      "relative mt-1.5 size-4 shrink-0 rounded-full border-4",
                      selected
                        ? "border-primary bg-input-background"
                        : "border-border bg-input-background"
                    )}
                  />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium">
                        {eventLabel(event.action)}
                      </p>
                      <span className="text-[11px] text-muted-foreground">
                        v{event.revisionVersion}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatDate(event.createdAt)} · {event.actorNameSnapshot}
                    </p>
                    {event.note && (
                      <p className="mt-2 whitespace-pre-wrap rounded-lg border border-border bg-muted/35 p-2.5 text-xs leading-relaxed">
                        {event.note}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

function RevisionTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors sm:flex-none sm:text-sm",
        active
          ? "dashboard-glass-control border-border text-foreground shadow-sm"
          : "text-muted-foreground"
      )}
    >
      {children}
    </button>
  );
}

function ChecklistItem({
  complete,
  pending = false,
  children,
}: {
  complete: boolean;
  pending?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2 text-sm">
      {pending ? (
        <Loader2 className="mt-0.5 size-4 shrink-0 animate-spin text-muted-foreground" />
      ) : complete ? (
        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[var(--semantic-success)]" />
      ) : (
        <XCircle className="mt-0.5 size-4 shrink-0 text-[var(--semantic-warning)]" />
      )}
      <span className={complete ? "text-foreground" : "text-muted-foreground"}>
        {children}
      </span>
    </div>
  );
}

function InfoGroup({ title, values }: { title: string; values: string[] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold">{title}</h3>
      {values.length ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {values.map((value) => (
            <span
              key={value}
              className="rounded-full border border-border bg-muted/45 px-2.5 py-1 text-xs"
            >
              {value}
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-1 text-sm text-muted-foreground">None selected</p>
      )}
    </div>
  );
}

function LongText({ title, value }: { title: string; value: string }) {
  return (
    <div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
        {value}
      </p>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b pb-3 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <DashboardPage width="wide">
      <DashboardPageHeader
        title="Custom collection service"
        description="Loading the service workspace and its latest revision."
      />
      <DashboardLoadingState
        label="Loading custom collection service"
        variant="skeleton"
        rows={8}
      />
    </DashboardPage>
  );
}

const withOther = (
  values: string[],
  other: string | null,
  options: Array<{ value: string; label: string }>
) =>
  values.map((value) =>
    value === "OTHER" && other ? other : labelForOption(value, options)
  );

const eventLabel = (action: string) =>
  ({
    CREATED: "Draft created",
    SUBMITTED: "Submitted for review",
    RESUBMITTED: "Resubmitted for review",
    PICKED: "Review started",
    REQUESTED_CHANGES: "Changes requested",
    APPROVED: "Approved and published",
    REJECTED: "Revision rejected",
  })[action] ?? action.replaceAll("_", " ");
