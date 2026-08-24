"use client";

import {
  FormEvent,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BadgePercent,
  CalendarClock,
  Database,
  History,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

import {
  DashboardButton as Button,
  DashboardCard as Card,
  DashboardEmptyState,
  DashboardErrorState,
  DashboardInlineAlert,
  DashboardInput as Input,
  DashboardLoadingState,
  DashboardPage,
  DashboardPageHeader,
  DashboardPagination,
  DashboardStatusBadge,
  DashboardTextarea as Textarea,
  type DashboardTone,
} from "@/components/dashboard";
import {
  cancelDatasetDiscountProposal,
  createDatasetDiscountProposal,
  listDatasetDiscountProposals,
  listMyDatasets,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import type {
  CreateDiscountProposalRequest,
  DatasetDiscountProposal,
  DiscountType,
} from "@/types/discount.types";
import {
  calculatePreview,
  formatMoney,
  getEligibleDataset,
  statusLabel,
  toInputDateTime,
  toIsoFromInput,
  type EligibleDiscountDataset,
} from "./discountCampaignUtils";
import { DiscountDateTimePicker } from "./DiscountDateTimePicker";

interface DiscountCampaignDetailProps {
  datasetId: string;
}

type CampaignFormState = {
  discountType: DiscountType;
  discountValue: string;
  startsAt: string;
  endsAt: string;
  supplierNotes: string;
};

const cancellableStatuses = ["SUBMITTED", "UNDER_REVIEW", "APPROVED", "ACTIVE"];
const blockingStatuses = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "APPROVED",
  "ACTIVE",
] as const;
const DATASET_FETCH_PAGE_SIZE = 100;
const HISTORY_PAGE_SIZE = 10;

const STATUS_TONES: Record<string, DashboardTone> = {
  SUBMITTED: "info",
  UNDER_REVIEW: "warning",
  APPROVED: "success",
  ACTIVE: "success",
  REJECTED: "danger",
  CANCELLED: "neutral",
  EXPIRED: "warning",
  DRAFT: "neutral",
};

const isBlockingStatus = (
  status: DatasetDiscountProposal["status"]
): status is (typeof blockingStatuses)[number] =>
  blockingStatuses.includes(status as (typeof blockingStatuses)[number]);

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

export function DiscountCampaignDetail({
  datasetId,
}: DiscountCampaignDetailProps) {
  const router = useRouter();
  const [dataset, setDataset] = useState<EligibleDiscountDataset | null>(null);
  const [proposals, setProposals] = useState<DatasetDiscountProposal[]>([]);
  const [proposalTotal, setProposalTotal] = useState(0);
  const [proposalPage, setProposalPage] = useState(1);
  const [blockingProposal, setBlockingProposal] =
    useState<DatasetDiscountProposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const defaultStartsAt = useMemo(() => {
    const start = new Date();
    start.setHours(start.getHours() + 1);
    return toInputDateTime(start);
  }, []);

  const defaultEndsAt = useMemo(() => {
    const end = new Date();
    end.setDate(end.getDate() + 14);
    return toInputDateTime(end);
  }, []);

  const [form, setForm] = useState<CampaignFormState>({
    discountType: "PERCENTAGE",
    discountValue: "",
    startsAt: defaultStartsAt,
    endsAt: defaultEndsAt,
    supplierNotes: "",
  });

  const loadDetail = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const realDatasets: EligibleDiscountDataset[] = [];
      let datasetPage = 1;
      let fetched = 0;
      let total = 0;

      do {
        const data = await listMyDatasets({
          status: "PUBLISHED",
          visibility: "PUBLIC",
          page: datasetPage,
          pageSize: DATASET_FETCH_PAGE_SIZE,
        });
        fetched += data.items.length;
        total = data.total;
        realDatasets.push(
          ...data.items
            .map(getEligibleDataset)
            .filter((item): item is EligibleDiscountDataset => Boolean(item))
        );
        if (data.items.length === 0) break;
        datasetPage += 1;
      } while (fetched < total);

      const selected =
        realDatasets.find((item) => item.id === datasetId) ?? null;
      setDataset(selected);

      if (!selected) {
        setProposals([]);
        setProposalTotal(0);
        setBlockingProposal(null);
        return;
      }

      const [proposalData, ...blockingData] = await Promise.all([
        listDatasetDiscountProposals(selected.id, {
          page: proposalPage,
          pageSize: HISTORY_PAGE_SIZE,
        }),
        ...blockingStatuses.map((status) =>
          listDatasetDiscountProposals(selected.id, {
            status,
            page: 1,
            pageSize: 1,
          })
        ),
      ]);
      setProposals(proposalData.items);
      setProposalTotal(proposalData.total);
      setBlockingProposal(
        blockingData.flatMap((response) => response.items)[0] ?? null
      );
    } catch (error: unknown) {
      setLoadError(
        error instanceof Error
          ? error.message
          : "The dataset promotion could not be loaded."
      );
    } finally {
      setLoading(false);
    }
  }, [datasetId, proposalPage]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  useEffect(() => {
    setProposalPage(1);
  }, [datasetId]);

  const activeProposal = useMemo(
    () =>
      blockingProposal ??
      proposals.find((proposal) => isBlockingStatus(proposal.status)) ??
      null,
    [blockingProposal, proposals]
  );

  const preview = dataset
    ? calculatePreview({
        baseAmount: dataset.baseAmount,
        discountType: form.discountType,
        discountValue: form.discountValue,
      })
    : null;

  const formDisabled = Boolean(activeProposal);
  const historyTotal = proposalTotal;
  const historyRows = proposals;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!dataset) return;

    const starts = new Date(form.startsAt);
    const ends = new Date(form.endsAt);

    if (!preview) {
      toast.error(
        "Enter a discount that lowers the price but keeps it above zero"
      );
      return;
    }
    if (!form.startsAt || !form.endsAt || starts >= ends) {
      toast.error("Choose a valid campaign start and end date");
      return;
    }

    const payload: CreateDiscountProposalRequest = {
      targetSurface: dataset.priceSurface,
      discountType: form.discountType,
      discountValue: form.discountValue,
      startsAt: toIsoFromInput(form.startsAt),
      endsAt: toIsoFromInput(form.endsAt),
      supplierNotes: form.supplierNotes.trim() || undefined,
    };

    setSubmitting(true);
    try {
      await createDatasetDiscountProposal(dataset.id, payload);
      if (proposalPage === 1) {
        await loadDetail();
      } else {
        setProposalPage(1);
      }
      toast.success("Discount proposal submitted for admin review");

      setForm({
        discountType: "PERCENTAGE",
        discountValue: "",
        startsAt: defaultStartsAt,
        endsAt: defaultEndsAt,
        supplierNotes: "",
      });
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to submit discount proposal"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (proposal: DatasetDiscountProposal) => {
    if (!dataset) return;

    setCancellingId(proposal.id);
    try {
      const response = await cancelDatasetDiscountProposal(
        dataset.id,
        proposal.id
      );
      setProposals((current) =>
        current.map((item) =>
          item.id === proposal.id ? response.discountProposal : item
        )
      );
      setBlockingProposal((current) =>
        current?.id === proposal.id ? response.discountProposal : current
      );
      toast.success("Discount campaign cancelled");
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Failed to cancel campaign"
      );
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) {
    return (
      <DashboardPage width="wide">
        <DashboardPageHeader
          title="Dataset promotion"
          description="Loading promotion eligibility, pricing, and campaign history."
        />
        <DashboardLoadingState
          label="Loading dataset promotion"
          variant="skeleton"
          rows={7}
        />
      </DashboardPage>
    );
  }

  if (loadError) {
    return (
      <DashboardPage width="standard">
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard/discount-campaigns")}
          className="self-start"
        >
          <ArrowLeft aria-hidden="true" /> Back to promotions
        </Button>
        <DashboardPageHeader
          title="Dataset promotion"
          description="Create and manage a promotion for this dataset."
        />
        <DashboardErrorState
          title="Dataset promotion could not be loaded"
          message={loadError}
          onRetry={() => void loadDetail()}
        />
      </DashboardPage>
    );
  }

  if (!dataset) {
    return (
      <DashboardPage width="standard">
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard/discount-campaigns")}
          className="self-start"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <DashboardPageHeader
          title="Dataset promotion"
          description="Create and manage a promotion for this dataset."
        />
        <DashboardEmptyState
          icon={BadgePercent}
          title="Dataset not eligible"
          description="Only published public datasets with active paid pricing or sample commercial pricing can run promotions."
        />
      </DashboardPage>
    );
  }

  return (
    <DashboardPage width="wide">
      <div>
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard/discount-campaigns")}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to campaigns
        </Button>

        <DashboardPageHeader
          title="Create dataset promotion"
          description={dataset.title}
          actions={
            <Button onClick={() => void loadDetail()} variant="outline">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          }
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,0.95fr)_minmax(420px,1.05fr)] gap-6">
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-start gap-3">
              <Database className="mt-1 size-5 text-muted-foreground" />
              <div className="min-w-0">
                <h2 className="text-xl font-semibold text-foreground">
                  {dataset.title}
                </h2>
                <p className="mt-1 font-mono text-xs text-muted-foreground">
                  {dataset.datasetUniqueId}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              <SummaryTile label="Dataset Status" value={dataset.status} />
              <SummaryTile label="Visibility" value={dataset.visibility} />
              <SummaryTile label="Price Surface" value={dataset.surfaceLabel} />
              <SummaryTile
                label="Base Price"
                value={formatMoney(dataset.baseAmount, dataset.currency)}
              />
            </div>

            {dataset.isSample && (
              <DashboardInlineAlert tone="info" className="mt-5">
                This is a sample listing. The discount applies to the full
                dataset commercial price, while sample access remains free.
              </DashboardInlineAlert>
            )}
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <CalendarClock className="size-5 text-muted-foreground" />
              <h2 className="text-xl font-semibold text-foreground">
                Campaign Status
              </h2>
            </div>

            {activeProposal ? (
              <div>
                <DashboardStatusBadge
                  status={activeProposal.status}
                  tone={STATUS_TONES[activeProposal.status] ?? "neutral"}
                >
                  {statusLabel(activeProposal.status)}
                </DashboardStatusBadge>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <SummaryTile
                    label="Discount"
                    value={`${activeProposal.discountType === "PERCENTAGE" ? `${activeProposal.discountValue}%` : formatMoney(activeProposal.discountValue, activeProposal.currencySnapshot)}`}
                  />
                  <SummaryTile
                    label="Final Price"
                    value={formatMoney(
                      activeProposal.finalPriceSnapshot,
                      activeProposal.currencySnapshot
                    )}
                  />
                  <SummaryTile
                    label="Starts"
                    value={formatDateTime(activeProposal.startsAt)}
                  />
                  <SummaryTile
                    label="Ends"
                    value={formatDateTime(activeProposal.endsAt)}
                  />
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No active or pending campaign exists for this dataset.
              </p>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-5">
              <BadgePercent className="size-5 text-muted-foreground" />
              <h2 className="text-xl font-semibold text-foreground">
                Proposal Details
              </h2>
            </div>

            {formDisabled && (
              <DashboardInlineAlert tone="warning" className="mb-5">
                A campaign is already pending or active. Cancel it before
                submitting another proposal.
              </DashboardInlineAlert>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Discount type">
                  <div className="dashboard-glass-control grid grid-cols-2 gap-1 rounded-lg border border-[var(--dashboard-control-border)] p-1">
                    {[
                      ["PERCENTAGE", "Percentage"],
                      ["FIXED_AMOUNT", "Fixed amount"],
                    ].map(([value, label]) => {
                      const active = form.discountType === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          disabled={formDisabled}
                          onClick={() =>
                            setForm((current) => ({
                              ...current,
                              discountType: value as DiscountType,
                            }))
                          }
                          className={cn(
                            "h-9 rounded-md border text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                            active
                              ? "border-[var(--dashboard-control-border-strong)] bg-muted text-foreground shadow-sm"
                              : "border-transparent text-muted-foreground hover:bg-muted/55 hover:text-foreground"
                          )}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </FormField>

                <FormField
                  label={
                    form.discountType === "PERCENTAGE"
                      ? "Discount Percentage"
                      : "Discount Amount"
                  }
                >
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    value={form.discountValue}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        discountValue: event.target.value,
                      }))
                    }
                    disabled={formDisabled}
                    placeholder={
                      form.discountType === "PERCENTAGE" ? "20" : "5000"
                    }
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Starts at">
                  <DiscountDateTimePicker
                    value={form.startsAt}
                    onChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        startsAt: value,
                      }))
                    }
                    disabled={formDisabled}
                  />
                </FormField>

                <FormField label="Ends at">
                  <DiscountDateTimePicker
                    value={form.endsAt}
                    onChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        endsAt: value,
                      }))
                    }
                    disabled={formDisabled}
                  />
                </FormField>
              </div>

              <FormField label="Supplier notes">
                <Textarea
                  value={form.supplierNotes}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      supplierNotes: event.target.value,
                    }))
                  }
                  disabled={formDisabled}
                  placeholder="Add campaign context for admin review"
                />
              </FormField>

              <div className="rounded-lg border border-border bg-muted/35 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Price Preview
                </p>
                <div className="mt-3 flex flex-wrap items-baseline gap-3">
                  <span className="text-sm text-muted-foreground line-through">
                    {formatMoney(dataset.baseAmount, dataset.currency)}
                  </span>
                  <span className="text-2xl font-semibold text-foreground">
                    {preview
                      ? formatMoney(preview.final, dataset.currency)
                      : "Enter discount"}
                  </span>
                </div>
                {preview && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Customer saves{" "}
                    {formatMoney(preview.amountOff, dataset.currency)}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={submitting || formDisabled}
                className="w-full"
                size="large"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Submit for Admin Review
              </Button>
            </form>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2 mb-5">
              <History className="size-5 text-muted-foreground" />
              <h2 className="text-xl font-semibold text-foreground">
                Campaign History
              </h2>
            </div>

            {historyTotal === 0 ? (
              <p className="text-sm text-muted-foreground">
                No discount proposals have been created for this dataset yet.
              </p>
            ) : (
              <div className="space-y-4">
                {historyRows.map((proposal) => (
                  <div
                    key={proposal.id}
                    className="rounded-lg border border-border bg-muted/20 p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <DashboardStatusBadge
                          status={proposal.status}
                          tone={STATUS_TONES[proposal.status] ?? "neutral"}
                        >
                          {statusLabel(proposal.status)}
                        </DashboardStatusBadge>
                        <p className="mt-3 text-sm font-semibold text-foreground">
                          {proposal.discountType === "PERCENTAGE"
                            ? `${proposal.discountValue}% off`
                            : `${formatMoney(proposal.discountValue, proposal.currencySnapshot)} off`}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {formatMoney(
                            proposal.basePriceSnapshot,
                            proposal.currencySnapshot
                          )}{" "}
                          to{" "}
                          {formatMoney(
                            proposal.finalPriceSnapshot,
                            proposal.currencySnapshot
                          )}
                        </p>
                      </div>

                      {cancellableStatuses.includes(proposal.status) && (
                        <Button
                          type="button"
                          variant="outline"
                          size="compact"
                          onClick={() => handleCancel(proposal)}
                          disabled={cancellingId === proposal.id}
                        >
                          {cancellingId === proposal.id && (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          )}
                          Cancel
                        </Button>
                      )}
                    </div>

                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <DetailLine
                        label="Starts"
                        value={formatDateTime(proposal.startsAt)}
                      />
                      <DetailLine
                        label="Ends"
                        value={formatDateTime(proposal.endsAt)}
                      />
                      <DetailLine
                        label="Submitted"
                        value={
                          proposal.submittedAt
                            ? formatDateTime(proposal.submittedAt)
                            : "-"
                        }
                      />
                      <DetailLine
                        label="Reviewed"
                        value={
                          proposal.reviewedAt
                            ? formatDateTime(proposal.reviewedAt)
                            : "-"
                        }
                      />
                    </div>

                    {proposal.supplierNotes && (
                      <NoteBlock
                        label="Supplier Notes"
                        value={proposal.supplierNotes}
                      />
                    )}
                    {proposal.adminNotes && (
                      <NoteBlock
                        label="Admin Notes"
                        value={proposal.adminNotes}
                      />
                    )}
                    {proposal.rejectionReason && (
                      <NoteBlock
                        label="Rejection Reason"
                        value={proposal.rejectionReason}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            <DashboardPagination
              page={proposalPage}
              pageSize={HISTORY_PAGE_SIZE}
              totalItems={historyTotal}
              itemLabel="proposals"
              onPageChange={setProposalPage}
            />
          </Card>
        </div>
      </div>
    </DashboardPage>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/35 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-muted-foreground">{value}</p>
    </div>
  );
}

function NoteBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">{value}</p>
    </div>
  );
}
