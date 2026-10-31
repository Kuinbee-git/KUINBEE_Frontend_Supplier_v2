"use client";
import Link from "next/link";
import { CatalogueImportWorkspace } from "@/components/catalogue/CatalogueImportWorkspace";
import { supplierCatalogueApi } from "@/lib/api/catalogue-imports";
import { DATASET_CATALOGUE_IMPORT_ENABLED } from "@/lib/catalogue-import-environment";
import { DATASET_PREPARATION_ENABLED } from "@/lib/dataset-preparation-environment";
import { useAuthStore } from "@/store/auth.store";
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
        <p className="p-6">
          Catalogue import is not enabled for this environment.
        </p>
      )}
    </>
  );
}
