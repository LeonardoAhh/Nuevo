"use client";

import { useId } from "react";
import type { EvaluationFormContext } from "./use-evaluation-form";
import { ChevronRight, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ResponsiveShell, ModalHeader, ModalFooter } from "@/components/ui/responsive-shell";
import { slideVariants } from "@/lib/animations";
import { StepDots } from "./form-controls";
export function CompetenciasDialog({
  context
}: {
  context: EvaluationFormContext;
}) {
  const fieldId = useId();
  const {
    modal,
    step,
    direction,
    editCompetencias,
    setEditCompetencias,
    closeModal,
    saveModal,
    isLastStep,
    goNext,
    goPrev,
    handleStepSelect
  } = context;
  return <ResponsiveShell open={modal === "competencias"} onClose={closeModal} maxWidth="sm:max-w-md" title="Competencias" description="Calificación del 0 al 4">
    <ModalHeader title="Competencias" subtitle={`Paso ${step + 1} de ${editCompetencias.length}`} onClose={closeModal} />
    <StepDots total={editCompetencias.length} current={step} onSelect={handleStepSelect} />
    <div className="flex-1 overflow-y-auto px-6 pb-6">
      <AnimatePresence mode="wait" custom={direction} initial={false}>
        {editCompetencias[step] && <motion.div key={`comp-${step}`} custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{
          duration: 0.2,
          ease: [0.22, 1, 0.36, 1]
        }} className="space-y-4">
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm font-semibold">{editCompetencias[step].nombre}</p>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{editCompetencias[step].descripcion}</p>
        </div>
          <div className="flex flex-wrap items-start gap-4">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground" htmlFor={`${fieldId}-0`}>Calificación (0-4)</Label>
              <Input id={`${fieldId}-0`} type="number" min={0} max={4} className="w-32" value={editCompetencias[step].calificacion === 0 ? "" : editCompetencias[step].calificacion} onChange={e => {
                const val = Math.min(4, Math.max(0, parseInt(e.target.value) || 0));
                const next = [...editCompetencias];
                next[step] = {
                  ...next[step],
                  calificacion: val
                };
                setEditCompetencias(next);
              }} placeholder="0" />
          </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">% Equivalente</p>
              <div className="flex h-9 items-center text-base font-semibold text-primary">
                {Math.round(editCompetencias[step].calificacion / 4 * 100)}%
            </div>
          </div>
        </div>
      </motion.div>}
    </AnimatePresence>
  </div>
    <ModalFooter onConfirm={isLastStep ? saveModal : goNext} confirmLabel={isLastStep ? "Guardar" : "Siguiente"} confirmIcon={isLastStep ? <Check className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />} secondaryAction={{
      label: "Atrás",
      onClick: goPrev,
      disabled: step === 0,
      variant: 'outline'
    }} />
</ResponsiveShell>;
}
