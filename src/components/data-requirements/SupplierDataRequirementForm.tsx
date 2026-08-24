"use client";

import { useEffect, useState } from "react";

import {
  DashboardButton,
  DashboardCard,
  DashboardCardContent,
  DashboardCardDescription,
  DashboardCardHeader,
  DashboardCardTitle,
  DashboardField,
  DashboardFormErrorSummary,
  DashboardFormGrid,
  DashboardFormLayout,
  DashboardInput,
  DashboardSection,
  DashboardStatusBadge,
  DashboardSuccessState,
  DashboardTextarea,
  type DashboardFormError,
} from "@/components/dashboard";
import { getSupplierProfile, submitSupplierDataRequirement } from "@/lib/api";
import { useAuthStore } from "@/store";
import type {
  DataRequirementReceipt,
  DataRequirementSubmission,
} from "@/types/data-requirement.types";

const DRAFT_KEY = "kuinbee:data-requirement:supplier:v1";
const DRAFT_TTL = 2 * 60 * 60 * 1000;

type FormState = Omit<
  DataRequirementSubmission,
  "formats" | "geographies" | "languages"
> & {
  formats: string;
  geographies: string;
  languages: string;
};

type FormFieldName = keyof FormState;
type FormErrors = Partial<Record<FormFieldName, string>>;

const empty = (): FormState => ({
  clientRequestId: "",
  contactName: "",
  organization: "",
  phone: "",
  title: "",
  industry: "",
  dataType: "",
  description: "",
  intendedUse: "",
  formats: "",
  geographies: "",
  languages: "",
  expectedVolume: "",
  targetDeliveryDate: "",
  budgetRange: "",
  licensingCompliance: "",
  notes: "",
});

const split = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const optional = (value?: string) => value?.trim() || undefined;

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};
  if (form.contactName.trim().length < 2) {
    errors.contactName = "Enter a contact name.";
  }
  if (form.title.trim().length < 5) {
    errors.title = "Enter a clear requirement title.";
  }
  if (!form.industry.trim()) {
    errors.industry = "Enter the relevant industry.";
  }
  if (!form.dataType.trim()) {
    errors.dataType = "Enter the required data type.";
  }
  if (form.description.trim().length < 50) {
    errors.description = "Describe the requirement in at least 50 characters.";
  }
  if (form.intendedUse.trim().length < 20) {
    errors.intendedUse = "Describe the intended use in at least 20 characters.";
  }
  if (split(form.formats).length > 10) {
    errors.formats = "Add no more than 10 formats.";
  }
  if (split(form.geographies).length > 20) {
    errors.geographies = "Add no more than 20 geographies.";
  }
  if (split(form.languages).length > 20) {
    errors.languages = "Add no more than 20 languages.";
  }
  return errors;
}

