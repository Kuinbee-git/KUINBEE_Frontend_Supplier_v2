import type { ReactNode } from "react";

const inset =
  "rounded-lg border border-border bg-[var(--dashboard-control-background)]";
const tinyLabel = "text-[11px] font-medium text-muted-foreground";

function Marker({ number }: { number: number }) {
  return (
    <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-[var(--dashboard-action)] text-xs font-bold text-[var(--dashboard-action-foreground)]">
      {number}
    </span>
  );
}

function PreviewHeading({
  number,
  children,
}: {
  number: number;
  children: ReactNode;
}) {
  return (
    <div className="mb-2 flex items-center gap-2">
      <Marker number={number} />
      <span className="text-xs font-semibold text-foreground">{children}</span>
    </div>
  );
}

function PreviewField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <div className={tinyLabel}>{label}</div>
      <div className={`${inset} min-h-9 px-3 py-2 text-xs text-foreground`}>
        {value}
      </div>
    </div>
  );
}

function PreviewFrame({
  step,
  children,
}: {
  step: number;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-[var(--dashboard-glass-background-soft)]">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <span className="text-xs font-semibold">Create proposal</span>
        <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
          Draft example
        </span>
      </div>
      <div className="grid grid-cols-4 border-b border-border text-center text-[11px] font-medium sm:text-xs">
        {[
          ["Basics", "Basics"],
          ["Files", "Files & contents"],
          ["Details", "Dataset details"],
          ["Review", "Review draft"],
        ].map(([shortLabel, fullLabel], index) => (
          <div
            key={fullLabel}
            className={`min-w-0 border-r border-border px-1 py-2 last:border-r-0 ${
              index === step
                ? "border-b-2 border-b-[var(--dashboard-action)] text-foreground"
                : "text-muted-foreground"
            }`}
          >
            <span className="sm:hidden">
              {index + 1}. {shortLabel}
            </span>
            <span className="hidden sm:inline">
              {index + 1}. {fullLabel}
            </span>
          </div>
        ))}
      </div>
      {children}
    </div>
  );
}

function BasicsPreview() {
  return (
    <PreviewFrame step={0}>
      <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,.9fr)]">
        <div className="space-y-4">
          <div>
            <PreviewHeading number={1}>Basics</PreviewHeading>
            <PreviewField
              label="Dataset title"
              value="September support calls"
            />
          </div>
          <div className="border-t border-border pt-4">
            <PreviewHeading number={2}>What are you uploading?</PreviewHeading>
            <div className="grid gap-1.5 text-xs">
              <div className="rounded-md border border-border px-3 py-2 text-muted-foreground">
                ○ Sample only
              </div>
              <div className="rounded-md border border-border px-3 py-2 text-muted-foreground">
                ○ Full dataset only
              </div>
              <div className="rounded-md border border-[var(--dashboard-action)] bg-[var(--dashboard-glass-background-soft)] px-3 py-2 font-medium">
                ◉ Full dataset + sample
              </div>
            </div>
          </div>
          <div className="border-t border-border pt-4">
            <PreviewHeading number={3}>Main types of data</PreviewHeading>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className={`${inset} px-2 py-1`}>☑ Audio</span>
              <span className={`${inset} px-2 py-1`}>☑ Text</span>
              <span className={`${inset} px-2 py-1 text-muted-foreground`}>
                □ Images
              </span>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Additional context: neither selected
            </p>
          </div>
        </div>
        <div className="border-t border-border pt-4 lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0">
          <PreviewHeading number={4}>
            Category, source &amp; license
          </PreviewHeading>
          <div className="space-y-3">
            <PreviewField label="Primary category" value="Call Center" />
            <PreviewField
              label="Data source"
              value="Consented support-call collection"
            />
            <PreviewField
              label="Dataset license"
              value="Supplier's stated license"
            />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3 text-[11px] text-muted-foreground sm:px-5">
        <span>Save partial answers and return later</span>
        <span className="shrink-0 rounded-md border border-border px-3 py-1.5 font-semibold text-foreground">
          Save draft
        </span>
      </div>
    </PreviewFrame>
  );
}

