import { Check, ChevronDown, FileCheck2, Printer, Save, Search, UserRound } from "lucide-react";
import { DESEMPENO } from "@/lib/desempeno/presentation";
import { PERIODOS_DESEMPENO } from "@/lib/catalogo";
import { cn } from "@/lib/utils";
import { GUIDE_COPY, type GuideStep } from "./guide-steps";
import { GuideMockupFrame, mockupStyles } from "./guide-mockup-frame";

function SearchPreview() {
  return (
    <div className={mockupStyles.card}>
      <p className="text-xs font-medium text-foreground">{DESEMPENO.search.title}</p>
      <div className="flex gap-2">
        <div className={cn(mockupStyles.field, "flex-1 ring-2 ring-primary/20")}>
          <Search className="size-3.5 shrink-0" />
          <span className="min-w-0 break-words">{DESEMPENO.search.placeholder}</span>
        </div>
        <span className={cn(mockupStyles.action, mockupStyles.primary)}><Search className="size-4" /></span>
      </div>
      <div className="flex items-center gap-3 rounded-md border bg-background p-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><UserRound className="size-4" /></span>
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-xs font-medium text-foreground">{DESEMPENO.fields.name}</p>
          <div className={cn(mockupStyles.line, "w-3/4")} />
        </div>
        <Check className="size-4 shrink-0 text-primary" />
      </div>
    </div>
  );
}

function PeriodPreview() {
  const options = PERIODOS_DESEMPENO.semestrales.slice(0, 2);
  return (
    <div className={mockupStyles.card}>
      <p className="text-xs font-medium text-foreground">{DESEMPENO.search.period}</p>
      <div className="grid grid-cols-2 gap-1 rounded-md bg-muted p-1">
        {(["semestrales", "mensuales"] as const).map(mode => (
          <span key={mode} className={cn(mockupStyles.action, mode === "semestrales" ? mockupStyles.primary : "border-transparent text-muted-foreground")}>
            {DESEMPENO.modes[mode]}
          </span>
        ))}
      </div>
      <div className="overflow-hidden rounded-md border bg-background">
        <div className="flex items-center justify-between gap-2 border-b px-3 py-2 text-xs">
          <span>{options[0] ?? DESEMPENO.search.period}</span><ChevronDown className="size-4 text-muted-foreground" />
        </div>
        {options.map((period, index) => (
          <div key={period} className={cn("flex items-center justify-between gap-2 px-3 py-2 text-xs", index === 0 ? "bg-accent text-accent-foreground" : "text-muted-foreground")}>
            {period}{index === 0 && <Check className="size-3.5" />}
          </div>
        ))}
      </div>
    </div>
  );
}

function EvaluationPreview({ step }: { step: GuideStep }) {
  return (
    <div className={mockupStyles.card}>
      <p className="text-xs font-medium text-foreground">{GUIDE_COPY.weights}</p>
      {step.weights?.map(weight => (
        <div key={weight.label} className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-3 text-xs">
            <span className="min-w-0 text-foreground">{weight.label}</span>
            <span className="shrink-0 font-semibold tabular-nums text-primary">{weight.value * 100}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${weight.value * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function SavePreview() {
  return (
    <div className={mockupStyles.card}>
      <div className="flex justify-end gap-2">
        <span className={cn(mockupStyles.action, mockupStyles.primary)}><Save className="size-3.5" />{GUIDE_COPY.save}</span>
        <span className={cn(mockupStyles.action, "text-muted-foreground")}><Printer className="size-3.5" />{GUIDE_COPY.print}</span>
      </div>
      <div className="space-y-3 rounded-md border bg-background p-3">
        <p className="text-xs font-medium text-foreground">{DESEMPENO.fields.commitments}</p>
        <div className={cn(mockupStyles.line, "w-full")} />
        <div className={cn(mockupStyles.line, "w-3/4")} />
        <div className={cn(mockupStyles.line, "w-1/2")} />
      </div>
      <div className="flex items-center justify-center gap-2 rounded-md bg-primary/10 px-3 py-2 text-xs font-medium text-primary">
        <FileCheck2 className="size-4" />{GUIDE_COPY.saved}
      </div>
    </div>
  );
}

function PrintPreview() {
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <span className={cn(mockupStyles.action, mockupStyles.primary)}><Printer className="size-3.5" />{GUIDE_COPY.print}</span>
      </div>
      <div className="mx-auto w-full max-w-64 space-y-3 rounded-md border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-2 border-b pb-2 text-primary">
          <FileCheck2 className="size-5 shrink-0" />
          <p className="text-xs font-semibold">{DESEMPENO.title}</p>
        </div>
        <div className={cn(mockupStyles.line, "w-3/4")} />
        <div className={cn(mockupStyles.line, "w-full")} />
        <div className={cn(mockupStyles.line, "w-full")} />
        <div className="grid grid-cols-2 gap-4 pt-3">
          {[DESEMPENO.fields.name, DESEMPENO.fields.evaluator].map(label => (
            <div key={label} className="border-t pt-1 text-center text-xs text-muted-foreground">{label}</div>
          ))}
        </div>
      </div>
      <p className="text-center text-xs text-muted-foreground">{GUIDE_COPY.delivery}</p>
    </div>
  );
}

export function GuideMockup({ step }: { step: GuideStep }) {
  return (
    <GuideMockupFrame scene={step.id}>
      {step.id === "search" && <SearchPreview />}
      {step.id === "period" && <PeriodPreview />}
      {step.id === "evaluate" && <EvaluationPreview step={step} />}
      {step.id === "save" && <SavePreview />}
      {step.id === "print" && <PrintPreview />}
    </GuideMockupFrame>
  );
}
