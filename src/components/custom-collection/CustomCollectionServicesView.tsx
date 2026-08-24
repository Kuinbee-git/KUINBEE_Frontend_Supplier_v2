"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Archive, EyeOff, Globe2, ImageIcon, Plus, Search } from "lucide-react";

import {
  DashboardButton,
  DashboardCard,
  DashboardCardContent,
  DashboardEmptyState,
  DashboardErrorState,
  DashboardLoadingState,
  DashboardPage,
  DashboardPageHeader,
  DashboardPagination,
  DashboardSearchField,
  DashboardSelect,
  DashboardSelectContent,
  DashboardSelectItem,
  DashboardSelectTrigger,
  DashboardSelectValue,
  DashboardStatusBadge,
  DashboardToolbar,
  DashboardToolbarActions,
  DashboardToolbarFilters,
  type DashboardTone,
} from "@/components/dashboard";
import { customCollectionApi } from "@/lib/api/custom-collection";
import type {
  CustomCollectionAvailability,
  CustomCollectionRevisionStatus,
  CustomCollectionService,
} from "@/types/custom-collection.types";
import { STATUS_CONFIG, formatDate } from "./customCollectionUtils";

const PAGE_SIZE = 9;

const STATUS_TONES: Partial<
  Record<CustomCollectionRevisionStatus, DashboardTone>
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

export function CustomCollectionServicesView() {
  const [items, setItems] = useState<CustomCollectionService[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<CustomCollectionRevisionStatus | "ALL">(
    "ALL"
  );
  const [availability, setAvailability] = useState<
    CustomCollectionAvailability | "ALL"
  >("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await customCollectionApi.list({
        page,
        pageSize: PAGE_SIZE,
        q: query || undefined,
        status: status === "ALL" ? undefined : status,
        availability: availability === "ALL" ? undefined : availability,
      });
      setItems(data.items);
      setTotal(data.total);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Your services could not be loaded."
      );
    } finally {
      setLoading(false);
    }
  }, [availability, page, query, status]);

  useEffect(() => {
    void load();
  }, [load]);

  const search = (event: FormEvent) => {
    event.preventDefault();
    setPage(1);
    setQuery(searchInput.trim());
  };

  const clearFilters = () => {
    setSearchInput("");
    setQuery("");
    setStatus("ALL");
    setAvailability("ALL");
    setPage(1);
  };

  const filtered = Boolean(query || status !== "ALL" || availability !== "ALL");

  return (
    <DashboardPage width="wide">
      <DashboardPageHeader
        title="Custom collection services"
        description="Present your team’s data collection capabilities and turn buyer requirements into qualified conversations."
        actions={
          <DashboardButton asChild>
            <Link href="/dashboard/custom-collection-services/create">
              <Plus aria-hidden="true" /> Create service
            </Link>
          </DashboardButton>
        }
      />

      <form onSubmit={search}>
        <DashboardToolbar ariaLabel="Filter custom collection services">
          <DashboardSearchField
            value={searchInput}
            onValueChange={setSearchInput}
            onClear={() => setSearchInput("")}
            maxLength={120}
            placeholder="Search by service title or description"
            label="Search services"
          />
          <DashboardToolbarFilters ariaLabel="Service filters">
            <DashboardSelect
              value={status}
              onValueChange={(value) => {
                setStatus(value as CustomCollectionRevisionStatus | "ALL");
                setPage(1);
              }}
            >
              <DashboardSelectTrigger aria-label="Filter by review status">
                <DashboardSelectValue />
              </DashboardSelectTrigger>
              <DashboardSelectContent>
                <DashboardSelectItem value="ALL">
                  All review statuses
                </DashboardSelectItem>
                {Object.entries(STATUS_CONFIG)
                  .filter(([value]) => value !== "SUPERSEDED")
                  .map(([value, config]) => (
                    <DashboardSelectItem key={value} value={value}>
                      {config.label}
                    </DashboardSelectItem>
                  ))}
              </DashboardSelectContent>
            </DashboardSelect>
            <DashboardSelect
              value={availability}
              onValueChange={(value) => {
                setAvailability(value as CustomCollectionAvailability | "ALL");
                setPage(1);
              }}
            >
              <DashboardSelectTrigger aria-label="Filter by availability">
                <DashboardSelectValue />
              </DashboardSelectTrigger>
              <DashboardSelectContent>
                <DashboardSelectItem value="ALL">
                  All services
                </DashboardSelectItem>
                <DashboardSelectItem value="ACTIVE">Active</DashboardSelectItem>
                <DashboardSelectItem value="ARCHIVED">
                  Archived
                </DashboardSelectItem>
              </DashboardSelectContent>
            </DashboardSelect>
          </DashboardToolbarFilters>
          <DashboardToolbarActions>
            {filtered ? (
              <DashboardButton
                type="button"
                variant="ghost"
                onClick={clearFilters}
              >
                Clear
              </DashboardButton>
            ) : null}
            <DashboardButton type="submit">Search</DashboardButton>
          </DashboardToolbarActions>
        </DashboardToolbar>
      </form>

      {error ? (
        <DashboardErrorState
          title="Services could not be loaded"
          message={error}
          onRetry={() => void load()}
        />
      ) : loading ? (
        <DashboardLoadingState
          label="Loading custom collection services"
          variant="skeleton"
          rows={6}
        />
      ) : items.length === 0 && filtered ? (
        <DashboardEmptyState
          filtered
          icon={Search}
          title="No services match these filters"
          description="Try changing the search or filters to see more services."
          onClear={clearFilters}
        />
      ) : items.length === 0 ? (
        <DashboardEmptyState
          icon={ImageIcon}
          title="No services yet"
          description="Create a private draft to describe your custom data collection capabilities and submit it for review."
          action={
            <DashboardButton asChild>
              <Link href="/dashboard/custom-collection-services/create">
                <Plus aria-hidden="true" /> Create your first service
              </Link>
            </DashboardButton>
          }
        />
      ) : (
        <section aria-label="Custom collection services" className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {items.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
          <DashboardPagination
            page={page}
            pageSize={PAGE_SIZE}
            totalItems={total}
            itemLabel="services"
            onPageChange={setPage}
          />
        </section>
      )}
    </DashboardPage>
  );
}

