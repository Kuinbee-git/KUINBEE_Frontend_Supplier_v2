import * as React from "react";
import { QueryProvider } from "../../src/components/QueryProvider";
import { DatasetDetail } from "../../src/components/datasets/DatasetDetail";
import { MyDatasetDetail } from "../../src/components/datasets/MyDatasetDetail";
import { DelistedDatasetEdit } from "../../src/components/datasets/DelistedDatasetEdit";
import { CreateDataset } from "../../src/components/datasets/CreateDataset";
import { MyDatasets } from "../../src/components/datasets/MyDatasets";
import { SubmittedProposals } from "../../src/components/datasets/SubmittedProposals";
import { CustomCollectionCreateView } from "../../src/components/custom-collection/CustomCollectionCreateView";
import { DatasetSupplierProposalsResponseSchema } from "@kuinbee/dataset-preparation-contracts";
import { CustomCollectionForm } from "../../src/components/custom-collection/CustomCollectionForm";
import { CustomCollectionServiceDetail } from "../../src/components/custom-collection/CustomCollectionServiceDetail";
import {
  COLLECTION_METHOD_OPTIONS,
  DATA_TYPE_OPTIONS,
  FORMAT_OPTIONS,
  GEOGRAPHY_OPTIONS,
  INDUSTRY_OPTIONS,
  LANGUAGE_OPTIONS,
  EMPTY_CUSTOM_COLLECTION_INPUT,
} from "../../src/components/custom-collection/customCollectionUtils";
import {
  DashboardPage,
  DashboardPageHeader,
  DashboardWorkspace,
} from "../../src/components/dashboard";
import type {
  ProposalDetailsResponse,
  DatasetPricingVersion,
} from "../../src/types/dataset-proposal.types";
import type {
  DatasetDetailsResponse,
  ListDatasetsResponse,
} from "../../src/types/dataset.types";
import type {
  CustomCollectionRevisionInput,
  CustomCollectionRevision,
  CustomCollectionServiceDetailResponse,
} from "../../src/types/custom-collection.types";

export const fixtureId = "c000000000000000000000321";
export const stamp = "2026-10-18T00:00:00.000Z";
const category = {
  id: "detail-category",
  name: "Research and observations",
  createdAt: stamp,
  createdBy: "fixture",
};
export const categoryFixtures = [
  category,
  ...Array.from({ length: 19 }, (_, index) => ({
    ...category,
    id: `secondary-${index}`,
    name: `Additional category ${String(index + 1).padStart(2, "0")}`,
  })),
];
export const datasetInventoryFixture: ListDatasetsResponse = {
  page: 1,
  pageSize: 10,
  total: 4,
  summary: {
    total: 4,
    byStatus: {
      SUBMITTED: 1,
      UNDER_REVIEW: 0,
      VERIFIED: 1,
      PUBLISHED: 0,
      DELISTED: 1,
      ARCHIVED: 1,
    },
    byVisibility: { PUBLIC: 4, PRIVATE: 0, UNLISTED: 0 },
  },
  items: (["SUBMITTED", "VERIFIED", "DELISTED", "ARCHIVED"] as const).map(
    (status, index) => ({
      id: `c${String(index + 400).padStart(24, "0")}`,
      datasetUniqueId: `D0000000${index + 400}`,
      title: `Collection ${status.toLowerCase()}`,
      status,
      visibility: "PUBLIC",
      publishedAt: null,
      publishedUploadId: null,
      updatedAt: stamp,
      rating: null,
      reviewCount: 0,
    })
  ),
};
export const proposalInventoryFixture =
  DatasetSupplierProposalsResponseSchema.parse({
    page: 1,
    pageSize: 10,
    total: 4,
    summary: {
      total: 4,
      byVerificationStatus: {
        SUBMITTED: 1,
        UNDER_REVIEW: 1,
        CHANGES_REQUESTED: 0,
        RESUBMITTED: 0,
        VERIFIED: 1,
        REJECTED: 1,
      },
    },
    items: (["SUBMITTED", "UNDER_REVIEW", "REJECTED", "VERIFIED"] as const).map(
      (verificationStatus, index) => ({
        id: `c${String(index + 500).padStart(24, "0")}`,
        datasetUniqueId: `D0000000${index + 500}`,
        title: `Proposal ${verificationStatus.toLowerCase()}`,
        verificationStatus,
        status: verificationStatus === "VERIFIED" ? "VERIFIED" : "SUBMITTED",
        primaryCategory: null,
        createdAt: stamp,
        updatedAt: stamp,
        material: { representation: "LEGACY", currentUploadId: null },
      })
    ),
  });
