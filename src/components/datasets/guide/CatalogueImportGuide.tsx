import Link from "next/link";
import { DashboardButton } from "@/components/dashboard";
import { CatalogueImportSteps } from "@/components/catalogue/CatalogueImportSteps";
import { CATALOGUE_IMPORT_PATH } from "@/lib/datasets/catalogue-import-guidance";
import { DATASET_CATALOGUE_IMPORT_ENABLED } from "@/lib/catalogue-import-environment";

const steps = [
  {
    title: "Open Import catalogue",
    detail:
      "In the sidebar, open Data catalogue → Import catalogue. You can also open My drafts and choose Import catalogue next to Create proposal. This is where you import a spreadsheet describing multiple collections.",
  },
  {
    title: "Download the template and read its fields",
    detail:
      "Choose Download Excel template or Download CSV template. You only need one file. Fill the Catalogue sheet in Excel; Choices and How to use are reference pages in that same workbook. For CSV, the same choices and column help appear on the import page.",
  },
  {
    title: "Copy your metadata into the template columns",
    detail:
      "Enter one collection per row. Only Collection ID and Collection name are required. Your Collection ID is your own stable reference; Kuinbee generates its internal IDs. Keep the template column headers unchanged and references as text. Category and Source use readable names, not IDs. Choose categories from the Excel dropdown or the import page list. Data types use names such as Audio;Text. Add documented descriptions, languages, quantities and dates in the columns provided. Leave unknown answers blank.",
  },
  {
    title: "Choose your completed file and matching option",
    detail:
      "Under Catalogue file, select one .xlsx workbook or one UTF-8 catalogue.csv. There are no separate measurement or sensor files to fill. Up to 1,000 collections and 32 MB. Use Create missing drafts; preserve matched metadata for a first import. Dataset files can be added later in each draft.",
  },
  {
    title: "Validate and preview before saving",
    detail:
      "Click Validate and preview. This prepares a preview without creating or editing dataset drafts. Check Create, Bind existing, Update, Unchanged, warnings and errors. Exact identifiers match automatically; case and punctuation matter. If your older drafts have no catalogue identifiers, use Find drafts and match each corresponding row explicitly. Duplicate identifiers are errors. Correct your file or exclude invalid rows. After changing a match or exclusion, click Update preview to apply those choices.",
  },
  {
    title: "Save the reviewed rows as private drafts",
    detail:
      "Click Save private drafts. Resolve selected errors and conflicts first. Unconfirmed file-format warnings can remain. Match older drafts before creating entries that may already exist; confirm unmatched drafts are separate only when that is true. Saving does not submit for review, publish, grant buyer access or authorize downloads or sample sharing.",
  },
  {
    title: "Continue in My drafts or resume from Import history",
    detail:
      "Use My drafts to complete each saved collection and add any files later. Import history lets you reopen a batch; Download row report explains each result. If a request is interrupted, use the displayed retry or resume action and confirm the result before starting another batch. Cancellation preserves rows already saved. Reimporting the same identifiers in the default mode preserves their existing drafts. Submission, review and publication remain later, separate actions with their own requirements.",
  },
] as const;

export function CatalogueImportGuide({
  id = "catalogue-import",
}: {
  id?: string;
}) {
  return (
    <section
      id={id}
      aria-labelledby="catalogue-import-title"
      className="min-w-0 scroll-mt-24 space-y-6 px-5 py-6 sm:px-8 sm:py-8"
    >
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Multiple collections · Excel or CSV
        </p>
        <h2 id="catalogue-import-title" className="text-xl font-semibold">
          Import a catalogue as private drafts
        </h2>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Prepare many collections from one metadata spreadsheet, review exactly
          what will happen, then save the rows you approve. Original dataset
          files are added separately in the individual draft editor.
        </p>
      </div>
      <CatalogueImportSteps />
      <ol className="divide-y divide-border">
        {steps.map((step, index) => (
          <li key={step.title} className="flex gap-3 py-4 first:pt-0">
            <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-border text-sm font-semibold">
              {index + 1}
            </span>
            <div className="min-w-0 space-y-2 text-sm">
              <h3 className="font-semibold">{step.title}</h3>
              <p className="max-w-3xl text-muted-foreground">{step.detail}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="min-w-0 overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-left text-sm">
          <caption className="border-b border-border p-4 text-left font-semibold">
            A minimal Catalogue row
          </caption>
          <thead className="border-b border-border">
            <tr>
              <th scope="col" className="p-3 font-medium">
                Column
              </th>
              <th scope="col" className="p-3 font-medium">
                What to enter
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            <tr>
              <th scope="row" className="p-3 font-mono font-medium">
                Collection ID
              </th>
              <td className="p-3">
                Your own catalogue reference, for example COLL-001. Required;
                reuse it on later imports.
              </td>
            </tr>
            <tr>
              <th scope="row" className="p-3 font-mono font-medium">
                Collection name
              </th>
              <td className="p-3">The collection name. Required.</td>
            </tr>
            <tr>
              <th scope="row" className="p-3 font-mono font-medium">
                Category
              </th>
              <td className="p-3">
                Choose a category name from the Excel dropdown or import page.
                Kuinbee matches the name to its category record. Leave blank if
                unsure.
              </td>
            </tr>
            <tr>
              <th scope="row" className="p-3 font-mono font-medium">
                File formats
              </th>
              <td className="p-3">
                Enter known formats such as WAV;CSV. Leave blank or enter
                Unknown when formats are undocumented.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="space-y-2 border-l-2 border-[var(--dashboard-action)] pl-4 text-sm">
        <h3 className="font-semibold">
          Example: 270 collections, with 50 drafts already saved
        </h3>
        <p className="max-w-3xl text-muted-foreground">
          Once the existing 50 drafts are matched by catalogue identifier, the
          default preview should preserve those 50 and propose 220 new drafts.
          If 20 of the 270 collections have undocumented formats, keep them
          unconfirmed; those warnings do not block otherwise valid private
          drafts.
        </p>
      </div>
      <div className="space-y-2 text-sm">
        <h3 className="font-semibold">If the import action is unavailable</h3>
        <p className="max-w-3xl text-muted-foreground">
          The import page explains when saving imports is not enabled. You can
          still read this guide and continue individual drafts. Ask supplier
          support for import access.
        </p>
        {!DATASET_CATALOGUE_IMPORT_ENABLED && (
          <p className="font-medium">
            Catalogue import saving is not enabled here yet.
          </p>
        )}
      </div>
      <div className="flex flex-wrap gap-3">
        <DashboardButton asChild variant="outline">
          <Link href={CATALOGUE_IMPORT_PATH}>Open Import catalogue</Link>
        </DashboardButton>
        <DashboardButton asChild variant="ghost">
          <Link href="/dashboard/support">Contact supplier support</Link>
        </DashboardButton>
      </div>
    </section>
  );
}
