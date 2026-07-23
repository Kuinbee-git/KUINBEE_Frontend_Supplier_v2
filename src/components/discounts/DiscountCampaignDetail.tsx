"use client";

import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
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

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getDatasetThemeTokens } from "@/constants/dataset.constants";
import {
  cancelDatasetDiscountProposal,
  createDatasetDiscountProposal,
  listDatasetDiscountProposals,
  listMyDatasets,
} from "@/lib/api";
import type {
  CreateDiscountProposalRequest,
  DatasetDiscountProposal,
  DiscountType,
} from "@/types/discount.types";
import {
  calculatePreview,
  createDemoDiscountProposal,
  demoProposalMap,
  formatMoney,
  getDemoDatasets,
  getEligibleDataset,
  isDemoDataset,
  statusColors,
  statusLabel,
  toInputDateTime,
  toIsoFromInput,
  type EligibleDiscountDataset,
} from "./discountCampaignUtils";
import { DiscountPagination } from "./DiscountPagination";
import { DiscountDateTimePicker } from "./DiscountDateTimePicker";

interface DiscountCampaignDetailProps {
  datasetId: string;
  isDark?: boolean;
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
  isDark = false,
}: DiscountCampaignDetailProps) {
  const router = useRouter();
  const tokens = getDatasetThemeTokens(isDark);
  const [dataset, setDataset] = useState<EligibleDiscountDataset | null>(null);
  const [proposals, setProposals] = useState<DatasetDiscountProposal[]>([]);
  const [proposalTotal, setProposalTotal] = useState(0);
  const [proposalPage, setProposalPage] = useState(1);
  const [blockingProposal, setBlockingProposal] =
    useState<DatasetDiscountProposal | null>(null);
  const [loading, setLoading] = useState(true);
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

  const loadDetail = async () => {
    setLoading(true);
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

      const displayDatasets = [
        ...getDemoDatasets(),
        ...realDatasets.filter((item) => !isDemoDataset(item.id)),
      ];
      const selected =
        displayDatasets.find((item) => item.id === datasetId) ?? null;
      setDataset(selected);

      if (!selected) {
        setProposals([]);
        setProposalTotal(0);
        setBlockingProposal(null);
        return;
      }

      if (isDemoDataset(selected.id)) {
        const demoProposals = demoProposalMap[selected.id] ?? [];
        setProposals(demoProposals);
        setProposalTotal(demoProposals.length);
        setBlockingProposal(
          demoProposals.find((proposal) => isBlockingStatus(proposal.status)) ??
            null
        );
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
    } catch (error: any) {
      toast.error(error?.message || "Failed to load discount campaign");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetail();
  }, [datasetId, proposalPage]);

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
  const historyTotal =
    dataset?.id && isDemoDataset(dataset.id) ? proposals.length : proposalTotal;
  const historyRows =
    dataset?.id && isDemoDataset(dataset.id)
      ? proposals.slice(
          (proposalPage - 1) * HISTORY_PAGE_SIZE,
          proposalPage * HISTORY_PAGE_SIZE
        )
      : proposals;

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
      if (isDemoDataset(dataset.id)) {
        const demoProposal = createDemoDiscountProposal(dataset, payload);
        setProposals((current) => [demoProposal, ...current]);
        setProposalTotal((current) => current + 1);
        setBlockingProposal(demoProposal);
        setProposalPage(1);
        toast.success("Demo discount proposal submitted");
      } else {
        await createDatasetDiscountProposal(dataset.id, payload);
        if (proposalPage === 1) {
          await loadDetail();
        } else {
          setProposalPage(1);
        }
        toast.success("Discount proposal submitted for admin review");
      }

      setForm({
        discountType: "PERCENTAGE",
        discountValue: "",
        startsAt: defaultStartsAt,
        endsAt: defaultEndsAt,
        supplierNotes: "",
      });
    } catch (error: any) {
      toast.error(error?.message || "Failed to submit discount proposal");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (proposal: DatasetDiscountProposal) => {
    if (!dataset) return;

    setCancellingId(proposal.id);
    try {
      if (isDemoDataset(dataset.id)) {
        const now = new Date().toISOString();
        setProposals((current) =>
          current.map((item) =>
            item.id === proposal.id
              ? { ...item, status: "CANCELLED", updatedAt: now }
              : item
          )
        );
        setBlockingProposal((current) =>
          current?.id === proposal.id
            ? { ...current, status: "CANCELLED", updatedAt: now }
            : current
        );
        toast.success("Demo campaign cancelled");
      } else {
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
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to cancel campaign");
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-[1400px] mx-auto p-8">
        <div className="flex items-center justify-center py-24">
          <Loader2
            className="w-10 h-10 animate-spin"
            style={{ color: tokens.textPrimary }}
          />
        </div>
      </div>
    );
  }

  if (!dataset) {
    return (
      <div className="max-w-[1100px] mx-auto p-8">
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard/discount-campaigns")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <Card
          className="p-12 text-center"
          style={{
            background: tokens.surfaceCard,
            borderColor: tokens.borderDefault,
          }}
        >
          <BadgePercent
            className="w-16 h-16 mx-auto mb-4"
            style={{ color: tokens.textMuted }}
          />
          <h1
            className="text-2xl font-semibold mb-2"
            style={{ color: tokens.textPrimary }}
          >
            Dataset not eligible
          </h1>
          <p style={{ color: tokens.textSecondary }}>
            Only published public datasets with active paid pricing or sample
            actual pricing can run discount campaigns.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto p-8">
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard/discount-campaigns")}
          className="mb-5"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to campaigns
        </Button>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1
                className="text-3xl font-semibold"
                style={{ color: tokens.textPrimary }}
              >
                Create Discount Campaign
              </h1>
              {isDemoDataset(dataset.id) && (
                <span className="rounded px-2 py-1 text-xs font-semibold bg-blue-500/10 text-blue-600">
                  Demo
                </span>
              )}
            </div>
            <p className="mt-2" style={{ color: tokens.textSecondary }}>
              {dataset.title}
            </p>
          </div>
          <Button onClick={loadDetail} variant="outline">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,0.95fr)_minmax(420px,1.05fr)] gap-6">
        <div className="space-y-6">
          <Card
            className="p-6"
            style={{
              background: tokens.surfaceCard,
              borderColor: tokens.borderDefault,
            }}
          >
            <div className="flex items-start gap-3">
              <Database
                className="w-5 h-5 mt-1"
                style={{ color: tokens.textMuted }}
              />
              <div className="min-w-0">
                <h2
                  className="text-xl font-semibold"
                  style={{ color: tokens.textPrimary }}
                >
                  {dataset.title}
                </h2>
                <p
                  className="mt-1 font-mono text-xs"
                  style={{ color: tokens.textMuted }}
                >
                  {dataset.datasetUniqueId}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              <SummaryTile
                label="Dataset Status"
                value={dataset.status}
                tokens={tokens}
              />
              <SummaryTile
                label="Visibility"
                value={dataset.visibility}
                tokens={tokens}
              />
              <SummaryTile
                label="Price Surface"
                value={dataset.surfaceLabel}
                tokens={tokens}
              />
              <SummaryTile
                label="Base Price"
                value={formatMoney(dataset.baseAmount, dataset.currency)}
                tokens={tokens}
              />
            </div>

            {dataset.isSample && (
              <div
                className="mt-5 rounded-md border p-4 text-sm"
                style={{
                  borderColor: tokens.borderDefault,
                  color: tokens.textSecondary,
                  background: isDark
                    ? "rgba(124, 58, 237, 0.1)"
                    : "rgba(124, 58, 237, 0.06)",
                }}
              >
                This is a sample listing. The discount applies to the full
                dataset commercial price, while sample access remains free.
              </div>
            )}
          </Card>

          <Card
            className="p-6"
            style={{
              background: tokens.surfaceCard,
              borderColor: tokens.borderDefault,
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <CalendarClock
                className="w-5 h-5"
                style={{ color: tokens.textMuted }}
              />
              <h2
                className="text-xl font-semibold"
                style={{ color: tokens.textPrimary }}
              >
                Campaign Status
              </h2>
            </div>

            {activeProposal ? (
              <div>
                <span
                  className="inline-flex rounded px-2 py-1 text-xs font-semibold"
                  style={{
                    background: `${statusColors[activeProposal.status] ?? "#64748b"}18`,
                    color: statusColors[activeProposal.status] ?? "#64748b",
                  }}
                >
                  {statusLabel(activeProposal.status)}
                </span>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <SummaryTile
                    label="Discount"
                    value={`${activeProposal.discountType === "PERCENTAGE" ? `${activeProposal.discountValue}%` : formatMoney(activeProposal.discountValue, activeProposal.currencySnapshot)}`}
                    tokens={tokens}
                  />
                  <SummaryTile
                    label="Final Price"
                    value={formatMoney(
                      activeProposal.finalPriceSnapshot,
                      activeProposal.currencySnapshot
                    )}
                    tokens={tokens}
                  />
                  <SummaryTile
                    label="Starts"
                    value={formatDateTime(activeProposal.startsAt)}
                    tokens={tokens}
                  />
                  <SummaryTile
                    label="Ends"
                    value={formatDateTime(activeProposal.endsAt)}
                    tokens={tokens}
                  />
                </div>
              </div>
            ) : (
              <p className="text-sm" style={{ color: tokens.textSecondary }}>
                No active or pending campaign exists for this dataset.
              </p>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card
            className="p-6"
            style={{
              background: tokens.surfaceCard,
              borderColor: tokens.borderDefault,
            }}
          >
            <div className="flex items-center gap-2 mb-5">
              <BadgePercent
                className="w-5 h-5"
                style={{ color: tokens.textMuted }}
              />
              <h2
                className="text-xl font-semibold"
                style={{ color: tokens.textPrimary }}
              >
                Proposal Details
              </h2>
            </div>

            {formDisabled && (
              <div
                className="mb-5 rounded-md border p-4 text-sm"
                style={{
                  borderColor: tokens.borderDefault,
                  color: tokens.textSecondary,
                  background: tokens.dropzoneBg,
                }}
              >
                A campaign is already pending or active. Cancel it before
                submitting another proposal.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Discount Type" tokens={tokens}>
                  <div
                    className="grid grid-cols-2 gap-1 rounded-md border p-1 backdrop-blur-xl"
                    style={{
                      background: isDark
                        ? "rgba(255, 255, 255, 0.06)"
                        : "rgba(255, 255, 255, 0.76)",
                      borderColor: isDark
                        ? "rgba(255, 255, 255, 0.12)"
                        : "rgba(26, 34, 64, 0.1)",
                    }}
                  >
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
                          className="h-9 rounded text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                          style={{
                            background: active
                              ? isDark
                                ? "rgba(255, 255, 255, 0.14)"
                                : "rgba(26, 34, 64, 0.08)"
                              : isDark
                                ? "rgba(255, 255, 255, 0.04)"
                                : "rgba(255, 255, 255, 0.45)",
                            color: active
                              ? tokens.textPrimary
                              : tokens.textSecondary,
                            border: `1px solid ${
                              active
                                ? isDark
                                  ? "rgba(255, 255, 255, 0.24)"
                                  : "rgba(26, 34, 64, 0.18)"
                                : "transparent"
                            }`,
                          }}
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
                  tokens={tokens}
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
                    style={{
                      background: isDark
                        ? "rgba(255, 255, 255, 0.06)"
                        : "rgba(255, 255, 255, 0.76)",
                      borderColor: tokens.borderDefault,
                      color: tokens.textPrimary,
                      backdropFilter: "blur(16px)",
                    }}
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Starts At" tokens={tokens}>
                  <DiscountDateTimePicker
                    value={form.startsAt}
                    onChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        startsAt: value,
                      }))
                    }
                    disabled={formDisabled}
                    tokens={tokens}
                    isDark={isDark}
                  />
                </FormField>

                <FormField label="Ends At" tokens={tokens}>
                  <DiscountDateTimePicker
                    value={form.endsAt}
                    onChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        endsAt: value,
                      }))
                    }
                    disabled={formDisabled}
                    tokens={tokens}
                    isDark={isDark}
                  />
                </FormField>
              </div>

              <FormField label="Supplier Notes" tokens={tokens}>
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
                  style={{
                    background: isDark
                      ? "rgba(255, 255, 255, 0.06)"
                      : "rgba(255, 255, 255, 0.76)",
                    borderColor: tokens.borderDefault,
                    color: tokens.textPrimary,
                    backdropFilter: "blur(16px)",
                  }}
                />
              </FormField>

              <div
                className="rounded-md border p-4"
                style={{
                  borderColor: tokens.borderDefault,
                  background: tokens.dropzoneBg,
                }}
              >
                <p
                  className="text-xs font-semibold uppercase"
                  style={{ color: tokens.textMuted }}
                >
                  Price Preview
                </p>
                <div className="mt-3 flex flex-wrap items-baseline gap-3">
                  <span
                    className="text-sm line-through"
                    style={{ color: tokens.textMuted }}
                  >
                    {formatMoney(dataset.baseAmount, dataset.currency)}
                  </span>
                  <span
                    className="text-2xl font-semibold"
                    style={{ color: tokens.textPrimary }}
                  >
                    {preview
                      ? formatMoney(preview.final, dataset.currency)
                      : "Enter discount"}
                  </span>
                </div>
                {preview && (
                  <p
                    className="mt-2 text-sm"
                    style={{ color: tokens.textSecondary }}
                  >
                    Customer saves{" "}
                    {formatMoney(preview.amountOff, dataset.currency)}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={submitting || formDisabled}
                className="h-11 w-full border font-semibold shadow-sm backdrop-blur-xl transition-all hover:shadow-md"
                style={{
                  background:
                    submitting || formDisabled
                      ? isDark
                        ? "rgba(148, 163, 184, 0.16)"
                        : "rgba(148, 163, 184, 0.22)"
                      : isDark
                        ? "rgba(255, 255, 255, 0.10)"
                        : "rgba(255, 255, 255, 0.78)",
                  borderColor:
                    submitting || formDisabled
                      ? tokens.borderDefault
                      : isDark
                        ? "rgba(255, 255, 255, 0.18)"
                        : "rgba(26, 34, 64, 0.12)",
                  color:
                    submitting || formDisabled
                      ? tokens.textMuted
                      : tokens.textPrimary,
                }}
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Submit for Admin Review
              </Button>
            </form>
          </Card>

          <Card
            className="p-6"
            style={{
              background: tokens.surfaceCard,
              borderColor: tokens.borderDefault,
            }}
          >
            <div className="flex items-center gap-2 mb-5">
              <History
                className="w-5 h-5"
                style={{ color: tokens.textMuted }}
              />
              <h2
                className="text-xl font-semibold"
                style={{ color: tokens.textPrimary }}
              >
                Campaign History
              </h2>
            </div>

            {historyTotal === 0 ? (
              <p className="text-sm" style={{ color: tokens.textSecondary }}>
                No discount proposals have been created for this dataset yet.
              </p>
            ) : (
              <div className="space-y-4">
                {historyRows.map((proposal) => (
                  <div
                    key={proposal.id}
                    className="rounded-md border p-4"
                    style={{ borderColor: tokens.borderDefault }}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <span
                          className="inline-flex rounded px-2 py-1 text-xs font-semibold"
                          style={{
                            background: `${statusColors[proposal.status] ?? "#64748b"}18`,
                            color: statusColors[proposal.status] ?? "#64748b",
                          }}
                        >
                          {statusLabel(proposal.status)}
                        </span>
                        <p
                          className="mt-3 text-sm font-semibold"
                          style={{ color: tokens.textPrimary }}
                        >
                          {proposal.discountType === "PERCENTAGE"
                            ? `${proposal.discountValue}% off`
                            : `${formatMoney(proposal.discountValue, proposal.currencySnapshot)} off`}
                        </p>
                        <p
                          className="mt-1 text-sm"
                          style={{ color: tokens.textSecondary }}
                        >
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
                          size="sm"
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
                        tokens={tokens}
                      />
                      <DetailLine
                        label="Ends"
                        value={formatDateTime(proposal.endsAt)}
                        tokens={tokens}
                      />
                      <DetailLine
                        label="Submitted"
                        value={
                          proposal.submittedAt
                            ? formatDateTime(proposal.submittedAt)
                            : "-"
                        }
                        tokens={tokens}
                      />
                      <DetailLine
                        label="Reviewed"
                        value={
                          proposal.reviewedAt
                            ? formatDateTime(proposal.reviewedAt)
                            : "-"
                        }
                        tokens={tokens}
                      />
                    </div>

                    {proposal.supplierNotes && (
                      <NoteBlock
                        label="Supplier Notes"
                        value={proposal.supplierNotes}
                        tokens={tokens}
                      />
                    )}
                    {proposal.adminNotes && (
                      <NoteBlock
                        label="Admin Notes"
                        value={proposal.adminNotes}
                        tokens={tokens}
                      />
                    )}
                    {proposal.rejectionReason && (
                      <NoteBlock
                        label="Rejection Reason"
                        value={proposal.rejectionReason}
                        tokens={tokens}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            <DiscountPagination
              page={proposalPage}
              pageSize={HISTORY_PAGE_SIZE}
              total={historyTotal}
              itemLabel="proposals"
              tokens={tokens}
              onPageChange={setProposalPage}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}

function FormField({
  label,
  children,
  tokens,
}: {
  label: string;
  children: ReactNode;
  tokens: ReturnType<typeof getDatasetThemeTokens>;
}) {
  return (
    <label className="block">
      <span
        className="mb-2 block text-sm font-medium"
        style={{ color: tokens.textSecondary }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

function SummaryTile({
  label,
  value,
  tokens,
}: {
  label: string;
  value: string;
  tokens: ReturnType<typeof getDatasetThemeTokens>;
}) {
  return (
    <div
      className="rounded-md border p-4"
      style={{
        borderColor: tokens.borderDefault,
        background: tokens.dropzoneBg,
      }}
    >
      <p
        className="text-xs font-semibold uppercase"
        style={{ color: tokens.textMuted }}
      >
        {label}
      </p>
      <p
        className="mt-2 text-sm font-semibold"
        style={{ color: tokens.textPrimary }}
      >
        {value}
      </p>
    </div>
  );
}

function DetailLine({
  label,
  value,
  tokens,
}: {
  label: string;
  value: string;
  tokens: ReturnType<typeof getDatasetThemeTokens>;
}) {
  return (
    <div>
      <p
        className="text-xs font-semibold uppercase"
        style={{ color: tokens.textMuted }}
      >
        {label}
      </p>
      <p className="mt-1" style={{ color: tokens.textSecondary }}>
        {value}
      </p>
    </div>
  );
}

function NoteBlock({
  label,
  value,
  tokens,
}: {
  label: string;
  value: string;
  tokens: ReturnType<typeof getDatasetThemeTokens>;
}) {
  return (
    <div className="mt-4">
      <p
        className="text-xs font-semibold uppercase"
        style={{ color: tokens.textMuted }}
      >
        {label}
      </p>
      <p className="mt-1 text-sm" style={{ color: tokens.textSecondary }}>
        {value}
      </p>
    </div>
  );
}
