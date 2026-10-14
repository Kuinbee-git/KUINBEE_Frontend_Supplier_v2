import Link from "next/link";
import { DashboardButton } from "@/components/dashboard";
import { DATASET_PREPARATION_ENABLED } from "@/lib/dataset-preparation-environment";

export function DatasetPreparationEntry() {
  if (!DATASET_PREPARATION_ENABLED) return null;
  return (
    <aside className="dashboard-glass-card mx-auto mb-5 flex max-w-7xl flex-wrap items-center gap-3 rounded-xl border border-border p-4 text-sm">
      <div className="min-w-0 flex-1">
        <strong>Prepare a Dataset step by step</strong>
        <p className="text-muted-foreground">
          Save information for sample, full or combined material. File intake
          and submission are not enabled in this testing release.
        </p>
      </div>
      <DashboardButton asChild variant="outline" size="compact">
        <Link href="/dashboard/datasets/prepare">Saved drafts</Link>
      </DashboardButton>
      <DashboardButton asChild size="compact">
        <Link href="/dashboard/datasets/prepare/new">Prepare a Dataset</Link>
      </DashboardButton>
    </aside>
  );
}
