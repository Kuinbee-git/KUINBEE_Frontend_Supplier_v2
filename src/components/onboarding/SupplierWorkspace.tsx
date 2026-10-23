"use client";
import {
  cloneElement,
  useEffect,
  useRef,
  useState,
  type ReactElement,
} from "react";
import { Check, Circle, LogOut } from "lucide-react";
import { DashboardButton } from "@/components/dashboard/ui/dashboard-button";
import {
  DashboardField,
  DashboardInput,
  DashboardTextarea,
  type DashboardFieldControlProps,
} from "@/components/dashboard/ui/dashboard-form";
import {
  DashboardSelect,
  DashboardSelectContent,
  DashboardSelectItem,
  DashboardSelectTrigger,
  DashboardSelectValue,
} from "@/components/dashboard/ui/dashboard-select";
import Link from "next/link";
import { reloadAt } from "@/lib/utils/reload-navigation";
import {
  loadSupplierWorkspace,
  saveSupplierWorkspace,
  submitSupplierWorkspace,
  onboardingRequest,
  uploadVerificationDocument,
  supplierSignOut,
} from "@/lib/api/supplier-onboarding";
import type {
  SupplierWorkspaceDto,
  SupplierIdentity,
  SupplierCapabilities,
  SupplierVerificationDetails,
} from "@/lib/supplier-onboarding-contracts";
import { SupplierProfileLogo } from "./SupplierProfileLogo";
import { SupplierOnboardingShell } from "./SupplierOnboardingShell";
import { SupplierApplicationEntry } from "./SupplierApplicationEntry";
import styles from "./supplier-onboarding.module.css";

const message = (error: unknown) =>
  error instanceof Error
    ? error.message
    : "Unable to complete this request. Try again.";
const pretty = (key: string) =>
  key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
function Summary({ values }: { values: Record<string, unknown> }) {
  return (
    <dl className={styles.summary}>
      {Object.entries(values).map(([key, value]) => (
        <div className="contents" key={key}>
          <dt>{pretty(key)}</dt>
          <dd>
            {Array.isArray(value)
              ? value.join(", ") || "Not provided"
              : String(value || "Not provided")}
          </dd>
        </div>
      ))}
    </dl>
  );
}
function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactElement<DashboardFieldControlProps>;
  hint?: string;
}) {
  return (
    <DashboardField label={label} description={hint}>
      {(props) => cloneElement(children, props)}
    </DashboardField>
  );
}

