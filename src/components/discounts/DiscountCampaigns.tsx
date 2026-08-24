"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BadgePercent,
  CircleDollarSign,
  Database,
  FlaskConical,
  Info,
  RefreshCw,
  Send,
  XCircle,
} from "lucide-react";

import {
  DashboardButton,
  DashboardDataTable,
  DashboardDialog,
  DashboardDialogContent,
  DashboardDialogTrigger,
  DashboardEmptyState,
  DashboardErrorState,
  DashboardLoadingState,
  DashboardMetricCard,
  DashboardMobileRecordCard,
  DashboardPage,
  DashboardPageHeader,
  DashboardPagination,
  DashboardSearchField,
  DashboardStatusBadge,
  DashboardToolbar,
  type DashboardTableColumn,
  type DashboardTone,
} from "@/components/dashboard";
import { listDatasetDiscountProposals, listMyDatasets } from "@/lib/api";
import type { DatasetDiscountProposal } from "@/types/discount.types";
import {
  formatMoney,
  getEligibleDataset,
  statusLabel,
  type EligibleDiscountDataset,
} from "./discountCampaignUtils";

type CampaignDatasetRow = EligibleDiscountDataset & {
  _index: number;
  activeProposal: DatasetDiscountProposal | null;
  proposalCount: number;
};

const DATASET_FETCH_PAGE_SIZE = 100;
const DATASET_TABLE_PAGE_SIZE = 10;

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

