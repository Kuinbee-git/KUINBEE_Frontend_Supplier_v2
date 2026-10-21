import Link from "next/link";
import { notFound } from "next/navigation";
import { ClipboardList, FolderUp, ListChecks, Send } from "lucide-react";
import { DashboardButton, DashboardCard } from "@/components/dashboard";
import {
  ProposalGuideVisual,
  ProposalMaterialChoicesVisual,
} from "@/components/datasets/guide/ProposalGuideVisuals";
import {
  DatasetPageHeader,
  DatasetWorkspace,
} from "@/components/datasets/workspace/DatasetWorkspace";
import { DATASET_PREPARATION_ENABLED } from "@/lib/dataset-preparation-environment";
import {
  PROPOSAL_DATA_TYPE_GUIDANCE,
  PROPOSAL_REVIEW_GUIDANCE,
  PROPOSAL_SCREEN_WALKTHROUGH,
  PROPOSAL_STEP_GUIDANCE,
  PROPOSAL_VISUAL_NOTES,
} from "@/lib/datasets/proposal-guidance";

const sectionClass = "min-w-0 scroll-mt-24 space-y-5 px-5 py-6 sm:px-8 sm:py-8";
const linkClass =
  "inline-flex min-h-10 items-center rounded-sm text-sm font-medium underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-[var(--dashboard-focus-ring)]";
const screenIcons = [ClipboardList, FolderUp, ListChecks, Send] as const;

