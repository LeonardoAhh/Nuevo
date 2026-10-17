"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, Printer, Save, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getPeriodoActual } from "@/lib/catalogo";
import { EVALUATION_WEIGHTS } from "@/lib/desempeno/presentation";
import { UMBRAL_CALIFICACION_APROBATORIA } from "@/lib/types/desempeno";
import { CompetencyRatingCard } from "./competency-rating-card";
import { PercentageCriterionCard } from "./percentage-criterion-card";
import { ReviewDateField } from "./review-date-field";

const DEMO = {
  number: "0000",
  name: "PERSONA DE PRUEBA",
  position: "AUXILIAR DE ALMACÉN (EJEMPLO)",
  evaluator: "EVALUADOR DE PRUEBA",
  objective: "Completar las actividades asignadas durante el periodo.",
  objectiveGoal: "100% de las actividades",
  responsibility: "Cumplir las tareas del puesto en tiempo y forma.",
  automaticResponsibility: 98,
  competency: {
    nombre: "Trabajo en equipo",
    descripcion: "Colabora con otras personas para alcanzar los objetivos del área.",
    comentarios: "",
  },
} as const;

const TUTORIAL_STEPS = [
  "Buscar persona",
  "Datos de la evaluación",
  "Objetivos",
  "Responsabilidades",
  "Competencias",
  "Revisión y guardado",
  "Impresión y entrega",
] as const;

function validPercentage(value: string) {
  return /^\d{1,3}$/.test(value) && Number(value) <= 100;
}

function PercentagePractice({ id, label, value, onChange }: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return <div className="flex flex-wrap items-center justify-between gap-3">
    <Label htmlFor={id}>{label}</Label>
    <Input
      id={id}
      type="number"
      min={0}
      max={100}
      inputMode="numeric"
      value={value}
      onChange={event => {
        const digits = event.target.value.replace(/\D/g, "").slice(0, 3);
        onChange(digits && Number(digits) > 100 ? "100" : digits);
      }}
      className="h-11 w-24 tabular-nums"
    />
  </div>;
}

