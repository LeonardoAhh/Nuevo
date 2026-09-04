"use client";

import type { DesempenoData } from "@/lib/types/desempeno";
import { ObjetivosDialog } from "./desempeno/objetivos-dialog";
import { CumplimientoDialog } from "./desempeno/cumplimiento-dialog";
import { CompetenciasDialog } from "./desempeno/competencias-dialog";
import { CompromisosDialog } from "./desempeno/compromisos-dialog";
import { EmployeeCard } from "./desempeno/employee-card";
import { useEvaluationForm } from "./desempeno/use-evaluation-form";
import { ScoreCard } from "./desempeno/score-card";
import { CommitmentsCard } from "./desempeno/commitments-card";
import { CompetenciesCard } from "./desempeno/competencies-card";
import { ResponsibilitiesCard } from "./desempeno/responsibilities-card";
import { ObjectivesCard } from "./desempeno/objectives-card";
import { Save, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
interface Props {
  data: DesempenoData;
  onUpdate?: (data: DesempenoData) => void;
  onGuardar?: () => void;
  guardarDisabled?: boolean;
  guardarTooltip?: string;
}
export function DesempenoForm({
  data,
  onUpdate,
  onGuardar,
  guardarDisabled,
  guardarTooltip
}: Props) {
  const context = useEvaluationForm({
    data,
    onUpdate,
    onGuardar,
    guardarDisabled,
    guardarTooltip
  });
  const {
    activeView,
    goNextView,
    goPrevView,
    canEdit,
    faltaEvaluador,
    isObjetivosCompletado,
    step2Complete,
    step3Complete,
    viewAnimProps
  } = context;
  return <div className="print:hidden space-y-6">

    {!canEdit && <EmployeeCard context={context} />}

    {/* ── Flujo de Evaluación Wizard ── */}
    {!canEdit ? <div className="space-y-6 print:space-y-6">
      {/* Modo Lectura: Muestra todo de corrido */}
      {/* PARTE 1: Objetivos (40%) */}
      <ObjectivesCard context={context} />
      {/* PARTE 2: Cumplimiento (30%) */}
      <ResponsibilitiesCard context={context} />
      {/* PARTE 3: Competencias (30%) */}
      <CompetenciesCard context={context} />


      <div className="grid gap-6 md:grid-cols-2">
        {/* Compromisos */}
        <CommitmentsCard context={context} />
        {/* Calificación Final */}
        <ScoreCard context={context} />
    </div>
  </div> : <div className="w-full relative overflow-hidden pb-4">
      <AnimatePresence mode="wait">
        {activeView === 1 && <motion.div key="v1" {...viewAnimProps} className="space-y-6">
          {<EmployeeCard context={context} />}
          <div className="flex justify-end pt-2">
            {faltaEvaluador ? <TooltipProvider>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <span tabIndex={0} className="inline-block cursor-not-allowed">
                    <Button type="button" size="lg" disabled className="pointer-events-none">
                        Siguiente <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </span>
              </TooltipTrigger>
                <TooltipContent side="top" className="bg-destructive text-destructive-foreground text-sm max-w-sm text-center">
                    Debes seleccionar un evaluador antes de continuar
              </TooltipContent>
            </Tooltip>
          </TooltipProvider> : <Button type="button" onClick={goNextView} size="lg">
                Siguiente <ChevronRight className="ml-2 h-4 w-4" />
          </Button>}
        </div>
      </motion.div>}

        {activeView === 2 && <motion.div key="v2" {...viewAnimProps} className="space-y-6">
          {/* PARTE 1: Objetivos (40%) */}
          <ObjectivesCard context={context} />
          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={goPrevView} size="lg">
              <ChevronLeft className="mr-2 h-4 w-4" /> Atrás
          </Button>
            <Button onClick={goNextView} disabled={!isObjetivosCompletado} size="lg">
                Siguiente <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </motion.div>}

        {activeView === 3 && <motion.div key="v3" {...viewAnimProps} className="space-y-6">
          {/* PARTE 2: Cumplimiento (30%) */}
          <ResponsibilitiesCard context={context} />
          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={goPrevView} size="lg">
              <ChevronLeft className="mr-2 h-4 w-4" /> Atrás
          </Button>
            <Button onClick={goNextView} disabled={!step2Complete} size="lg">
                Siguiente <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </motion.div>}

        {activeView === 4 && <motion.div key="v4" {...viewAnimProps} className="space-y-6">
          {/* PARTE 3: Competencias (30%) */}
          <CompetenciesCard context={context} />
          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={goPrevView} size="lg">
              <ChevronLeft className="mr-2 h-4 w-4" /> Atrás
          </Button>
            <Button onClick={goNextView} disabled={!step3Complete} size="lg">
                Siguiente <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </motion.div>}

        {activeView === 5 && <motion.div key="v5" {...viewAnimProps} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Compromisos */}
            <CommitmentsCard context={context} />
            {/* Calificación Final */}
            <ScoreCard context={context} />
        </div>
          <div className="flex justify-between pt-2 items-center">
            <Button variant="outline" onClick={goPrevView} size="lg">
              <ChevronLeft className="mr-2 h-4 w-4" /> Atrás
          </Button>
            {onGuardar ? guardarDisabled ? <TooltipProvider>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <span tabIndex={0} className="inline-block cursor-not-allowed">
                    <Button type="button" size="lg" disabled className="pointer-events-none">
                        Guardar Evaluación <Save className="ml-2 h-4 w-4" />
                  </Button>
                </span>
              </TooltipTrigger>
                <TooltipContent side="top" className="bg-destructive text-destructive-foreground text-sm max-w-sm text-center">
                  {guardarTooltip || "No se puede guardar"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider> : <Button type="button" onClick={onGuardar} size="lg">
                Guardar Evaluación <Save className="ml-2 h-4 w-4" />
          </Button> : <p className="text-sm text-muted-foreground">
                Usa el botón superior para <strong>Guardar Evaluación</strong>
          </p>}
        </div>
      </motion.div>}
    </AnimatePresence>
  </div>}

    {/* ══ MODALES ══════════════════════════════════════════════════════════ */}

    {/* Modal Objetivos */}
    <ObjetivosDialog context={context} />

    {/* Modal Cumplimiento */}
    <CumplimientoDialog context={context} />

    {/* Modal Competencias */}
    <CompetenciasDialog context={context} />

    {/* Modal Compromisos */}
    <CompromisosDialog context={context} />

</div>;
}
