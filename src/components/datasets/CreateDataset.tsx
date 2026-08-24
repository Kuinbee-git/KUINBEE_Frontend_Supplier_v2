"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  DashboardButton,
  DashboardCard,
  DashboardDialog,
  DashboardDialogContent,
  DashboardFormActions,
  DashboardInlineAlert,
  DashboardProgress,
} from "@/components/dashboard";
import { getDatasetThemeTokens } from "@/constants/dataset.constants";
import {
  FileText,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Upload,
  RotateCcw,
} from "lucide-react";
import {
  createDatasetProposal,
  discardDraftProposal,
  updateProposalMetadata,
  upsertAboutInfo,
  upsertDataFormatInfo,
  replaceFeatures,
  upsertProposalPricing,
  getProposalDetails,
  upsertLocationInfo,
  setProposalTags,
} from "@/lib/api";
import {
  BasicInfoStep,
  AboutStep,
  DataFormatStep,
  FeaturesStep,
  PricingStep,
  ReviewStep,
} from "./create-steps";
import { DatasetUploadFlow } from "./DatasetUploadFlow";
import { DatasetPageHeader, DatasetWorkspace } from "./workspace";
import { useDraftProposal } from "@/hooks/useDraftProposal";
import type {
  Currency,
  DatasetSuperType,
  SampleDeliveryMechanism,
  UpsertAboutInfoRequest,
  UpsertLocationInfoRequest,
  UpsertDataFormatRequest,
  Feature,
  FileFormat,
  UpsertPricingRequest,
} from "@/types/dataset-proposal.types";
import type { Source } from "@/types/catalog.types";

interface CreateDatasetProps {
  isDark?: boolean;
}

interface BasicFormData {
  title: string;
  superType: DatasetSuperType | "";
  primaryCategoryId: string;
  sourceId: string;
  license: string;
  isSample: boolean;
  sampleNotes: {
    whySample: string;
    actualDataSize: string;
    completeness: string;
    deliveryMechanism: SampleDeliveryMechanism | "";
    deliveryMechanismNotes: string;
  };
  actualPrice: string;
  actualPriceCurrency: Currency;
  isNegotiable: boolean | null;
}

interface LocationFormData {
  country: string;
  state: string;
  city: string;
  region: string;
  coordinates: string;
  coverage: string;
}

type FormatFormData = Omit<UpsertDataFormatRequest, "fileFormat"> & {
  fileFormat: FileFormat | "";
};

type Step =
  | "basic"
  | "about"
  | "format"
  | "features"
  | "pricing"
  | "upload"
  | "review";

interface SavedDraftProposal {
  basicData?: Partial<BasicFormData>;
  aboutData?: UpsertAboutInfoRequest;
  locationData?: Partial<LocationFormData>;
  tagsText?: string;
  formatData?: FormatFormData;
  features?: Feature[];
  pricingData?: UpsertPricingRequest;
  createdProposalId?: string;
  currentStep?: Step;
  fileUploaded?: boolean;
  sampleFileUploaded?: boolean;
}

interface ApiErrorLike {
  message?: string;
  code?: string;
}

function asApiError(error: unknown): ApiErrorLike {
  return error && typeof error === "object" ? (error as ApiErrorLike) : {};
}

const DEFAULT_BASIC_DATA: BasicFormData = {
  title: "",
  superType: "" as DatasetSuperType | "",
  primaryCategoryId: "",
  sourceId: "",
  license: "",
  isSample: false,
  sampleNotes: {
    whySample: "",
    actualDataSize: "",
    completeness: "",
    deliveryMechanism: "",
    deliveryMechanismNotes: "",
  },
  actualPrice: "",
  actualPriceCurrency: "USD",
  isNegotiable: null,
};

const DEFAULT_LOCATION_DATA: LocationFormData = {
  country: "",
  state: "",
  city: "",
  region: "",
  coordinates: "",
  coverage: "",
};

function normalizeBasicData(input: unknown): BasicFormData {
  const raw =
    input && typeof input === "object"
      ? (input as Partial<BasicFormData> & { actualPrice?: unknown })
      : {};

  return {
    ...DEFAULT_BASIC_DATA,
    ...raw,
    isSample: raw.isSample === true,
    sampleNotes: {
      ...DEFAULT_BASIC_DATA.sampleNotes,
      ...(raw.sampleNotes ?? {}),
    },
    actualPrice:
      typeof raw.actualPrice === "string"
        ? raw.actualPrice
        : raw.actualPrice != null
          ? String(raw.actualPrice)
          : "",
    actualPriceCurrency: raw.actualPriceCurrency ?? "USD",
    isNegotiable:
      raw.isNegotiable === true
        ? true
        : raw.isNegotiable === false
          ? false
          : null,
  };
}

const SAMPLE_FREE_PRICING: UpsertPricingRequest = {
  isPaid: false,
  price: null,
  currency: "USD",
};