export function EvaluationTutorial({ onFinish }: { onFinish: () => void }) {
  const [step, setStep] = useState(0);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(false);
  const [evaluator, setEvaluator] = useState("");
  const [objective, setObjective] = useState("");
  const [responsibility, setResponsibility] = useState("");
  const [competency, setCompetency] = useState<number | null>(null);
  const [commitments, setCommitments] = useState("");
  const [reviewDate, setReviewDate] = useState("");
  const [observations, setObservations] = useState("");
  const [saved, setSaved] = useState(false);
  const [printed, setPrinted] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const resetSimulation = () => { setSaved(false); setPrinted(false); };

  useEffect(() => {
    const target = [
      "#tutorial-search",
      "#tutorial-evaluator",
      "#tutorial-objective",
      "#tutorial-responsibility",
      'input[name="tutorial-competency"]',
      "#tutorial-commitments",
      "#tutorial-print",
    ][step];
    const frame = requestAnimationFrame(() => {
      (document.querySelector<HTMLElement>(target) ?? headingRef.current)?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [step]);

  const matchesDemo = query.trim().length > 0 && (
    DEMO.number.includes(query.trim()) || DEMO.name.toLocaleLowerCase("es-MX").includes(query.trim().toLocaleLowerCase("es-MX"))
  );
  const score = Math.round(Number(objective) * EVALUATION_WEIGHTS.objetivos)
    + Math.round(((Number(responsibility) + DEMO.automaticResponsibility) / 2) * EVALUATION_WEIGHTS.cumplimiento)
    + Math.round(((competency ?? 0) / 4 * 100) * EVALUATION_WEIGHTS.competencias);
  const needsCommitments = score < UMBRAL_CALIFICACION_APROBATORIA;
  const canContinue = [
    selected,
    evaluator === DEMO.evaluator,
    validPercentage(objective),
    validPercentage(responsibility),
    competency !== null,
    !needsCommitments || commitments.trim().length > 0,
    printed,
  ][step];
  const nextAction = [
    !matchesDemo ? `Escribe ${DEMO.number} en el buscador.` : !selected ? "Toca la persona de prueba en el resultado." : "Persona seleccionada. Pulsa Siguiente.",
    evaluator !== DEMO.evaluator ? "Abre Evaluador y elige EVALUADOR DE PRUEBA." : "Evaluador seleccionado. Pulsa Siguiente.",
    !validPercentage(objective) ? "Escribe 90 en Resultado (%)." : "Objetivo capturado. Pulsa Siguiente.",
    !validPercentage(responsibility) ? "Escribe 90 en Cumplimiento (%)." : "Responsabilidad capturada. Pulsa Siguiente.",
    competency === null ? "Toca una calificación del 0 al 4." : "Competencia calificada. Pulsa Siguiente.",
    needsCommitments && !commitments.trim() ? "Escribe un compromiso de mejora." : !saved ? "Pulsa Guardar simulación." : "Guardado simulado. Pulsa Siguiente.",
    !printed ? "Pulsa Simular impresión." : "Impresión simulada. Pulsa Terminar.",
  ][step];
  const period = getPeriodoActual("semestrales");

  const focusAction = () => {
    const target = [
      !matchesDemo ? "#tutorial-search" : "[data-tutorial-result]",
      "#tutorial-evaluator",
      "#tutorial-objective",
      "#tutorial-responsibility",
      'input[name="tutorial-competency"]',
      needsCommitments && !commitments.trim() ? "#tutorial-commitments" : "#tutorial-next",
      "#tutorial-print",
    ][step];
    document.querySelector<HTMLElement>(target)?.focus();
  };

  const goTo = (next: number) => {
    setStep(next);
    scrollRef.current?.scrollTo({ top: 0, behavior: "instant" });
  };

  const advance = () => {
    if (!canContinue) { focusAction(); return; }
    if (step === 5 && !saved) { setSaved(true); return; }
    if (step === TUTORIAL_STEPS.length - 1) { onFinish(); return; }
    goTo(step + 1);
  };

  return <div className="flex min-h-0 flex-1 flex-col">
    <div ref={scrollRef} className={step === 5
      ? "min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-3 sm:p-4"
      : "min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain p-4 sm:p-6"}>
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>Paso {step + 1} de {TUTORIAL_STEPS.length}</span>
          <span>{Math.round(((step + 1) / TUTORIAL_STEPS.length) * 100)}%</span>
        </div>
        <Progress value={((step + 1) / TUTORIAL_STEPS.length) * 100} aria-label="Progreso del tutorial" />
        <div className="space-y-1">
          <h3 ref={headingRef} tabIndex={-1} className="text-lg font-semibold tracking-tight outline-none">{TUTORIAL_STEPS[step]}</h3>
        </div>
      </div>

      <div id="tutorial-action" role="status" className="rounded-md border border-border border-l-2 border-l-primary bg-muted/40 px-4 py-3">
        <p className="font-mono text-xs font-medium uppercase text-muted-foreground">Haz esto ahora</p>
        <p className="mt-1 text-sm font-medium">{nextAction}</p>
      </div>

      {step === 0 && <div className="space-y-3">
        <Label htmlFor="tutorial-search">Buscar por número o nombre</Label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input id="tutorial-search" value={query} onChange={event => { setQuery(event.target.value); setSelected(false); resetSimulation(); }} placeholder="Escribe 0000" className="h-11 pl-9" />
        </div>
        {matchesDemo && <button type="button" data-tutorial-result onClick={() => { setSelected(true); resetSimulation(); }} aria-pressed={selected} className="flex min-h-11 w-full items-center justify-between gap-3 rounded-md border border-border bg-card px-3 py-2 text-left text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <span className="min-w-0"><span className="block font-medium">{DEMO.name}</span><span className="block text-xs text-muted-foreground">#{DEMO.number} · {DEMO.position}</span></span>
          {selected && <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />}
        </button>}
        {query && !matchesDemo && <p className="text-xs text-muted-foreground">Para este ejercicio, busca el número {DEMO.number}.</p>}
      </div>}

      {step === 1 && <div className="space-y-4">
        <Card><CardContent className="grid gap-3 p-4 sm:grid-cols-2">
          <div><p className="text-xs text-muted-foreground">Número empleado</p><p className="text-sm font-medium">{DEMO.number}</p></div>
          <div><p className="text-xs text-muted-foreground">Nombre</p><p className="text-sm font-medium">{DEMO.name}</p></div>
          <div><p className="text-xs text-muted-foreground">Puesto</p><p className="text-sm font-medium">{DEMO.position}</p></div>
          <div><p className="text-xs text-muted-foreground">Periodo asignado</p><p className="text-sm font-medium">Semestral · {period}</p></div>
        </CardContent></Card>
        <div className="space-y-2"><Label htmlFor="tutorial-evaluator">Evaluador</Label>
          <Select value={evaluator} onValueChange={value => { setEvaluator(value); resetSimulation(); }}>
            <SelectTrigger id="tutorial-evaluator" className="h-11 w-full"><SelectValue placeholder="Selecciona al evaluador" /></SelectTrigger>
            <SelectContent><SelectItem value={DEMO.evaluator}>{DEMO.evaluator}</SelectItem></SelectContent>
          </Select>
        </div>
      </div>}

      {step === 2 && <div className="space-y-3">
        <PercentageCriterionCard title="Objetivo 1" description={DEMO.objective} metadataLabel="Meta" metadata={DEMO.objectiveGoal}>
          <PercentagePractice id="tutorial-objective" label="Resultado (%)" value={objective} onChange={value => { setObjective(value); resetSimulation(); }} />
        </PercentageCriterionCard>
        <p className="text-xs text-muted-foreground">En la evaluación real también puedes marcar «No aplica» cuando corresponda.</p>
      </div>}

      {step === 3 && <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <PercentageCriterionCard title="Responsabilidad 1" description={DEMO.responsibility} metadataLabel="Evalúa" metadata="Evaluador">
            <PercentagePractice id="tutorial-responsibility" label="Cumplimiento (%)" value={responsibility} onChange={value => { setResponsibility(value); resetSimulation(); }} />
          </PercentageCriterionCard>
          <PercentageCriterionCard title="Responsabilidad 2" description="Asistencia del periodo." metadataLabel="Evalúa" metadata="Sistema">
            <div className="flex items-center justify-between gap-3 text-sm"><span>Dato automático</span><span className="font-medium tabular-nums">{DEMO.automaticResponsibility}%</span></div>
          </PercentageCriterionCard>
        </div>
        <p className="text-xs text-muted-foreground">Los datos automáticos no se editan. En los demás criterios puedes usar «No aplica» cuando corresponda.</p>
      </div>}

      {step === 4 && <CompetencyRatingCard
        item={{ ...DEMO.competency, calificacion: competency ?? 0, evaluada: competency !== null }}
        name="tutorial-competency" showError={false} onChange={value => { setCompetency(value); resetSimulation(); }}
      />}

      {step === 5 && <Card><CardContent className="space-y-3 p-3 sm:p-4">
        <div className="flex items-baseline justify-between gap-3 border-b border-border pb-2">
          <span className="text-sm text-muted-foreground">Calificación de práctica</span>
          <span className="text-2xl font-semibold tabular-nums" aria-live="polite">{score}%</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
          <ReviewDateField id="tutorial-review-date" value={reviewDate} onChange={value => { setReviewDate(value); resetSimulation(); }} />
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="tutorial-commitments">Compromisos y acuerdos</Label>
              {needsCommitments && <p className="text-xs text-muted-foreground">Obligatorios si la calificación es menor a {UMBRAL_CALIFICACION_APROBATORIA}%.</p>}
              <Textarea id="tutorial-commitments" value={commitments} onChange={event => { setCommitments(event.target.value); resetSimulation(); }} className="h-20 resize-none" />
            </div>
            <div className="space-y-1"><Label htmlFor="tutorial-observations">Observaciones</Label>
              <Textarea id="tutorial-observations" value={observations} onChange={event => { setObservations(event.target.value); resetSimulation(); }} className="h-20 resize-none" />
            </div>
          </div>
        </div>
        {saved && <p role="status" className="flex items-center gap-2 text-sm font-medium"><CheckCircle2 className="size-4" aria-hidden="true" /> Evaluación de práctica guardada</p>}
      </CardContent></Card>}

      {step === 6 && <div className="space-y-4">
        <Card><CardContent className="space-y-3 p-4">
          <p className="text-sm font-medium">Evaluación de práctica guardada · {score}%</p>
          <p className="text-sm text-muted-foreground">En el sistema real, Imprimir abre el formato oficial. Aquí solo se simula el paso.</p>
          <Button id="tutorial-print" type="button" onClick={() => setPrinted(true)} disabled={printed} className="min-h-11"><Printer aria-hidden="true" /> {printed ? "Impresión simulada" : "Simular impresión"}</Button>
        </CardContent></Card>
        {printed && <p role="status" className="flex items-start gap-2 text-sm text-muted-foreground"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-foreground" aria-hidden="true" /> Después se recaban las firmas y se entrega el documento físico a Capacitación.</p>}
      </div>}
    </div>

    <footer className="safe-bottom-content flex shrink-0 items-center justify-between gap-3 border-t border-border bg-card px-4 pt-3 sm:px-6">
      <Button type="button" variant="outline" onClick={() => goTo(step - 1)} disabled={step === 0} className="min-h-11"><ChevronLeft aria-hidden="true" /> Atrás</Button>
      <Button id="tutorial-next" type="button" onClick={advance} aria-describedby="tutorial-action" className="min-h-11">
        {step === 5 && !saved ? <><Save aria-hidden="true" /> Guardar simulación</> : step === TUTORIAL_STEPS.length - 1 ? "Terminar" : <>Siguiente <ChevronRight aria-hidden="true" /></>}
      </Button>
    </footer>
  </div>;
}
