"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Archive,
  EyeOff,
  Globe2,
  ImageIcon,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";

import { StyledSelect } from "@/components/datasets/shared/StyledSelect";
import { PaginationControls } from "@/components/shared/PaginationControls";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getDatasetThemeTokens } from "@/constants/dataset.constants";
import { cn } from "@/lib/utils";
import { customCollectionApi } from "@/lib/api/custom-collection";
import { useThemeStore } from "@/store";
import type {
  CustomCollectionAvailability,
  CustomCollectionRevisionStatus,
  CustomCollectionService,
} from "@/types/custom-collection.types";
import { STATUS_CONFIG, formatDate } from "./customCollectionUtils";

const PAGE_SIZE = 9;

export function CustomCollectionServicesView() {
  const { isDark } = useThemeStore();
  const tokens = getDatasetThemeTokens(isDark);
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
    <div className="custom-collection-scope mx-auto w-full max-w-[1500px] space-y-6 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Custom collection services
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Present your team&apos;s data collection capabilities and turn buyer
            requirements into qualified conversations.
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/dashboard/custom-collection-services/create">
            <Plus /> Create service
          </Link>
        </Button>
      </header>

      <section
        aria-label="Filter custom collection services"
        className="supplier-glass-panel rounded-2xl border p-4"
      >
        <form onSubmit={search} className="flex flex-col gap-3 lg:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              className="supplier-glass-input pl-9"
              maxLength={120}
              placeholder="Search by service title or description"
              aria-label="Search services"
            />
          </div>
          <div className="lg:w-52">
            <StyledSelect
              value={status}
              onValueChange={(value) => {
                setStatus(value as CustomCollectionRevisionStatus | "ALL");
                setPage(1);
              }}
              options={[
                { value: "ALL", label: "All review statuses" },
                ...Object.entries(STATUS_CONFIG)
                  .filter(([value]) => value !== "SUPERSEDED")
                  .map(([value, config]) => ({
                    value,
                    label: config.label,
                  })),
              ]}
              ariaLabel="Filter by review status"
              isDark={isDark}
              tokens={tokens}
            />
          </div>
          <div className="lg:w-44">
            <StyledSelect
              value={availability}
              onValueChange={(value) => {
                setAvailability(value as CustomCollectionAvailability | "ALL");
                setPage(1);
              }}
              options={[
                { value: "ALL", label: "All services" },
                { value: "ACTIVE", label: "Active" },
                { value: "ARCHIVED", label: "Archived" },
              ]}
              ariaLabel="Filter by availability"
              isDark={isDark}
              tokens={tokens}
            />
          </div>
          <Button type="submit" className="h-9 min-w-24 px-5">
            Search
          </Button>
          {filtered && (
            <Button type="button" variant="ghost" onClick={clearFilters}>
              Clear
            </Button>
          )}
        </form>
      </section>

      {error && (
        <div className="flex flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-destructive">{error}</p>
          <Button type="button" variant="outline" size="sm" onClick={load}>
            <RefreshCw /> Try again
          </Button>
        </div>
      )}

      {loading ? (
        <div
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
          aria-label="Loading services"
        >
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="supplier-glass-card h-80 animate-pulse rounded-2xl border"
            />
          ))}
        </div>
      ) : items.length === 0 && filtered ? (
        <Card className="supplier-glass-panel border-dashed">
          <CardContent className="flex min-h-80 flex-col items-center justify-center px-6 py-12 text-center">
            <span className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Search className="size-7" />
            </span>
            <h2 className="text-lg font-semibold">
              No services match these filters
            </h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Try changing the search or filters to see more services.
            </p>
            <Button asChild className="mt-5">
              <button type="button" onClick={clearFilters}>
                Clear filters
              </button>
            </Button>
          </CardContent>
        </Card>
      ) : items.length === 0 ? (
        <Card className="supplier-glass-panel border-dashed">
          <CardContent className="flex min-h-80 flex-col items-center justify-center px-6 py-12 text-center">
            <span className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ImageIcon className="size-7" />
            </span>
            <h2 className="text-lg font-semibold">No services yet</h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Create a private draft to describe your custom data collection
              capabilities and submit it for review.
            </p>
            <Button asChild className="mt-5">
              <Link href="/dashboard/custom-collection-services/create">
                <Plus /> Create your first service
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {items.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
          <PaginationControls
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            itemLabel="services"
            mutedColor="var(--muted-foreground)"
            onPageChange={setPage}
          />
        </>
      )}
    </div>
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
      className="group rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Card className="supplier-glass-card h-full overflow-hidden transition-all group-hover:-translate-y-0.5 group-hover:border-primary/40">
        <div className="supplier-glass-input relative aspect-[16/8] overflow-hidden">
          {revision.coverImage ? (
            // The image URL is supplied by the configured asset host and may not be known at build time.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={revision.coverImage.url}
              alt=""
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <ImageIcon className="size-9" />
            </div>
          )}
          {service.archivedAt && (
            <span className="supplier-glass-panel absolute left-3 top-3 inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium">
              <Archive className="size-3" /> Archived
            </span>
          )}
        </div>
        <CardContent className="space-y-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              <span
                className={cn(
                  "inline-flex rounded-full border px-2.5 py-1 text-xs font-medium",
                  status.className
                )}
              >
                {status.label}
              </span>
              {service.publishedRevision && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium",
                    service.isPublished
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/25 dark:bg-emerald-400/10 dark:text-emerald-200"
                      : "border-slate-300 bg-slate-100 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-white/70"
                  )}
                >
                  {service.isPublished ? (
                    <Globe2 className="size-3" />
                  ) : (
                    <EyeOff className="size-3" />
                  )}
                  {service.isPublished ? "Public" : "Private"}
                </span>
              )}
              {hasSeparateApprovedRevision && (
                <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:border-blue-400/25 dark:bg-blue-400/10 dark:text-blue-200">
                  Approved v{service.publishedRevision?.version}
                </span>
              )}
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">
              v{revision.version}
            </span>
          </div>
          <div>
            <h2 className="line-clamp-2 text-lg font-semibold leading-snug group-hover:text-primary">
              {revision.title}
            </h2>
            <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
              {revision.shortDescription}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-4 text-xs text-muted-foreground">
            <span>{revision.primaryCategory.name}</span>
            <span>{formatDate(service.updatedAt)}</span>
          </div>
          {hasSeparateApprovedRevision && (
            <p className="rounded-lg bg-blue-500/10 px-3 py-2 text-xs text-blue-700 dark:text-blue-300">
              Approved revision v{service.publishedRevision?.version} remains{" "}
              {service.isPublished ? "public" : "private"} while this update is
              reviewed.
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