export function DiscountCampaigns() {
  const [datasets, setDatasets] = useState<EligibleDiscountDataset[]>([]);
  const [proposalMap, setProposalMap] = useState<
    Record<string, DatasetDiscountProposal[]>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const loadDatasets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const allItems: EligibleDiscountDataset[] = [];
      let page = 1;
      let fetched = 0;
      let total = 0;

      do {
        const data = await listMyDatasets({
          status: "PUBLISHED",
          visibility: "PUBLIC",
          page,
          pageSize: DATASET_FETCH_PAGE_SIZE,
        });
        fetched += data.items.length;
        total = data.total;
        allItems.push(
          ...data.items
            .map(getEligibleDataset)
            .filter((item): item is EligibleDiscountDataset => Boolean(item))
        );
        if (data.items.length === 0) break;
        page += 1;
      } while (fetched < total);

      setDatasets(allItems);

      const proposalEntries = await Promise.all(
        allItems.map(async (dataset) => {
          try {
            const proposals = await listDatasetDiscountProposals(dataset.id, {
              page: 1,
              pageSize: 20,
            });
            return [dataset.id, proposals.items] as const;
          } catch {
            return [dataset.id, []] as const;
          }
        })
      );
      setProposalMap(Object.fromEntries(proposalEntries));
    } catch (requestError: unknown) {
      setDatasets([]);
      setProposalMap({});
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Discount campaign datasets could not be loaded."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDatasets();
  }, [loadDatasets]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const rows = useMemo<CampaignDatasetRow[]>(() => {
    const query = searchQuery.trim().toLowerCase();
    return datasets
      .filter(
        (dataset) =>
          !query ||
          dataset.title.toLowerCase().includes(query) ||
          dataset.datasetUniqueId.toLowerCase().includes(query)
      )
      .map((dataset, index) => {
        const proposals = proposalMap[dataset.id] ?? [];
        return {
          ...dataset,
          _index: index,
          activeProposal:
            proposals.find((proposal) =>
              ["SUBMITTED", "UNDER_REVIEW", "APPROVED", "ACTIVE"].includes(
                proposal.status
              )
            ) ?? null,
          proposalCount: proposals.length,
        };
      });
  }, [datasets, proposalMap, searchQuery]);

  const totalPages = Math.max(
    1,
    Math.ceil(rows.length / DATASET_TABLE_PAGE_SIZE)
  );
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedRows = rows.slice(
    (safeCurrentPage - 1) * DATASET_TABLE_PAGE_SIZE,
    safeCurrentPage * DATASET_TABLE_PAGE_SIZE
  );

  const allProposals = Object.values(proposalMap).flat();
  const metrics = [
    {
      label: "Eligible datasets",
      value: datasets.length,
      supportingText: "Published public datasets",
      icon: Database,
    },
    {
      label: "Paid datasets",
      value: datasets.filter((item) => !item.isSample).length,
      supportingText: "Checkout-price campaigns",
      icon: CircleDollarSign,
    },
    {
      label: "Sample listings",
      value: datasets.filter((item) => item.isSample).length,
      supportingText: "Commercial-price campaigns",
      icon: FlaskConical,
    },
    {
      label: "Submitted",
      value: allProposals.filter((item) => item.status === "SUBMITTED").length,
      supportingText: "Awaiting review",
      icon: Send,
    },
    {
      label: "Active",
      value: allProposals.filter((item) => item.status === "ACTIVE").length,
      supportingText: "Live marketplace promotions",
      icon: BadgePercent,
    },
    {
      label: "Rejected",
      value: allProposals.filter((item) => item.status === "REJECTED").length,
      supportingText: "Campaigns needing a new proposal",
      icon: XCircle,
    },
  ];

  const columns: readonly DashboardTableColumn<CampaignDatasetRow>[] = [
    {
      id: "dataset",
      header: "Dataset",
      rowHeader: true,
      className: "min-w-64",
      cell: (item) => (
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Database className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <Link
              href={`/dashboard/discount-campaigns/${item.id}`}
              className="block max-w-72 truncate text-sm font-semibold text-foreground underline-offset-4 hover:text-primary hover:underline"
            >
              {item.title}
            </Link>
            <p className="mt-1 truncate font-mono text-xs font-normal text-muted-foreground">
              {item.datasetUniqueId}
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "type",
      header: "Type",
      cell: (item) => (
        <DashboardStatusBadge tone={item.isSample ? "info" : "neutral"}>
          {item.isSample ? "Sample listing" : "Paid dataset"}
        </DashboardStatusBadge>
      ),
    },
    {
      id: "surface",
      header: "Price surface",
      className: "min-w-52 text-muted-foreground",
      cell: (item) => (
        <div>
          <p>{item.surfaceLabel}</p>
          {item.isSample ? (
            <p className="mt-1 text-xs">Sample access stays free</p>
          ) : null}
        </div>
      ),
    },
    {
      id: "price",
      header: "Base price",
      className: "font-semibold tabular-nums",
      cell: (item) => formatMoney(item.baseAmount, item.currency),
    },
    {
      id: "status",
      header: "Campaign status",
      cell: (item) =>
        item.activeProposal ? (
          <DashboardStatusBadge
            status={item.activeProposal.status}
            tone={STATUS_TONES[item.activeProposal.status] ?? "neutral"}
          >
            {statusLabel(item.activeProposal.status)}
          </DashboardStatusBadge>
        ) : (
          <span className="text-sm text-muted-foreground">No campaign</span>
        ),
    },
    {
      id: "action",
      header: <span className="sr-only">Action</span>,
      align: "end",
      cell: (item) => (
        <DashboardButton asChild variant="outline" size="compact">
          <Link href={`/dashboard/discount-campaigns/${item.id}`}>Open</Link>
        </DashboardButton>
      ),
    },
  ];

  return (
    <DashboardPage width="wide">
      <DashboardPageHeader
        title="Dataset promotions"
        description="Create and manage approved discounts for eligible public datasets without changing their listing status."
        actions={
          <div className="flex flex-wrap gap-2">
            <DashboardDialog>
              <DashboardDialogTrigger asChild>
                <DashboardButton
                  variant="outline"
                  size="icon"
                  aria-label="How dataset promotions work"
                >
                  <Info aria-hidden="true" />
                </DashboardButton>
              </DashboardDialogTrigger>
              <DashboardDialogContent
                title="How to create a dataset promotion"
                description="Pick an eligible dataset, create a proposal, and wait for admin approval."
              >
                <ol className="list-decimal space-y-3 pl-5 text-sm leading-6 text-muted-foreground">
                  <li>Only published public datasets appear here.</li>
                  <li>Paid datasets discount their checkout price.</li>
                  <li>
                    Sample listings discount the full dataset commercial price;
                    sample access remains free.
                  </li>
                  <li>
                    Admin approval is required before a promotion becomes
                    active.
                  </li>
                  <li>
                    Stale discounts stop applying if the underlying price
                    changes.
                  </li>
                </ol>
              </DashboardDialogContent>
            </DashboardDialog>
            <DashboardButton
              variant="outline"
              onClick={() => void loadDatasets()}
            >
              <RefreshCw aria-hidden="true" /> Refresh
            </DashboardButton>
          </div>
        }
      />

      {error ? (
        <DashboardErrorState
          title="Dataset promotions could not be loaded"
          message={error}
          onRetry={() => void loadDatasets()}
        />
      ) : loading ? (
        <DashboardLoadingState
          label="Loading dataset promotions"
          variant="skeleton"
          rows={6}
        />
      ) : (
        <>
          <section
            aria-label="Dataset promotion summary"
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
          >
            {metrics.map((metric) => (
              <DashboardMetricCard key={metric.label} {...metric} />
            ))}
          </section>

          <DashboardToolbar ariaLabel="Search eligible datasets">
            <DashboardSearchField
              value={searchQuery}
              onValueChange={setSearchQuery}
              label="Search eligible datasets"
              placeholder="Search by dataset title or ID"
            />
          </DashboardToolbar>

          {rows.length ? (
            <section
              aria-label="Eligible promotion datasets"
              className="space-y-4"
            >
              <DashboardDataTable
                caption="Eligible dataset promotions"
                items={paginatedRows}
                columns={columns}
                getRowId={(item) => item.id}
                renderMobileItem={(item) => (
                  <DashboardMobileRecordCard>
                    <div className="flex items-start gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Database className="size-4" aria-hidden="true" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-semibold text-foreground">
                          {item.title}
                        </h3>
                        <p className="mt-1 truncate font-mono text-xs text-muted-foreground">
                          {item.datasetUniqueId}
                        </p>
                      </div>
                      <p className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                        {formatMoney(item.baseAmount, item.currency)}
                      </p>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <DashboardStatusBadge
                        tone={item.isSample ? "info" : "neutral"}
                      >
                        {item.isSample ? "Sample listing" : "Paid dataset"}
                      </DashboardStatusBadge>
                      {item.activeProposal ? (
                        <DashboardStatusBadge
                          tone={
                            STATUS_TONES[item.activeProposal.status] ??
                            "neutral"
                          }
                        >
                          {statusLabel(item.activeProposal.status)}
                        </DashboardStatusBadge>
                      ) : null}
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-3 border-t border-border/70 pt-3">
                      <span className="truncate text-xs text-muted-foreground">
                        {item.surfaceLabel}
                      </span>
                      <DashboardButton asChild variant="outline" size="compact">
                        <Link href={`/dashboard/discount-campaigns/${item.id}`}>
                          Open
                        </Link>
                      </DashboardButton>
                    </div>
                  </DashboardMobileRecordCard>
                )}
              />
              <DashboardPagination
                page={safeCurrentPage}
                pageSize={DATASET_TABLE_PAGE_SIZE}
                totalItems={rows.length}
                itemLabel="datasets"
                onPageChange={setCurrentPage}
              />
            </section>
          ) : (
            <DashboardEmptyState
              filtered={Boolean(searchQuery.trim())}
              icon={BadgePercent}
              title={
                searchQuery.trim()
                  ? "No datasets match this search"
                  : "No eligible datasets"
              }
              description={
                searchQuery.trim()
                  ? "Try a different title or dataset ID."
                  : "Published public datasets with active paid pricing or sample commercial pricing will appear here."
              }
              onClear={
                searchQuery.trim() ? () => setSearchQuery("") : undefined
              }
            />
          )}
        </>
      )}
    </DashboardPage>
  );
}
