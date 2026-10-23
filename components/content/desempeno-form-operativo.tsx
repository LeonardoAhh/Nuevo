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
import { PercentageCriterionCard } from "./desempeno/percentage-criterion-card";
import { CompetencyRatingCard } from "./desempeno/competency-rating-card";
import { ReviewDateField } from "./desempeno/review-date-field";
import { AlertCircle, ChevronLeft, ChevronRight, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  lateCapture?: {
    motivo: string;
    onMotivoChange: (value: string) => void;
  };
}

const STEPS = ["Datos", "Objetivos", "Responsabilidades", "Competencias", "Revisión"] as const;

function PercentageControl({ id, label, value, noAplica, automatic, helpId, showError, onChange }: {
  id: string;
  label: string;
  value: string;
  noAplica?: boolean;
  automatic?: boolean;
  helpId: string;
  showError: boolean;
  onChange: (value: string, noAplica?: boolean) => void;
}) {
  const pending = !automatic && noAplica !== true && !esPorcentajeValido(value);
  return <div className="flex flex-wrap items-center gap-2">
    <Label htmlFor={id} className="mr-auto">{label}</Label>
    {automatic && <span className="text-xs font-medium text-muted-foreground">Dato automático</span>}
    <Input id={id} name={id} type="number" inputMode="numeric" min={0} max={100}
      value={noAplica ? "" : value === "NA" ? "" : value}
      onChange={(event) => {
        const digits = event.target.value.replace(/\D/g, "").slice(0, 3);
        onChange(digits && Number(digits) > 100 ? "100" : digits, false);
      }}
      disabled={noAplica || automatic} readOnly={automatic} aria-describedby={helpId}
      aria-invalid={showError && pending} className={cn("h-11 w-24 shrink-0 text-sm font-medium tabular-nums", showError && pending && "border-destructive")} />
    {!automatic && <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md px-2 text-sm font-medium hover:bg-muted">
      <input type="checkbox" checked={noAplica === true} onChange={(event) => onChange("", event.target.checked)} className="size-4 accent-primary" />
      No aplica
    </label>}
  </div>;
}

function StepHeading({ context, title, description }: { context: EvaluationFormContext; title: string; description: string }) {
  return <div className="space-y-1 xl:flex xl:items-baseline xl:justify-between xl:gap-6 xl:space-y-0">
    <h2 id={context.headingId} tabIndex={-1} className="scroll-mt-24 text-xl font-semibold tracking-tight outline-none xl:shrink-0">{title}</h2>
    <p className="text-sm leading-relaxed text-muted-foreground xl:min-w-0 xl:text-right">{description}</p>
  </div>;
}