export function SupplierWorkspace({ profile = false }: { profile?: boolean }) {
  const [data, setData] = useState<SupplierWorkspaceDto | null>(null);
  const [identity, setIdentity] = useState<SupplierIdentity | null>(null);
  const [capabilities, setCapabilities] = useState<SupplierCapabilities | null>(
    null
  );
  const [details, setDetails] = useState<SupplierVerificationDetails | null>(
    null
  );
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [needsEmail, setNeedsEmail] = useState(false);
  const [needsLogin, setNeedsLogin] = useState(false);
  const load = useRef<Promise<SupplierWorkspaceDto> | null>(null);
  function accept(next: SupplierWorkspaceDto) {
    setData(next);
    setIdentity(next.identity);
    setCapabilities(next.capabilities);
    setDetails(next.verificationDetails);
    setDirty(false);
  }
  useEffect(() => {
    if (!load.current)
      load.current = (async () => {
        const token = new URLSearchParams(window.location.hash.slice(1)).get(
          "token"
        );
        if (token) {
          window.history.replaceState(
            null,
            "",
            window.location.pathname + window.location.search
          );
          await onboardingRequest("/exchange", { token });
        }
        return loadSupplierWorkspace();
      })();
    let active = true;
    load.current
      .then((next) => {
        if (active) accept(next);
      })
      .catch((err) => {
        if (!active) return;
        if (err.code === "LOGIN_REQUIRED" || err.code === "INVITATION_REQUIRED")
          setNeedsLogin(true);
        else if (err.status === 401 && !profile) setNeedsEmail(true);
        else setError(message(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [profile]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  async function run(
    action: () => Promise<SupplierWorkspaceDto>,
    success = "Saved"
  ) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      accept(await action());
      setNotice(success);
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  }
  async function save() {
    if (!data || !identity || !capabilities || !details) return;
    await run(
      () =>
        saveSupplierWorkspace(
          {
            version: data.version,
            identity,
            capabilities,
            verificationDetails: details,
          },
          data.verificationStatus === "APPROVED"
        ),
      "Your changes are saved."
    );
  }
  function editIdentity(key: keyof SupplierIdentity, value: string) {
    setIdentity((i) => (i ? { ...i, [key]: value } : i));
    setDirty(true);
  }
  function editCapability(key: keyof SupplierCapabilities, value: string) {
    setCapabilities((c) =>
      c
        ? {
            ...c,
            [key]: Array.isArray(c[key])
              ? value
                  .split(",")
                  .map((v) => v.trim())
                  .filter(Boolean)
              : value,
          }
        : c
    );
    setDirty(true);
  }
  const verified = Boolean(data?.userId);
  const approved = data?.verificationStatus === "APPROVED";
  const steps = verified
    ? [
        "Confirm details",
        "Private documents",
        "Capabilities",
        "Review & submit",
      ]
    : ["About you", "Capabilities", "Review & submit"];
  const capabilityStep = verified ? 2 : 1;
  const reviewStep = steps.length - 1;
  const editable = Boolean(data?.canEdit || approved);
  const name =
    identity?.supplierType === "COMPANY"
      ? "Company / organization name *"
      : "Full name *";
  const listFields: (keyof SupplierCapabilities)[] = [
    "offerings",
    "domains",
    "modalities",
    "formats",
    "countries",
    "languages",
  ];
  if (needsEmail) return <SupplierApplicationEntry status />;
  const signOutAction = (
    <DashboardButton
      variant="ghost"
      size="compact"
      disabled={busy}
      onClick={async () => {
        try {
          await supplierSignOut();
          reloadAt("/");
        } catch (err) {
          setError(message(err));
        }
      }}
    >
      <LogOut aria-hidden="true" />
      <span>Sign out</span>
    </DashboardButton>
  );
  const content = (
    <>
      <div className={styles.workspaceHeader}>
        <div>
          <p className={styles.eyebrow}>
            {profile
              ? "Your complete supplier profile"
              : "Supplier application & verification"}
          </p>
          <h1 className={styles.title}>
            {loading
              ? "Loading your workspace…"
              : profile
                ? "Your supplier profile"
                : verified
                  ? "Complete your verification"
                  : "Your supplier application"}
          </h1>
          {data && (
            <div className={styles.statusLine}>
              <span>{data.email}</span>
              <span className={styles.statusBadge}>
                {pretty(
                  (verified ? data.verificationStatus : data.applicationStatus)
                    .toLowerCase()
                    .replaceAll("_", " ")
                )}
              </span>
              <span className="inline-flex items-center gap-1.5">
                {dirty ? (
                  <Circle className="size-3" aria-hidden="true" />
                ) : (
                  <Check className="size-3.5" aria-hidden="true" />
                )}
                {dirty ? "Unsaved changes" : "Saved"}
              </span>
            </div>
          )}
        </div>
        {profile && signOutAction}
      </div>
      {loading && (
        <div
          role="status"
          aria-label="Loading workspace"
          className={`${styles.panel} space-y-6`}
        >
          <div className="h-5 w-48 rounded bg-muted" />
          <div className={styles.grid}>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-10 rounded-lg bg-muted" />
            ))}
          </div>
        </div>
      )}
      {error && (
        <div className={styles.error} role="alert">
          {error}
          <div className={styles.actions}>
            <DashboardButton
              variant="outline"
              onClick={() => window.location.reload()}
            >
              Refresh
            </DashboardButton>
            <DashboardButton asChild variant="outline">
              <Link href="/application/status">Request a new email link</Link>
            </DashboardButton>
          </div>
        </div>
      )}
      {needsLogin && (
        <div className={styles.notice}>
          <p>
            Sign in with your supplier account to continue. If you have an
            unaccepted invitation, open its secure email link first.
          </p>
          <DashboardButton asChild>
            <Link href="/auth/login">Supplier login</Link>
          </DashboardButton>
        </div>
      )}
      {notice && (
        <p className={styles.notice} role="status">
          {notice}
        </p>
      )}
      {data?.reason && <p className={styles.notice}>{data.reason}</p>}
      {data && identity && capabilities && details && (
        <>
          {data.access === "APPROVED" && (
            <div className={styles.actions}>
              <DashboardButton asChild variant="outline">
                <Link href="/dashboard">Open supplier dashboard</Link>
              </DashboardButton>
              <DashboardButton asChild variant="outline">
                <Link href="/dashboard/datasets">Manage datasets</Link>
              </DashboardButton>
            </div>
          )}
          {!editable && (
            <section className={`${styles.panel} mt-6`}>
              <h2 className={styles.sectionTitle}>
                {data.applicationStatus === "INVITED" && !verified
                  ? "You’re invited"
                  : "Your submission is saved"}
              </h2>
              <p className={styles.muted}>
                {data.applicationStatus === "INVITED" && !verified
                  ? "Open the invitation email to activate your account or sign in. If it has expired, contact support for a replacement."
                  : "Your submitted information is retained below. We’ll email you when there’s an update or a correction to make."}
              </p>
              {(verified ? data.verificationStatus : data.applicationStatus) ===
                "REJECTED" && (
                <div className={styles.actions}>
                  <p>
                    {data.reapplyAt
                      ? `Eligible to reapply from ${new Date(data.reapplyAt).toLocaleDateString()}.`
                      : "Contact support about a changed offering or an earlier review."}
                  </p>
                  <DashboardButton
                    disabled={
                      busy ||
                      !data.reapplyAt ||
                      new Date(data.reapplyAt) > new Date()
                    }
                    variant="outline"
                    onClick={() =>
                      run(
                        () =>
                          onboardingRequest("/workspace/reapply", {
                            version: data.version,
                          }),
                        "You can now update and resubmit."
                      )
                    }
                  >
                    Reapply
                  </DashboardButton>
                </div>
              )}
            </section>
          )}
          <div
            className={styles.workspaceFrame}
            data-readonly={!editable || undefined}
          >
            {editable && (
              <aside className={styles.workspaceAside}>
                <p className={styles.eyebrow}>
                  {profile ? "Your profile" : "Your progress"}
                </p>
                <nav aria-label="Application sections">
                  <ol className={styles.steps}>
                    {steps.map((title, index) => (
                      <li key={title}>
                        <button
                          type="button"
                          className={styles.step}
                          aria-label={`${index + 1}. ${title}`}
                          aria-current={step === index ? "step" : undefined}
                          onClick={() => setStep(index)}
                        >
                          <span
                            className={styles.stepNumber}
                            aria-hidden="true"
                          >
                            {index + 1}
                          </span>
                          <span>{title}</span>
                        </button>
                      </li>
                    ))}
                  </ol>
                </nav>
              </aside>
            )}
            <section className={styles.workspaceContent}>
              {!editable ? (
                <>
                  <h2 className={styles.sectionTitle}>Your saved details</h2>
                  <Summary values={identity} />
                  <hr className={styles.divider} />
                  <h3 className={styles.subsectionTitle}>Capabilities</h3>
                  <Summary values={capabilities} />
                  {verified && <Summary values={details} />}
                </>
              ) : (
                <fieldset disabled={busy} className="min-w-0">
                  {step === 0 && (
                    <>
                      <h2 className={styles.sectionTitle}>
                        {verified
                          ? "Confirm your prefilled details"
                          : "About you"}
                      </h2>
                      <p className={`${styles.muted} mb-6`}>
                        {approved
                          ? "Reviewed identity changes need approval. Your capabilities can be maintained in the next section."
                          : "We’ve kept everything you already supplied. Complete only what’s missing or needs correction."}
                      </p>
                      <div className={styles.grid}>
                        <DashboardField label="Supplier type">
                          {(props) => (
                            <DashboardSelect
                              disabled={approved || busy}
                              value={identity.supplierType}
                              onValueChange={(value) =>
                                editIdentity("supplierType", value)
                              }
                            >
                              <DashboardSelectTrigger {...props}>
                                <DashboardSelectValue />
                              </DashboardSelectTrigger>
                              <DashboardSelectContent>
                                <DashboardSelectItem value="INDIVIDUAL">
                                  Individual
                                </DashboardSelectItem>
                                <DashboardSelectItem value="COMPANY">
                                  Company / organization
                                </DashboardSelectItem>
                              </DashboardSelectContent>
                            </DashboardSelect>
                          )}
                        </DashboardField>
                        <Field label={name}>
                          <DashboardInput
                            disabled={approved}
                            value={identity.name}
                            maxLength={200}
                            onChange={(e) =>
                              editIdentity("name", e.target.value)
                            }
                          />
                        </Field>
                        <Field label="Contact person *">
                          <DashboardInput
                            disabled={approved}
                            value={identity.contactName}
                            maxLength={200}
                            onChange={(e) =>
                              editIdentity("contactName", e.target.value)
                            }
                            autoComplete="name"
                          />
                        </Field>
                        <Field label="Country *">
                          <DashboardInput
                            disabled={approved}
                            value={identity.country}
                            maxLength={100}
                            onChange={(e) =>
                              editIdentity("country", e.target.value)
                            }
                            autoComplete="country-name"
                          />
                        </Field>
                        <Field label="Phone / preferred contact">
                          <DashboardInput
                            disabled={approved}
                            value={identity.phone}
                            maxLength={40}
                            onChange={(e) =>
                              editIdentity("phone", e.target.value)
                            }
                            autoComplete="tel"
                          />
                        </Field>
                        <Field label="Website">
                          <DashboardInput
                            disabled={approved}
                            value={identity.website}
                            maxLength={500}
                            onChange={(e) =>
                              editIdentity("website", e.target.value)
                            }
                            placeholder="https://"
                          />
                        </Field>
                        {identity.supplierType === "COMPANY" && (
                          <Field label="Your role">
                            <DashboardInput
                              disabled={approved}
                              value={identity.role}
                              maxLength={120}
                              onChange={(e) =>
                                editIdentity("role", e.target.value)
                              }
                            />
                          </Field>
                        )}
                      </div>
                      {verified && (
                        <>
                          <hr className={styles.divider} />
                          <h3 className={styles.subsectionTitle}>
                            Verification details
                          </h3>
                          <p className={`${styles.muted} mb-6`}>
                            Provide the details relevant to your entity.
                            Registration or tax numbers are optional when not
                            applicable.
                          </p>
                          <div className={styles.grid}>
                            {Object.entries(details).map(([key, value]) => (
                              <Field label={pretty(key)} key={key}>
                                {key === "address" || key === "notes" ? (
                                  <DashboardTextarea
                                    disabled={approved}
                                    value={value}
                                    maxLength={key === "address" ? 1000 : 3000}
                                    onChange={(e) => {
                                      setDetails({
                                        ...details,
                                        [key]: e.target.value,
                                      });
                                      setDirty(true);
                                    }}
                                  />
                                ) : (
                                  <DashboardInput
                                    disabled={approved}
                                    value={value}
                                    maxLength={
                                      key === "registrationCountry" ? 100 : 160
                                    }
                                    onChange={(e) => {
                                      setDetails({
                                        ...details,
                                        [key]: e.target.value,
                                      });
                                      setDirty(true);
                                    }}
                                  />
                                )}
                              </Field>
                            ))}
                          </div>
                        </>
                      )}
                      {approved && (
                        <div className={styles.actions}>
                          <DashboardButton
                            variant="outline"
                            onClick={() =>
                              run(
                                () =>
                                  onboardingRequest(
                                    "/profile/identity-change",
                                    {
                                      version: data.version,
                                    }
                                  ),
                                "Your proposed identity changes can now be edited and submitted for review."
                              )
                            }
                          >
                            Request identity or document change
                          </DashboardButton>
                        </div>
                      )}
                    </>
                  )}
                  {verified && step === 1 && (
                    <>
                      <h2 className={styles.sectionTitle}>
                        Private verification documents
                      </h2>
                      <p className={styles.muted}>
                        Three required slots and two optional slots. Choose any
                        accepted alternative for each slot, including an
                        equivalent from your country. PDF, PNG or JPEG, up to 5
                        MB each. Files are private and shared with authorized
                        reviewers.
                      </p>
                      {data.documentChecklist.map((slot) => (
                        <div className={styles.document} key={slot.key}>
                          <h3>
                            {slot.label} ·{" "}
                            {slot.required ? "Required" : "Optional"}
                          </h3>
                          <p className={styles.muted}>
                            {slot.acceptedAlternatives.join(" / ")}
                          </p>
                          <ul>
                            {data.documents
                              .filter((d) => d.requirementKey === slot.key)
                              .map((d) => (
                                <li key={d.id}>
                                  <span>
                                    {d.name} · {(d.size / 1024).toFixed(0)} KB
                                  </span>
                                  <button
                                    type="button"
                                    className={styles.textButton}
                                    onClick={async () => {
                                      try {
                                        const link = await onboardingRequest<{
                                          url: string;
                                        }>(`/workspace/documents/${d.id}`);
                                        window.open(
                                          link.url,
                                          "_blank",
                                          "noopener,noreferrer"
                                        );
                                      } catch (err) {
                                        setError(message(err));
                                      }
                                    }}
                                  >
                                    Download
                                  </button>
                                  {!approved && (
                                    <button
                                      type="button"
                                      className={styles.textButton}
                                      onClick={() =>
                                        run(
                                          () =>
                                            onboardingRequest(
                                              `/workspace/documents/${d.id}`,
                                              { version: data.version },
                                              "DELETE"
                                            ),
                                          "Document removed from the draft."
                                        )
                                      }
                                    >
                                      Remove
                                    </button>
                                  )}
                                </li>
                              ))}
                          </ul>
                          {!approved && (
                            <label className={styles.field}>
                              {`Upload ${slot.label}`}
                              <input
                                type="file"
                                accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                                disabled={dirty || busy}
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  e.target.value = "";
                                  if (!file) return;
                                  if (file.size > 5 * 1024 * 1024) {
                                    setError("Choose a document up to 5 MB.");
                                    return;
                                  }
                                  void run(
                                    () =>
                                      uploadVerificationDocument(
                                        file,
                                        slot.key,
                                        data.version
                                      ),
                                    "Document saved. Submit verification when all required slots are complete."
                                  );
                                }}
                              />
                              {dirty && (
                                <small>
                                  Save your form changes before uploading a
                                  document.
                                </small>
                              )}
                            </label>
                          )}
                        </div>
                      ))}
                    </>
                  )}
                  {step === capabilityStep && (
                    <>
                      <h2 className={styles.sectionTitle}>Your capabilities</h2>
                      <p className={`${styles.muted} mb-6`}>
                        Tell us what you offer. Separate list entries with
                        commas. More detail helps our team understand relevant
                        opportunities; optional fields can be completed later.
                      </p>
                      <div className={styles.grid}>
                        {listFields.map((key) => (
                          <Field
                            label={`${pretty(key)}${["offerings", "domains"].includes(key) ? " *" : ""}`}
                            key={key}
                            hint={
                              key === "offerings"
                                ? "For example: existing datasets, custom collection, annotation / processing"
                                : undefined
                            }
                          >
                            <DashboardInput
                              key={`${data.id}-${data.version}-${key}`}
                              defaultValue={(
                                capabilities[key] as string[]
                              ).join(", ")}
                              maxLength={4800}
                              onChange={() => setDirty(true)}
                              onBlur={(e) =>
                                editCapability(key, e.target.value)
                              }
                            />
                          </Field>
                        ))}
                      </div>
                      <div className={`${styles.grid} mt-6`}>
                        {Object.entries(capabilities)
                          .filter(([, v]) => !Array.isArray(v))
                          .map(([key, value]) => (
                            <Field
                              key={key}
                              label={`${pretty(key)}${["description", "rights"].includes(key) ? " *" : ""}`}
                              hint={
                                key === "description"
                                  ? "At least 20 characters. Describe the data or services you can provide."
                                  : key === "rights"
                                    ? "Explain your ownership or authorization to supply and license the data."
                                    : undefined
                              }
                            >
                              <DashboardTextarea
                                value={String(value)}
                                maxLength={
                                  key === "description" || key === "notes"
                                    ? 5000
                                    : key === "experience"
                                      ? 3000
                                      : ["capacity", "availability"].includes(
                                            key
                                          )
                                        ? 500
                                        : 2000
                                }
                                onChange={(e) =>
                                  editCapability(
                                    key as keyof SupplierCapabilities,
                                    e.target.value
                                  )
                                }
                              />
                            </Field>
                          ))}
                      </div>
                    </>
                  )}
                  {step === reviewStep && (
                    <>
                      <h2 className={styles.sectionTitle}>
                        Review your information
                      </h2>
                      <p className={styles.muted}>
                        {approved
                          ? "Your current profile and full capabilities are visible here."
                          : "Save your changes, check the details below, then explicitly submit this version for review."}
                      </p>
                      <Summary values={identity} />
                      <Summary values={capabilities} />
                      {verified && (
                        <>
                          <Summary values={details} />
                          <h3 className={styles.subsectionTitle}>Documents</h3>
                          {data.documentChecklist.map((slot) => (
                            <p className={styles.muted} key={slot.key}>
                              {slot.label}:{" "}
                              {data.documents
                                .filter((d) => d.requirementKey === slot.key)
                                .map((d) => d.name)
                                .join(", ") ||
                                (slot.required
                                  ? "Required — missing"
                                  : "Not provided (optional)")}
                            </p>
                          ))}
                        </>
                      )}
                    </>
                  )}
                  <div className={styles.actionBar}>
                    <DashboardButton
                      type="button"
                      variant={dirty ? "default" : "outline"}
                      disabled={busy || !dirty}
                      onClick={save}
                    >
                      {busy ? "Saving…" : "Save changes"}
                    </DashboardButton>
                    <div className={styles.actionGroup}>
                      {step > 0 && (
                        <DashboardButton
                          type="button"
                          variant="outline"
                          onClick={() => setStep(step - 1)}
                        >
                          Back
                        </DashboardButton>
                      )}
                      {step < reviewStep && (
                        <DashboardButton
                          type="button"
                          variant={dirty ? "outline" : "default"}
                          onClick={() => setStep(step + 1)}
                        >
                          Next
                        </DashboardButton>
                      )}
                      {step === reviewStep && !approved && (
                        <DashboardButton
                          type="button"
                          disabled={busy || dirty}
                          onClick={() =>
                            run(
                              () => submitSupplierWorkspace(data.version),
                              "Submitted for admin review. We’ll email you when the status changes."
                            )
                          }
                        >
                          {verified
                            ? "Submit verification"
                            : "Submit application"}
                        </DashboardButton>
                      )}
                    </div>
                  </div>
                </fieldset>
              )}
            </section>
          </div>
          {verified && !editable && (
            <section className={`${styles.panel} mt-6`}>
              <h2 className={styles.sectionTitle}>Your private documents</h2>
              <ul className="space-y-3 mt-4">
                {data.documents.map((doc) => (
                  <li key={doc.id}>
                    <button
                      type="button"
                      className={styles.textButton}
                      onClick={async () => {
                        try {
                          const link = await onboardingRequest<{ url: string }>(
                            `/workspace/documents/${doc.id}`
                          );
                          window.open(
                            link.url,
                            "_blank",
                            "noopener,noreferrer"
                          );
                        } catch (err) {
                          setError(message(err));
                        }
                      }}
                    >
                      {doc.name}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {profile && data.access === "APPROVED" && <SupplierProfileLogo />}
          {data.reviews.length > 0 && (
            <section className={`${styles.panel} mt-6`}>
              <h2 className={styles.sectionTitle}>Submission history</h2>
              {data.reviews.map((review) => (
                <details className={styles.document} key={review.id}>
                  <summary className="cursor-pointer">
                    {pretty(review.phase.toLowerCase())} ·{" "}
                    {new Date(review.submittedAt).toLocaleDateString()} ·{" "}
                    {review.decision
                      ? pretty(
                          review.decision.toLowerCase().replaceAll("_", " ")
                        )
                      : "Awaiting review"}
                  </summary>
                  {review.reason && (
                    <p className={styles.notice}>{review.reason}</p>
                  )}
                  <Summary values={review.snapshot.identity} />
                  <Summary values={review.snapshot.capabilities} />
                  {review.phase === "VERIFICATION" && (
                    <Summary values={review.snapshot.verificationDetails} />
                  )}
                </details>
              ))}
            </section>
          )}
        </>
      )}
    </>
  );
  return profile ? (
    <div
      className="mx-auto max-w-[1120px] px-[var(--dashboard-page-padding-inline)] py-[var(--dashboard-page-padding-block)]"
      data-dashboard-content="true"
    >
      {content}
    </div>
  ) : (
    <SupplierOnboardingShell actions={signOutAction}>
      {content}
    </SupplierOnboardingShell>
  );
}
