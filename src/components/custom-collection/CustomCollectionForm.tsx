"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Loader2,
  PencilLine,
} from "lucide-react";
import { type FieldPath, useForm, useWatch } from "react-hook-form";

import {
  DashboardButton as Button,
  DashboardCheckbox,
  DashboardFormActions,
  DashboardInput as Input,
  DashboardSelect,
  DashboardSelectContent,
  DashboardSelectItem,
  DashboardSelectTrigger,
  DashboardSelectValue,
  DashboardTextarea as Textarea,
} from "@/components/dashboard";
import { cn } from "@/lib/utils";
import { listCategories } from "@/lib/api/catalog";
import type { CustomCollectionRevisionInput } from "@/types/custom-collection.types";
import {
  COLLECTION_METHOD_OPTIONS,
  customCollectionFormSchema,
  DATA_TYPE_OPTIONS,
  EMPTY_CUSTOM_COLLECTION_INPUT,
  FORMAT_OPTIONS,
  GEOGRAPHY_OPTIONS,
  INDUSTRY_OPTIONS,
  LANGUAGE_OPTIONS,
  type CustomCollectionOption,
} from "./customCollectionUtils";

interface CustomCollectionFormProps {
  initialValues?: CustomCollectionRevisionInput;
  submitLabel: string;
  busy?: boolean;
  categoryOptions?: Array<{ id: string; name: string }>;
  loadCategories?: boolean;
  isExistingDraft?: boolean;
  onSubmit: (values: CustomCollectionRevisionInput) => Promise<void>;
}

const EMPTY_CATEGORY_OPTIONS: Array<{ id: string; name: string }> = [];

type MultiValueField =
  | "collectionMethods"
  | "dataTypes"
  | "supportedFormats"
  | "industries"
  | "geographies"
  | "languages";

const STEPS = [
  {
    title: "Service overview",
    description: "Explain the buyer problem you solve",
  },
  {
    title: "Collection capabilities",
    description: "Define your methods and coverage",
  },
  {
    title: "Delivery and trust",
    description: "Set expectations for the engagement",
  },
  {
    title: "Review changes",
    description: "Check every detail before saving",
  },
] as const;

const STEP_FIELDS: Array<Array<FieldPath<CustomCollectionRevisionInput>>> = [
  [
    "title",
    "shortDescription",
    "description",
    "primaryCategoryId",
    "secondaryCategoryIds",
  ],
  [
    "collectionMethods",
    "collectionMethodsOther",
    "dataTypes",
    "dataTypesOther",
    "industries",
    "industriesOther",
    "geographies",
    "geographiesOther",
    "languages",
    "languagesOther",
  ],
  [
    "supportedFormats",
    "supportedFormatsOther",
    "estimatedTurnaroundMinDays",
    "estimatedTurnaroundMaxDays",
    "deliverables",
    "qualityAssurance",
    "complianceNotes",
  ],
  [],
];

