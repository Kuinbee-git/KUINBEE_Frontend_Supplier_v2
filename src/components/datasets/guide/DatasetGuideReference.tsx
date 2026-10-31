import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { ProposalMaterialChoicesVisual } from "./ProposalGuideVisuals";
import { CatalogueImportGuide } from "./CatalogueImportGuide";
import { PROPOSAL_REVIEW_GUIDANCE } from "@/lib/datasets/proposal-guidance";
const sectionClass = "min-w-0 space-y-5 px-5 pb-6 sm:px-6";
const linkClass =
  "inline-flex min-h-10 items-center text-sm font-medium underline underline-offset-4";
const summaryClass =
  "flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-sm font-semibold [&::-webkit-details-marker]:hidden";
const detailsClass =
  "group min-w-0 scroll-mt-24 rounded-xl border border-border bg-[var(--dashboard-glass-background-soft)]";
export function DatasetGuideReference() {
  return (
    <section aria-label="Guide reference" className="space-y-3">
      <div className="mb-4">
        <h2 className="text-base font-semibold">Keep the details close</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Open a reference whenever you need it.
        </p>
      </div>
      <nav
        aria-label="Reference shortcuts"
        className="flex flex-wrap gap-x-5 gap-y-1"
      >
        <a href="#prepare" className={linkClass}>
          Before you start
        </a>
        <a href="#review-process" className={linkClass}>
          After submission
        </a>
        <a href="#common-questions" className={linkClass}>
          Common questions
        </a>
      </nav>
      <details id="template-reference" className={detailsClass}>
        <summary className={summaryClass}>
          Excel / CSV format and import help
          <ChevronDown
            className="size-4 shrink-0 transition-transform group-open:rotate-180"
            aria-hidden="true"
          />
        </summary>
        <CatalogueImportGuide id="catalogue-reference" />
      </details>
      <details id="prepare" className={detailsClass}>
        <summary className={summaryClass}>
          Before you start
          <ChevronDown
            className="size-4 shrink-0 transition-transform group-open:rotate-180"
            aria-hidden="true"
          />
        </summary>
        <section
          id="prepare-content"
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
            The maximum is 5 GB per file and 5 GB shared across full material,
            samples and companions in one Dataset, and 100 GB across your
            supplier account. GB means one billion bytes. Retained files and
            active upload reservations count; the backend decides available
            capacity. The Files & contents screen shows the current limit for
            each supported file type.
          </p>
        </section>
      </details>
      <details id="review-process" className={detailsClass}>
        <summary className={summaryClass}>
          After submission
          <ChevronDown
            className="size-4 shrink-0 transition-transform group-open:rotate-180"
            aria-hidden="true"
          />
        </summary>{" "}
        <section
          id="review-process-content"
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
      </details>
      <details id="common-questions" className={detailsClass}>
        <summary className={summaryClass}>
          Common questions
          <ChevronDown
            className="size-4 shrink-0 transition-transform group-open:rotate-180"
            aria-hidden="true"
          />
        </summary>{" "}
        <section
          id="common-questions-content"
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
                Yes. Use Remove in that quantity&apos;s header, then Save draft.
                Other quantities and full/sample figures stay separate. You can
                add it again later.
              </dd>
            </div>
            <div>
              <dt className="font-semibold">
                An upload or save was interrupted. Should I start again?
              </dt>
              <dd className="mt-2 text-muted-foreground">
                Use the Retry, Resume or Refresh action shown for that
                operation. Confirm its result before starting a replacement. An
                unconfirmed request is different from a confirmed failure.
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Why is Submit unavailable?</dt>
              <dd className="mt-2 text-muted-foreground">
                Save pending changes, confirm uploads and selected files, and
                refresh review checks. Use the listed items to find missing
                information or pricing requirements. The backend makes the final
                submission decision.
              </dd>
            </div>
            <div>
              <dt className="font-semibold">
                Can I remove any old file to free capacity?
              </dt>
              <dd className="mt-2 text-muted-foreground">
                Only eligible files can be deleted. Files needed by a current
                review, publication or existing access are protected. Storage is
                released after confirmed physical deletion; deselecting a file
                does not delete it.
              </dd>
            </div>
          </dl>
          <Link href="/dashboard/support" className={linkClass}>
            Contact supplier support
          </Link>
        </section>
      </details>
    </section>
  );
}
