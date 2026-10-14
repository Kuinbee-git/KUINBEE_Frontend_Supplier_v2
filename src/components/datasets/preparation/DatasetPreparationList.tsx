"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import {
  DATASET_UPLOAD_CHOICES,
  type DatasetPreparationsListResponse,
} from "@kuinbee/dataset-preparation-contracts";
import { useComponentRequest } from "@/hooks/useComponentRequest";
import { preparationApi } from "@/lib/api/dataset-preparations";
import {
  DashboardButton,
  DashboardCard,
  DashboardEmptyState,
} from "@/components/dashboard";
import {
  DatasetPageHeader,
  DatasetWorkspace,
} from "@/components/datasets/workspace/DatasetWorkspace";

export function DatasetPreparationList() {
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<DatasetPreparationsListResponse | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setResult(await preparationApi.list(page));
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Saved drafts could not be loaded."
      );
    } finally {
      setLoading(false);
    }
  }, [page]);
  useComponentRequest(load, [page]);
  return (
    <DatasetWorkspace className="max-w-[70rem]">
      <DatasetPageHeader
        title="Saved drafts"
        description="Prepare Dataset information and return to finish it. These drafts have not been submitted or published."
        action={
          <DashboardButton asChild>
            <Link href="/dashboard/datasets/prepare/new">
              Prepare a Dataset
            </Link>
          </DashboardButton>
        }
        meta={
          <>
            <DashboardButton
              asChild
              variant="link"
              size="compact"
              className="h-auto p-0"
            >
              <Link href="/dashboard/datasets">Existing proposals</Link>
            </DashboardButton>
            <DashboardButton
              asChild
              variant="link"
              size="compact"
              className="h-auto p-0"
            >
              <Link href="/dashboard/datasets/create">
                Existing creation workflow
              </Link>
            </DashboardButton>
          </>
        }
      />
      <DashboardCard className="p-4 text-sm">
        File intake and admin submission are unavailable in this preparation
        testing release. Existing proposals continue through their current
        workflow.
      </DashboardCard>
      {loading && <p role="status">Loading saved drafts…</p>}
      {error && (
        <div role="alert" className="rounded-lg border border-destructive p-4">
          {error}{" "}
          <DashboardButton
            variant="link"
            size="compact"
            type="button"
            className="h-auto p-0"
            onClick={load}
          >
            Retry loading drafts
          </DashboardButton>
        </div>
      )}
      {!loading && !error && result?.items.length === 0 && (
        <DashboardEmptyState
          title="No saved drafts yet"
          description="Start with a title, save it, and complete the information step by step."
        />
      )}
      <ul className="space-y-3">
        {result?.items.map((item) => (
          <li key={item.id}>
            <DashboardCard className="p-4">
              <Link
                href={`/dashboard/datasets/prepare/${item.id}`}
                className="block text-lg font-semibold underline"
              >
                {item.metadata.title}
              </Link>
              <p className="mt-1 text-sm text-muted-foreground">
                {DATASET_UPLOAD_CHOICES.find(
                  (choice) => choice.value === item.metadata.uploadChoice
                )?.label ?? "Upload choice not selected"}{" "}
                · Updated {new Date(item.updatedAt).toLocaleString()}
              </p>
              <p className="mt-1 text-xs">
                Saved privately · Continue preparing · Admin submission
                unavailable
              </p>
            </DashboardCard>
          </li>
        ))}
      </ul>
      {result && result.total > 20 && (
        <nav
          aria-label="Saved draft pages"
          className="flex flex-wrap items-center gap-3"
        >
          <DashboardButton
            variant="outline"
            type="button"
            disabled={loading || page <= 1}
            onClick={() => setPage((value) => value - 1)}
          >
            Previous draft page
          </DashboardButton>
          <span>
            Page {page} of {Math.ceil(result.total / 20)}
          </span>
          <DashboardButton
            variant="outline"
            type="button"
            disabled={loading || page * 20 >= result.total}
            onClick={() => setPage((value) => value + 1)}
          >
            Next draft page
          </DashboardButton>
        </nav>
      )}
    </DatasetWorkspace>
  );
}
