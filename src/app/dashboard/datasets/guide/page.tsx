import Link from "next/link";
import { notFound } from "next/navigation";
import { DashboardButton, DashboardCard } from "@/components/dashboard";
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
} from "@/lib/datasets/proposal-guidance";

const sectionClass = "min-w-0 scroll-mt-24 space-y-5 px-5 py-6 sm:px-8 sm:py-8";
const linkClass =
  "inline-flex min-h-10 items-center rounded-sm text-sm font-medium underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-[var(--dashboard-focus-ring)]";

export default function DatasetProposalGuidePage() {
  if (!DATASET_PREPARATION_ENABLED) notFound();
  return (
    <DatasetWorkspace className="dataset-proposal-workspace max-w-[80rem]">
      <DatasetPageHeader
        title="Dataset proposal guide"
        description="Prepare your collection, save it step by step, and understand what happens before and after admin review."
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
              Follow the four proposal screens
            </h2>
            <p className="max-w-3xl text-sm text-muted-foreground">
              Choose a screen below to see the actual fields, what to enter and
              a concrete example. You can save after the first title and return
              through My drafts. Complete the applicable fields before Submit.
            </p>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              <a href="#prepare" className={linkClass}>
                Before you start
              </a>
              {PROPOSAL_STEP_GUIDANCE.map((step, index) => (
                <a
                  key={step.title}
                  href={`#step-${index + 1}`}
                  className={linkClass}
                >
                  {index + 1}. {step.title}
                </a>
              ))}
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
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">
                  Choose the material for this proposal
                </caption>
                <thead className="border-b border-border bg-muted/20">
                  <tr>
                    <th scope="col" className="p-4 font-medium">
                      Upload choice
                    </th>
                    <th scope="col" className="p-4 font-medium">
                      What to prepare
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <th scope="row" className="p-4 align-top font-medium">
                      Sample only
                    </th>
                    <td className="p-4 text-muted-foreground">
                      A prepared sample and an honest description of the
                      collection it represents. This does not mean the full
                      collection is uploaded or available for purchase.
                    </td>
                  </tr>
                  <tr>
                    <th scope="row" className="p-4 align-top font-medium">
                      Full dataset only
                    </th>
                    <td className="p-4 text-muted-foreground">
                      The complete material for the collection boundary you
                      define. No sample is generated automatically.
                    </td>
                  </tr>
                  <tr>
                    <th scope="row" className="p-4 align-top font-medium">
                      Full dataset + sample
                    </th>
                    <td className="p-4 text-muted-foreground">
                      The complete material and a separately prepared sample
                      that buyers can inspect.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
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