export function SupplierDataRequirementForm() {
  const user = useAuthStore((state) => state.user);
  const [form, setForm] = useState<FormState>(empty);
  const [hydrated, setHydrated] = useState(false);
  const [receipt, setReceipt] = useState<DataRequirementReceipt | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [requestError, setRequestError] = useState("");
  const [validationAttempt, setValidationAttempt] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fallback = { ...empty(), clientRequestId: crypto.randomUUID() };
    let restored = false;

    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as {
          version: number;
          savedAt: number;
          data: FormState;
        };
        if (saved.version === 1 && Date.now() - saved.savedAt < DRAFT_TTL) {
          setForm({ ...fallback, ...saved.data });
          restored = true;
        } else {
          sessionStorage.removeItem(DRAFT_KEY);
        }
      }
    } catch {
      // Browser storage is optional; the form remains usable without it.
    }

    if (!restored) {
      setForm(fallback);
      void getSupplierProfile()
        .then(({ profile }) => {
          if (!profile) return;
          setForm((current) => ({
            ...current,
            contactName:
              current.contactName ||
              profile.contactPersonName ||
              profile.individualName ||
              "",
            organization: current.organization || profile.companyName || "",
            industry: current.industry || profile.primaryDomain || "",
          }));
        })
        .catch(() => undefined);
    }

    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || receipt) return;
    try {
      sessionStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ version: 1, savedAt: Date.now(), data: form })
      );
    } catch {
      // Storage may be blocked or full; submission is still available.
    }
  }, [form, hydrated, receipt]);

  const update = (key: FormFieldName, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
    setRequestError("");
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate(form);
    if (Object.keys(nextErrors).length) {
      setFieldErrors(nextErrors);
      setRequestError("");
      setValidationAttempt((current) => current + 1);
      return;
    }

    setSubmitting(true);
    setFieldErrors({});
    setRequestError("");
    try {
      const result = await submitSupplierDataRequirement({
        clientRequestId: form.clientRequestId || crypto.randomUUID(),
        contactName: form.contactName.trim(),
        organization: optional(form.organization),
        phone: optional(form.phone),
        title: form.title.trim(),
        industry: form.industry.trim(),
        dataType: form.dataType.trim(),
        description: form.description.trim(),
        intendedUse: form.intendedUse.trim(),
        formats: split(form.formats),
        geographies: split(form.geographies),
        languages: split(form.languages),
        expectedVolume: optional(form.expectedVolume),
        targetDeliveryDate: optional(form.targetDeliveryDate),
        budgetRange: optional(form.budgetRange),
        licensingCompliance: optional(form.licensingCompliance),
        notes: optional(form.notes),
      });
      try {
        sessionStorage.removeItem(DRAFT_KEY);
      } catch {
        // The receipt is authoritative even when storage cleanup is unavailable.
      }
      setReceipt(result);
    } catch (caught: unknown) {
      setRequestError(
        caught instanceof Error
          ? caught.message
          : "We could not submit the requirement."
      );
      setValidationAttempt((current) => current + 1);
    } finally {
      setSubmitting(false);
    }
  };

  const summaryErrors: DashboardFormError[] = [
    ...Object.entries(fieldErrors)
      .filter((entry): entry is [string, string] => Boolean(entry[1]))
      .map(([fieldId, message]) => ({ fieldId, message })),
    ...(requestError ? [{ message: requestError }] : []),
  ];

  if (receipt) {
    return (
      <DashboardSuccessState
        focusOnMount
        title={
          receipt.duplicate
            ? "Requirement already received"
            : "Requirement submitted"
        }
        message={
          <div>
            <p>
              {receipt.duplicate
                ? "This request was already submitted, so we have returned its original reference."
                : "The Kuinbee admin team will review it. Keep this reference for your records."}
            </p>
            <p className="dashboard-tone-success mx-auto mt-5 w-fit rounded-lg border px-5 py-3 font-mono text-lg font-semibold">
              {receipt.referenceCode}
            </p>
            <p className="mt-4 text-xs text-muted-foreground">
              Confirmation sent to {user?.email || "your account email"}.
            </p>
          </div>
        }
        action={
          <DashboardButton
            variant="outline"
            onClick={() => {
              setReceipt(null);
              setForm({ ...empty(), clientRequestId: crypto.randomUUID() });
              setFieldErrors({});
              setRequestError("");
            }}
          >
            Submit another requirement
          </DashboardButton>
        }
      />
    );
  }

  return (
    <form onSubmit={submit} noValidate>
      <DashboardFormErrorSummary
        errors={summaryErrors}
        focusOnMount
        focusKey={validationAttempt}
        className="mb-6"
      />

      <DashboardFormLayout
        stickyAside
        aside={
          <SubmissionGuidance submitting={submitting} hydrated={hydrated} />
        }
        asideAriaLabel="Submission guidance"
      >
        <DashboardSection
          title="Contact details"
          description="The account email is attached securely and cannot be changed here."
        >
          <DashboardFormGrid columns={2}>
            <DashboardField
              id="contactName"
              label="Contact name"
              required
              error={fieldErrors.contactName}
            >
              {(controlProps) => (
                <DashboardInput
                  {...controlProps}
                  value={form.contactName}
                  onChange={(event) =>
                    update("contactName", event.target.value)
                  }
                  maxLength={150}
                />
              )}
            </DashboardField>
            <DashboardField
              id="accountEmail"
              label="Account email"
              description="Taken from your signed-in supplier account."
            >
              {(controlProps) => (
                <DashboardInput
                  {...controlProps}
                  value={user?.email || ""}
                  disabled
                />
              )}
            </DashboardField>
            <DashboardField id="organization" label="Organisation">
              {(controlProps) => (
                <DashboardInput
                  {...controlProps}
                  value={form.organization}
                  onChange={(event) =>
                    update("organization", event.target.value)
                  }
                  maxLength={200}
                />
              )}
            </DashboardField>
            <DashboardField id="phone" label="Phone">
              {(controlProps) => (
                <DashboardInput
                  {...controlProps}
                  type="tel"
                  value={form.phone}
                  onChange={(event) => update("phone", event.target.value)}
                  maxLength={50}
                />
              )}
            </DashboardField>
          </DashboardFormGrid>
        </DashboardSection>

        <DashboardSection
          title="Requirement"
          description="Describe the data you need. This is a request to Kuinbee, not a supplier-managed listing."
        >
          <DashboardFormGrid columns={2}>
            <DashboardField
              id="title"
              label="Requirement title"
              required
              error={fieldErrors.title}
              className="md:col-span-2"
            >
              {(controlProps) => (
                <DashboardInput
                  {...controlProps}
                  value={form.title}
                  onChange={(event) => update("title", event.target.value)}
                  maxLength={160}
                  placeholder="Example: Multilingual customer-support speech audio"
                />
              )}
            </DashboardField>
            <DashboardField
              id="industry"
              label="Industry"
              required
              error={fieldErrors.industry}
            >
              {(controlProps) => (
                <DashboardInput
                  {...controlProps}
                  value={form.industry}
                  onChange={(event) => update("industry", event.target.value)}
                  maxLength={150}
                  placeholder="Example: Retail"
                />
              )}
            </DashboardField>
            <DashboardField
              id="dataType"
              label="Data type"
              required
              error={fieldErrors.dataType}
            >
              {(controlProps) => (
                <DashboardInput
                  {...controlProps}
                  value={form.dataType}
                  onChange={(event) => update("dataType", event.target.value)}
                  maxLength={150}
                  placeholder="Example: Speech audio"
                />
              )}
            </DashboardField>
            <DashboardField
              id="description"
              label="Detailed description"
              required
              error={fieldErrors.description}
              className="md:col-span-2"
            >
              {(controlProps) => (
                <>
                  <DashboardTextarea
                    {...controlProps}
                    value={form.description}
                    onChange={(event) =>
                      update("description", event.target.value)
                    }
                    rows={7}
                    maxLength={5000}
                    placeholder="Describe the required coverage, content, quality, provenance, and any important exclusions."
                  />
                  <Counter value={form.description} min={50} max={5000} />
                </>
              )}
            </DashboardField>
            <DashboardField
              id="intendedUse"
              label="Intended use"
              required
              error={fieldErrors.intendedUse}
              className="md:col-span-2"
            >
              {(controlProps) => (
                <>
                  <DashboardTextarea
                    {...controlProps}
                    value={form.intendedUse}
                    onChange={(event) =>
                      update("intendedUse", event.target.value)
                    }
                    rows={4}
                    maxLength={2000}
                    placeholder="Explain how the data will be evaluated or used."
                  />
                  <Counter value={form.intendedUse} min={20} max={2000} />
                </>
              )}
            </DashboardField>
          </DashboardFormGrid>
        </DashboardSection>

        <DashboardSection
          title="Delivery preferences"
          description="Optional details help the admin team assess the request."
        >
          <DashboardFormGrid columns={2}>
            <DashboardField
              id="formats"
              label="Formats"
              description="Comma-separated, up to 10 formats."
              error={fieldErrors.formats}
            >
              {(controlProps) => (
                <DashboardInput
                  {...controlProps}
                  value={form.formats}
                  onChange={(event) => update("formats", event.target.value)}
                  placeholder="CSV, JSON, WAV"
                />
              )}
            </DashboardField>
            <DashboardField id="expectedVolume" label="Expected volume">
              {(controlProps) => (
                <DashboardInput
                  {...controlProps}
                  value={form.expectedVolume}
                  onChange={(event) =>
                    update("expectedVolume", event.target.value)
                  }
                  maxLength={500}
                  placeholder="Example: 2,000 hours"
                />
              )}
            </DashboardField>
            <DashboardField
              id="geographies"
              label="Geographies"
              description="Comma-separated, up to 20 geographies."
              error={fieldErrors.geographies}
            >
              {(controlProps) => (
                <DashboardInput
                  {...controlProps}
                  value={form.geographies}
                  onChange={(event) =>
                    update("geographies", event.target.value)
                  }
                  placeholder="India, United Kingdom"
                />
              )}
            </DashboardField>
            <DashboardField
              id="languages"
              label="Languages"
              description="Comma-separated, up to 20 languages."
              error={fieldErrors.languages}
            >
              {(controlProps) => (
                <DashboardInput
                  {...controlProps}
                  value={form.languages}
                  onChange={(event) => update("languages", event.target.value)}
                  placeholder="English, Hindi"
                />
              )}
            </DashboardField>
            <DashboardField
              id="targetDeliveryDate"
              label="Target delivery date"
            >
              {(controlProps) => (
                <DashboardInput
                  {...controlProps}
                  type="date"
                  value={form.targetDeliveryDate}
                  onChange={(event) =>
                    update("targetDeliveryDate", event.target.value)
                  }
                  className="[color-scheme:light] dark:[color-scheme:dark]"
                />
              )}
            </DashboardField>
            <DashboardField id="budgetRange" label="Budget range">
              {(controlProps) => (
                <DashboardInput
                  {...controlProps}
                  value={form.budgetRange}
                  onChange={(event) =>
                    update("budgetRange", event.target.value)
                  }
                  maxLength={100}
                  placeholder="Example: USD 25,000–50,000"
                />
              )}
            </DashboardField>
            <DashboardField
              id="licensingCompliance"
              label="Licensing or compliance needs"
              className="md:col-span-2"
            >
              {(controlProps) => (
                <DashboardTextarea
                  {...controlProps}
                  value={form.licensingCompliance}
                  onChange={(event) =>
                    update("licensingCompliance", event.target.value)
                  }
                  rows={4}
                  maxLength={2000}
                />
              )}
            </DashboardField>
            <DashboardField
              id="notes"
              label="Additional notes"
              className="md:col-span-2"
            >
              {(controlProps) => (
                <DashboardTextarea
                  {...controlProps}
                  value={form.notes}
                  onChange={(event) => update("notes", event.target.value)}
                  rows={4}
                  maxLength={3000}
                />
              )}
            </DashboardField>
          </DashboardFormGrid>
        </DashboardSection>
      </DashboardFormLayout>
    </form>
  );
}