function FilesPreview() {
  return (
    <PreviewFrame step={1}>
      <div className="space-y-4 p-4 sm:p-5">
        <div>
          <PreviewHeading number={1}>Set up files and upload</PreviewHeading>
          <div className="rounded-lg border border-dashed border-border px-4 py-5 text-center">
            <div className="text-xs font-semibold">Upload prepared files</div>
            <div className="mt-1 text-[11px] text-muted-foreground">
              Wait for a confirmed result before organizing them
            </div>
          </div>
        </div>
        <div className="border-t border-border pt-4">
          <PreviewHeading number={2}>Selected material</PreviewHeading>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className={`${inset} min-w-0 p-3`}>
              <div className="text-xs font-semibold">Full dataset</div>
              <div className="mt-2 truncate border-t border-border pt-2 text-xs">
                support-calls.zip
              </div>
              <div className="mt-1 text-[11px] text-muted-foreground">
                Private full material
              </div>
            </div>
            <div className={`${inset} min-w-0 p-3`}>
              <div className="text-xs font-semibold">Sample</div>
              <div className="mt-2 truncate border-t border-border pt-2 text-xs">
                sample-calls.wav
              </div>
              <div className="mt-1 text-[11px] text-muted-foreground">
                Prepared buyer sample
              </div>
            </div>
          </div>
        </div>
        <div className="grid gap-4 border-t border-border pt-4 sm:grid-cols-2">
          <div>
            <PreviewHeading number={3}>Companion relationship</PreviewHeading>
            <div className={`${inset} px-3 py-2 text-xs`}>
              sample-transcript.txt{" "}
              <span className="text-muted-foreground">→</span> sample-calls.wav
            </div>
          </div>
          <div>
            <PreviewHeading number={4}>Confirmed inventory</PreviewHeading>
            <div
              className={`${inset} flex items-center justify-between gap-2 px-3 py-2 text-xs`}
            >
              <span>Selected files shown</span>
              <span className="font-semibold">Refresh files</span>
            </div>
          </div>
        </div>
      </div>
    </PreviewFrame>
  );
}

