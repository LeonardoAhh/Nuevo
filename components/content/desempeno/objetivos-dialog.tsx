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
export function ObjetivosDialog({
  context
}: {
  context: EvaluationFormContext;
}) {
  const fieldId = useId();
  const {
    modal,
    step,
    direction,
    editObjetivos,
    closeModal,
    saveModal,
    isLastStep,
    goNext,
    goPrev,
    handleStepSelect,
    handlePorcentajeChange
  } = context;
  return <ResponsiveShell open={modal === "objetivos"} onClose={closeModal} maxWidth="sm:max-w-md" title="Objetivos SMART" description="Captura resultado y porcentaje por objetivo">
    <ModalHeader title="Objetivos SMART" subtitle={`Paso ${step + 1} de ${editObjetivos.length}`} onClose={closeModal} />
    <StepDots total={editObjetivos.length} current={step} onSelect={handleStepSelect} />
    <div className="flex-1 overflow-y-auto px-6 pb-6">
      <AnimatePresence mode="wait" custom={direction} initial={false}>
        {editObjetivos[step] && <motion.div key={`obj-${step}`} custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{
          duration: 0.2,
          ease: [0.22, 1, 0.36, 1]
        }} className="space-y-4">
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm font-semibold">Objetivo {editObjetivos[step].numero}</p>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{editObjetivos[step].descripcion}</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground" htmlFor={`${fieldId}-0`}>Resultado del periodo</Label>
              <Input id={`${fieldId}-0`} value={editObjetivos[step].resultado} readOnly className="cursor-not-allowed bg-muted" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground" htmlFor={`${fieldId}-1`}>% Obtenido (1-100)</Label>
              <Input id={`${fieldId}-1`} type="tel" value={editObjetivos[step].porcentaje === "NA" ? "" : editObjetivos[step].porcentaje} onChange={e => handlePorcentajeChange(e, step, "objetivos")} autoFocus onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  goNext();
                }
              }} placeholder="0-100" />
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
