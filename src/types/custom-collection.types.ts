export type CustomCollectionRevisionStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "CHANGES_REQUESTED"
  | "RESUBMITTED"
  | "APPROVED"
  | "REJECTED"
  | "SUPERSEDED";

export type CustomCollectionAvailability = "ACTIVE" | "ARCHIVED";

export interface CustomCollectionCategory {
  id: string;
  name: string;
}

export interface CustomCollectionReviewer {
  id: string;
  email: string;
  displayName: string;
}

export interface CustomCollectionCoverImage {
  id: string;
  url: string;
  contentType: string;
  sizeBytes: string | null;
}

export interface CustomCollectionRevisionInput {
  title: string;
  shortDescription: string;
  description: string;
  primaryCategoryId: string;
  secondaryCategoryIds: string[];
  collectionMethods: string[];
  collectionMethodsOther: string | null;
  dataTypes: string[];
  dataTypesOther: string | null;
  supportedFormats: string[];
  supportedFormatsOther: string | null;
  industries: string[];
  industriesOther: string | null;
  geographies: string[];
  geographiesOther: string | null;
  languages: string[];
  languagesOther: string | null;
  estimatedTurnaroundMinDays: number;
  estimatedTurnaroundMaxDays: number;
  deliverables: string;
  qualityAssurance: string;
  complianceNotes: string | null;
}

export interface CustomCollectionRevision {
  id: string;
  serviceId: string;
  version: number;
  status: CustomCollectionRevisionStatus;
  title: string;
  shortDescription: string;
  description: string;
  primaryCategory: CustomCollectionCategory;
  secondaryCategories: CustomCollectionCategory[];
  collectionMethods: string[];
  collectionMethodsOther: string | null;
  dataTypes: string[];
  dataTypesOther: string | null;
  supportedFormats: string[];
  supportedFormatsOther: string | null;
  industries: string[];
  industriesOther: string | null;
  geographies: string[];
  geographiesOther: string | null;
  languages: string[];
  languagesOther: string | null;
  estimatedTurnaroundMinDays: number;
  estimatedTurnaroundMaxDays: number;
  deliverables: string;
  qualityAssurance: string;
  complianceNotes: string | null;
  coverImage: CustomCollectionCoverImage | null;
  submittedAt: string | null;
  reviewStartedAt: string | null;
  reviewedAt: string | null;
  reviewedById: string | null;
  reviewedBy: CustomCollectionReviewer | null;
  approvedAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CustomCollectionService {
  id: string;
  slug: string;
  isPublished: boolean;
  publishedAt: string | null;
  unpublishedAt: string | null;
  archivedAt: string | null;
  supplier: {
    id: string;
    displayName: string;
    contactEmail: string | null;
    logoUrl: string | null;
  };
  publishedRevision: CustomCollectionRevision | null;
  workingRevision: CustomCollectionRevision | null;
  createdAt: string;
  updatedAt: string;
}

export interface CustomCollectionReviewEvent {
  id: string;
  serviceId: string;
  revisionId: string;
  revisionVersion: number;
  fromStatus: CustomCollectionRevisionStatus | null;
  toStatus: CustomCollectionRevisionStatus;
  action: string;
  note: string | null;
  actorId: string | null;
  actorNameSnapshot: string;
  actorEmailSnapshot: string;
  actorUserTypeSnapshot: string;
  createdAt: string;
}

export interface CustomCollectionListQuery {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: CustomCollectionRevisionStatus;
  availability?: CustomCollectionAvailability;
}

export interface CustomCollectionListResponse {
  items: CustomCollectionService[];
  page: number;
  pageSize: number;
  total: number;
}

export interface CustomCollectionServiceDetailResponse {
  service: CustomCollectionService;
  history: CustomCollectionReviewEvent[];
}

export interface CustomCollectionApiError extends Error {
  status: number;
  code: string;
  details?: unknown;
}
