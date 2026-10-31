import { CATALOGUE_IMPORT_STEPS } from "@/lib/datasets/catalogue-import-guidance";

export function CatalogueImportSteps({
  currentStep,
}: {
  currentStep?: number;
}) {
  return (
    <ol
      aria-label="Catalogue import steps"
      className="grid gap-5 border-y border-border py-4 sm:grid-cols-3"
    >
      {CATALOGUE_IMPORT_STEPS.map((step, index) => (
        <li
          key={step.title}
          aria-current={currentStep === index + 1 ? "step" : undefined}
          className="flex min-w-0 gap-3"
        >
          <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-border text-sm font-semibold">
            {index + 1}
          </span>
          <div className="min-w-0 space-y-1 text-sm">
            <p className="font-semibold">{step.title}</p>
            <p className="text-muted-foreground">{step.detail}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
