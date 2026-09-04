"use client";

import { useId } from "react";
import type { EvaluationFormContext } from "./use-evaluation-form";
import { ChevronRight, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ResponsiveShell, ModalHeader, ModalFooter } from "@/components/ui/responsive-shell";
import { slideVariants } from "@/lib/animations";
import { CumplimientoOperativoIndex } from "@/lib/types/desempeno";
import { StepDots } from "./form-controls";
const CUMPLIMIENTO_READONLY_STEPS = new Set([CumplimientoOperativoIndex.Asistencia]);
export function CumplimientoDialog({
  context
}: {
  context: EvaluationFormContext;
}) {
  const fieldId = useId();
  const {
    data,
    modal,
    step,
    direction,
    editCumplimiento,
    closeModal,
    saveModal,
    isLastStep,
    goNext,
    goPrev,
    handleStepSelect,
    handlePorcentajeChange
  } = context;
  return <ResponsiveShell open={modal === "cumplimiento"} onClose={closeModal} maxWidth="sm:max-w-md" title="Responsabilidades" description="Porcentaje de cumplimiento">
    <ModalHeader title="Responsabilidades" subtitle={`Paso ${step + 1} de ${editCumplimiento.length}`} onClose={closeModal} />
    <StepDots total={editCumplimiento.length} current={step} onSelect={handleStepSelect} />
    <div className="flex-1 overflow-y-auto px-6 pb-6">
      <AnimatePresence mode="wait" custom={direction} initial={false}>
        {editCumplimiento[step] && <motion.div key={`cump-${step}`} custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{
          duration: 0.2,
          ease: [0.22, 1, 0.36, 1]
        }} className="space-y-4">
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm font-semibold">{editCumplimiento[step].descripcion}</p>
            <p className="text-sm text-muted-foreground mt-1">
                Evalúa: {editCumplimiento[step].evalua}
          </p>
        </div>
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground" htmlFor={`${fieldId}-0`}>% Cumplimiento</Label>
            {data.tipo !== "jefe" && CUMPLIMIENTO_READONLY_STEPS.has(step) ? <Input id={`${fieldId}-0`} value={editCumplimiento[step].porcentaje} readOnly className="cursor-not-allowed bg-muted" /> : <Input id={`${fieldId}-0`} type="tel" value={editCumplimiento[step].porcentaje === "NA" ? "" : editCumplimiento[step].porcentaje} onChange={e => handlePorcentajeChange(e, step, "cumplimiento")} autoFocus onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                goNext();
              }
            }} placeholder="0-100" />}
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