function DetailsPreview() {
  return (
    <PreviewFrame step={2}>
      <div className="space-y-4 p-4 sm:p-5">
        <div>
          <PreviewHeading number={1}>
            What collection does this Dataset cover?
          </PreviewHeading>
          <div className={`${inset} px-3 py-3 text-xs leading-5`}>
            All 120 consented support calls in the September 2026 collection.
          </div>
        </div>
        <div className="border-t border-border pt-4">
          <PreviewHeading number={2}>Three different scopes</PreviewHeading>
          <div className="grid gap-2 sm:grid-cols-3">
            {[
              ["Collection size", "120 calls", "Represented"],
              ["Full dataset size", "120 calls", "Prepared full"],
              ["Sample size", "6 calls", "Prepared sample"],
            ].map(([label, value, scope]) => (
              <div key={label} className={`${inset} p-3`}>
                <div className={tinyLabel}>{label}</div>
                <div className="mt-2 text-base font-semibold">{value}</div>
                <div className="text-[11px] text-muted-foreground">{scope}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="grid gap-4 border-t border-border pt-4 sm:grid-cols-2">
          <div>
            <PreviewHeading number={3}>
              Questions for selected types
            </PreviewHeading>
            <div className={`${inset} space-y-1 px-3 py-2 text-xs`}>
              <div>Audio · languages and recording context</div>
              <div>Text · record and annotation meaning</div>
            </div>
          </div>
          <div>
            <PreviewHeading number={4}>
              Sample coverage &amp; limits
            </PreviewHeading>
            <div className={`${inset} px-3 py-2 text-xs leading-5`}>
              Six calls cover both languages; most calls are not in the sample.
            </div>
          </div>
        </div>
      </div>
    </PreviewFrame>
  );
}

function ReviewPreview() {
  return (
    <PreviewFrame step={3}>
      <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-2">
        <div className="space-y-4">
          <div>
            <PreviewHeading number={1}>Saved proposal</PreviewHeading>
            <div className={`${inset} space-y-2 p-3 text-xs`}>
              <div className="font-semibold">September support calls</div>
              <div className="flex justify-between gap-3 border-t border-border pt-2">
                <span>Collection</span>
                <span>120 calls</span>
              </div>
              <div className="flex justify-between gap-3">
                <span>Sample</span>
                <span>6 calls</span>
              </div>
              <div className="flex justify-between gap-3">
                <span>Files</span>
                <span>Full + sample</span>
              </div>
            </div>
          </div>
          <div className="border-t border-border pt-4">
            <PreviewHeading number={2}>Access &amp; pricing</PreviewHeading>
            <div className={`${inset} space-y-2 p-3 text-xs`}>
              <div>○ Free access &nbsp;&nbsp; ◉ Paid access</div>
              <div className="border-t border-border pt-2 text-muted-foreground">
                Save pricing → Submit pricing for review
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-4 border-t border-border pt-4 lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0">
          <div>
            <PreviewHeading number={3}>Ready for admin review?</PreviewHeading>
            <div className={`${inset} space-y-2 p-3 text-xs`}>
              <div>✓ Saved answers</div>
              <div>✓ Selected files</div>
              <div>✓ Pricing state</div>
              <div className="border-t border-border pt-2 font-semibold">
                Refresh review checks
              </div>
            </div>
          </div>
          <div className="border-t border-border pt-4">
            <PreviewHeading number={4}>Separate Submit action</PreviewHeading>
            <div className="rounded-md bg-[var(--dashboard-action)] px-3 py-2 text-center text-xs font-semibold text-[var(--dashboard-action-foreground)]">
              Submit proposal for admin review
            </div>
            <div className="mt-2 text-[11px] text-muted-foreground">
              Admin review → approval → supplier publication
            </div>
          </div>
        </div>
      </div>
    </PreviewFrame>
  );
}

export function ProposalGuideVisual({ step }: { step: number }) {
  return (
    <figure className="min-w-0" data-proposal-guide-visual={step + 1}>
      <div aria-hidden="true">
        {step === 0 ? (
          <BasicsPreview />
        ) : step === 1 ? (
          <FilesPreview />
        ) : step === 2 ? (
          <DetailsPreview />
        ) : (
          <ReviewPreview />
        )}
      </div>
      <figcaption className="mt-2 text-xs text-muted-foreground">
        Illustrated example using fictional content. Use the live editor for
        your own proposal.
      </figcaption>
    </figure>
  );
}

export function ProposalMaterialChoicesVisual() {
  return (
    <div className="grid overflow-hidden rounded-lg border border-border sm:grid-cols-3">
      {[
        {
          label: "Sample only",
          full: false,
          sample: true,
          caption:
            "A prepared preview; describe the larger collection honestly.",
        },
        {
          label: "Full dataset only",
          full: true,
          sample: false,
          caption:
            "The complete material for your defined collection boundary.",
        },
        {
          label: "Full dataset + sample",
          full: true,
          sample: true,
          caption: "Complete material plus a separate buyer sample.",
        },
      ].map((choice) => (
        <div
          key={choice.label}
          className="min-w-0 border-b border-border p-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0"
        >
          <div className="text-sm font-semibold">{choice.label}</div>
          <div className="mt-3 flex gap-2 text-[11px] font-medium">
            <span
              className={`rounded-md border px-2 py-1 ${choice.full ? "border-[var(--dashboard-action)] text-foreground" : "border-border text-muted-foreground opacity-50"}`}
            >
              {choice.full ? "Full supplied" : "No full file"}
            </span>
            <span
              className={`rounded-md border px-2 py-1 ${choice.sample ? "border-[var(--dashboard-action)] text-foreground" : "border-border text-muted-foreground opacity-50"}`}
            >
              {choice.sample ? "Sample supplied" : "No sample"}
            </span>
          </div>
          <p className="mt-3 text-xs leading-5 text-muted-foreground">
            {choice.caption}
          </p>
        </div>
      ))}
    </div>
  );
}
