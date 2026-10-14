import Link from "next/link";
import { DATASET_PREPARATION_ENABLED } from "@/lib/dataset-preparation-environment";

export function DatasetPreparationEntry() {
  if (!DATASET_PREPARATION_ENABLED) return null;
  return (
    <aside className="mx-auto mb-5 flex max-w-7xl flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4 text-sm">
      <div className="min-w-0 flex-1">
        <strong>Prepare a Dataset step by step</strong>
        <p className="text-muted-foreground">
          Save information for sample, full or combined material. File intake
          and submission are not enabled in this testing release.
        </p>
      </div>
      <Link
        className="rounded-lg border border-border px-3 py-2 font-medium"
        href="/dashboard/datasets/prepare"
      >
        Saved drafts
      </Link>
      <Link
        className="rounded-lg bg-primary px-3 py-2 font-medium text-primary-foreground"
        href="/dashboard/datasets/prepare/new"
      >
        Prepare a Dataset
      </Link>
    </aside>
  );
}