export function DesempenoForm({ data, onUpdate, onGuardar, guardarDisabled, guardarTooltip, saving, lateCapture }: Props) {
  const formId = useId();
  const percentageHelpId = `${formId}-percentage-help`;
  const automaticHelpId = `${formId}-automatic-help`;
  const context = useEvaluationForm({ data, onUpdate, onGuardar, guardarDisabled, guardarTooltip });
  const { activeView, goNextView, goPrevView, canEdit, stepError } = context;
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
    <p id={percentageHelpId} className="sr-only">Ingresa un porcentaje entero de 0 a 100 o marca No aplica.</p>
    <p id={automaticHelpId} className="sr-only">Calculado por el sistema para el periodo seleccionado.</p>

    {stepError && <div tabIndex={-1} data-step-error={activeView} role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />{stepError}
    </div>}

    {activeView === 1 && <div className="space-y-4"><StepHeading context={context} title="Datos de la evaluación" description="Verifica a la persona, el periodo y selecciona al evaluador responsable." /><EmployeeCard context={context} /></div>}

    {activeView === 2 && <div className="space-y-4">
      <StepHeading context={context} title={`Objetivos (${EVALUATION_WEIGHTS.objetivos * 100}%)`} description="Ingresa de 0 a 100% o marca No aplica en cada objetivo." />
      <div className="grid gap-3 lg:auto-rows-fr lg:grid-cols-2">{data.objetivos.map((item, index) => <PercentageCriterionCard
        key={`${item.numero}-${index}`}
        title={`Objetivo ${item.numero}`}
        description={item.descripcion}
        metadataLabel="Meta"
        metadata={item.resultado || "Sin meta definida"}
      >
        <PercentageControl id={`${formId}-objetivo-${index}`} label="Resultado (%)" value={item.porcentaje} noAplica={item.no_aplica} helpId={percentageHelpId} showError={Boolean(stepError)} onChange={(value, na) => context.updateObjetivo(index, value, na)} />
      </PercentageCriterionCard>)}</div>
    </div>}

    {activeView === 3 && <div className="space-y-4">
      <StepHeading context={context} title={`Responsabilidades (${EVALUATION_WEIGHTS.cumplimiento * 100}%)`} description="Ingresa de 0 a 100% o marca No aplica. Los datos automáticos permanecen bloqueados." />
      <div className="grid gap-3 lg:auto-rows-fr lg:grid-cols-2">{data.cumplimiento_responsabilidades.map((item, index) => {
        const automatic = data.tipo !== "jefe" && index === CumplimientoOperativoIndex.Asistencia;
        return <PercentageCriterionCard
          key={`${item.descripcion}-${index}`}
          title={`Responsabilidad ${index + 1}`}
          description={item.descripcion}
          metadataLabel="Evalúa"
          metadata={item.evalua}
        >
          <PercentageControl id={`${formId}-responsabilidad-${index}`} label="Cumplimiento (%)" value={item.porcentaje} noAplica={item.no_aplica} automatic={automatic} helpId={automatic ? automaticHelpId : percentageHelpId} showError={Boolean(stepError)} onChange={(value, na) => context.updateResponsabilidad(index, value, na)} />
        </PercentageCriterionCard>;
      })}</div>
    </div>}

    {activeView === 4 && <div className="space-y-4">
      <StepHeading context={context} title={`Competencias (${EVALUATION_WEIGHTS.competencias * 100}%)`} description="Selecciona una calificación para cada competencia. El cero es una respuesta válida." />
      <div role="note" aria-label="Escala de competencias" className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs leading-4 text-muted-foreground">
        <span className="font-medium text-foreground">Escala</span>
        {ESCALA_COMPETENCIAS.map(({ valor, etiqueta }) => <span key={valor}>
          <span className="font-medium text-foreground">{valor}</span> {etiqueta}
        </span>)}
      </div>
      <div className="space-y-3">{data.competencias.map((item, index) => <CompetencyRatingCard
        key={`${item.nombre}-${index}`}
        item={item}
        name={`${formId}-competencia-${index}`}
        showError={Boolean(stepError)}
        onChange={(value) => context.updateCompetencia(index, value)}
      />)}</div>
    </div>}

    {activeView === 5 && <div className="space-y-4">
      <StepHeading context={context} title="Revisión y compromisos" description="Revisa el resultado y registra los acuerdos de seguimiento antes de guardar." />
      <Card><CardContent className="space-y-5 p-4 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b border-border pb-4">
          <h3 className="text-sm font-medium text-muted-foreground">Calificación del periodo</h3>
          <p className="text-3xl font-semibold tracking-tight tabular-nums text-foreground" aria-live="polite" aria-atomic="true">{context.ponderacion.calificacionFinal}%</p>
        </div>
        <div className="space-y-2">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <Label htmlFor={`${formId}-compromisos`}>Compromisos y acuerdos</Label>
            {context.ponderacion.calificacionFinal < UMBRAL_CALIFICACION_APROBATORIA && <span id={`${formId}-compromisos-hint`} className="text-xs text-muted-foreground">Obligatorios si la calificación es menor a {UMBRAL_CALIFICACION_APROBATORIA}%</span>}
          </div>
          <Textarea id={`${formId}-compromisos`} value={data.compromisos} onChange={(e) => context.updateReview({ compromisos: e.target.value })} aria-required={context.ponderacion.calificacionFinal < UMBRAL_CALIFICACION_APROBATORIA} aria-describedby={context.ponderacion.calificacionFinal < UMBRAL_CALIFICACION_APROBATORIA ? `${formId}-compromisos-hint` : undefined} className="min-h-24" />
        </div>
        <div className="grid gap-4 md:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
          {lateCapture ? <div className="min-w-0 space-y-2">
            <p className="text-sm font-medium">Fecha de captura tardía</p>
            <p className="flex min-h-11 items-center rounded-md border border-input bg-muted/30 px-3 text-sm text-muted-foreground">Se asigna automáticamente al guardar.</p>
          </div> : <ReviewDateField id={`${formId}-fecha`} value={data.fecha_revision} onChange={fecha_revision => context.updateReview({ fecha_revision })} />}
          <div className="min-w-0 space-y-2">
            <div className="flex min-h-5 items-center"><Label htmlFor={`${formId}-observaciones`} className="leading-5">Observaciones</Label></div>
            <Textarea id={`${formId}-observaciones`} value={data.observaciones} onChange={(e) => context.updateReview({ observaciones: e.target.value })} className="h-36 resize-none" />
          </div>
        </div>
        {lateCapture && <div className="space-y-2">
          <Label htmlFor={`${formId}-motivo`}>Motivo de la captura tardía</Label>
          <Textarea id={`${formId}-motivo`} required value={lateCapture.motivo} onChange={event => lateCapture.onMotivoChange(event.target.value)} className="min-h-24" />
        </div>}
      </CardContent></Card>
      {guardarTooltip && <p role="status" className="text-sm text-muted-foreground">{guardarTooltip}</p>}
    </div>}

    <div role="group" aria-label="Navegación de la evaluación" className="flex items-center justify-between gap-3">
      <Button type="button" variant="outline" onClick={goPrevView} disabled={activeView === 1 || saving} className="min-h-11 min-w-0 flex-1 sm:flex-none"><ChevronLeft className="size-4" />Atrás</Button>
      {activeView < STEPS.length ? <Button type="submit" className="min-h-11 min-w-0 flex-1 sm:flex-none">Siguiente<ChevronRight className="size-4" /></Button>
        : <Button type="submit" className="min-h-11 min-w-0 flex-1 sm:flex-none" disabled={!validation.valida || guardarDisabled || saving}>{saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}{saving ? "Guardando…" : "Guardar evaluación"}</Button>}
    </div>
  </form>;
}
