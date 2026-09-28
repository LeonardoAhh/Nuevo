import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { GUIDE_COPY, GUIDE_STEPS } from "./guide-steps";

export function GuideProgress({ current, onSelect }: { current: number; onSelect: (index: number) => void }) {
  return (
    <nav aria-label={GUIDE_COPY.navigation}>
      <ol className="grid grid-flow-col auto-cols-fr gap-1 sm:gap-2">
        {GUIDE_STEPS.map((step, index) => (
          <li key={step.id} className="min-w-0">
            <Button
              type="button"
              variant="ghost"
              className="h-8 w-full px-0 hover:bg-transparent"
              onClick={() => onSelect(index)}
              aria-current={index === current ? "step" : undefined}
              aria-label={`${GUIDE_COPY.step(index, GUIDE_STEPS.length)}: ${step.title}`}
            >
              <span className={cn("h-1.5 w-full rounded-full", index === current ? "bg-primary" : "bg-muted-foreground/20")} aria-hidden="true" />
            </Button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