const source = {
  id: "detail-source",
  name: "Supplier collection",
  description: "Supplier-declared source for a visual fixture.",
  websiteUrl: "https://example.test/source",
  createdBy: "fixture",
  createdByType: "SUPPLIER",
  isVerified: true,
  createdAt: stamp,
  updatedAt: stamp,
};
const about = {
  overview: "A populated collection with detailed metadata.",
  description: "A long description for the supplier detail view. ".repeat(12),
  dataQuality: "Supplier-declared quality notes.",
  useCases: "Research and comparison.",
  limitations: "Synthetic visual fixture only.",
  methodology: "Structured collection with documented coverage.",
  updatedAt: stamp,
};
const format = {
  fileFormat: "CSV" as const,
  rows: 200,
  cols: 3,
  fileSize: "12000",
  compressionType: "NONE" as const,
  encoding: "UTF-8" as const,
  updatedAt: stamp,
};
const features = [
  {
    id: "feature-one",
    name: "observation_id",
    dataType: "string",
    description: "A supplier-defined observation identifier.",
    isNullable: false,
  },
  {
    id: "feature-two",
    name: "measurement",
    dataType: "number",
    description: "A measurement with documented units.",
    isNullable: true,
  },
];
const upload = {
  id: "detail-upload",
  status: "UPLOADED" as const,
  originalFileName: "observations-and-documentation.csv",
  contentType: "text/csv",
  sizeBytes: "12000",
  updatedAt: stamp,
};
const location = {
  country: "India",
  state: "Maharashtra",
  city: "Pune",
  region: "Western India",
  coordinates: "18.5204, 73.8567",
  coverage: "A defined synthetic collection boundary.",
  updatedAt: stamp,
};
export function proposalFixture(view = "proposal"): ProposalDetailsResponse {
  const rejected = view === "rejected",
    submitted = view === "submitted",
    correction = view === "correction";
  return {
    dataset: {
      id: fixtureId,
      datasetUniqueId: "D0000000321",
      status: rejected ? "REJECTED" : "SUBMITTED",
      title: "Detailed supplier collection " + "with context ".repeat(6),
      superType: "CROSS_SECTIONAL",
      primaryCategoryId: category.id,
      sourceId: source.id,
      license: "CC-BY-4.0",
      visibility: "PUBLIC",
      isSample: false,
      isPaid: true,
      price: "1000",
      currency: "INR",
      updatedAt: stamp,
    },
    verification: {
      id: "detail-verification",
      status: rejected
        ? "REJECTED"
        : submitted
          ? "SUBMITTED"
          : correction
            ? "CHANGES_REQUESTED"
            : "PENDING",
      notes: correction
        ? "Clarify coverage and measurement units before resubmission."
        : null,
      rejectionReason: rejected
        ? "The declared collection boundary needs correction."
        : null,
      currentUploadId: upload.id,
      updatedAt: stamp,
    },
    currentUpload: upload,
    sampleUpload: {
      ...upload,
      id: "detail-sample",
      originalFileName: "sample.csv",
    },
    aboutDatasetInfo: about,
    dataFormatInfo: format,
    features,
    primaryCategory: category,
    secondaryCategories: [
      { ...category, id: "detail-secondary", name: "Secondary research" },
    ],
    source,
    locationInfo: location,
    tags: [
      "observations",
      "research",
      "a-long-descriptive-tag-for-testing-detail-layout",
    ],
  };
}
export function datasetFixture(view = "published"): DatasetDetailsResponse {
  const status =
    view === "edit-correction"
      ? "SUBMITTED"
      : view === "delisted" || view === "edit" || view === "edit-locked"
        ? "DELISTED"
        : view === "archived"
          ? "ARCHIVED"
          : view === "verified"
            ? "VERIFIED"
            : "PUBLISHED";
  return {
    dataset: {
      id: fixtureId,
      datasetUniqueId: "D0000000321",
      title: "Detailed supplier collection " + "with context ".repeat(6),
      rating: "4.5",
      reviewCount: 3,
      status,
      visibility: "PUBLIC",
      isSample: false,
      isPaid: true,
      price: "1000",
      currency: "INR",
      license: "CC-BY-4.0",
      publishedUploadId: upload.id,
      publishedAt: stamp,
      archivedAt: status === "ARCHIVED" ? stamp : null,
      updatedAt: stamp,
    },
    aboutDatasetInfo: about,
    dataFormatInfo: format,
    features,
    primaryCategory: category,
    secondaryCategories: [
      { ...category, id: "detail-secondary", name: "Secondary research" },
    ],
    source,
    locationInfo: location,
    tags: [
      "observations",
      "research",
      "a-long-descriptive-tag-for-testing-detail-layout",
    ],
    verification: {
      id: "detail-verification",
      status: ["edit-correction", "edit-locked"].includes(view)
        ? "CHANGES_REQUESTED"
        : "VERIFIED",
      notes: ["edit-correction", "edit-locked"].includes(view)
        ? "Clarify the methodology before resubmitting."
        : null,
      rejectionReason: null,
      updatedAt: stamp,
    },
    publishedUpload: { ...upload, status: "PROMOTED", scope: "FINAL" },
  };
}
export const pricingFixture: DatasetPricingVersion = {
  id: "detail-pricing",
  datasetId: fixtureId,
  status: "ACTIVE",
  isPaid: true,
  price: "1000",
  currency: "INR",
  notes: "Supplier pricing notes.",
  changeRationale: null,
  rejectionReason: null,
  submittedAt: stamp,
  approvedAt: stamp,
  updatedAt: stamp,
};
const first = (values: Array<{ value: string }>) =>
  values.find((v) => v.value !== "OTHER")!.value;