export function CustomCollectionForm({
  initialValues = EMPTY_CUSTOM_COLLECTION_INPUT,
  submitLabel,
  busy = false,
  categoryOptions = EMPTY_CATEGORY_OPTIONS,
  loadCategories = true,
  isExistingDraft = false,
  onSubmit,
}: CustomCollectionFormProps) {
  const [step, setStep] = useState(0);
  const [categories, setCategories] = useState(categoryOptions);
  const [categoriesLoading, setCategoriesLoading] = useState(loadCategories);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [categoryQuery, setCategoryQuery] = useState("");
  const categoryDisclosure = useRef<HTMLDetailsElement>(null);
  const categoryHelpId = useId();

  const {
    register,
    control,
    setValue,
    reset,
    trigger,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<CustomCollectionRevisionInput>({
    resolver: zodResolver(customCollectionFormSchema),
    defaultValues: initialValues,
    mode: "onTouched",
  });

  const formValues = useWatch({ control });

  useEffect(() => reset(initialValues), [initialValues, reset]);

  useEffect(() => {
    if (!isDirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);

  useEffect(() => {
    if (!loadCategories) return;

    let active = true;
    listCategories({ pageSize: 100 })
      .then((response) => {
        if (!active) return;
        setCategories((current) => {
          const options = new Map(
            [...current, ...categoryOptions, ...response.items].map((item) => [
              item.id,
              item,
            ])
          );
          return Array.from(options.values());
        });
        setCategoriesError(null);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setCategoriesError(
          error instanceof Error
            ? error.message
            : "Categories could not be loaded."
        );
      })
      .finally(() => {
        if (active) setCategoriesLoading(false);
      });
    return () => {
      active = false;
    };
  }, [categoryOptions, loadCategories]);

  const primaryCategoryId = formValues.primaryCategoryId ?? "";
  const secondaryCategoryIds = formValues.secondaryCategoryIds ?? [];

  const secondaryCategories = useMemo(
    () => categories.filter(({ id }) => id !== primaryCategoryId),
    [categories, primaryCategoryId]
  );
  const categoryNames = useMemo(
    () => new Map(categories.map(({ id, name }) => [id, name])),
    [categories]
  );

  const moveNext = async () => {
    if (!(await trigger(STEP_FIELDS[step]))) return;
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  };

  const submitInvalid = () => {
    const firstInvalidStep = STEP_FIELDS.findIndex((fields) =>
      fields.some((field) => field in errors)
    );
    if (firstInvalidStep >= 0) setStep(firstInvalidStep);
  };

  const submitOrAdvance = (event: React.FormEvent<HTMLFormElement>) => {
    if (step < STEPS.length - 1) {
      event.preventDefault();
      void moveNext();
      return;
    }

    void handleSubmit(onSubmit, submitInvalid)(event);
  };

  return (
    <form
      onSubmit={submitOrAdvance}
      className="custom-collection-form dashboard-panel-stack"
      noValidate
    >
      <nav
        aria-label="Service form progress"
        className="grid grid-cols-2 border-b border-border xl:grid-cols-4"
      >
        {STEPS.map((item, index) => {
          const active = index === step;
          const complete = index < step;
          return (
            <button
              key={item.title}
              type="button"
              onClick={() => setStep(index)}
              className={cn(
                "flex min-w-0 flex-col items-start border-b-2 border-transparent p-4 text-left transition-colors",
                active
                  ? "border-b-[var(--dashboard-focus-ring)] bg-[var(--dashboard-control-background)]"
                  : "hover:bg-muted/55"
              )}
              aria-current={active ? "step" : undefined}
            >
              <span className="flex items-center gap-2 text-sm font-semibold">
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full border text-xs",
                    active || complete
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground"
                  )}
                >
                  {complete ? <Check className="size-3.5" /> : index + 1}
                </span>
                {item.title}
              </span>
              <span className="mt-1 hidden pl-8 text-xs text-muted-foreground 2xl:block">
                {item.description}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="min-w-0 p-4 sm:p-6">
        {step === 0 && (
          <div className="space-y-6">
            <SectionHeading
              title="Describe your service"
              description="Use buyer-friendly language and focus on the outcome your team can deliver."
            />

            <TextField
              id="title"
              label="Service title"
              hint="A specific, searchable title works best."
              error={errors.title?.message}
              required
            >
              <Input
                id="title"
                maxLength={120}
                placeholder="Example: Retail price and availability field collection"
                {...register("title")}
              />
              <CharacterCount value={formValues.title} max={120} />
            </TextField>

            <TextField
              id="shortDescription"
              label="Marketplace summary"
              hint="This appears on service cards, so lead with the strongest capability."
              error={errors.shortDescription?.message}
              required
            >
              <Textarea
                id="shortDescription"
                rows={3}
                maxLength={240}
                placeholder="Summarize what you collect, for whom, and the outcome buyers receive."
                {...register("shortDescription")}
              />
              <CharacterCount value={formValues.shortDescription} max={240} />
            </TextField>

            <TextField
              id="description"
              label="Full service description"
              hint="Explain your process, expertise, buyer inputs, and typical engagement."
              error={errors.description?.message}
              required
            >
              <Textarea
                id="description"
                rows={6}
                maxLength={5000}
                placeholder="Describe how an engagement works from scoping through delivery..."
                {...register("description")}
              />
              <CharacterCount value={formValues.description} max={5000} />
            </TextField>

            <div className="grid gap-6 lg:grid-cols-2">
              <TextField
                id="primaryCategoryId"
                label="Primary category"
                hint="Main marketplace category."
                error={
                  errors.primaryCategoryId?.message ||
                  categoriesError ||
                  undefined
                }
                required
              >
                <DashboardSelect
                  value={primaryCategoryId || undefined}
                  onValueChange={(value) =>
                    setValue("primaryCategoryId", value, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                  disabled={categoriesLoading || Boolean(categoriesError)}
                >
                  <DashboardSelectTrigger
                    id="primaryCategoryId"
                    aria-label="Primary category"
                    aria-invalid={Boolean(
                      errors.primaryCategoryId?.message || categoriesError
                    )}
                  >
                    <DashboardSelectValue
                      placeholder={
                        categoriesLoading
                          ? "Loading categories…"
                          : categoriesError
                            ? "Categories unavailable"
                            : "Select a category"
                      }
                    />
                  </DashboardSelectTrigger>
                  <DashboardSelectContent>
                    {categories.map(({ id, name }) => (
                      <DashboardSelectItem key={id} value={id}>
                        {name}
                      </DashboardSelectItem>
                    ))}
                  </DashboardSelectContent>
                </DashboardSelect>
              </TextField>

              <fieldset className="min-w-0">
                <legend className="text-sm font-medium">
                  Secondary categories
                </legend>
                <p
                  id={categoryHelpId}
                  className="mt-1 text-xs text-muted-foreground"
                >
                  Optional. Choose up to 10.
                </p>
                <details
                  className="mt-2"
                  ref={categoryDisclosure}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") {
                      event.preventDefault();
                      event.currentTarget.open = false;
                      event.currentTarget.querySelector("summary")?.focus();
                    }
                  }}
                >
                  <summary
                    aria-label="Choose secondary categories"
                    aria-describedby={categoryHelpId}
                    className="dashboard-field-control flex h-10 cursor-pointer list-none items-center justify-between gap-2 rounded-lg border px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dashboard-focus-ring)] [&::-webkit-details-marker]:hidden"
                  >
                    <span>
                      {secondaryCategoryIds.length
                        ? `${secondaryCategoryIds.length} selected`
                        : "Choose categories"}
                    </span>
                    <ChevronDown
                      aria-hidden="true"
                      className="size-4 shrink-0"
                    />
                  </summary>
                  <div className="mt-2 space-y-2 rounded-lg border border-border p-2">
                    <Input
                      aria-label="Search secondary categories"
                      placeholder="Search categories"
                      value={categoryQuery}
                      onChange={(event) => setCategoryQuery(event.target.value)}
                    />
                    <div className="dashboard-scroll-region max-h-48 space-y-1 overflow-y-auto">
                      {secondaryCategories.length ? (
                        secondaryCategories
                          .filter((category) =>
                            category.name
                              .toLowerCase()
                              .includes(categoryQuery.trim().toLowerCase())
                          )
                          .map((category) => {
                            const checked = secondaryCategoryIds.includes(
                              category.id
                            );
                            const atLimit = secondaryCategoryIds.length >= 10;
                            return (
                              <label
                                key={category.id}
                                className={cn(
                                  "flex min-h-9 cursor-pointer items-center gap-2 rounded-md px-2 text-sm hover:bg-accent",
                                  !checked &&
                                    atLimit &&
                                    "cursor-not-allowed opacity-50"
                                )}
                              >
                                <DashboardCheckbox
                                  checked={checked}
                                  disabled={!checked && atLimit}
                                  onCheckedChange={() => {
                                    setValue(
                                      "secondaryCategoryIds",
                                      checked
                                        ? secondaryCategoryIds.filter(
                                            (id) => id !== category.id
                                          )
                                        : [
                                            ...secondaryCategoryIds,
                                            category.id,
                                          ],
                                      {
                                        shouldDirty: true,
                                        shouldValidate: true,
                                      }
                                    );
                                  }}
                                />
                                {category.name}
                              </label>
                            );
                          })
                      ) : (
                        <p className="p-2 text-sm text-muted-foreground">
                          Select a primary category first.
                        </p>
                      )}
                    </div>
                    {secondaryCategories.length > 0 &&
                      !secondaryCategories.some((category) =>
                        category.name
                          .toLowerCase()
                          .includes(categoryQuery.trim().toLowerCase())
                      ) && (
                        <p className="px-2 text-sm text-muted-foreground">
                          No categories match your search.
                        </p>
                      )}
                    <Button
                      type="button"
                      variant="outline"
                      size="compact"
                      onClick={() => {
                        if (categoryDisclosure.current) {
                          categoryDisclosure.current.open = false;
                          categoryDisclosure.current
                            .querySelector("summary")
                            ?.focus();
                        }
                      }}
                    >
                      Done
                    </Button>
                  </div>
                </details>
                {secondaryCategoryIds.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {secondaryCategoryIds
                      .map((id) => categoryNames.get(id) ?? "Saved category")
                      .join(", ")}
                  </p>
                )}
                {errors.secondaryCategoryIds?.message && (
                  <FieldError>{errors.secondaryCategoryIds.message}</FieldError>
                )}
              </fieldset>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-7">
            <SectionHeading
              title="Define your collection capabilities"
              description="Select every option you can reliably support. Buyers will use these as marketplace filters."
            />
            <MultiChoiceField
              label="Collection methods"
              name="collectionMethods"
              options={COLLECTION_METHOD_OPTIONS}
              values={formValues.collectionMethods ?? []}
              otherValue={formValues.collectionMethodsOther ?? null}
              error={errors.collectionMethods?.message}
              otherError={errors.collectionMethodsOther?.message}
              onChange={(values) =>
                setValue("collectionMethods", values, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              onOtherChange={(value) =>
                setValue("collectionMethodsOther", value, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            />
            <MultiChoiceField
              label="Data types"
              name="dataTypes"
              options={DATA_TYPE_OPTIONS}
              values={formValues.dataTypes ?? []}
              otherValue={formValues.dataTypesOther ?? null}
              error={errors.dataTypes?.message}
              otherError={errors.dataTypesOther?.message}
              onChange={(values) =>
                setValue("dataTypes", values, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              onOtherChange={(value) =>
                setValue("dataTypesOther", value, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            />
            <MultiChoiceField
              label="Industries served"
              name="industries"
              options={INDUSTRY_OPTIONS}
              values={formValues.industries ?? []}
              otherValue={formValues.industriesOther ?? null}
              error={errors.industries?.message}
              otherError={errors.industriesOther?.message}
              onChange={(values) =>
                setValue("industries", values, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              onOtherChange={(value) =>
                setValue("industriesOther", value, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            />
            <MultiChoiceField
              label="Geographic coverage"
              name="geographies"
              options={GEOGRAPHY_OPTIONS}
              values={formValues.geographies ?? []}
              otherValue={formValues.geographiesOther ?? null}
              error={errors.geographies?.message}
              otherError={errors.geographiesOther?.message}
              onChange={(values) =>
                setValue("geographies", values, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              onOtherChange={(value) =>
                setValue("geographiesOther", value, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            />
            <MultiChoiceField
              label="Languages supported"
              name="languages"
              options={LANGUAGE_OPTIONS}
              values={formValues.languages ?? []}
              otherValue={formValues.languagesOther ?? null}
              error={errors.languages?.message}
              otherError={errors.languagesOther?.message}
              onChange={(values) =>
                setValue("languages", values, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              onOtherChange={(value) =>
                setValue("languagesOther", value, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-7">
            <SectionHeading
              title="Set delivery expectations"
              description="Give buyers enough detail to judge fit before they request a consultation."
            />
            <MultiChoiceField
              label="Supported delivery formats"
              name="supportedFormats"
              options={FORMAT_OPTIONS}
              values={formValues.supportedFormats ?? []}
              otherValue={formValues.supportedFormatsOther ?? null}
              error={errors.supportedFormats?.message}
              otherError={errors.supportedFormatsOther?.message}
              onChange={(values) =>
                setValue("supportedFormats", values, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              onOtherChange={(value) =>
                setValue("supportedFormatsOther", value, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                id="estimatedTurnaroundMinDays"
                label="Minimum turnaround"
                hint="Calendar days"
                error={errors.estimatedTurnaroundMinDays?.message}
                required
              >
                <Input
                  id="estimatedTurnaroundMinDays"
                  type="number"
                  min={1}
                  max={365}
                  {...register("estimatedTurnaroundMinDays", {
                    valueAsNumber: true,
                  })}
                />
              </TextField>
              <TextField
                id="estimatedTurnaroundMaxDays"
                label="Maximum turnaround"
                hint="Calendar days"
                error={errors.estimatedTurnaroundMaxDays?.message}
                required
              >
                <Input
                  id="estimatedTurnaroundMaxDays"
                  type="number"
                  min={1}
                  max={365}
                  {...register("estimatedTurnaroundMaxDays", {
                    valueAsNumber: true,
                  })}
                />
              </TextField>
            </div>

            <TextField
              id="deliverables"
              label="Typical deliverables"
              hint="Describe the files, documentation, metadata, or access buyers receive."
              error={errors.deliverables?.message}
              required
            >
              <Textarea
                id="deliverables"
                rows={5}
                maxLength={3000}
                placeholder="Example: cleaned CSV files, data dictionary, methodology report, and collection log..."
                {...register("deliverables")}
              />
              <CharacterCount value={formValues.deliverables} max={3000} />
            </TextField>

            <TextField
              id="qualityAssurance"
              label="Quality assurance"
              hint="Explain validation, sampling, deduplication, review, and acceptance checks."
              error={errors.qualityAssurance?.message}
              required
            >
              <Textarea
                id="qualityAssurance"
                rows={5}
                maxLength={3000}
                placeholder="Describe the controls your team uses to maintain accuracy and completeness..."
                {...register("qualityAssurance")}
              />
              <CharacterCount value={formValues.qualityAssurance} max={3000} />
            </TextField>

            <TextField
              id="complianceNotes"
              label="Compliance and privacy notes"
              hint="Optional. Mention consent, privacy, security, regulatory, or ethical safeguards."
              error={errors.complianceNotes?.message}
            >
              <Textarea
                id="complianceNotes"
                rows={5}
                maxLength={3000}
                value={formValues.complianceNotes ?? ""}
                onChange={(event) =>
                  setValue("complianceNotes", event.target.value || null, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
              />
              <CharacterCount
                value={formValues.complianceNotes ?? ""}
                max={3000}
              />
            </TextField>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <SectionHeading
              title="Review your changes"
              description="Nothing is saved yet. Check the complete service draft, then go back to any section that needs correction."
            />

            <ReviewSection title="Service overview" onEdit={() => setStep(0)}>
              <ReviewValue label="Service title" value={formValues.title} />
              <ReviewValue
                label="Marketplace summary"
                value={formValues.shortDescription}
              />
              <ReviewValue
                label="Full description"
                value={formValues.description}
                wide
              />
              <ReviewValue
                label="Primary category"
                value={
                  categoryNames.get(formValues.primaryCategoryId ?? "") ??
                  "Not selected"
                }
              />
              <ReviewValue
                label="Secondary categories"
                value={formatCategoryNames(
                  formValues.secondaryCategoryIds,
                  categoryNames
                )}
              />
            </ReviewSection>

            <ReviewSection
              title="Collection capabilities"
              onEdit={() => setStep(1)}
            >
              <ReviewValue
                label="Collection methods"
                value={formatOptionNames(
                  formValues.collectionMethods,
                  COLLECTION_METHOD_OPTIONS,
                  formValues.collectionMethodsOther
                )}
              />
              <ReviewValue
                label="Data types"
                value={formatOptionNames(
                  formValues.dataTypes,
                  DATA_TYPE_OPTIONS,
                  formValues.dataTypesOther
                )}
              />
              <ReviewValue
                label="Industries"
                value={formatOptionNames(
                  formValues.industries,
                  INDUSTRY_OPTIONS,
                  formValues.industriesOther
                )}
              />
              <ReviewValue
                label="Geographies"
                value={formatOptionNames(
                  formValues.geographies,
                  GEOGRAPHY_OPTIONS,
                  formValues.geographiesOther
                )}
              />
              <ReviewValue
                label="Languages"
                value={formatOptionNames(
                  formValues.languages,
                  LANGUAGE_OPTIONS,
                  formValues.languagesOther
                )}
              />
            </ReviewSection>

            <ReviewSection title="Delivery and trust" onEdit={() => setStep(2)}>
              <ReviewValue
                label="Delivery formats"
                value={formatOptionNames(
                  formValues.supportedFormats,
                  FORMAT_OPTIONS,
                  formValues.supportedFormatsOther
                )}
              />
              <ReviewValue
                label="Estimated turnaround"
                value={`${formValues.estimatedTurnaroundMinDays ?? "—"}–${
                  formValues.estimatedTurnaroundMaxDays ?? "—"
                } days`}
              />
              <ReviewValue
                label="Typical deliverables"
                value={formValues.deliverables}
                wide
              />
              <ReviewValue
                label="Quality assurance"
                value={formValues.qualityAssurance}
                wide
              />
              <ReviewValue
                label="Compliance and privacy"
                value={formValues.complianceNotes || "Not provided"}
                wide
              />
            </ReviewSection>
          </div>
        )}
      </div>

      <DashboardFormActions
        className="rounded-none border-x-0 border-b-0 px-4 md:px-6"
        status={
          busy
            ? "Saving draft…"
            : isDirty
              ? "Unsaved changes. Save at the review step."
              : isExistingDraft
                ? "No unsaved changes."
                : "Your draft is created after the review step."
        }
      >
        {step > 0 && (
          <Button
            type="button"
            variant="outline"
            className="min-h-10 w-full shrink-0 sm:w-auto"
            onClick={() => setStep((current) => current - 1)}
            disabled={busy}
          >
            <ChevronLeft /> Previous
          </Button>
        )}
        {step < STEPS.length - 1 ? (
          <Button
            key="next-step"
            type="button"
            className="min-h-10 w-full shrink-0 sm:w-auto"
            onClick={moveNext}
            disabled={busy || categoriesLoading || Boolean(categoriesError)}
          >
            Next <ChevronRight />
          </Button>
        ) : (
          <Button
            key="save-draft"
            type="submit"
            className="min-h-10 w-full shrink-0 sm:w-auto"
            disabled={busy}
          >
            {busy && <Loader2 className="animate-spin" />}
            {submitLabel}
          </Button>
        )}
      </DashboardFormActions>
    </form>
  );
}

function SectionHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="border-b pb-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function TextField({
  id,
  label,
  hint,
  error,
  required = false,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex min-w-0 flex-col gap-1">
        <label htmlFor={id} className="text-sm font-medium text-foreground">
          {label} {required && <span className="text-destructive">*</span>}
        </label>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      {children}
      {error && <FieldError>{error}</FieldError>}
    </div>
  );
}

function FieldError({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="text-xs font-medium text-destructive">
      {children}
    </p>
  );
}

function CharacterCount({ value, max }: { value?: string; max: number }) {
  return (
    <p
      className="text-right text-[11px] text-muted-foreground"
      aria-live="polite"
    >
      {value?.length ?? 0}/{max}
    </p>
  );
}

function ReviewSection({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="min-w-0 border-t border-border first:border-t-0">
      <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/35 px-4 py-3 sm:px-5">
        <h3 className="font-semibold">{title}</h3>
        <Button type="button" variant="ghost" size="compact" onClick={onEdit}>
          <PencilLine /> Edit
        </Button>
      </div>
      <div className="grid gap-x-8 gap-y-5 p-4 sm:grid-cols-2 sm:p-5">
        {children}
      </div>
    </section>
  );
}

function ReviewValue({
  label,
  value,
  wide = false,
}: {
  label: string;
  value?: string | number | null;
  wide?: boolean;
}) {
  return (
    <div className={cn("min-w-0", wide && "sm:col-span-2")}>
      <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1.5 whitespace-pre-wrap break-words text-sm leading-6 text-foreground">
        {value || "Not provided"}
      </p>
    </div>
  );
}

function formatOptionNames(
  values: string[] | undefined,
  options: CustomCollectionOption[],
  otherValue?: string | null
) {
  if (!values?.length) return "Not selected";
  const labels = new Map(options.map(({ value, label }) => [value, label]));
  return values
    .map((value) =>
      value === "OTHER" && otherValue ? otherValue : labels.get(value) || value
    )
    .join(", ");
}

function formatCategoryNames(
  values: string[] | undefined,
  categoryNames: Map<string, string>
) {
  if (!values?.length) return "None selected";
  return values.map((value) => categoryNames.get(value) || value).join(", ");
}

function MultiChoiceField({
  label,
  name,
  options,
  values,
  otherValue,
  error,
  otherError,
  onChange,
  onOtherChange,
}: {
  label: string;
  name: MultiValueField;
  options: CustomCollectionOption[];
  values: string[];
  otherValue: string | null;
  error?: string;
  otherError?: string;
  onChange: (values: string[]) => void;
  onOtherChange: (value: string | null) => void;
}) {
  const toggle = (value: string) => {
    const selected = values.includes(value);
    onChange(
      selected ? values.filter((item) => item !== value) : [...values, value]
    );
    if (value === "OTHER" && selected) onOtherChange(null);
  };

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-semibold">
        {label} <span className="text-destructive">*</span>
      </legend>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {options.map((option) => {
          const selected = values.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              role="checkbox"
              aria-checked={selected}
              onClick={() => toggle(option.value)}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                selected
                  ? "border-primary bg-primary/5 text-foreground"
                  : "dashboard-glass-control border-[var(--dashboard-control-border)] hover:bg-muted/55"
              )}
            >
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded border",
                  selected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input"
                )}
              >
                {selected && <Check className="size-3.5" />}
              </span>
              {option.label}
            </button>
          );
        })}
      </div>
      {error && <FieldError>Select at least one option.</FieldError>}
      {values.includes("OTHER") && (
        <div className="max-w-xl space-y-2">
          <label
            htmlFor={`${name}-other`}
            className="text-sm font-medium text-foreground"
          >
            Describe the other option
          </label>
          <Input
            id={`${name}-other`}
            maxLength={200}
            value={otherValue ?? ""}
            onChange={(event) => onOtherChange(event.target.value || null)}
          />
          {otherError && <FieldError>{otherError}</FieldError>}
        </div>
      )}
    </fieldset>
  );
}