export default function DatasetProposalGuidePage() {
  if (!DATASET_PREPARATION_ENABLED) notFound();
  return (
    <DatasetWorkspace className="dataset-proposal-workspace max-w-[80rem]">
      <DatasetPageHeader
        title="Dataset proposal guide"
        description="See each proposal screen, what to enter, and what happens after submission."
        action={
          <div className="flex flex-wrap gap-3">
            <DashboardButton asChild variant="outline">
              <Link href="/dashboard/datasets">My drafts</Link>
            </DashboardButton>
            <DashboardButton asChild>
              <Link href="/dashboard/datasets/create">Create proposal</Link>
            </DashboardButton>
          </div>
        }
      />
      <DashboardCard
        className="min-w-0 overflow-hidden"
        data-proposal-panel="true"
      >
        <article className="divide-y divide-border leading-6">
          <nav aria-label="Proposal guide contents" className={sectionClass}>
            <h2 className="text-lg font-semibold">
              Choose a screen to explore
            </h2>
            <p className="max-w-3xl text-sm text-muted-foreground">
              Each illustrated screen has numbered callouts and field examples.
              Open any step below, then use the live editor for your own draft.
            </p>
            <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-border xl:grid-cols-4">
              {PROPOSAL_STEP_GUIDANCE.map((step, index) => {
                const Icon = screenIcons[index];
                const borderClass = [
                  "border-b border-r xl:border-b-0",
                  "border-b xl:border-r xl:border-b-0",
                  "border-r",
                  "",
                ][index];
                return (
                  <a
                    key={step.title}
                    href={`#step-${index + 1}`}
                    className={`min-w-0 border-border p-4 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--dashboard-focus-ring)] ${borderClass}`}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                        Screen {index + 1}
                      </span>
                      <Icon
                        className="size-5 text-[var(--dashboard-action)]"
                        aria-hidden="true"
                      />
                    </span>
                    <span className="mt-3 block text-sm font-semibold">
                      {step.title}
                    </span>
                    <span className="mt-1 hidden text-xs leading-5 text-muted-foreground sm:block">
                      {step.summary}
                    </span>
                    <span className="mt-3 block text-xs font-semibold text-[var(--dashboard-action)]">
                      View illustrated screen →
                    </span>
                  </a>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              <a href="#prepare" className={linkClass}>
                Before you start
              </a>
              <a href="#review-process" className={linkClass}>
                After submission
              </a>
              <a href="#common-questions" className={linkClass}>
                Common questions
              </a>
            </div>
          </nav>
          <section
            id="prepare"
            aria-labelledby="prepare-title"
            className={sectionClass}
          >
            <h2 id="prepare-title" className="text-xl font-semibold">
              Before you start
            </h2>
            <p className="max-w-3xl text-sm text-muted-foreground">
              Know what collection you are describing, where it came from, its
              stated license, and which files you intend to supply. A category
              describes the subject; data types describe the content; the upload
              choice describes the material you are supplying now.
            </p>
            <ProposalMaterialChoicesVisual />
            <p className="max-w-3xl text-sm text-muted-foreground">
              Current upload limits are 2 GB per file, 5 GB shared across full
              material, samples and companions in one Dataset, and 100 GB across
              your supplier account. GB means one billion bytes. Retained files
              and active upload reservations count; the backend decides
              available capacity. Use the supported file types offered by the
              upload form.
            </p>
          </section>
          {PROPOSAL_STEP_GUIDANCE.map((step, index) => (
            <section
              key={step.title}
              id={`step-${index + 1}`}
              aria-labelledby={`step-${index + 1}-title`}
              className={sectionClass}
            >
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Screen {index + 1} of 4
                </p>
                <h2
                  id={`step-${index + 1}-title`}
                  className="text-xl font-semibold"
                >
                  {index + 1}. {step.title}
                </h2>
                <p className="max-w-3xl text-sm text-muted-foreground">
                  {PROPOSAL_SCREEN_WALKTHROUGH[index].goal}
                </p>
              </div>
              <div className="grid min-w-0 items-start gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)]">
                <ProposalGuideVisual step={index} />
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold">Follow the callouts</h3>
                  <ol className="mt-2 divide-y divide-border">
                    {PROPOSAL_VISUAL_NOTES[index].map(
                      ([title, detail], noteIndex) => (
                        <li key={title} className="flex gap-3 py-3 first:pt-0">
                          <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-[var(--dashboard-action)] text-xs font-bold text-[var(--dashboard-action-foreground)]">
                            {noteIndex + 1}
                          </span>
                          <div className="min-w-0 text-sm">
                            <p className="font-semibold">{title}</p>
                            <p className="mt-1 text-muted-foreground">
                              {detail}
                            </p>
                          </div>
                        </li>
                      )
                    )}
                  </ol>
                </div>
              </div>
              <h3 className="text-sm font-semibold">Field-by-field help</h3>
              <div className="border-y border-border">
                {PROPOSAL_SCREEN_WALKTHROUGH[index].fields.map(
                  ([field, instruction, example]) => (
                    <div
                      key={field}
                      className="grid gap-2 border-b border-border py-4 last:border-b-0 sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-5"
                    >
                      <h3 className="text-sm font-semibold">{field}</h3>
                      <div className="space-y-1 text-sm">
                        <p>{instruction}</p>
                        <p className="text-muted-foreground">
                          <span className="font-medium text-foreground">
                            Example:{" "}
                          </span>
                          {example}
                        </p>
                      </div>
                    </div>
                  )
                )}
              </div>
              <p className="max-w-3xl border-l-2 border-[var(--dashboard-action)] pl-4 text-sm">
                <span className="font-semibold">
                  Before you leave this screen:{" "}
                </span>
                {PROPOSAL_SCREEN_WALKTHROUGH[index].finish}
              </p>
              {index === 2 && (
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-left text-sm">
                    <caption className="border-b border-border p-4 text-left font-medium">
                      Information to prepare for each data type
                    </caption>
                    <tbody className="divide-y divide-border">
                      {PROPOSAL_DATA_TYPE_GUIDANCE.map(
                        ([type, information]) => (
                          <tr key={type}>
                            <th
                              scope="row"
                              className="p-4 align-top font-medium"
                            >
                              {type}
                            </th>
                            <td className="p-4 text-muted-foreground">
                              {information}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          ))}
          <section
            id="review-process"
            aria-labelledby="review-process-title"
            className={sectionClass}
          >
            <h2 id="review-process-title" className="text-xl font-semibold">
              What happens after submission?
            </h2>
            <ol className="divide-y divide-border">
              {PROPOSAL_REVIEW_GUIDANCE.map(([state, information]) => (
                <li
                  key={state}
                  className="grid gap-2 py-4 first:pt-0 sm:grid-cols-[13rem_minmax(0,1fr)]"
                >
                  <h3 className="text-sm font-semibold">{state}</h3>
                  <p className="text-sm text-muted-foreground">{information}</p>
                </li>
              ))}
            </ol>
            <p className="text-sm text-muted-foreground">
              Use{" "}
              <Link href="/dashboard/proposals" className={linkClass}>
                Submitted proposals
              </Link>{" "}
              for initial reviews and{" "}
              <Link href="/dashboard/my-datasets" className={linkClass}>
                My datasets
              </Link>{" "}
              for verified, published and managed datasets. The actions shown
              depend on the current review and publication state.
            </p>
          </section>
          <section
            id="common-questions"
            aria-labelledby="common-questions-title"
            className={sectionClass}
          >
            <h2 id="common-questions-title" className="text-xl font-semibold">
              Common questions
            </h2>
            <dl className="max-w-3xl space-y-6 text-sm">
              <div>
                <dt className="font-semibold">
                  I do not know a quantity or a date. Should I enter zero?
                </dt>
                <dd className="mt-2 text-muted-foreground">
                  Choose Unknown where offered. Zero is a known amount, not a
                  substitute for missing information. Use Estimate only when you
                  have a basis for the figure.
                </dd>
              </div>
              <div>
                <dt className="font-semibold">
                  Can I cancel a collection quantity?
                </dt>
                <dd className="mt-2 text-muted-foreground">
                  Yes. Use Remove in that quantity&apos;s header, then Save
                  draft. Other quantities and full/sample figures stay separate.
                  You can add it again later.
                </dd>
              </div>
              <div>
                <dt className="font-semibold">
                  An upload or save was interrupted. Should I start again?
                </dt>
                <dd className="mt-2 text-muted-foreground">
                  Use the Retry, Resume or Refresh action shown for that
                  operation. Confirm its result before starting a replacement.
                  An unconfirmed request is different from a confirmed failure.
                </dd>
              </div>
              <div>
                <dt className="font-semibold">Why is Submit unavailable?</dt>
                <dd className="mt-2 text-muted-foreground">
                  Save pending changes, confirm uploads and selected files, and
                  refresh review checks. Use the listed items to find missing
                  information or pricing requirements. The backend makes the
                  final submission decision.
                </dd>
              </div>
              <div>
                <dt className="font-semibold">
                  Can I remove any old file to free capacity?
                </dt>
                <dd className="mt-2 text-muted-foreground">
                  Only eligible files can be deleted. Files needed by a current
                  review, publication or existing access are protected. Storage
                  is released after confirmed physical deletion; deselecting a
                  file does not delete it.
                </dd>
              </div>
            </dl>
            <Link href="/dashboard/support" className={linkClass}>
              Contact supplier support
            </Link>
          </section>
        </article>
      </DashboardCard>
    </DatasetWorkspace>
  );
}
