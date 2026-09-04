import { ChevronDown, Info } from "lucide-react";
import { GUIDE_COPY, GUIDE_STEPS, type GuideStep } from "./guide-steps";
import { evaluationStyles } from "./presentation";
import { GuideMockup } from "./guide-mockup";

export function GuideStepContent({ step, index }: { step: GuideStep; index: number }) {
  return (
    <section className={evaluationStyles.stack}>
      <GuideMockup step={step} />
      <div className="space-y-1.5" aria-live="polite" aria-atomic="true">
          <p className={evaluationStyles.caption}>{GUIDE_COPY.step(index, GUIDE_STEPS.length)}</p>
          <h3 className={evaluationStyles.sectionTitle}>{step.title}</h3>
          <p className={evaluationStyles.description}>{step.description}</p>
      </div>

      <details className="group rounded-lg border">
        <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
          {GUIDE_COPY.details}
          <ChevronDown className="size-4 shrink-0 group-open:rotate-180" aria-hidden="true" />
        </summary>
      <ol className="divide-y border-t">
        {step.instructions.map((instruction, itemIndex) => (
          <li key={instruction} className="flex items-start gap-3 p-3">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium tabular-nums text-muted-foreground" aria-hidden="true">
              {itemIndex + 1}
            </span>
            <p className="text-sm leading-relaxed text-foreground">{instruction}</p>
          </li>
        ))}
      </ol>

      <aside className="flex items-start gap-3 border-t bg-muted p-3">
        <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-foreground">{GUIDE_COPY.reminder}</h4>
          <p className={evaluationStyles.description}>{step.note}</p>
        </div>
      </aside>
      </details>

      {step.weights && <div className="sr-only">
        <h4 className="text-sm font-medium">{GUIDE_COPY.weights}</h4>
        <dl className="divide-y rounded-lg border">
          {step.weights.map(weight => (
            <div key={weight.label} className="flex items-baseline justify-between gap-3 p-3 text-sm">
              <dt className="min-w-0 text-muted-foreground">{weight.label}</dt>
              <dd className="shrink-0 font-semibold tabular-nums text-foreground">{weight.value * 100}%</dd>
            </div>
          ))}
        </dl>
      </div>}

    </section>
  );
}
