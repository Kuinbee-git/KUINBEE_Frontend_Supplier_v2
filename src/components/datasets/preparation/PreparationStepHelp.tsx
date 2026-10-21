import { ChevronDown } from "lucide-react";
import { PROPOSAL_STEP_GUIDANCE } from "@/lib/datasets/proposal-guidance";

export function PreparationStepHelp({ step }: { step: number }) {
  const guidance = PROPOSAL_STEP_GUIDANCE[step];
  if (!guidance) return null;
  return (
    <details
      key={step}
      className="group border-b border-border px-4 py-3 text-sm sm:px-6"
      data-proposal-step-help="true"
    >
      <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-4 rounded-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-[var(--dashboard-focus-ring)] [&::-webkit-details-marker]:hidden">
        Help with {guidance.title}
        <ChevronDown
          aria-hidden="true"
          className="size-4 shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none"
        />
      </summary>
      <div className="space-y-4 pb-2 pt-3 leading-6">
        <p>{guidance.summary}</p>
        <ol className="list-decimal space-y-2 pl-5 text-muted-foreground">
          {guidance.instructions.map((instruction) => (
            <li key={instruction}>{instruction}</li>
          ))}
        </ol>
        <p className="border-l-2 border-border pl-3 text-muted-foreground">
          <strong className="font-medium text-foreground">Example: </strong>
          {guidance.example}
        </p>
      </div>
    </details>
  );
}