const service: CustomCollectionRevisionInput = {
  ...EMPTY_CUSTOM_COLLECTION_INPUT,
  title: "Detailed collection service",
  shortDescription:
    "A complete service overview for the supplier review screen.",
  description:
    "A detailed description of the collection, delivery and expected output. ".repeat(
      5
    ),
  primaryCategoryId: category.id,
  collectionMethods: [first(COLLECTION_METHOD_OPTIONS)],
  dataTypes: [first(DATA_TYPE_OPTIONS)],
  supportedFormats: [first(FORMAT_OPTIONS)],
  industries: [first(INDUSTRY_OPTIONS)],
  geographies: [first(GEOGRAPHY_OPTIONS)],
  languages: [first(LANGUAGE_OPTIONS)],
  estimatedTurnaroundMinDays: 7,
  estimatedTurnaroundMaxDays: 14,
  deliverables: "Structured files, annotations and documentation.",
  qualityAssurance: "Supplier-defined quality checks and documented sampling.",
  complianceNotes: "Synthetic UI fixture; no real customer material.",
};
export function serviceFixture(
  view: string
): CustomCollectionServiceDetailResponse {
  const revision: CustomCollectionRevision = {
    ...service,
    id: "fixture-service-revision",
    serviceId: fixtureId,
    version: 1,
    status: "APPROVED",
    primaryCategory: category,
    secondaryCategories: [],
    coverImage: null,
    submittedAt: stamp,
    reviewStartedAt: stamp,
    reviewedAt: stamp,
    reviewedById: null,
    reviewedBy: null,
    approvedAt: stamp,
    publishedAt: stamp,
    createdAt: stamp,
    updatedAt: stamp,
  };
  const working: CustomCollectionRevision = {
    ...revision,
    id: "fixture-service-correction",
    version: 2,
    status: "CHANGES_REQUESTED",
    approvedAt: null,
    publishedAt: null,
  };
  return {
    service: {
      id: fixtureId,
      slug: "fixture-service",
      isPublished: true,
      publishedAt: stamp,
      unpublishedAt: null,
      archivedAt: null,
      supplier: {
        id: "fixture-supplier",
        displayName: "Fixture supplier",
        contactEmail: null,
        logoUrl: null,
      },
      workingRevision: view === "service-edit" ? working : null,
      publishedRevision: revision,
      createdAt: stamp,
      updatedAt: stamp,
    },
    history: [
      {
        id: "fixture-service-review",
        serviceId: fixtureId,
        revisionId: working.id,
        revisionVersion: 2,
        fromStatus: "SUBMITTED",
        toStatus: "CHANGES_REQUESTED",
        action: "REQUEST_CHANGES",
        note: "Clarify the collection boundary.",
        actorId: null,
        actorNameSnapshot: "Fixture reviewer",
        actorEmailSnapshot: "reviewer@example.test",
        actorUserTypeSnapshot: "ADMIN",
        createdAt: stamp,
      },
    ],
  };
}
export function SupplierDetailsFixture({
  view,
  dark,
}: {
  view: string;
  dark: boolean;
}) {
  let content;
  if (["proposal", "submitted", "correction", "rejected"].includes(view))
    content = (
      <DatasetDetail
        proposal={proposalFixture(view)}
        isDark={dark}
        onRefresh={() => {}}
      />
    );
  else if (["edit", "edit-correction", "edit-locked"].includes(view))
    content = <DelistedDatasetEdit datasetId={fixtureId} />;
  else if (view === "create") content = <CreateDataset isDark={dark} />;
  else if (["inventory", "inventory-delisted"].includes(view))
    content = <MyDatasets isDark={dark} />;
  else if (view === "inventory-proposals")
    content = <SubmittedProposals isDark={dark} />;
  else if (view === "service-create") content = <CustomCollectionCreateView />;
  else if (["service-detail", "service-edit"].includes(view))
    content = <CustomCollectionServiceDetail serviceId={fixtureId} />;
  else if (view === "service-review")
    content = (
      <DashboardPage>
        <DashboardPageHeader title="Review collection service" />
        <DashboardWorkspace>
          <CustomCollectionForm
            initialValues={service}
            categoryOptions={[category]}
            loadCategories={false}
            submitLabel="Save draft"
            onSubmit={async () => {
              throw Error("This visual fixture never submits");
            }}
          />
        </DashboardWorkspace>
      </DashboardPage>
    );
  else content = <MyDatasetDetail datasetId={fixtureId} isDark={dark} />;
  return <QueryProvider>{content}</QueryProvider>;
}
