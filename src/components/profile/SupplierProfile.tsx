"use client";

import * as React from "react";
import {
  Building2,
  FileCheck2,
  LockKeyhole,
  Upload,
  UserRound,
} from "lucide-react";

import {
  DashboardButton,
  DashboardCard,
  DashboardCardContent,
  DashboardCardDescription,
  DashboardCardHeader,
  DashboardCardTitle,
  DashboardChoiceField,
  DashboardChoiceGroupField,
  DashboardErrorState,
  DashboardField,
  DashboardFormActions,
  DashboardFormErrorSummary,
  DashboardFormGrid,
  DashboardFormLayout,
  DashboardInlineAlert,
  DashboardInput,
  DashboardLoadingState,
  DashboardPage,
  DashboardPageHeader,
  DashboardRadioGroup,
  DashboardRadioGroupItem,
  DashboardSection,
  DashboardStatusBadge,
  DashboardTextarea,
} from "@/components/dashboard";
import {
  completeSupplierLogoUpload,
  getOnboardingStatus,
  getSupplierProfile,
  presignSupplierLogoUpload,
  updateSupplierProfile,
  uploadFileToS3,
} from "@/lib/api";
import {
  BUSINESS_DOMAINS,
  type SupplierLogoContentType,
  type SupplierProfile as SupplierProfileType,
  type SupplierType,
  type UpdateProfileRequest,
} from "@/types/onboarding.types";

interface SupplierProfileProps {
  onSave?: (profile: SupplierProfileType) => void;
}

interface ProfileFormState {
  supplierType: SupplierType;
  individualName: string;
  companyName: string;
  websiteUrl: string;
  contactPersonName: string;
  businessDomains: string;
  primaryDomain: string;
  naturesOfDataProvided: string;
}

type ProfileField = keyof ProfileFormState;
type ProfileFieldErrors = Partial<Record<ProfileField, string>>;

const LOGO_ALLOWED_TYPES: SupplierLogoContentType[] = [
  "image/png",
  "image/jpeg",
  "image/webp",
];
const LOGO_MAX_BYTES = 2 * 1024 * 1024;
const LOGO_MIN_DIMENSION = 256;
const LOGO_MAX_DIMENSION = 2048;
const BUSINESS_DOMAIN_SET = new Set<string>(BUSINESS_DOMAINS);

const PROFILE_FIELD_IDS: Record<ProfileField, string> = {
  supplierType: "profile-supplier-type",
  individualName: "profile-individual-name",
  companyName: "profile-company-name",
  websiteUrl: "profile-website-url",
  contactPersonName: "profile-contact-name",
  businessDomains: "profile-business-domains",
  primaryDomain: "profile-primary-domain",
  naturesOfDataProvided: "profile-data-nature",
};

const EMPTY_FORM: ProfileFormState = {
  supplierType: "COMPANY",
  individualName: "",
  companyName: "",
  websiteUrl: "",
  contactPersonName: "",
  businessDomains: "",
  primaryDomain: "",
  naturesOfDataProvided: "",
};

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function getErrorCode(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error
    ? String((error as { code?: unknown }).code)
    : null;
}

function getSupplierInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function formFromProfile(profile: SupplierProfileType): ProfileFormState {
  return {
    supplierType: profile.supplierType,
    individualName: profile.individualName ?? "",
    companyName: profile.companyName ?? "",
    websiteUrl: profile.websiteUrl ?? "",
    contactPersonName: profile.contactPersonName,
    businessDomains: profile.businessDomains.join(", "),
    primaryDomain: profile.primaryDomain ?? "",
    naturesOfDataProvided: profile.naturesOfDataProvided ?? "",
  };
}

function parseBusinessDomains(value: string) {
  return Array.from(
    new Set(
      value
        .split(",")
        .map((domain) => domain.trim().toUpperCase())
        .filter(Boolean)
    )
  );
}

function readImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image dimensions"));
    };
    image.src = url;
  });
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Not available";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function SupplierProfile({ onSave }: SupplierProfileProps) {
  const logoInputRef = React.useRef<HTMLInputElement>(null);
  const localLogoUrlRef = React.useRef<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [requestError, setRequestError] = React.useState<string | null>(null);
  const [statusWarning, setStatusWarning] = React.useState<string | null>(null);
  const [logoError, setLogoError] = React.useState<string | null>(null);
  const [logoSuccess, setLogoSuccess] = React.useState(false);
  const [saveSuccess, setSaveSuccess] = React.useState(false);
  const [validationAttempt, setValidationAttempt] = React.useState(0);
  const [profile, setProfile] = React.useState<SupplierProfileType | null>(
    null
  );
  const [logoPreviewUrl, setLogoPreviewUrl] = React.useState<string | null>(
    null
  );
  const [isOnboardingComplete, setIsOnboardingComplete] = React.useState(false);
  const [form, setForm] = React.useState<ProfileFormState>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = React.useState<ProfileFieldErrors>({});
  const [hasChanges, setHasChanges] = React.useState(false);

  const releaseLocalLogoUrl = React.useCallback(() => {
    if (localLogoUrlRef.current) {
      URL.revokeObjectURL(localLogoUrlRef.current);
      localLogoUrlRef.current = null;
    }
  }, []);

  React.useEffect(() => releaseLocalLogoUrl, [releaseLocalLogoUrl]);

  const loadProfile = React.useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    setStatusWarning(null);

    try {
      try {
        const statusResponse = await getOnboardingStatus();
        setIsOnboardingComplete(statusResponse.onboarding.nextStep === "DONE");
      } catch (error) {
        console.error("Failed to check onboarding status:", error);
        setStatusWarning(
          "We could not confirm whether this profile is locked. Editing remains available, but the server will protect a finalized profile."
        );
      }

      const response = await getSupplierProfile();
      if (response.profile) {
        setProfile(response.profile);
        setForm(formFromProfile(response.profile));
        setLogoPreviewUrl(response.profile.logoUrl ?? null);
      } else {
        setProfile(null);
        setForm(EMPTY_FORM);
        setLogoPreviewUrl(null);
      }
      setHasChanges(false);
    } catch (error) {
      console.error("Failed to load profile:", error);
      setLoadError(getErrorMessage(error, "Failed to load supplier profile."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const updateField = <Key extends ProfileField>(
    field: Key,
    value: ProfileFormState[Key]
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setRequestError(null);
    setSaveSuccess(false);
    setHasChanges(true);
  };

  const validateForm = () => {
    const errors: ProfileFieldErrors = {};
    const domains = parseBusinessDomains(form.businessDomains);

    if (form.supplierType === "INDIVIDUAL") {
      if (!form.individualName.trim()) {
        errors.individualName = "Enter the individual supplier's full name.";
      }
    } else {
      if (!form.companyName.trim()) {
        errors.companyName = "Enter the registered company name.";
      }
      if (!form.contactPersonName.trim()) {
        errors.contactPersonName = "Enter the primary contact person's name.";
      }
    }

    if (domains.length === 0) {
      errors.businessDomains = "Add at least one business domain.";
    } else {
      const unsupported = domains.filter(
        (domain) => !BUSINESS_DOMAIN_SET.has(domain)
      );
      if (unsupported.length > 0) {
        errors.businessDomains = `Use supported domain values only. Check: ${unsupported.join(", ")}.`;
      }
    }

    if (form.websiteUrl.trim()) {
      try {
        const website = new URL(form.websiteUrl.trim());
        if (!new Set(["http:", "https:"]).has(website.protocol)) {
          errors.websiteUrl = "Use a complete http or https website address.";
        }
      } catch {
        errors.websiteUrl =
          "Use a complete website address, such as https://example.com.";
      }
    }

    setFieldErrors(errors);
    return { errors, domains };
  };

  const validateLogoFile = async (file: File): Promise<string | null> => {
    if (!LOGO_ALLOWED_TYPES.includes(file.type as SupplierLogoContentType)) {
      return "Logo must be a PNG, JPEG, or WebP image.";
    }
    if (file.size > LOGO_MAX_BYTES) {
      return "Logo must be 2 MB or smaller.";
    }

    const dimensions = await readImageDimensions(file);
    if (dimensions.width !== dimensions.height) {
      return "Logo must be square. Use a padded square canvas for wide logos.";
    }
    if (
      dimensions.width < LOGO_MIN_DIMENSION ||
      dimensions.height < LOGO_MIN_DIMENSION ||
      dimensions.width > LOGO_MAX_DIMENSION ||
      dimensions.height > LOGO_MAX_DIMENSION
    ) {
      return "Logo dimensions must be between 256x256 and 2048x2048 pixels.";
    }
    return null;
  };

  const handleLogoFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setLogoError(null);
    setLogoSuccess(false);
    if (!profile) {
      setLogoError("Save your supplier profile before uploading a logo.");
      return;
    }

    setIsUploadingLogo(true);
    try {
      const validationError = await validateLogoFile(file);
      if (validationError) {
        setLogoError(validationError);
        return;
      }

      const presign = await presignSupplierLogoUpload({
        originalFileName: file.name,
        contentType: file.type as SupplierLogoContentType,
      });
      await uploadFileToS3(presign.putUrl, file);
      const complete = await completeSupplierLogoUpload({
        s3Key: presign.s3Key,
        sizeBytes: file.size.toString(),
      });

      releaseLocalLogoUrl();
      if (complete.profile.logoUrl) {
        setLogoPreviewUrl(complete.profile.logoUrl);
      } else {
        const localPreview = URL.createObjectURL(file);
        localLogoUrlRef.current = localPreview;
        setLogoPreviewUrl(localPreview);
      }
      setProfile(complete.profile);
      setLogoSuccess(true);
    } catch (error) {
      console.error("Failed to upload supplier logo:", error);
      setLogoError(getErrorMessage(error, "Failed to upload logo."));
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRequestError(null);
    setSaveSuccess(false);

    const { errors, domains } = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationAttempt((current) => current + 1);
      return;
    }

    setIsSaving(true);
    try {
      let requestData: UpdateProfileRequest;
      if (form.supplierType === "INDIVIDUAL") {
        requestData = {
          supplierType: "INDIVIDUAL",
          individualName: form.individualName.trim(),
          contactPersonName:
            form.contactPersonName.trim() || form.individualName.trim(),
          businessDomains: domains,
          primaryDomain: form.primaryDomain.trim() || null,
          naturesOfDataProvided: form.naturesOfDataProvided.trim() || null,
        };
      } else {
        requestData = {
          supplierType: "COMPANY",
          companyName: form.companyName.trim(),
          websiteUrl: form.websiteUrl.trim() || null,
          contactPersonName: form.contactPersonName.trim(),
          businessDomains: domains,
          primaryDomain: form.primaryDomain.trim() || null,
          naturesOfDataProvided: form.naturesOfDataProvided.trim() || null,
        };
      }

      const response = await updateSupplierProfile(requestData);
      setProfile(response.profile);
      setForm(formFromProfile(response.profile));
      setHasChanges(false);
      setFieldErrors({});
      setSaveSuccess(true);
      onSave?.(response.profile);
    } catch (error) {
      console.error("Failed to save profile:", error);
      if (getErrorCode(error) === "ONBOARDING_ALREADY_COMPLETED") {
        setRequestError(
          "Your onboarding is finalized, so this profile can no longer be modified."
        );
        setIsOnboardingComplete(true);
      } else {
        setRequestError(getErrorMessage(error, "Failed to save profile."));
      }
    } finally {
      setIsSaving(false);
    }
  };

  const displayName =
    form.supplierType === "COMPANY"
      ? form.companyName.trim() || profile?.companyName || "Supplier"
      : form.individualName.trim() ||
        profile?.individualName ||
        profile?.contactPersonName ||
        "Supplier";
  const profileLocked = isOnboardingComplete;
  const validationErrors = Object.entries(fieldErrors).map(
    ([field, message]) => ({
      fieldId: PROFILE_FIELD_IDS[field as ProfileField],
      message: message as string,
    })
  );

  if (isLoading) {
    return (
      <DashboardPage width="standard">
        <DashboardPageHeader
          title="Supplier profile"
          description="Manage the identity and business details shown across your supplier workspace."
        />
        <DashboardLoadingState label="Loading supplier profile" />
      </DashboardPage>
    );
  }

  if (loadError) {
    return (
      <DashboardPage width="standard">
        <DashboardPageHeader
          title="Supplier profile"
          description="Manage the identity and business details shown across your supplier workspace."
        />
        <DashboardErrorState
          title="Profile could not be loaded"
          message={loadError}
          onRetry={() => void loadProfile()}
        />
      </DashboardPage>
    );
  }

  const profileAside = (
    <>
      <DashboardCard>
        <DashboardCardHeader>
          <DashboardCardTitle>Marketplace logo</DashboardCardTitle>
          <DashboardCardDescription>
            This mark appears with your datasets in marketplace discovery.
          </DashboardCardDescription>
        </DashboardCardHeader>
        <DashboardCardContent className="space-y-5">
          <div className="flex items-center gap-4">
            <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/50 text-xl font-semibold text-foreground">
              {logoPreviewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoPreviewUrl}
                  alt={`${displayName} logo`}
                  className="h-full w-full object-contain p-2"
                />
              ) : (
                <span>{getSupplierInitials(displayName)}</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {displayName}
              </p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                PNG, JPEG, or WebP. Square, 256–2048 px, maximum 2 MB.
              </p>
            </div>
          </div>

          <input
            ref={logoInputRef}
            type="file"
            accept={LOGO_ALLOWED_TYPES.join(",")}
            className="sr-only"
            aria-label="Choose supplier logo"
            onChange={handleLogoFileChange}
          />
          <DashboardButton
            variant="outline"
            className="w-full"
            disabled={!profile || isUploadingLogo}
            onClick={() => logoInputRef.current?.click()}
          >
            <Upload aria-hidden="true" />
            {isUploadingLogo
              ? "Uploading…"
              : logoPreviewUrl
                ? "Replace logo"
                : "Upload logo"}
          </DashboardButton>
          {!profile ? (
            <p className="text-xs text-muted-foreground">
              Save the profile before uploading a logo.
            </p>
          ) : null}
          {profile?.logoUpdatedAt ? (
            <p className="text-xs text-muted-foreground">
              Logo updated {formatDate(profile.logoUpdatedAt)}
            </p>
          ) : null}
          {logoError ? (
            <DashboardInlineAlert tone="danger" message={logoError} />
          ) : null}
          {logoSuccess ? (
            <DashboardInlineAlert
              tone="success"
              title="Logo updated"
              message="The new logo is ready for marketplace surfaces."
            />
          ) : null}
        </DashboardCardContent>
      </DashboardCard>

      <DashboardCard>
        <DashboardCardHeader>
          <DashboardCardTitle>Profile status</DashboardCardTitle>
          <DashboardCardDescription>
            Current account and document state.
          </DashboardCardDescription>
        </DashboardCardHeader>
        <DashboardCardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-muted-foreground">Editing</span>
            <DashboardStatusBadge
              icon={profileLocked ? LockKeyhole : FileCheck2}
              tone={profileLocked ? "neutral" : "success"}
            >
              {profileLocked ? "Locked" : "Available"}
            </DashboardStatusBadge>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-muted-foreground">
              Offline contract
            </span>
            <DashboardStatusBadge
              tone={profile?.isOfflineContractDone ? "success" : "warning"}
            >
              {profile?.isOfflineContractDone ? "Completed" : "Pending"}
            </DashboardStatusBadge>
          </div>
          <div className="border-t border-border pt-4 text-xs leading-5 text-muted-foreground">
            <p>Created: {formatDate(profile?.createdAt)}</p>
            <p>Last updated: {formatDate(profile?.updatedAt)}</p>
          </div>
        </DashboardCardContent>
      </DashboardCard>
    </>
  );

  return (
    <DashboardPage width="standard">
      <DashboardPageHeader
        title="Supplier profile"
        description="Manage the identity and business details shown across your supplier workspace."
        meta={
          <DashboardStatusBadge
            icon={form.supplierType === "COMPANY" ? Building2 : UserRound}
            tone="neutral"
          >
            {form.supplierType === "COMPANY" ? "Company" : "Individual"}
          </DashboardStatusBadge>
        }
      />

      {statusWarning ? (
        <DashboardInlineAlert
          tone="warning"
          title="Profile status unavailable"
          message={statusWarning}
        />
      ) : null}
      {profileLocked ? (
        <DashboardInlineAlert
          tone="info"
          icon={LockKeyhole}
          title="Profile editing is locked"
          message="Onboarding is finalized. Contact support if these business details need to change. Logo replacement remains available."
        />
      ) : null}
      {profile ? (
        <DashboardInlineAlert
          tone={profile.isOfflineContractDone ? "success" : "warning"}
          title={
            profile.isOfflineContractDone
              ? "Offline contract completed"
              : "Offline contract pending"
          }
          message={
            profile.isOfflineContractDone
              ? "Your offline contract documentation is recorded as complete."
              : "Complete the offline contract documentation before the account can finish onboarding."
          }
        />
      ) : null}

      <form onSubmit={handleSave} noValidate>
        <DashboardFormLayout aside={profileAside} stickyAside>
          {requestError ? (
            <DashboardInlineAlert
              tone="danger"
              title="Profile was not saved"
              message={requestError}
            />
          ) : null}
          {saveSuccess ? (
            <DashboardInlineAlert
              tone="success"
              title="Profile saved"
              message="Your supplier details are up to date."
            />
          ) : null}
          <DashboardFormErrorSummary
            errors={validationErrors}
            focusKey={validationAttempt}
            focusOnMount
          />

          <DashboardSection
            title="Supplier identity"
            description="Choose the account type and provide the legal identity used for supplier records."
          >
            <div className="space-y-5">
              <DashboardChoiceGroupField
                label="Supplier type"
                description={
                  profile
                    ? "Supplier type cannot be changed after the profile is created."
                    : "Choose the structure that owns and supplies the data."
                }
                required
              >
                {(groupProps) => (
                  <DashboardRadioGroup
                    {...groupProps}
                    id={PROFILE_FIELD_IDS.supplierType}
                    value={form.supplierType}
                    disabled={Boolean(profile) || profileLocked}
                    className="grid gap-3 sm:grid-cols-2"
                    onValueChange={(value) =>
                      updateField("supplierType", value as SupplierType)
                    }
                  >
                    <DashboardChoiceField
                      className="rounded-xl border border-border bg-muted/30 p-4"
                      control={<DashboardRadioGroupItem value="COMPANY" />}
                      label="Company"
                      description="A registered business or organisation."
                    />
                    <DashboardChoiceField
                      className="rounded-xl border border-border bg-muted/30 p-4"
                      control={<DashboardRadioGroupItem value="INDIVIDUAL" />}
                      label="Individual"
                      description="A person supplying data directly."
                    />
                  </DashboardRadioGroup>
                )}
              </DashboardChoiceGroupField>

              {form.supplierType === "COMPANY" ? (
                <DashboardFormGrid>
                  <DashboardField
                    id={PROFILE_FIELD_IDS.companyName}
                    label="Company name"
                    required
                    error={fieldErrors.companyName}
                  >
                    {(controlProps) => (
                      <DashboardInput
                        {...controlProps}
                        value={form.companyName}
                        disabled={profileLocked}
                        placeholder="Registered company name"
                        onChange={(event) =>
                          updateField("companyName", event.target.value)
                        }
                      />
                    )}
                  </DashboardField>
                  <DashboardField
                    id={PROFILE_FIELD_IDS.websiteUrl}
                    label="Website"
                    description="Optional"
                    error={fieldErrors.websiteUrl}
                  >
                    {(controlProps) => (
                      <DashboardInput
                        {...controlProps}
                        type="url"
                        value={form.websiteUrl}
                        disabled={profileLocked}
                        placeholder="https://example.com"
                        onChange={(event) =>
                          updateField("websiteUrl", event.target.value)
                        }
                      />
                    )}
                  </DashboardField>
                </DashboardFormGrid>
              ) : (
                <DashboardField
                  id={PROFILE_FIELD_IDS.individualName}
                  label="Full name"
                  required
                  error={fieldErrors.individualName}
                >
                  {(controlProps) => (
                    <DashboardInput
                      {...controlProps}
                      value={form.individualName}
                      disabled={profileLocked}
                      placeholder="Full legal name"
                      onChange={(event) =>
                        updateField("individualName", event.target.value)
                      }
                    />
                  )}
                </DashboardField>
              )}
            </div>
          </DashboardSection>

          <DashboardSection
            title="Business information"
            description="Describe the areas and data capabilities represented by this supplier account."
          >
            <div className="space-y-5">
              <DashboardField
                id={PROFILE_FIELD_IDS.businessDomains}
                label="Business domains"
                required
                error={fieldErrors.businessDomains}
                description={`Comma-separated values: ${BUSINESS_DOMAINS.join(", ")}`}
              >
                {(controlProps) => (
                  <DashboardTextarea
                    {...controlProps}
                    value={form.businessDomains}
                    disabled={profileLocked}
                    placeholder="TECHNOLOGY, RESEARCH"
                    onChange={(event) =>
                      updateField("businessDomains", event.target.value)
                    }
                  />
                )}
              </DashboardField>
              <DashboardField
                id={PROFILE_FIELD_IDS.primaryDomain}
                label="Primary domain"
                description="Optional"
              >
                {(controlProps) => (
                  <DashboardInput
                    {...controlProps}
                    value={form.primaryDomain}
                    disabled={profileLocked}
                    placeholder="Main business domain"
                    onChange={(event) =>
                      updateField("primaryDomain", event.target.value)
                    }
                  />
                )}
              </DashboardField>
              <DashboardField
                id={PROFILE_FIELD_IDS.naturesOfDataProvided}
                label="Nature of data provided"
                description="Optional"
              >
                {(controlProps) => (
                  <DashboardTextarea
                    {...controlProps}
                    value={form.naturesOfDataProvided}
                    disabled={profileLocked}
                    placeholder="Describe the data categories, collection methods, and coverage you provide."
                    onChange={(event) =>
                      updateField("naturesOfDataProvided", event.target.value)
                    }
                  />
                )}
              </DashboardField>
            </div>
          </DashboardSection>

          <DashboardSection
            title="Contact information"
            description="This contact is used for supplier operations and account communication."
          >
            <DashboardFormGrid>
              <DashboardField
                id={PROFILE_FIELD_IDS.contactPersonName}
                label="Contact person"
                required={form.supplierType === "COMPANY"}
                error={fieldErrors.contactPersonName}
                description={
                  form.supplierType === "INDIVIDUAL"
                    ? "Optional; defaults to the individual name."
                    : undefined
                }
              >
                {(controlProps) => (
                  <DashboardInput
                    {...controlProps}
                    value={form.contactPersonName}
                    disabled={profileLocked}
                    placeholder="Primary contact name"
                    onChange={(event) =>
                      updateField("contactPersonName", event.target.value)
                    }
                  />
                )}
              </DashboardField>
              <DashboardField
                label="Contact email"
                description="This is the login email and cannot be changed here."
              >
                {(controlProps) => (
                  <DashboardInput
                    {...controlProps}
                    type="email"
                    value={profile?.contactEmail ?? ""}
                    placeholder="Available after the profile is created"
                    disabled
                    readOnly
                  />
                )}
              </DashboardField>
            </DashboardFormGrid>
          </DashboardSection>

          <DashboardFormActions
            sticky
            status={
              profileLocked
                ? "Profile editing is locked."
                : saveSuccess
                  ? "All changes are saved."
                  : hasChanges
                    ? "You have unsaved changes."
                    : "No unsaved changes."
            }
          >
            <DashboardButton
              type="submit"
              disabled={!hasChanges || isSaving || profileLocked}
            >
              {isSaving ? "Saving…" : "Save profile"}
            </DashboardButton>
          </DashboardFormActions>
        </DashboardFormLayout>
      </form>
    </DashboardPage>
  );
}
