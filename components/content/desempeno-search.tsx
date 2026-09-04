"use client";

import { EvaluationWorkspace } from "./desempeno/workspace";
import { useEvaluationSearch } from "./desempeno/use-evaluation-search";
import { SearchPanel } from "./desempeno/search-panel";
import { PendingSummary } from "./desempeno/pending-summary";
import { Suspense } from "react";
import { AlertCircle, CalendarX2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TooltipProvider } from "@/components/ui/tooltip";
import { UMBRAL_CALIFICACION_APROBATORIA } from "@/lib/types/desempeno";
import DesempenoPrint from "./desempeno-print";
import { DesempenoForm } from "./desempeno-form-operativo";
import { DesempenoSaveSuccess } from "./desempeno-save-success";
import { DesempenoGuia } from "./desempeno-guia";
import { NoticeCard, DesempenoFormSkeleton, GuiaButton } from "./desempeno/search-controls";
function DesempenoSearchContent() {
  const context = useEvaluationSearch();
  const {
    periodoSeleccionado,
    data,
    setData,
    loading,
    saving,
    saveSuccess,
    resetSaveSuccess,
    error,
    guardar,
    guiaOpen,
    setGuiaOpen,
    ponderacion,
    bloqueado,
    faltaEvaluador,
    elegibilidad,
    noElegible,
    mismatchBloqueo,
    mismatchSuave,
    periodoSemestralObjetivo
  } = context;
  return <TooltipProvider>
    <EvaluationWorkspace section="evaluation" actions={!data && <GuiaButton onClick={() => setGuiaOpen(true)} />}>

      {/* ── Buscador ── */}
      <SearchPanel context={context} />

      {/* Banner de Pendientes en estado vacío */}
      <PendingSummary context={context} />

      {/* Alertas */}
      {error && <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
    </Alert>}

      {noElegible && <NoticeCard tone="warning" icon={<CalendarX2 className="h-5 w-5" />} title="Empleado no elegible para evaluación semestral">
        {elegibilidad.motivo} Cambia el periodo o espera al siguiente semestre.
    </NoticeCard>}

      {mismatchBloqueo && <NoticeCard tone="danger" icon={<CalendarX2 className="h-5 w-5" />} title="Periodo equivocado: este empleado es de planta">
          El personal de planta se evalúa <strong className="font-semibold text-foreground">SEMESTRAL</strong> ({periodoSemestralObjetivo}), no mensual. Cambia el modo a <strong className="font-semibold text-foreground">Semestral</strong> para poder guardar.
    </NoticeCard>}

      {mismatchSuave && <NoticeCard tone="warning" icon={<AlertCircle className="h-5 w-5" />} title="¿Seguro? Este empleado es de nuevo ingreso">
          Los nuevos ingresos normalmente se evalúan en modo <strong className="font-semibold text-foreground">Mensual</strong> (onboarding). Verifica el periodo antes de guardar.
    </NoticeCard>}

      {loading ? <DesempenoFormSkeleton /> : data ? <DesempenoForm data={data} onUpdate={setData} onGuardar={() => guardar({
        ...data,
        periodo: data.periodo || periodoSeleccionado
      })} guardarDisabled={saving || bloqueado || noElegible || mismatchBloqueo || faltaEvaluador} guardarTooltip={faltaEvaluador ? "Selecciona un evaluador primero" : mismatchBloqueo ? "Empleado de planta: evalúalo en modo Semestral, no Mensual" : noElegible ? "Empleado no elegible para este periodo semestral (< 2 meses)" : bloqueado ? `Captura compromisos primero (calificación < ${UMBRAL_CALIFICACION_APROBATORIA}%)` : "Guardar evaluación"} /> : null}

      {data && <div className="print-area hidden print:block">
        <DesempenoPrint data={data} />
    </div>}

      <DesempenoSaveSuccess visible={saveSuccess} nombre={data?.nombre} calificacion={ponderacion?.calificacionFinal} onDone={resetSaveSuccess} />

      <DesempenoGuia open={guiaOpen} onClose={() => setGuiaOpen(false)} />
  </EvaluationWorkspace>
</TooltipProvider>;
}

// ─── Export con Suspense boundary ─────────────────────────────────────────────

export default function DesempenoSearch() {
  return <Suspense fallback={<div className="flex items-center justify-center py-12">
      <div className="text-sm text-muted-foreground">Cargando...</div>
  </div>}>
    <DesempenoSearchContent />
</Suspense>;
}