function ServiceCard({ service }: { service: CustomCollectionService }) {
  const revision = service.workingRevision ?? service.publishedRevision;
  if (!revision) return null;
  const status = STATUS_CONFIG[revision.status];
  const hasSeparateApprovedRevision =
    Boolean(service.workingRevision) && Boolean(service.publishedRevision);

  return (
    <Link
      href={`/dashboard/custom-collection-services/${service.id}`}
      className="group rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-[var(--dashboard-focus-ring)]"
    >
      <DashboardCard className="flex h-full flex-col overflow-hidden transition-[transform,border-color,box-shadow] duration-150 group-hover:-translate-y-0.5 group-hover:border-[var(--dashboard-focus-ring)] group-hover:shadow-md motion-reduce:transform-none motion-reduce:transition-none">
        <div className="relative aspect-[16/8] overflow-hidden border-b border-border bg-muted/45">
          {revision.coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={revision.coverImage.url}
              alt=""
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02] motion-reduce:transform-none"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <ImageIcon className="size-9" aria-hidden="true" />
            </div>
          )}
          {service.archivedAt ? (
            <DashboardStatusBadge
              icon={Archive}
              tone="neutral"
              className="absolute left-3 top-3"
            >
              Archived
            </DashboardStatusBadge>
          ) : null}
        </div>
        <DashboardCardContent className="flex flex-1 flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              <DashboardStatusBadge
                status={revision.status}
                tone={STATUS_TONES[revision.status] ?? "neutral"}
              >
                {status.label}
              </DashboardStatusBadge>
              {service.publishedRevision ? (
                <DashboardStatusBadge
                  icon={service.isPublished ? Globe2 : EyeOff}
                  tone={service.isPublished ? "success" : "neutral"}
                >
                  {service.isPublished ? "Public" : "Private"}
                </DashboardStatusBadge>
              ) : null}
              {hasSeparateApprovedRevision ? (
                <DashboardStatusBadge tone="info">
                  Approved v{service.publishedRevision?.version}
                </DashboardStatusBadge>
              ) : null}
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">
              v{revision.version}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="line-clamp-2 text-lg font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
              {revision.title}
            </h2>
            <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
              {revision.shortDescription}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4 text-xs text-muted-foreground">
            <span>{revision.primaryCategory.name}</span>
            <span>{formatDate(service.updatedAt)}</span>
          </div>
          {hasSeparateApprovedRevision ? (
            <p className="dashboard-tone-info rounded-lg border px-3 py-2 text-xs">
              Approved revision v{service.publishedRevision?.version} remains{" "}
              {service.isPublished ? "public" : "private"} while this update is
              reviewed.
            </p>
          ) : null}
        </DashboardCardContent>
      </DashboardCard>
    </Link>
  );
}
