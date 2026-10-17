"use client";

import { Button } from "@/components/ui/button";
import { EvaluationWorkspace } from "./desempeno/workspace";
import { useEvaluationSearch } from "./desempeno/use-evaluation-search";
import { SearchPanel } from "./desempeno/search-panel";
import { PendingSummary } from "./desempeno/pending-summary";
import { ExistingEvaluationNotice } from "./desempeno/existing-evaluation-notice";
import { Suspense } from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TooltipProvider } from "@/components/ui/tooltip";
import { UMBRAL_CALIFICACION_APROBATORIA } from "@/lib/types/desempeno";
import DesempenoPrint from "./desempeno-print";
import { DesempenoForm } from "./desempeno-form-operativo";
import { DesempenoSaveSuccess } from "./desempeno-save-success";
import { DesempenoGuia } from "./desempeno-guia";
import { GuiaButton } from "./desempeno/search-controls";
function DesempenoSearchContent() {
  const context = useEvaluationSearch();
  const {
    data,
    setData,
    existingEvaluation,
    loading,
    saving,
    saveSuccess,
    resetSaveSuccess,
    error,
    guardar,
    guiaOpen,
    setGuiaOpen,
    practiceLocked,
    ponderacion,
    bloqueado,
    faltaEvaluador
  } = context;
  return <TooltipProvider>
    <div inert={practiceLocked}>
    <EvaluationWorkspace
      section="evaluation"
      confirmNavigation={context.confirmDiscard}
      actions={<>
        {context.modoEdicion && data && <Button type="button" variant="outline" disabled className="min-h-11 px-4">Editando</Button>}
        <GuiaButton onClick={() => setGuiaOpen(true)} />
      </>}
    >

      {/* ── Buscador ── */}
      <SearchPanel context={context} />

      {/* Banner de Pendientes en estado vacío */}
      <PendingSummary context={context} />

      {/* Alertas */}
      {error && <Alert variant="destructive" className="font-sans">
        <AlertCircle className="size-4" aria-hidden="true" />
        <div>
          <AlertTitle className="text-sm font-semibold leading-5 tracking-normal">{error.title}</AlertTitle>
          <AlertDescription className="text-sm font-normal leading-5">{error.description}</AlertDescription>
        </div>
    </Alert>}

      {existingEvaluation && !loading && <ExistingEvaluationNotice evaluation={existingEvaluation} />}

      {!loading && data ? <div className={saveSuccess ? "hidden" : undefined}><DesempenoForm data={data} onUpdate={next => {
        resetSaveSuccess();
        setData(next);
      }} onGuardar={() => guardar(data)} saving={saving} guardarDisabled={saving || saveSuccess || bloqueado || faltaEvaluador} guardarTooltip={faltaEvaluador ? "Selecciona al evaluador antes de guardar." : bloqueado ? `Captura los compromisos antes de guardar una evaluación menor a ${UMBRAL_CALIFICACION_APROBATORIA}%.` : undefined} /></div> : null}

      {data && saveSuccess && !loading && <div className="print-area hidden print:block">
        <DesempenoPrint data={data} />
    </div>}

      <DesempenoSaveSuccess visible={saveSuccess} nombre={data?.nombre} calificacion={ponderacion?.calificacionFinal} onPrint={() => window.print()} onNew={() => {
        context.closeEvaluation();
      }} onEdit={context.canEdit ? resetSaveSuccess : undefined} />

  </EvaluationWorkspace>
    </div>
    <DesempenoGuia open={guiaOpen} onClose={() => setGuiaOpen(false)} />
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
