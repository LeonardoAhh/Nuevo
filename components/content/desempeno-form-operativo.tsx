"use client";

import { useId } from "react";
import type { DesempenoData } from "@/lib/types/desempeno";
import { ESCALA_COMPETENCIAS, UMBRAL_CALIFICACION_APROBATORIA, validarEvaluacion, esPorcentajeValido, CumplimientoOperativoIndex } from "@/lib/types/desempeno";
import { EVALUATION_WEIGHTS } from "@/lib/desempeno/presentation";
import { EmployeeCard } from "./desempeno/employee-card";
import { useEvaluationForm, type EvaluationFormContext } from "./desempeno/use-evaluation-form";
import { ScoreCard } from "./desempeno/score-card";
import { CommitmentsCard } from "./desempeno/commitments-card";
import { CompetenciesCard } from "./desempeno/competencies-card";
import { ResponsibilitiesCard } from "./desempeno/responsibilities-card";
import { ObjectivesCard } from "./desempeno/objectives-card";
import { AlertCircle, Check, ChevronLeft, ChevronRight, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface Props {
  data: DesempenoData;
  onUpdate?: (data: DesempenoData) => void;
  onGuardar?: () => void;
  guardarDisabled?: boolean;
  guardarTooltip?: string;
  saving?: boolean;
}

const STEPS = ["Datos", "Objetivos", "Responsabilidades", "Competencias", "Revisión"] as const;

function PercentageControl({ id, label, value, noAplica, automatic, onChange }: {
  id: string;
  label: string;
  value: string;
  noAplica?: boolean;
  automatic?: boolean;
  onChange: (value: string, noAplica?: boolean) => void;
}) {
  const helpId = `${id}-help`;
  const pending = !automatic && noAplica !== true && !esPorcentajeValido(value);
  return <div className="space-y-3">
    <div className="flex items-center justify-between gap-3">
      <Label htmlFor={id}>{label}</Label>
      {automatic && <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">Dato automático</span>}
    </div>
    <div className="grid gap-2 sm:grid-cols-[minmax(0,10rem)_auto] sm:items-center">
      <Input id={id} name={id} type="number" inputMode="numeric" min={0} max={100}
        value={noAplica ? "" : value === "NA" ? "" : value}
        onChange={(event) => {
          const digits = event.target.value.replace(/\D/g, "").slice(0, 3);
          onChange(digits && Number(digits) > 100 ? "100" : digits, false);
        }}
        disabled={noAplica || automatic} readOnly={automatic} aria-describedby={helpId}
        aria-invalid={pending} className="min-h-11" />
      {!automatic && <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm font-medium hover:bg-accent">
        <input type="checkbox" checked={noAplica === true} onChange={(event) => onChange("", event.target.checked)} className="size-4 accent-primary" />
        No aplica
      </label>}
    </div>
    <p id={helpId} className={cn("text-xs", pending ? "text-destructive" : "text-muted-foreground")}>
      {automatic ? "Calculado por el sistema para el periodo seleccionado." : pending ? "Captura un entero de 0 a 100 o selecciona No aplica." : "Respuesta registrada."}
    </p>
  </div>;
}

function StepHeading({ context, title, description }: { context: EvaluationFormContext; title: string; description: string }) {
  return <div className="space-y-1">
    <h2 ref={context.headingRef} tabIndex={-1} className="scroll-mt-6 text-xl font-semibold tracking-tight outline-none">{title}</h2>
    <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
  </div>;
}

export function DesempenoForm({ data, onUpdate, onGuardar, guardarDisabled, guardarTooltip, saving }: Props) {
  const formId = useId();
  const context = useEvaluationForm({ data, onUpdate, onGuardar, guardarDisabled, guardarTooltip });
  const { activeView, setActiveView, goNextView, goPrevView, canEdit, stepError } = context;
  const validation = validarEvaluacion(data);

  if (!canEdit) return <div className="space-y-6 print:space-y-6">
    <EmployeeCard context={context} /><ObjectivesCard context={context} /><ResponsibilitiesCard context={context} /><CompetenciesCard context={context} />
    <div className="grid gap-6 md:grid-cols-2"><CommitmentsCard context={context} /><ScoreCard context={context} /></div>
  </div>;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (activeView < STEPS.length) return goNextView();
    if (validation.valida && !guardarDisabled && !saving) onGuardar?.();
  };

  return <form className="space-y-5 print:hidden" onSubmit={submit} noValidate>
    <div className="sticky top-0 z-10 rounded-xl border bg-background/95 p-3 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/85">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="min-w-0 truncate font-semibold">{data.nombre}</span>
        <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-medium">{data.periodo}</span>
      </div>
      <nav aria-label="Progreso de la evaluación"><ol className="grid grid-cols-5 gap-1">
        {STEPS.map((label, index) => {
          const step = index + 1;
          const completed = validation.pasos[index];
          return <li key={label}><button type="button" onClick={() => step <= activeView && setActiveView(step)} disabled={step > activeView}
            aria-current={activeView === step ? "step" : undefined}
            aria-label={`${label}, paso ${step} de ${STEPS.length}${completed ? ", completo" : ""}`}
            className={cn("flex min-h-11 w-full items-center justify-center gap-1 rounded-md border px-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", activeView === step ? "border-primary bg-primary text-primary-foreground" : completed ? "border-primary/30 bg-primary/10 text-foreground" : "bg-background text-muted-foreground", step > activeView && "cursor-not-allowed opacity-60")}>
            {completed && activeView !== step ? <Check className="size-4" aria-hidden="true" /> : <span aria-hidden="true">{step}</span>}
            <span className="hidden sm:inline">{label}</span>
          </button></li>;
        })}
      </ol></nav>
    </div>

    {stepError && <div tabIndex={-1} data-step-error={activeView} role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />{stepError}
    </div>}

    {activeView === 1 && <div className="space-y-4"><StepHeading context={context} title="Datos de la evaluación" description="Verifica a la persona, el periodo y selecciona al evaluador responsable." /><EmployeeCard context={context} /></div>}

    {activeView === 2 && <div className="space-y-4">
      <StepHeading context={context} title={`Objetivos (${EVALUATION_WEIGHTS.objetivos * 100}%)`} description="Registra el resultado obtenido para cada meta. Todos los criterios requieren una respuesta." />
      <div className="grid items-stretch gap-4 md:grid-cols-2">{data.objetivos.map((item, index) => <Card key={`${item.numero}-${index}`} className="h-full"><fieldset>
        <legend className="px-6 pt-6 text-base font-semibold">Objetivo {item.numero}</legend>
        <CardHeader className="space-y-2 pt-2"><p className="text-sm leading-relaxed">{item.descripcion}</p><p className="text-sm text-muted-foreground"><strong>Meta:</strong> {item.resultado || "Sin meta definida"}</p></CardHeader>
        <CardContent><PercentageControl id={`${formId}-objetivo-${index}`} label="Porcentaje obtenido" value={item.porcentaje} noAplica={item.no_aplica} onChange={(value, na) => context.updateObjetivo(index, value, na)} /></CardContent>
      </fieldset></Card>)}</div>
    </div>}

    {activeView === 3 && <div className="space-y-4">
      <StepHeading context={context} title={`Responsabilidades (${EVALUATION_WEIGHTS.cumplimiento * 100}%)`} description="Completa cada criterio. Los datos calculados por el sistema permanecen identificados y bloqueados." />
      <div className="grid items-stretch gap-4 md:grid-cols-2">{data.cumplimiento_responsabilidades.map((item, index) => {
        const automatic = data.tipo !== "jefe" && index === CumplimientoOperativoIndex.Asistencia;
        return <Card key={`${item.descripcion}-${index}`} className="h-full"><fieldset>
          <legend className="px-6 pt-6 text-base font-semibold">Responsabilidad {index + 1}</legend>
          <CardHeader className="space-y-2 pt-2"><p className="text-sm leading-relaxed">{item.descripcion}</p><p className="text-xs font-medium text-muted-foreground">Evalúa: {item.evalua}</p></CardHeader>
          <CardContent><PercentageControl id={`${formId}-responsabilidad-${index}`} label="Porcentaje de cumplimiento" value={item.porcentaje} noAplica={item.no_aplica} automatic={automatic} onChange={(value, na) => context.updateResponsabilidad(index, value, na)} /></CardContent>
        </fieldset></Card>;
      })}</div>
    </div>}

    {activeView === 4 && <div className="space-y-4">
      <StepHeading context={context} title={`Competencias (${EVALUATION_WEIGHTS.competencias * 100}%)`} description="Selecciona una calificación de 0 a 4 para cada competencia. El cero es una respuesta válida." />
      {data.competencias.map((item, index) => <Card key={`${item.nombre}-${index}`}><fieldset>
        <legend className="px-6 pt-6 text-base font-semibold">{item.nombre}</legend>
        <CardHeader className="space-y-2 pt-2"><p className="text-sm leading-relaxed text-muted-foreground">{item.descripcion}</p></CardHeader>
        <CardContent><div className="grid grid-cols-1 gap-2 sm:grid-cols-5">
          {ESCALA_COMPETENCIAS.map(({ valor, etiqueta }) => <label key={valor} className={cn("flex min-h-14 cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm transition-colors focus-within:ring-2 focus-within:ring-ring sm:flex-col sm:justify-center sm:text-center", item.evaluada && item.calificacion === valor && "border-primary bg-primary/10")}>
            <input type="radio" name={`${formId}-competencia-${index}`} value={valor} checked={item.evaluada === true && item.calificacion === valor} onChange={() => context.updateCompetencia(index, valor)} className="size-4 accent-primary" />
            <span><strong className="block text-base">{valor}</strong>{etiqueta}</span>
          </label>)}
        </div>{!item.evaluada && <p className="mt-3 text-xs text-destructive">Selecciona una calificación.</p>}</CardContent>
      </fieldset></Card>)}
    </div>}

    {activeView === 5 && <div className="space-y-4">
      <StepHeading context={context} title="Revisión y compromisos" description="Revisa el resultado y registra los acuerdos de seguimiento antes de guardar." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card><CardHeader><h3 className="font-semibold">Compromisos y observaciones</h3></CardHeader><CardContent className="space-y-4">
          <div className="space-y-2"><Label htmlFor={`${formId}-compromisos`}>Compromisos / Acuerdos{context.ponderacion.calificacionFinal < UMBRAL_CALIFICACION_APROBATORIA ? " (obligatorio)" : ""}</Label><Textarea id={`${formId}-compromisos`} value={data.compromisos} onChange={(e) => context.updateReview({ compromisos: e.target.value })} aria-required={context.ponderacion.calificacionFinal < UMBRAL_CALIFICACION_APROBATORIA} className="min-h-28" /></div>
          <div className="space-y-2"><Label htmlFor={`${formId}-fecha`}>Fecha de revisión</Label><Input id={`${formId}-fecha`} type="date" value={data.fecha_revision.includes("/") ? data.fecha_revision.split("/").reverse().join("-") : data.fecha_revision} onChange={(e) => context.updateReview({ fecha_revision: e.target.value ? e.target.value.split("-").reverse().join("/") : "" })} /></div>
          <div className="space-y-2"><Label htmlFor={`${formId}-observaciones`}>Observaciones</Label><Textarea id={`${formId}-observaciones`} value={data.observaciones} onChange={(e) => context.updateReview({ observaciones: e.target.value })} /></div>
        </CardContent></Card>
        <div className="space-y-4"><ScoreCard context={context} /><Card><CardContent className="pt-6"><h3 className="font-semibold">Estado de la evaluación</h3><ul className="mt-3 space-y-2 text-sm">{STEPS.slice(0, 4).map((label, index) => <li key={label} className="flex items-center gap-2"><span className={cn("flex size-5 items-center justify-center rounded-full border", validation.pasos[index] && "border-primary bg-primary text-primary-foreground")}>{validation.pasos[index] ? <Check className="size-3" /> : index + 1}</span>{label}</li>)}</ul></CardContent></Card></div>
      </div>
      {(guardarTooltip || !validation.valida) && <p role="status" className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">{!validation.valida ? validation.errores[0] : guardarTooltip}</p>}
    </div>}

    <div className="flex items-center justify-between gap-3 rounded-xl border bg-card p-3 shadow-sm">
      <Button type="button" variant="outline" size="lg" onClick={goPrevView} disabled={activeView === 1 || saving} className="min-h-11 min-w-0 flex-1 sm:flex-none"><ChevronLeft className="mr-2 size-4" />Atrás</Button>
      {activeView < STEPS.length ? <Button type="submit" size="lg" className="min-h-11 min-w-0 flex-1 sm:flex-none">Siguiente<ChevronRight className="ml-2 size-4" /></Button>
        : <Button type="submit" size="lg" className="min-h-11 min-w-0 flex-1 sm:flex-none" disabled={!validation.valida || guardarDisabled || saving}>{saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}{saving ? "Guardando…" : "Guardar evaluación"}</Button>}
    </div>
  </form>;
}
