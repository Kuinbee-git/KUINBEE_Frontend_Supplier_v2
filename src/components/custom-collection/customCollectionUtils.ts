import { z } from "zod";

import type {
  CustomCollectionRevision,
  CustomCollectionRevisionInput,
  CustomCollectionRevisionStatus,
} from "@/types/custom-collection.types";

export interface CustomCollectionOption {
  value: string;
  label: string;
  description?: string;
}

export const COLLECTION_METHOD_OPTIONS: CustomCollectionOption[] = [
  { value: "SURVEYS", label: "Surveys" },
  { value: "INTERVIEWS", label: "Interviews" },
  { value: "FOCUS_GROUPS", label: "Focus groups" },
  { value: "FIELD_OBSERVATION", label: "Field observation" },
  { value: "WEB_SCRAPING", label: "Web scraping" },
  { value: "API_INTEGRATION", label: "API integration" },
  { value: "SENSOR_IOT", label: "Sensors and IoT" },
  { value: "IMAGE_VIDEO_CAPTURE", label: "Image and video capture" },
  { value: "AUDIO_COLLECTION", label: "Audio collection" },
  { value: "DOCUMENT_DIGITIZATION", label: "Document digitization" },
  { value: "CROWDSOURCING", label: "Crowdsourcing" },
  { value: "TRANSACTIONAL_INTEGRATION", label: "Transactional integration" },
  { value: "OTHER", label: "Other" },
];

export const DATA_TYPE_OPTIONS: CustomCollectionOption[] = [
  { value: "TABULAR", label: "Tabular" },
  { value: "TEXT", label: "Text" },
  { value: "IMAGE", label: "Images" },
  { value: "VIDEO", label: "Video" },
  { value: "AUDIO", label: "Audio" },
  { value: "GEOSPATIAL", label: "Geospatial" },
  { value: "TIME_SERIES", label: "Time series" },
  { value: "SENSOR", label: "Sensor" },
  { value: "TRANSACTIONAL", label: "Transactional" },
  { value: "DOCUMENT", label: "Documents" },
  { value: "OTHER", label: "Other" },
];

export const FORMAT_OPTIONS: CustomCollectionOption[] = [
  { value: "CSV", label: "CSV" },
  { value: "JSON", label: "JSON" },
  { value: "EXCEL", label: "Excel" },
  { value: "PARQUET", label: "Parquet" },
  { value: "SQL", label: "SQL" },
  { value: "XML", label: "XML" },
  { value: "API", label: "API delivery" },
  { value: "IMAGES", label: "Image files" },
  { value: "AUDIO", label: "Audio files" },
  { value: "VIDEO", label: "Video files" },
  { value: "OTHER", label: "Other" },
];

export const INDUSTRY_OPTIONS: CustomCollectionOption[] = [
  { value: "HEALTHCARE", label: "Healthcare" },
  { value: "FINANCE", label: "Finance" },
  { value: "RETAIL", label: "Retail" },
  { value: "TECHNOLOGY", label: "Technology" },
  { value: "EDUCATION", label: "Education" },
  { value: "GOVERNMENT", label: "Government" },
  { value: "REAL_ESTATE", label: "Real estate" },
  { value: "AGRICULTURE", label: "Agriculture" },
  { value: "MANUFACTURING", label: "Manufacturing" },
  { value: "MEDIA", label: "Media" },
  { value: "ENERGY", label: "Energy" },
  { value: "TRANSPORT_LOGISTICS", label: "Transport and logistics" },
  { value: "RESEARCH", label: "Research" },
  { value: "OTHER", label: "Other" },
];

export const GEOGRAPHY_OPTIONS: CustomCollectionOption[] = [
  { value: "INDIA", label: "India" },
  { value: "SOUTH_ASIA", label: "South Asia" },
  { value: "ASIA_PACIFIC", label: "Asia Pacific" },
  { value: "MIDDLE_EAST", label: "Middle East" },
  { value: "EUROPE", label: "Europe" },
  { value: "NORTH_AMERICA", label: "North America" },
  { value: "SOUTH_AMERICA", label: "South America" },
  { value: "AFRICA", label: "Africa" },
  { value: "GLOBAL", label: "Global" },
  { value: "OTHER", label: "Other" },
];

