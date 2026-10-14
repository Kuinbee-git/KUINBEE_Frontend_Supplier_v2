"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import {
  DATASET_UPLOAD_CHOICES,
  type DatasetPreparationsListResponse,
} from "@kuinbee/dataset-preparation-contracts";
import { useComponentRequest } from "@/hooks/useComponentRequest";
import { preparationApi } from "@/lib/api/dataset-preparations";
import { DatasetWorkspace } from "@/components/datasets/workspace/DatasetWorkspace";

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
    <DatasetWorkspace className="mx-auto max-w-5xl space-y-5">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Saved drafts</h1>
        <p className="text-sm text-muted-foreground">
          Prepare Dataset information and return to finish it. These drafts have
          not been submitted or published.
        </p>
        <div className="flex flex-wrap gap-4 text-sm">
          <Link
            className="rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground"
            href="/dashboard/datasets/prepare/new"
          >
            Prepare a Dataset
          </Link>
          <Link className="self-center underline" href="/dashboard/datasets">
            Existing proposals
          </Link>
          <Link
            className="self-center underline"
            href="/dashboard/datasets/create"
          >
            Existing creation workflow
          </Link>
        </div>
      </header>
      <p className="rounded-lg border border-border bg-card p-4 text-sm">
        File intake and admin submission are unavailable in this preparation
        testing release. Existing proposals continue through their current
        workflow.
      </p>
      {loading && <p role="status">Loading saved drafts…</p>}
      {error && (
        <div role="alert" className="rounded-lg border border-destructive p-4">
          {error}{" "}
          <button type="button" className="underline" onClick={load}>
            Retry loading drafts
          </button>
        </div>
      )}
      {!loading && !error && result?.items.length === 0 && (
        <p className="rounded-lg border border-border p-6">
          No saved drafts yet. Start with a title, save it, and complete the
          information step by step.
        </p>
      )}
      <ul className="space-y-3">
        {result?.items.map((item) => (
          <li
            key={item.id}
            className="rounded-xl border border-border bg-card p-4"
          >
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
          </li>
        ))}
      </ul>
      {result && result.total > 20 && (
        <nav aria-label="Saved draft pages" className="flex items-center gap-3">
          <button
            type="button"
            className="rounded-lg border border-border px-3 py-2"
            disabled={loading || page <= 1}
            onClick={() => setPage((value) => value - 1)}
          >
            Previous draft page
          </button>
          <span>
            Page {page} of {Math.ceil(result.total / 20)}
          </span>
          <button
            type="button"
            className="rounded-lg border border-border px-3 py-2"
            disabled={loading || page * 20 >= result.total}
            onClick={() => setPage((value) => value + 1)}
          >
            Next draft page
          </button>
        </nav>
      )}
    </DatasetWorkspace>
  );
}