export function CreateDataset({ isDark = false }: CreateDatasetProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>("basic");
  const [createdProposalId, setCreatedProposalId] = useState<string | null>(
    null
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [sampleUploadDialogOpen, setSampleUploadDialogOpen] = useState(false);
  const [startOverDialogOpen, setStartOverDialogOpen] = useState(false);
  const [startOverError, setStartOverError] = useState<string | null>(null);
  const [fileUploaded, setFileUploaded] = useState(false);
  const [sampleFileUploaded, setSampleFileUploaded] = useState(false);

  // Step 1: Basic Info
  const [basicData, setBasicData] = useState<BasicFormData>(DEFAULT_BASIC_DATA);

  // Step 2: About Dataset
  const [aboutData, setAboutData] = useState<UpsertAboutInfoRequest>({
    overview: "",
    description: "",
    dataQuality: "",
    useCases: null,
    limitations: null,
    methodology: null,
  });
  const [locationData, setLocationData] = useState<LocationFormData>(
    DEFAULT_LOCATION_DATA
  );
  const [tagsText, setTagsText] = useState("");

  // Step 3: Data Format
  const [formatData, setFormatData] = useState<FormatFormData>({
    fileFormat: "",
    fileSize: "",
    rows: 0,
    cols: 0,
    compressionType: undefined,
    encoding: "UTF-8",
  });

  // Step 4: Features
  const [features, setFeatures] = useState<Feature[]>([
    { name: "", dataType: "", description: null, isNullable: false },
  ]);

  // Step 5: Pricing
  const [pricingData, setPricingData] = useState<UpsertPricingRequest>({
    isPaid: false,
    price: null,
    currency: "USD",
  });
  // Draft management
  const { loadDraft, saveDraft, clearDraft, isDraftStorageReady } =
    useDraftProposal();
  const [draftLoaded, setDraftLoaded] = useState(false);

  const tokens = getDatasetThemeTokens(isDark);

  // Load draft on mount
  useEffect(() => {
    if (draftLoaded || !isDraftStorageReady) return;

    const draft = loadDraft() as SavedDraftProposal | null;
    if (draft) {
      const restoreDraft = (d: SavedDraftProposal) => {
        if (d.basicData) setBasicData(normalizeBasicData(d.basicData));
        if (d.aboutData) setAboutData(d.aboutData);
        if (d.locationData)
          setLocationData({
            ...DEFAULT_LOCATION_DATA,
            ...d.locationData,
          });
        if (typeof d.tagsText === "string") setTagsText(d.tagsText);
        if (d.formatData) setFormatData(d.formatData);
        if (d.features && d.features.length > 0) setFeatures(d.features);
        if (d.pricingData) setPricingData(d.pricingData);
        if (d.createdProposalId) setCreatedProposalId(d.createdProposalId);
        if (d.currentStep) setCurrentStep(d.currentStep as Step);
        if (d.fileUploaded) setFileUploaded(d.fileUploaded);
        if (d.sampleFileUploaded) setSampleFileUploaded(d.sampleFileUploaded);

        // Only show toast if the draft actually contains meaningful progress
        if (
          d.createdProposalId ||
          d.currentStep !== "basic" ||
          (d.basicData && d.basicData.title)
        ) {
          toast.success("Draft proposal restored!");
        }

        setDraftLoaded(true);
      };

      if (draft.createdProposalId) {
        // Proactively verify the drafted dataset is still editable
        getProposalDetails(draft.createdProposalId)
          .then((res) => {
            if (res.verification.status !== "PENDING") {
              clearDraft();
              setDraftLoaded(true);
            } else {
              restoreDraft({
                ...draft,
                fileUploaded:
                  res.currentUpload?.status === "UPLOADED" ||
                  res.currentUpload?.status === "PROMOTED",
                sampleFileUploaded:
                  res.sampleUpload?.status === "UPLOADED" ||
                  res.sampleUpload?.status === "PROMOTED",
              });
            }
          })
          .catch((err) => {
            console.error(
              "Failed to verify draft proposal. Restoring local draft.",
              err
            );
            restoreDraft(draft);
            setError(
              "Your locally saved draft was restored, but its server status could not be verified. Check your connection before saving the next step."
            );
          });
      } else {
        restoreDraft(draft);
      }
    } else {
      setDraftLoaded(true);
    }
  }, [clearDraft, draftLoaded, isDraftStorageReady, loadDraft]);

  // Auto-save draft whenever form data changes
  useEffect(() => {
    if (!draftLoaded || !isDraftStorageReady) return;

    const draftData = {
      basicData,
      aboutData,
      locationData,
      tagsText,
      formatData,
      features,
      pricingData,
      createdProposalId,
      currentStep,
      fileUploaded,
      sampleFileUploaded,
    };

    saveDraft(draftData);
  }, [
    draftLoaded,
    isDraftStorageReady,
    basicData,
    aboutData,
    locationData,
    tagsText,
    formatData,
    features,
    pricingData,
    createdProposalId,
    currentStep,
    fileUploaded,
    sampleFileUploaded,
    saveDraft,
  ]);

  const steps = [
    { id: "basic" as Step, label: "Basic Info", number: 1 },
    { id: "about" as Step, label: "About Dataset", number: 2 },
    { id: "format" as Step, label: "Data Format", number: 3 },
    { id: "features" as Step, label: "Features", number: 4 },
    { id: "pricing" as Step, label: "Pricing", number: 5 },
    { id: "upload" as Step, label: "Upload File", number: 6 },
    { id: "review" as Step, label: "Review Draft", number: 7 },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);
  const isLastStep = currentStepIndex === steps.length - 1;

  const isBasicValid = () => {
    const baseFieldsValid =
      basicData.title.trim() !== "" &&
      basicData.superType !== "" &&
      basicData.primaryCategoryId !== "" &&
      basicData.sourceId !== "" &&
      basicData.license !== "";

    if (!baseFieldsValid) return false;
    if (!basicData.isSample) return true;

    const parsedActualPrice = Number.parseInt(basicData.actualPrice, 10);
    const hasValidActualPrice =
      Number.isInteger(parsedActualPrice) && parsedActualPrice >= 0;
    const deliveryMechanism = basicData.sampleNotes.deliveryMechanism;

    if (!basicData.sampleNotes.whySample.trim()) return false;
    if (!basicData.sampleNotes.actualDataSize.trim()) return false;
    if (!deliveryMechanism) return false;
    if (!hasValidActualPrice) return false;
    if (!basicData.actualPriceCurrency) return false;
    if (basicData.isNegotiable === null) return false;
    if (
      deliveryMechanism === "OTHER" &&
      !basicData.sampleNotes.deliveryMechanismNotes.trim()
    )
      return false;

    return true;
  };

  const isAboutValid = () => {
    return (
      (aboutData.overview?.trim() ?? "") !== "" &&
      (aboutData.description?.trim() ?? "") !== "" &&
      (aboutData.dataQuality?.trim() ?? "") !== "" &&
      locationData.country.trim() !== ""
    );
  };

  const isFormatValid = () => {
    return (
      formatData.fileFormat !== "" &&
      formatData.fileSize.trim() !== "" &&
      formatData.rows > 0 &&
      formatData.cols > 0
    );
  };

  const isFeaturesValid = () => {
    return (
      features.length > 0 &&
      features.every((f) => f.name.trim() !== "" && f.dataType.trim() !== "")
    );
  };

  const isPricingValid = () => {
    if (basicData.isSample) return true;
    if (!pricingData.isPaid) return true; // Free datasets don't need a price
    return !!(pricingData.price && pricingData.price.trim() !== "");
  };

  useEffect(() => {
    if (!basicData.isSample) return;

    setPricingData((prev) => {
      if (
        prev.isPaid === false &&
        (prev.price == null || prev.price === "") &&
        prev.currency === "USD"
      ) {
        return prev;
      }
      return { ...SAMPLE_FREE_PRICING };
    });
  }, [basicData.isSample]);

  useEffect(() => {
    if (basicData.isSample || !pricingData.isPaid) {
      setSampleFileUploaded(false);
    }
  }, [basicData.isSample, pricingData.isPaid]);

  const handleBasicChange = (field: string, value: string | boolean | null) => {
    setBasicData((prev) => {
      if (field.startsWith("sampleNotes.")) {
        const nestedKey = field.replace(
          "sampleNotes.",
          ""
        ) as keyof BasicFormData["sampleNotes"];
        return {
          ...prev,
          sampleNotes: {
            ...(prev.sampleNotes ?? DEFAULT_BASIC_DATA.sampleNotes),
            [nestedKey]: value,
          },
        };
      }

      if (field === "isSample" && value === false) {
        return {
          ...prev,
          isSample: false,
          sampleNotes: { ...DEFAULT_BASIC_DATA.sampleNotes },
          actualPrice: DEFAULT_BASIC_DATA.actualPrice,
          actualPriceCurrency: DEFAULT_BASIC_DATA.actualPriceCurrency,
          isNegotiable: DEFAULT_BASIC_DATA.isNegotiable,
        };
      }

      return { ...prev, [field]: value };
    });
    setError(null);
  };

  const handleSourceCreated = useCallback((source: Source) => {
    // Source was created and auto-selected in SourcesSelect
    // We can show a success message or handle additional logic
    setSuccess(`Source "${source.name}" created successfully`);
    setTimeout(() => setSuccess(null), 3000);
  }, []);

  const handleAboutChange = (
    field: keyof UpsertAboutInfoRequest,
    value: string
  ) => {
    setAboutData((prev) => ({ ...prev, [field]: value || null }));
    setError(null);
  };

  const handleLocationChange = (field: string, value: string) => {
    setLocationData((prev) => ({
      ...prev,
      [field as keyof LocationFormData]: value,
    }));
    setError(null);
  };

  const parseTags = (raw: string) => {
    return Array.from(
      new Set(
        raw
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
      )
    );
  };

  const handleFormatChange = (
    field: string,
    value: string | number | undefined
  ) => {
    setFormatData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleFeatureChange = (
    index: number,
    field: keyof Feature,
    value: string | boolean | null
  ) => {
    const updated = [...features];
    updated[index] = { ...updated[index], [field]: value };
    setFeatures(updated);
    setError(null);
  };

  const addFeature = () => {
    setFeatures([
      ...features,
      { name: "", dataType: "", description: null, isNullable: false },
    ]);
  };

  const removeFeature = (index: number) => {
    if (features.length > 1) {
      setFeatures(features.filter((_, i) => i !== index));
    }
  };

  const handlePricingChange = (
    field: keyof UpsertPricingRequest,
    value: string | boolean | null | undefined
  ) => {
    if (basicData.isSample) {
      setPricingData({ ...SAMPLE_FREE_PRICING });
      setError(null);
      return;
    }
    setPricingData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleNext = async () => {
    setError(null);
    setSuccess(null);

    const handleApiError = (err: unknown, defaultMsg: string) => {
      console.error(defaultMsg, err);
      const apiError = asApiError(err);
      const errorMsg = apiError.message || defaultMsg;
      if (
        errorMsg.toLowerCase().includes("not editable") ||
        apiError.code === "INVALID_STATE"
      ) {
        setError(
          "This proposal is no longer editable because it has entered review. Your existing proposal was not changed or discarded; open it from your proposals list to see its current status."
        );
        return true;
      }
      setError(errorMsg);
      return false;
    };

    // Step 1: Create the basic proposal (or navigate if already created)
    if (currentStep === "basic") {
      if (!isBasicValid()) {
        setError("Please fill in all required fields");
        return;
      }

      const parsedActualPrice = Number.parseInt(basicData.actualPrice, 10);
      const basicPayload = {
        title: basicData.title,
        superType: basicData.superType as DatasetSuperType,
        primaryCategoryId: basicData.primaryCategoryId,
        sourceId: basicData.sourceId,
        license: basicData.license,
        isSample: basicData.isSample,
        ...(basicData.isSample
          ? {
              sampleNotes: {
                whySample: basicData.sampleNotes.whySample.trim(),
                actualDataSize: basicData.sampleNotes.actualDataSize.trim(),
                completeness:
                  basicData.sampleNotes.completeness.trim() || undefined,
                deliveryMechanism: basicData.sampleNotes
                  .deliveryMechanism as SampleDeliveryMechanism,
                deliveryMechanismNotes:
                  basicData.sampleNotes.deliveryMechanism === "OTHER"
                    ? basicData.sampleNotes.deliveryMechanismNotes.trim() ||
                      undefined
                    : undefined,
              },
              actualPrice: parsedActualPrice,
              actualPriceCurrency: basicData.actualPriceCurrency,
              isNegotiable: basicData.isNegotiable ?? false,
            }
          : {}),
      };

      // Reusing the existing draft must persist any edits made after navigating
      // back to Basic Info. Otherwise the UI and server proposal diverge.
      if (createdProposalId) {
        setSubmitting(true);
        try {
          await updateProposalMetadata(createdProposalId, basicPayload);
          setSuccess("Basic information saved!");
          setTimeout(() => {
            setSuccess(null);
            setCurrentStep("about");
          }, 500);
        } catch (err: unknown) {
          handleApiError(err, "Failed to update basic information");
        } finally {
          setSubmitting(false);
        }
        return;
      }

      // Only create new proposal if one doesn't exist yet
      setSubmitting(true);
      try {
        const response = await createDatasetProposal(basicPayload);

        setCreatedProposalId(response.dataset.id);
        setSuccess("Proposal created successfully!");
        setTimeout(() => {
          setSuccess(null);
          setCurrentStep("about");
        }, 1000);
      } catch (err: unknown) {
        console.error("Failed to create proposal:", err);
        setError(asApiError(err).message || "Failed to create proposal");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Step 2: Add About information
    if (currentStep === "about") {
      if (!isAboutValid()) {
        setError(
          "Please fill in all required fields (Overview, Description, Data Quality, Country)"
        );
        return;
      }

      if (!createdProposalId) {
        setError("No proposal ID found");
        return;
      }

      setSubmitting(true);
      try {
        await upsertAboutInfo(createdProposalId, aboutData);
        const locationPayload: UpsertLocationInfoRequest = {
          country: locationData.country.trim(),
          state: locationData.state.trim() || null,
          city: locationData.city.trim() || null,
          region: locationData.region.trim() || null,
          coordinates: locationData.coordinates.trim() || null,
          coverage: locationData.coverage.trim() || null,
        };
        await upsertLocationInfo(createdProposalId, locationPayload);
        await setProposalTags(createdProposalId, { tags: parseTags(tagsText) });
        setSuccess("About information saved!");
        setTimeout(() => {
          setSuccess(null);
          setCurrentStep("format");
        }, 1000);
      } catch (err: unknown) {
        handleApiError(err, "Failed to save about information");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Step 3: Add Data Format information
    if (currentStep === "format") {
      if (!isFormatValid()) {
        setError("Please fill in all required fields");
        return;
      }

      if (!createdProposalId) {
        setError("No proposal ID found");
        return;
      }

      setSubmitting(true);
      try {
        await upsertDataFormatInfo(createdProposalId, {
          ...formatData,
          fileFormat: formatData.fileFormat as FileFormat,
        });
        setSuccess("Data format information saved!");
        setTimeout(() => {
          setSuccess(null);
          setCurrentStep("features");
        }, 1000);
      } catch (err: unknown) {
        handleApiError(err, "Failed to save data format information");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Step 4: Add Features and complete
    if (currentStep === "features") {
      if (!isFeaturesValid()) {
        setError("Please define at least one feature with name and data type");
        return;
      }

      if (!createdProposalId) {
        setError("No proposal ID found");
        return;
      }

      setSubmitting(true);
      try {
        await replaceFeatures(createdProposalId, { features });
        setSuccess("Features saved!");
        setTimeout(() => {
          setSuccess(null);
          setCurrentStep("pricing");
        }, 1000);
      } catch (err: unknown) {
        handleApiError(err, "Failed to save features");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Step 5: Configure Pricing
    if (currentStep === "pricing") {
      if (!isPricingValid()) {
        setError("Please enter a valid price for paid datasets");
        return;
      }

      if (!createdProposalId) {
        setError("No proposal ID found");
        return;
      }

      setSubmitting(true);
      try {
        const pricingPayload = basicData.isSample
          ? SAMPLE_FREE_PRICING
          : pricingData;
        await upsertProposalPricing(createdProposalId, pricingPayload);
        setSuccess("Pricing saved!");
        setTimeout(() => {
          setSuccess(null);
          setCurrentStep("upload");
        }, 1000);
      } catch (err: unknown) {
        handleApiError(err, "Failed to save pricing");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Step 6: Confirm the required file exists, then show a non-submitting review.
    if (currentStep === "upload") {
      if (!fileUploaded) {
        setError("Please upload a file before completing");
        return;
      }

      if (!createdProposalId) {
        setError("No proposal ID found");
        return;
      }

      setCurrentStep("review");
      setSuccess(
        "Upload confirmed. Review your saved draft before continuing."
      );
      return;
    }

    // Step 7: Leave the creation flow. Moderation submission remains an explicit
    // action on the proposal detail page and is never triggered from this wizard.
    if (currentStep === "review") {
      if (!createdProposalId) {
        setError("No proposal ID found");
        return;
      }

      setSuccess("Opening your proposal workspace...");
      clearDraft();
      setTimeout(() => {
        router.push(`/dashboard/datasets/${createdProposalId}`);
      }, 500);
      return;
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(steps[currentStepIndex - 1].id);
      setError(null);
      setSuccess(null);
    }
  };

  const handleStartOver = () => {
    setStartOverError(null);
    setStartOverDialogOpen(true);
  };

  const confirmStartOver = async () => {
    setError(null);
    setSuccess(null);
    setStartOverError(null);
    setSubmitting(true);

    try {
      if (createdProposalId) {
        await discardDraftProposal(createdProposalId);
      }
      clearDraft();
      window.location.reload();
    } catch (err: unknown) {
      const apiError = err as {
        status?: number;
        code?: string;
        message?: string;
      };

      if (apiError.status === 404) {
        clearDraft();
        window.location.reload();
        return;
      }

      const message =
        apiError.code === "INVALID_STATE"
          ? "This proposal can no longer be discarded because it has already entered review. Open it from your proposals list to see its current status."
          : apiError.message ||
            "Failed to discard this draft. Your existing proposal has not been cleared.";
      setStartOverError(message);
      setSubmitting(false);
    }
  };

  const shouldShowSampleUpload = !basicData.isSample && pricingData.isPaid;

  return (
    <>
      <DatasetWorkspace className="max-w-[1320px]">
        <div className="space-y-7">
          <DatasetPageHeader
            title="Create a dataset proposal"
            description="Build and save the proposal in seven clear steps. You will review the completed draft before deciding when to submit it for moderation."
            breadcrumbs={
              <DashboardButton
                variant="ghost"
                size="compact"
                onClick={() => router.back()}
                className="-ml-3"
              >
                <ArrowLeft aria-hidden="true" />
                Back to datasets
              </DashboardButton>
            }
          />

          <DashboardCard className="p-4 xl:hidden">
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Step {currentStepIndex + 1} of {steps.length}
            </p>
            <DashboardProgress
              label={steps[currentStepIndex].label}
              value={currentStepIndex + 1}
              max={steps.length}
            />
          </DashboardCard>

          {/* Two Column Layout */}
          <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
            {/* Left: Form Content (Wider) */}
            <div className="min-w-0 space-y-5">
              {/* Error Message */}
              {error && (
                <DashboardInlineAlert
                  tone="danger"
                  title="This step could not be saved"
                  message={
                    error.toLowerCase().includes("not editable")
                      ? `${error} This draft might already be in review. Start over only if you want to clear this local draft.`
                      : error
                  }
                  action={
                    error.toLowerCase().includes("not editable") ? (
                      <DashboardButton
                        variant="outline"
                        size="compact"
                        onClick={handleStartOver}
                      >
                        Start over
                      </DashboardButton>
                    ) : undefined
                  }
                />
              )}

              {/* Success Message */}
              {success && (
                <DashboardInlineAlert
                  tone="success"
                  title="Saved"
                  message={success}
                />
              )}

              {/* Form Card */}
              <DashboardCard className="overflow-hidden">
                <div className="p-5 sm:p-7 lg:p-8">
                  <div className="mb-6">
                    <p className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                      Step {currentStepIndex + 1} of {steps.length}
                    </p>
                    <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
                      {steps[currentStepIndex].label}
                    </h2>
                  </div>

                  <div className="space-y-6">
                    {currentStep === "basic" && (
                      <BasicInfoStep
                        data={basicData}
                        onChange={handleBasicChange}
                        onSourceCreated={handleSourceCreated}
                        disabled={submitting}
                        tokens={tokens}
                        isDark={isDark}
                      />
                    )}

                    {currentStep === "about" && (
                      <AboutStep
                        data={aboutData}
                        onChange={handleAboutChange}
                        locationData={locationData}
                        onLocationChange={handleLocationChange}
                        tagsText={tagsText}
                        onTagsChange={setTagsText}
                        disabled={submitting}
                        tokens={tokens}
                      />
                    )}

                    {currentStep === "format" && (
                      <DataFormatStep
                        data={formatData}
                        onChange={handleFormatChange}
                        disabled={submitting}
                        tokens={tokens}
                        isDark={isDark}
                      />
                    )}

                    {currentStep === "features" && (
                      <FeaturesStep
                        features={features}
                        onChange={handleFeatureChange}
                        onAdd={addFeature}
                        onRemove={removeFeature}
                        disabled={submitting}
                        isDark={isDark}
                        tokens={tokens}
                      />
                    )}

                    {currentStep === "pricing" && (
                      <PricingStep
                        data={pricingData}
                        onChange={handlePricingChange}
                        disabled={submitting}
                        isSample={basicData.isSample}
                        tokens={tokens}
                        isDark={isDark}
                      />
                    )}

                    {currentStep === "upload" && (
                      <div className="space-y-8 py-8">
                        <div className="text-center space-y-6">
                          <div
                            className="w-20 h-20 rounded-full mx-auto flex items-center justify-center"
                            style={{
                              background: isDark
                                ? "color-mix(in srgb, var(--dashboard-action) 10%, transparent)"
                                : "color-mix(in srgb, var(--dashboard-action) 5%, transparent)",
                              border: `2px dashed ${isDark ? "color-mix(in srgb, var(--dashboard-action) 30%, transparent)" : "color-mix(in srgb, var(--dashboard-action) 20%, transparent)"}`,
                            }}
                          >
                            <FileText
                              className="w-10 h-10"
                              style={{ color: tokens.textSecondary }}
                            />
                          </div>

                          <div>
                            <h3
                              className="text-xl font-semibold mb-2"
                              style={{ color: tokens.textPrimary }}
                            >
                              {fileUploaded
                                ? "File uploaded successfully!"
                                : "Upload your dataset file"}
                            </h3>
                            <p
                              className="text-sm max-w-md mx-auto"
                              style={{ color: tokens.textMuted }}
                            >
                              {fileUploaded
                                ? "Your file has been uploaded. Continue to review the complete saved draft."
                                : "Upload your dataset file to complete the proposal. Accepted formats: CSV, JSON, Parquet, XLSX, ZIP."}
                            </p>
                          </div>

                          {fileUploaded ? (
                            <div
                              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg"
                              style={{
                                background:
                                  "color-mix(in srgb, var(--dashboard-success) 10%, transparent)",
                                border:
                                  "1px solid color-mix(in srgb, var(--dashboard-success) 30%, transparent)",
                              }}
                            >
                              <CheckCircle className="w-5 h-5 text-[var(--dashboard-success-foreground)]" />
                              <span className="text-sm font-medium text-[var(--dashboard-success-foreground)]">
                                Upload complete
                              </span>
                            </div>
                          ) : (
                            <DashboardButton
                              onClick={() => setUploadDialogOpen(true)}
                              size="large"
                              className="gap-2 px-8 py-6 text-base"
                            >
                              <Upload className="w-5 h-5" />
                              Upload Dataset File
                            </DashboardButton>
                          )}
                        </div>

                        {!fileUploaded && (
                          <div
                            className="rounded-lg border p-5 max-w-md mx-auto"
                            style={{
                              background:
                                "color-mix(in srgb, var(--dashboard-action) 5%, transparent)",
                              borderColor:
                                "color-mix(in srgb, var(--dashboard-action) 20%, transparent)",
                            }}
                          >
                            <div className="flex items-start gap-3">
                              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-[var(--dashboard-info-foreground)]" />
                              <div
                                className="text-sm leading-relaxed"
                                style={{ color: tokens.textSecondary }}
                              >
                                <p
                                  className="font-semibold mb-2"
                                  style={{ color: tokens.textPrimary }}
                                >
                                  Upload requirements:
                                </p>
                                <ul className="space-y-1.5 list-none">
                                  <li className="flex items-start gap-2">
                                    <span className="text-[var(--dashboard-info-foreground)]">
                                      •
                                    </span>
                                    <span>
                                      Supported formats: CSV, JSON, Parquet,
                                      XLSX, ZIP
                                    </span>
                                  </li>
                                  <li className="flex items-start gap-2">
                                    <span className="text-[var(--dashboard-info-foreground)]">
                                      •
                                    </span>
                                    <span>
                                      File upload is required to complete your
                                      proposal
                                    </span>
                                  </li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        )}

                        {shouldShowSampleUpload && (
                          <div
                            className="rounded-lg border p-5 max-w-md mx-auto"
                            style={{
                              background:
                                "color-mix(in srgb, var(--dashboard-success) 6%, transparent)",
                              borderColor:
                                "color-mix(in srgb, var(--dashboard-success) 25%, transparent)",
                            }}
                          >
                            <div className="text-center space-y-4">
                              <div>
                                <p
                                  className="text-sm font-semibold"
                                  style={{ color: tokens.textPrimary }}
                                >
                                  Optional: Upload sample file
                                </p>
                                <p
                                  className="text-xs mt-1"
                                  style={{ color: tokens.textMuted }}
                                >
                                  Buyers can download this sample file freely
                                  before purchasing.
                                </p>
                              </div>

                              {sampleFileUploaded ? (
                                <div
                                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg"
                                  style={{
                                    background:
                                      "color-mix(in srgb, var(--dashboard-success) 12%, transparent)",
                                    border:
                                      "1px solid color-mix(in srgb, var(--dashboard-success) 35%, transparent)",
                                  }}
                                >
                                  <CheckCircle className="w-4 h-4 text-[var(--dashboard-success-foreground)]" />
                                  <span className="text-xs font-medium text-[var(--dashboard-success-foreground)]">
                                    Sample upload complete
                                  </span>
                                </div>
                              ) : null}

                              <DashboardButton
                                onClick={() => setSampleUploadDialogOpen(true)}
                                size="compact"
                                variant="outline"
                                className="gap-2"
                              >
                                <Upload className="w-4 h-4" />
                                {sampleFileUploaded
                                  ? "Replace sample file"
                                  : "Upload sample file"}
                              </DashboardButton>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {currentStep === "review" && (
                      <ReviewStep
                        title={basicData.title}
                        superType={basicData.superType}
                        country={locationData.country}
                        fileFormat={formatData.fileFormat}
                        fileSize={formatData.fileSize}
                        featureCount={features.length}
                        isSample={basicData.isSample}
                        isPaid={pricingData.isPaid}
                        price={pricingData.price ?? null}
                        currency={pricingData.currency ?? "USD"}
                        fileUploaded={fileUploaded}
                        sampleFileUploaded={sampleFileUploaded}
                        shouldShowSampleUpload={shouldShowSampleUpload}
                        onEdit={setCurrentStep}
                      />
                    )}
                  </div>
                </div>

                {/* Navigation Buttons */}
                <DashboardFormActions
                  className="px-5 sm:px-7"
                  status={
                    submitting
                      ? "Saving this step…"
                      : `Step ${currentStepIndex + 1} of ${steps.length}`
                  }
                >
                  <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
                    {currentStepIndex > 0 && (
                      <DashboardButton
                        variant="outline"
                        onClick={handleBack}
                        disabled={submitting}
                        className="h-11 gap-2 px-5"
                      >
                        <ChevronLeft className="w-4 h-4 transition-transform duration-200" />
                        Back
                      </DashboardButton>
                    )}

                    {(createdProposalId || currentStep !== "basic") && (
                      <DashboardButton
                        variant="ghost"
                        onClick={handleStartOver}
                        disabled={submitting}
                        className="text-[var(--dashboard-danger-foreground)]"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Start Over
                      </DashboardButton>
                    )}
                  </div>

                  <DashboardButton
                    size="large"
                    onClick={handleNext}
                    disabled={submitting}
                    className="w-full sm:w-auto"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : isLastStep ? (
                      <>
                        Open proposal workspace
                        <ChevronRight className="w-4 h-4" />
                      </>
                    ) : currentStep === "upload" ? (
                      fileUploaded ? (
                        <>
                          Review saved draft
                          <ChevronRight className="w-4 h-4" />
                        </>
                      ) : (
                        "Upload file to continue"
                      )
                    ) : (
                      <>
                        Next
                        <ChevronRight className="w-4 h-4 transition-transform duration-200" />
                      </>
                    )}
                  </DashboardButton>
                </DashboardFormActions>
              </DashboardCard>
            </div>

            {/* Right: Progress Stepper (Wider, Sticky) */}
            <aside className="hidden xl:block">
              <DashboardCard className="sticky top-6 w-full p-5">
                <h3 className="text-sm font-semibold text-foreground">
                  Proposal progress
                </h3>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Your work is saved after every completed step.
                </p>
                <div className="mt-6 flex w-full flex-col gap-5">
                  {steps.map((step, idx) => (
                    <div
                      key={step.id}
                      className="flex flex-row items-start w-full relative"
                    >
                      {/* Step Circle */}
                      <div
                        className={`relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors ${
                          idx <= currentStepIndex
                            ? "border-[var(--dashboard-indicator)] bg-[var(--dashboard-indicator)] text-primary-foreground"
                            : "dashboard-tone-neutral"
                        }`}
                      >
                        {idx < currentStepIndex ? "✓" : step.number}
                      </div>

                      {/* Step Label & Status */}
                      <div className="ml-3 flex min-w-0 flex-col">
                        <div
                          className={`text-sm font-semibold ${
                            idx <= currentStepIndex
                              ? "text-foreground"
                              : "text-muted-foreground"
                          }`}
                        >
                          {step.label}
                        </div>
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          {idx < currentStepIndex
                            ? "Complete"
                            : idx === currentStepIndex
                              ? "In progress"
                              : "Pending"}
                        </div>
                      </div>

                      {/* Connecting Line */}
                      {idx < steps.length - 1 && (
                        <div
                          className={`absolute w-px transition-colors duration-300 motion-reduce:transition-none ${
                            idx < currentStepIndex
                              ? "bg-[var(--dashboard-indicator)]"
                              : "bg-border"
                          }`}
                          style={{
                            left: "1.125rem",
                            top: "2.25rem",
                            height: "1.25rem",
                            zIndex: 0,
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </DashboardCard>
            </aside>
          </div>
        </div>
      </DatasetWorkspace>

      {/* Upload Dialog */}
      {createdProposalId && (
        <DatasetUploadFlow
          isOpen={uploadDialogOpen}
          onClose={() => setUploadDialogOpen(false)}
          datasetId={createdProposalId}
          isDark={isDark}
          isEditable
          onUploadComplete={() => {
            setFileUploaded(true);
            setUploadDialogOpen(false);
            setSuccess("File uploaded successfully!");
            setTimeout(() => setSuccess(null), 2000);
          }}
        />
      )}

      {createdProposalId && shouldShowSampleUpload && (
        <DatasetUploadFlow
          isOpen={sampleUploadDialogOpen}
          onClose={() => setSampleUploadDialogOpen(false)}
          datasetId={createdProposalId}
          isDark={isDark}
          isEditable
          uploadKind="sample"
          onUploadComplete={() => {
            setSampleFileUploaded(true);
            setSampleUploadDialogOpen(false);
            setSuccess("Sample file uploaded successfully!");
            setTimeout(() => setSuccess(null), 2000);
          }}
        />
      )}

      <DashboardDialog
        open={startOverDialogOpen}
        onOpenChange={(open) => {
          if (!submitting) setStartOverDialogOpen(open);
        }}
      >
        <DashboardDialogContent
          size="sm"
          title="Start over?"
          description={
            createdProposalId
              ? "This permanently removes the server draft and its uploaded files."
              : "This permanently clears the progress saved in this browser."
          }
          showCloseButton={!submitting}
          onEscapeKeyDown={(event) => {
            if (submitting) event.preventDefault();
          }}
          onPointerDownOutside={(event) => {
            if (submitting) event.preventDefault();
          }}
          footer={
            <>
              <DashboardButton
                variant="outline"
                onClick={() => setStartOverDialogOpen(false)}
                disabled={submitting}
              >
                Keep draft
              </DashboardButton>
              <DashboardButton
                variant="destructive"
                onClick={confirmStartOver}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="animate-spin" aria-hidden="true" />
                    Discarding…
                  </>
                ) : (
                  <>
                    <RotateCcw aria-hidden="true" />
                    Discard and start over
                  </>
                )}
              </DashboardButton>
            </>
          }
        >
          {startOverError ? (
            <DashboardInlineAlert
              tone="danger"
              title="The draft was not discarded"
              message={startOverError}
            />
          ) : (
            <p className="text-sm leading-6 text-muted-foreground">
              This cannot be undone. Your marketplace account and published
              datasets are not affected.
            </p>
          )}
        </DashboardDialogContent>
      </DashboardDialog>
    </>
  );
}
