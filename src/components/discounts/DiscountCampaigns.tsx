"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BadgePercent,
  ChevronRight,
  Database,
  Info,
  Loader2,
  Search,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { getDatasetThemeTokens } from "@/constants/dataset.constants";
import { listDatasetDiscountProposals, listMyDatasets } from "@/lib/api";
import {
  DatasetsTable,
  type TableColumn,
} from "@/components/datasets/shared/DatasetsTable";
import { StatsCards } from "@/components/datasets/shared/StatsCards";
import {
  demoProposalMap,
  formatMoney,
  getDemoDatasets,
  getEligibleDataset,
  isDemoDataset,
  statusColors,
  statusLabel,
  type EligibleDiscountDataset,
} from "./discountCampaignUtils";
import type { DatasetDiscountProposal } from "@/types/discount.types";
import { DiscountPagination } from "./DiscountPagination";

interface DiscountCampaignsProps {
  isDark?: boolean;
}

type CampaignDatasetRow = EligibleDiscountDataset & {
  _index: number;
  activeProposal: DatasetDiscountProposal | null;
  proposalCount: number;
};

const DATASET_FETCH_PAGE_SIZE = 100;
const DATASET_TABLE_PAGE_SIZE = 10;

export function DiscountCampaigns({ isDark = false }: DiscountCampaignsProps) {
  const router = useRouter();
  const tokens = getDatasetThemeTokens(isDark);
  const [datasets, setDatasets] = useState<EligibleDiscountDataset[]>([]);
  const [proposalMap, setProposalMap] = useState<
    Record<string, DatasetDiscountProposal[]>
  >({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const loadDatasets = async () => {
    setLoading(true);
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

      const eligible = allItems;
      const demoDatasets = getDemoDatasets();
      const displayDatasets = [
        ...demoDatasets,
        ...eligible.filter((item) => !isDemoDataset(item.id)),
      ];

      setDatasets(displayDatasets);

      const proposalEntries = await Promise.all(
        displayDatasets.map(async (dataset) => {
          if (isDemoDataset(dataset.id)) {
            return [dataset.id, demoProposalMap[dataset.id] ?? []] as const;
          }

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
    } catch (error: any) {
      toast.error(
        error?.message || "Failed to load discount campaign datasets"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDatasets();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const rows = useMemo<CampaignDatasetRow[]>(() => {
    const query = searchQuery.trim().toLowerCase();
    return datasets
      .filter((dataset) => {
        if (!query) return true;
        return (
          dataset.title.toLowerCase().includes(query) ||
          dataset.datasetUniqueId.toLowerCase().includes(query)
        );
      })
      .map((dataset, index) => {
        const proposals = proposalMap[dataset.id] ?? [];
        const activeProposal =
          proposals.find((proposal) =>
            ["SUBMITTED", "UNDER_REVIEW", "APPROVED", "ACTIVE"].includes(
              proposal.status
            )
          ) ?? null;
        return {
          ...dataset,
          _index: index,
          activeProposal,
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

  const stats = [
    { value: datasets.length, label: "Eligible", color: tokens.textPrimary },
    {
      value: datasets.filter((item) => !item.isSample).length,
      label: "Paid Datasets",
      color: "#2563eb",
    },
    {
      value: datasets.filter((item) => item.isSample).length,
      label: "Samples",
      color: "#7c3aed",
    },
    {
      value: Object.values(proposalMap)
        .flat()
        .filter((item) => item.status === "SUBMITTED").length,
      label: "Submitted",
      color: "#f59e0b",
    },
    {
      value: Object.values(proposalMap)
        .flat()
        .filter((item) => item.status === "ACTIVE").length,
      label: "Active",
      color: "#16a34a",
    },
    {
      value: Object.values(proposalMap)
        .flat()
        .filter((item) => item.status === "REJECTED").length,
      label: "Rejected",
      color: "#dc2626",
    },
  ];

  const columns: TableColumn<CampaignDatasetRow>[] = [
    {
      header: "No.",
      accessor: (item) => (
        <span className="font-medium" style={{ color: tokens.textMuted }}>
          {item._index + 1}
        </span>
      ),
      headerClassName: "text-center",
      className: "text-center",
      minWidth: "56px",
    },
    {
      header: "Dataset",
      accessor: (item) => (
        <div className="flex items-center gap-2 min-w-0">
          <Database
            className="w-4 h-4 flex-shrink-0"
            style={{ color: tokens.textMuted }}
          />
          <div className="min-w-0">
            <p
              className="text-sm font-semibold truncate"
              style={{ color: tokens.textPrimary }}
            >
              {item.title}
            </p>
            <p
              className="text-xs font-mono truncate"
              style={{ color: tokens.textMuted }}
            >
              {item.datasetUniqueId}
            </p>
          </div>
        </div>
      ),
      minWidth: "260px",
    },
    {
      header: "Type",
      accessor: (item) => (
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex rounded px-2 py-1 text-xs font-medium bg-emerald-500/10 text-emerald-600">
            {item.isSample ? "Sample listing" : "Paid dataset"}
          </span>
          {isDemoDataset(item.id) && (
            <span className="inline-flex rounded px-2 py-1 text-xs font-medium bg-blue-500/10 text-blue-600">
              Demo
            </span>
          )}
        </div>
      ),
      hidden: "md",
      minWidth: "150px",
    },
    {
      header: "Price Surface",
      accessor: (item) => (
        <div>
          <p className="text-sm" style={{ color: tokens.textPrimary }}>
            {item.surfaceLabel}
          </p>
          {item.isSample && (
            <p className="text-xs mt-1" style={{ color: tokens.textMuted }}>
              Sample access stays free
            </p>
          )}
        </div>
      ),
      hidden: "lg",
      minWidth: "220px",
    },
    {
      header: "Base Price",
      accessor: (item) => (
        <span className="font-semibold" style={{ color: tokens.textPrimary }}>
          {formatMoney(item.baseAmount, item.currency)}
        </span>
      ),
      minWidth: "150px",
    },
    {
      header: "Campaign Status",
      accessor: (item) => {
        if (!item.activeProposal) {
          return (
            <span className="text-sm" style={{ color: tokens.textMuted }}>
              No campaign
            </span>
          );
        }

        return (
          <span
            className="inline-flex rounded px-2 py-1 text-xs font-semibold"
            style={{
              background: `${statusColors[item.activeProposal.status] ?? "#64748b"}18`,
              color: statusColors[item.activeProposal.status] ?? "#64748b",
            }}
          >
            {statusLabel(item.activeProposal.status)}
          </span>
        );
      },
      hidden: "sm",
      minWidth: "160px",
    },
    {
      header: "Actions",
      accessor: () => (
        <span
          className="inline-flex items-center gap-1 text-xs font-semibold"
          style={{ color: tokens.textSecondary }}
        >
          Open
          <ChevronRight className="w-3.5 h-3.5" />
        </span>
      ),
      headerClassName: "text-right",
      className: "text-right",
      minWidth: "90px",
    },
  ];

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

  return (
    <div className="max-w-[1400px] mx-auto p-8">
      <div className="mb-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1
                className="text-3xl font-semibold"
                style={{ color: tokens.textPrimary }}
              >
                Discount Campaigns
              </h1>
              <Dialog>
                <DialogTrigger asChild>
                  <button
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border transition-colors"
                    style={{
                      borderColor: tokens.borderDefault,
                      background: tokens.surfaceCard,
                      color: tokens.textSecondary,
                    }}
                    aria-label="How discount campaigns work"
                    title="How discount campaigns work"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>How to create a discount campaign</DialogTitle>
                    <DialogDescription>
                      Pick an eligible dataset, create a proposal, and wait for
                      admin approval. Approved discounts apply to marketplace
                      pricing without changing dataset status.
                    </DialogDescription>
                  </DialogHeader>
                  <div
                    className="space-y-3 text-sm"
                    style={{ color: tokens.textSecondary }}
                  >
                    <p>1. Only published public datasets appear here.</p>
                    <p>2. Paid datasets discount their checkout price.</p>
                    <p>
                      3. Sample datasets discount the full dataset commercial
                      price; sample access remains free.
                    </p>
                    <p>
                      4. Admin approval is required before a campaign becomes
                      active.
                    </p>
                    <p>
                      5. If pricing changes, stale discounts stop applying
                      automatically.
                    </p>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <p className="mt-2" style={{ color: tokens.textSecondary }}>
              Select a dataset from the table to create or manage its discount
              campaign.
            </p>
          </div>
          <Button onClick={loadDatasets} variant="outline">
            Refresh
          </Button>
        </div>

        <div className="mt-6">
          <StatsCards stats={stats} tokens={tokens} isDark={isDark} />
        </div>
      </div>

      <Card
        className="p-4 mb-5"
        style={{
          background: tokens.surfaceCard,
          borderColor: tokens.borderDefault,
        }}
      >
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: tokens.textMuted }}
          />
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search eligible datasets..."
            className="pl-10"
            style={{
              background: tokens.inputBg,
              borderColor: tokens.inputBorder,
              color: tokens.textPrimary,
            }}
          />
        </div>
      </Card>

      <DatasetsTable
        data={paginatedRows}
        columns={columns}
        onRowClick={(item) =>
          router.push(`/dashboard/discount-campaigns/${item.id}`)
        }
        emptyIcon={
          <BadgePercent
            className="w-16 h-16 mx-auto mb-4"
            style={{ color: tokens.textMuted }}
          />
        }
        emptyTitle="No eligible datasets"
        emptyDescription="Published public datasets with active paid pricing or sample actual pricing will appear here."
        tokens={tokens}
        isDark={isDark}
        getRowKey={(item) => item.id}
      />

      <DiscountPagination
        page={safeCurrentPage}
        pageSize={DATASET_TABLE_PAGE_SIZE}
        total={rows.length}
        itemLabel="datasets"
        tokens={tokens}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