export const LANGUAGE_OPTIONS: CustomCollectionOption[] = [
  { value: "ENGLISH", label: "English" },
  { value: "HINDI", label: "Hindi" },
  { value: "MARATHI", label: "Marathi" },
  { value: "BENGALI", label: "Bengali" },
  { value: "TAMIL", label: "Tamil" },
  { value: "TELUGU", label: "Telugu" },
  { value: "GUJARATI", label: "Gujarati" },
  { value: "KANNADA", label: "Kannada" },
  { value: "MALAYALAM", label: "Malayalam" },
  { value: "PUNJABI", label: "Punjabi" },
  { value: "MULTILINGUAL", label: "Multilingual" },
  { value: "OTHER", label: "Other" },
];

const optionValues = (options: CustomCollectionOption[]) =>
  options.map(({ value }) => value) as [string, ...string[]];

const optionalOther = z.string().trim().min(1).max(200).nullable();

export const customCollectionFormSchema = z
  .object({
    title: z.string().trim().min(5, "Enter at least 5 characters.").max(120),
    shortDescription: z
      .string()
      .trim()
      .min(30, "Enter at least 30 characters.")
      .max(240),
    description: z
      .string()
      .trim()
      .min(100, "Enter at least 100 characters.")
      .max(5000),
    primaryCategoryId: z.string().min(1, "Select a primary category."),
    secondaryCategoryIds: z.array(z.string()).max(10),
    collectionMethods: z
      .array(z.enum(optionValues(COLLECTION_METHOD_OPTIONS)))
      .min(1),
    collectionMethodsOther: optionalOther,
    dataTypes: z.array(z.enum(optionValues(DATA_TYPE_OPTIONS))).min(1),
    dataTypesOther: optionalOther,
    supportedFormats: z.array(z.enum(optionValues(FORMAT_OPTIONS))).min(1),
    supportedFormatsOther: optionalOther,
    industries: z.array(z.enum(optionValues(INDUSTRY_OPTIONS))).min(1),
    industriesOther: optionalOther,
    geographies: z.array(z.enum(optionValues(GEOGRAPHY_OPTIONS))).min(1),
    geographiesOther: optionalOther,
    languages: z.array(z.enum(optionValues(LANGUAGE_OPTIONS))).min(1),
    languagesOther: optionalOther,
    estimatedTurnaroundMinDays: z.number().int().min(1).max(365),
    estimatedTurnaroundMaxDays: z.number().int().min(1).max(365),
    deliverables: z
      .string()
      .trim()
      .min(20, "Enter at least 20 characters.")
      .max(3000),
    qualityAssurance: z
      .string()
      .trim()
      .min(20, "Enter at least 20 characters.")
      .max(3000),
    complianceNotes: z.string().trim().max(3000).nullable(),
  })
  .superRefine((value, context) => {
    if (value.estimatedTurnaroundMinDays > value.estimatedTurnaroundMaxDays) {
      context.addIssue({
        code: "custom",
        path: ["estimatedTurnaroundMaxDays"],
        message: "Maximum turnaround cannot be less than minimum turnaround.",
      });
    }

    if (value.secondaryCategoryIds.includes(value.primaryCategoryId)) {
      context.addIssue({
        code: "custom",
        path: ["secondaryCategoryIds"],
        message: "The primary category cannot also be a secondary category.",
      });
    }

    const otherFields: Array<
      [keyof CustomCollectionRevisionInput, keyof CustomCollectionRevisionInput]
    > = [
      ["collectionMethods", "collectionMethodsOther"],
      ["dataTypes", "dataTypesOther"],
      ["supportedFormats", "supportedFormatsOther"],
      ["industries", "industriesOther"],
      ["geographies", "geographiesOther"],
      ["languages", "languagesOther"],
    ];

    for (const [valuesField, otherField] of otherFields) {
      const selected = value[valuesField] as string[];
      const other = value[otherField] as string | null;
      if (selected.includes("OTHER") && !other?.trim()) {
        context.addIssue({
          code: "custom",
          path: [otherField],
          message: "Describe the other option.",
        });
      }
    }
  });

