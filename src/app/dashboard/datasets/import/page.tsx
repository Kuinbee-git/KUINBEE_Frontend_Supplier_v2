"use client";
import Link from "next/link";
import { CatalogueImportWorkspace } from "@/components/catalogue/CatalogueImportWorkspace";
import { supplierCatalogueApi } from "@/lib/api/catalogue-imports";
import { DATASET_CATALOGUE_IMPORT_ENABLED } from "@/lib/catalogue-import-environment";
import { DATASET_PREPARATION_ENABLED } from "@/lib/dataset-preparation-environment";
import { useAuthStore } from "@/store/auth.store";
import { DashboardButton, DashboardCard } from "@/components/dashboard";
import { CatalogueImportSteps } from "@/components/catalogue/CatalogueImportSteps";
import { CATALOGUE_IMPORT_GUIDE_PATH } from "@/lib/datasets/catalogue-import-guidance";
export default function CatalogueImportPage() {
  const user = useAuthStore((state) => state.user);
  return (
    <>
      <div className="px-4 pt-5 sm:px-6">
        <Link
          className="text-sm underline underline-offset-4"
          href="/dashboard/datasets"
        >
          Back to my drafts
        </Link>
      </div>
      {DATASET_PREPARATION_ENABLED &&
      DATASET_CATALOGUE_IMPORT_ENABLED &&
      user ? (
        <CatalogueImportWorkspace
          api={supplierCatalogueApi}
          ownerLabel="Your supplier catalogue"
          storageKey={`catalogue-import:${user.id}`}
        />
      ) : (
        <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
          <header className="space-y-2">
            <h1 className="text-2xl font-semibold">Import private catalogue</h1>
            <p className="max-w-3xl text-sm text-muted-foreground">
              Prepare multiple collections from an Excel or CSV metadata file,
              preview the changes, then save private drafts.
            </p>
          </header>
          <CatalogueImportSteps />
          <DashboardCard className="space-y-3 p-4 sm:p-6">
            <h2 className="text-lg font-semibold">
              Catalogue import is not enabled here yet
            </h2>
            <p className="max-w-3xl text-sm text-muted-foreground">
              You can read the walkthrough and continue individual drafts.
              Contact supplier support to ask for catalogue import access or a
              larger saved preparation allowance.
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
          </DashboardCard>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Saving imports keeps collections private. Submission for review,
            publication and buyer access require separate actions.
          </p>
        </div>
      )}
    </>
  );
}
