"use client";
import Link from "next/link";
import { CatalogueImportWorkspace } from "@/components/catalogue/CatalogueImportWorkspace";
import { supplierCatalogueApi } from "@/lib/api/catalogue-imports";
import { DATASET_CATALOGUE_IMPORT_ENABLED } from "@/lib/catalogue-import-environment";
import { DATASET_PREPARATION_ENABLED } from "@/lib/dataset-preparation-environment";
import { useAuthStore } from "@/store/auth.store";
import {
  DashboardButton,
  DashboardWorkspace,
  DashboardRegion,
} from "@/components/dashboard";
import {
  DatasetWorkspace,
  DatasetPageHeader,
} from "@/components/datasets/workspace/DatasetWorkspace";
import { CatalogueImportSteps } from "@/components/catalogue/CatalogueImportSteps";
import { CATALOGUE_IMPORT_GUIDE_PATH } from "@/lib/datasets/catalogue-import-guidance";
export default function CatalogueImportPage() {
  const user = useAuthStore((state) => state.user);
  if (DATASET_PREPARATION_ENABLED && DATASET_CATALOGUE_IMPORT_ENABLED && user)
    return (
      <CatalogueImportWorkspace
        api={supplierCatalogueApi}
        ownerLabel="Your supplier catalogue"
        storageKey={`catalogue-import:${user.id}`}
      />
    );
  return (
    <DatasetWorkspace className="dataset-proposal-workspace">
      <DatasetPageHeader
        title="Import private catalogue"
        description="Prepare collection metadata from an Excel or CSV template. Preview every change before saving private drafts."
        breadcrumbs={<Link href="/dashboard/datasets">My drafts</Link>}
      />
      <DashboardWorkspace>
        <DashboardRegion>
          <CatalogueImportSteps />
        </DashboardRegion>
        <DashboardRegion className="space-y-4">
          <h2 className="text-xl font-semibold">
            Catalogue import is not enabled here yet
          </h2>
          <p className="max-w-3xl text-sm text-muted-foreground">
            You can read the walkthrough and continue individual drafts. Contact
            supplier support to ask for catalogue import access.
          </p>
          <div className="flex flex-wrap gap-3">
            <DashboardButton asChild>
              <Link href={CATALOGUE_IMPORT_GUIDE_PATH}>
                Read the file import guide
              </Link>
            </DashboardButton>
            <DashboardButton asChild variant="outline">
              <Link href="/dashboard/support">Contact supplier support</Link>
            </DashboardButton>
          </div>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Saving imports keeps collections private. Submission for review,
            publication and buyer access require separate actions.
          </p>
        </DashboardRegion>
      </DashboardWorkspace>
    </DatasetWorkspace>
  );
}