function SubmissionGuidance({
  submitting,
  hydrated,
}: {
  submitting: boolean;
  hydrated: boolean;
}) {
  return (
    <DashboardCard>
      <DashboardCardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <DashboardCardTitle>Submit for admin review</DashboardCardTitle>
          <DashboardStatusBadge tone="info">
            Supplier panel
          </DashboardStatusBadge>
        </div>
        <DashboardCardDescription>
          You receive a reference only. Kuinbee controls review, publication,
          and closure.
        </DashboardCardDescription>
      </DashboardCardHeader>
      <DashboardCardContent>
        <ul className="list-disc space-y-2 pl-5 text-sm leading-5 text-muted-foreground">
          <li>The draft is saved in this browser for two hours.</li>
          <li>The submission origin is recorded as Supplier panel.</li>
          <li>No requirement-management area is created in your account.</li>
        </ul>
        <DashboardButton
          type="submit"
          className="mt-6 w-full"
          size="large"
          disabled={submitting || !hydrated}
        >
          {submitting
            ? "Submitting…"
            : hydrated
              ? "Submit requirement"
              : "Preparing form…"}
        </DashboardButton>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Submit once. Repeated requests return the same reference.
        </p>
      </DashboardCardContent>
    </DashboardCard>
  );
}

function Counter({
  value,
  min,
  max,
}: {
  value: string;
  min: number;
  max: number;
}) {
  const belowMinimum = value.trim().length < min;
  return (
    <p className="text-right text-xs text-muted-foreground" aria-live="polite">
      {value.length}/{max}
      {belowMinimum ? ` · minimum ${min}` : ""}
    </p>
  );
}