export const EMPTY_CUSTOM_COLLECTION_INPUT: CustomCollectionRevisionInput = {
  title: "",
  shortDescription: "",
  description: "",
  primaryCategoryId: "",
  secondaryCategoryIds: [],
  collectionMethods: [],
  collectionMethodsOther: null,
  dataTypes: [],
  dataTypesOther: null,
  supportedFormats: [],
  supportedFormatsOther: null,
  industries: [],
  industriesOther: null,
  geographies: [],
  geographiesOther: null,
  languages: [],
  languagesOther: null,
  estimatedTurnaroundMinDays: 1,
  estimatedTurnaroundMaxDays: 30,
  deliverables: "",
  qualityAssurance: "",
  complianceNotes: null,
};

export const revisionToInput = (
  revision: CustomCollectionRevision
): CustomCollectionRevisionInput => ({
  title: revision.title,
  shortDescription: revision.shortDescription,
  description: revision.description,
  primaryCategoryId: revision.primaryCategory.id,
  secondaryCategoryIds: revision.secondaryCategories.map(({ id }) => id),
  collectionMethods: revision.collectionMethods,
  collectionMethodsOther: revision.collectionMethodsOther,
  dataTypes: revision.dataTypes,
  dataTypesOther: revision.dataTypesOther,
  supportedFormats: revision.supportedFormats,
  supportedFormatsOther: revision.supportedFormatsOther,
  industries: revision.industries,
  industriesOther: revision.industriesOther,
  geographies: revision.geographies,
  geographiesOther: revision.geographiesOther,
  languages: revision.languages,
  languagesOther: revision.languagesOther,
  estimatedTurnaroundMinDays: revision.estimatedTurnaroundMinDays,
  estimatedTurnaroundMaxDays: revision.estimatedTurnaroundMaxDays,
  deliverables: revision.deliverables,
  qualityAssurance: revision.qualityAssurance,
  complianceNotes: revision.complianceNotes,
});

export const STATUS_CONFIG: Record<
  CustomCollectionRevisionStatus,
  { label: string; description: string }
> = {
  DRAFT: {
    label: "Draft",
    description: "Complete the service details and submit when it is ready.",
  },
  SUBMITTED: {
    label: "Submitted",
    description: "Your service is waiting to be assigned to a reviewer.",
  },
  UNDER_REVIEW: {
    label: "Under review",
    description: "A Kuinbee reviewer is checking this revision.",
  },
  CHANGES_REQUESTED: {
    label: "Changes requested",
    description: "Review the feedback, update the draft, and resubmit it.",
  },
  RESUBMITTED: {
    label: "Resubmitted",
    description: "Your updated revision is waiting for another review.",
  },
  APPROVED: {
    label: "Approved",
    description:
      "This revision is approved. Choose whether to publish it in the marketplace.",
  },
  REJECTED: {
    label: "Rejected",
    description: "This revision was not approved for publication.",
  },
  SUPERSEDED: {
    label: "Previous version",
    description: "A newer approved revision has replaced this version.",
  },
};

export const labelForOption = (
  value: string,
  options?: CustomCollectionOption[]
) =>
  options?.find((option) => option.value === value)?.label ??
  value.replaceAll("_", " ");

export const formatDate = (value: string | null | undefined) =>
  value
    ? new Date(value).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Not yet";

export const latestReviewNote = (history: Array<{ note: string | null }>) =>
  [...history].reverse().find(({ note }) => Boolean(note?.trim()))?.note ??
  null;
