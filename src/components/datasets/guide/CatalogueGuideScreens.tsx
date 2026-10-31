import type { ReactNode } from "react";
import { Check, FileSpreadsheet, FolderOpen, Upload } from "lucide-react";

const control =
  "rounded-lg border border-border bg-[var(--dashboard-control-background)]";
const primary =
  "inline-flex items-center justify-center rounded-md bg-[var(--dashboard-action)] px-3 py-2 text-xs font-semibold text-[var(--dashboard-action-foreground)]";
const secondary =
  "inline-flex items-center justify-center rounded-md border border-border px-3 py-2 text-xs font-medium";

function Group({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0 space-y-3">
      <div
        data-guide-target={number}
        className="flex items-center gap-2 text-sm font-semibold"
      >
        <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full border border-border text-xs">
          {number}
        </span>
        {title}
      </div>
      {children}
    </div>
  );
}

export function CatalogueGuideScreen({
  step,
  action,
}: {
  step: number;
  action: number;
}) {
  return (
    <figure className="min-w-0" data-catalogue-guide-visual={step + 1}>
      <div
        aria-hidden="true"
        className="overflow-hidden rounded-xl border border-border bg-[var(--dashboard-glass-background-soft)]"
      >
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <span className="flex items-center gap-2 text-sm font-semibold">
            <FileSpreadsheet className="size-4" />
            Import private catalogue
          </span>
          <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
            Example only
          </span>
        </div>
        <div className="grid grid-cols-3 border-b border-border text-center text-xs">
          {["Prepare file", "Preview & match", "Save drafts"].map(
            (title, index) => (
              <div
                key={title}
                className={`min-w-0 border-r border-border px-2 py-3 last:border-r-0 ${index === step ? "border-b-2 border-b-[var(--dashboard-action)] font-semibold" : "text-muted-foreground"}`}
              >
                {index + 1}. {title}
              </div>
            )
          )}
        </div>
        <div className="space-y-5 p-4 sm:p-5">
          {step === 0 ? (
            <>
              <Group number={1} title="Prepare your metadata file">
                <div className="flex flex-wrap gap-2">
                  <span className={secondary}>Download Excel template</span>
                  <span className={secondary}>Download CSV template</span>
                </div>
              </Group>
              <Group number={2} title="Keep the template columns">
                <div className={`${control} overflow-hidden text-xs`}>
                  <div className="grid grid-cols-[1fr_1.25fr] gap-3 border-b border-border px-3 py-2 font-medium">
                    <span className="break-words">Collection ID</span>
                    <span>Collection name</span>
                  </div>
                  <div className="grid grid-cols-[1fr_1.25fr] gap-3 px-3 py-3">
                    <span>COLL-001</span>
                    <span>September support calls</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Required: identifier and title. Optional metadata can stay
                  unconfirmed.
                </p>
              </Group>
              <Group number={3} title="Catalogue file">
                <div
                  className={`${control} flex items-center gap-3 p-3 text-xs`}
                >
                  <Upload className="size-4 shrink-0" />
                  <span>catalogue.csv</span>
                  <span className="ml-auto text-muted-foreground">
                    270 rows
                  </span>
                </div>
              </Group>
              <Group number={4} title="Preview before saving">
                <div className="flex flex-wrap items-center gap-3">
                  <span className={primary}>Validate and preview</span>
                  <span className="text-xs text-muted-foreground">
                    Drafts are unchanged.
                  </span>
                </div>
              </Group>
            </>
          ) : step === 1 ? (
            <>
              <Group number={1} title="Review catalogue">
                <div
                  className={`${control} grid grid-cols-3 divide-x divide-border`}
                >
                  {[
                    ["Collections", 270],
                    ["Create", 220],
                    ["Unchanged", 50],
                  ].map(([title, value]) => (
                    <div key={title} className="min-w-0 p-3">
                      <div className="text-[11px] text-muted-foreground">
                        {title}
                      </div>
                      <div className="mt-1 text-xl font-semibold">{value}</div>
                    </div>
                  ))}
                </div>
              </Group>
              <Group number={2} title="Match each catalogue identifier">
                <div className={`${control} divide-y divide-border text-xs`}>
                  <div className="flex flex-wrap items-center justify-between gap-2 p-3">
                    <span className="font-medium">
                      COLL-001 · Support calls
                    </span>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Check className="size-3" />
                      Existing draft
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 p-3">
                    <span className="font-medium">
                      COLL-051 · Image collection
                    </span>
                    <span className="text-muted-foreground">New draft</span>
                  </div>
                  <div className="p-3">
                    <span className={secondary}>Find drafts</span>
                  </div>
                </div>
              </Group>
              <Group number={3} title="Review warnings and errors">
                <div
                  className={`${control} flex items-start gap-2 p-3 text-xs`}
                >
                  <span className="font-semibold">20</span>
                  <span>
                    File formats unconfirmed. These rows can remain private
                    drafts.
                  </span>
                </div>
              </Group>
              <Group number={4} title="Apply matching or exclusion choices">
                <div className="flex flex-wrap items-center gap-3">
                  <span className={secondary}>Update preview</span>
                  <span className="text-xs text-muted-foreground">
                    Selected errors must be resolved.
                  </span>
                </div>
              </Group>
            </>
          ) : (
            <>
              <Group number={1} title="Save the reviewed rows">
                <span className={primary}>Save private drafts</span>
              </Group>
              <Group number={2} title="Confirm the result">
                <div className={`${control} space-y-3 p-3`}>
                  <div className="flex justify-between gap-3 text-xs">
                    <span>
                      {action >= 1 ? "Import completed" : "Ready to save"}
                    </span>
                    <span>{action >= 1 ? "270 / 270" : "270 collections"}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-[var(--dashboard-glass-background-soft)]">
                    <div
                      className="h-full rounded-full bg-[var(--dashboard-action)] transition-[width] duration-500 motion-reduce:transition-none"
                      style={{ width: action >= 1 ? "100%" : "0%" }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    50 drafts preserved · 220 drafts created
                  </p>
                </div>
              </Group>
              <Group number={3} title="Continue in My drafts">
                <div
                  className={`${control} flex items-center gap-3 p-3 text-xs`}
                >
                  <FolderOpen className="size-4 shrink-0" />
                  <div>
                    <div className="font-medium">September support calls</div>
                    <div className="mt-1 text-muted-foreground">
                      Private draft · continue editing
                    </div>
                  </div>
                </div>
              </Group>
              <Group number={4} title="Import history">
                <div className="flex flex-wrap gap-2">
                  <span className={secondary}>Open batch</span>
                  <span className={secondary}>Download row report</span>
                </div>
              </Group>
            </>
          )}
        </div>
        <div className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
          Saving stays separate from submission, publication and buyer access.
        </div>
      </div>
      <figcaption className="mt-3 text-xs text-muted-foreground">
        Example catalogue. No collections are created by this walkthrough.
      </figcaption>
    </figure>
  );
}
