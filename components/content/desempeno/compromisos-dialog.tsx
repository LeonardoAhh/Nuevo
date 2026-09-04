"use client";

import { DESEMPENO } from "@/lib/desempeno/presentation";
import { useId } from "react";
import type { EvaluationFormContext } from "./use-evaluation-form";
import { Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ResponsiveShell, ModalHeader, ModalFooter } from "@/components/ui/responsive-shell";
export function CompromisosDialog({
  context
}: {
  context: EvaluationFormContext;
}) {
  const fieldId = useId();
  const {
    modal,
    editCompromisos,
    setEditCompromisos,
    setEditFechaRevision,
    editObservaciones,
    setEditObservaciones,
    closeModal,
    saveModal,
    dateValue
  } = context;
  return <ResponsiveShell open={modal === "compromisos"} onClose={closeModal} maxWidth="sm:max-w-md" title="Compromisos" description="Registra compromisos, acuerdos y fechas">
    <ModalHeader title="Compromisos" subtitle="Acuerdos y observaciones" onClose={closeModal} />
    <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground" htmlFor={`${fieldId}-0`}>{DESEMPENO.fields.commitments}</Label>
        <Textarea id={`${fieldId}-0`} value={editCompromisos} onChange={e => setEditCompromisos(e.target.value)} placeholder="Compromisos del evaluado..." className="min-h-20" />
    </div>
      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground" htmlFor={`${fieldId}-1`}>{DESEMPENO.fields.reviewDate}</Label>
        <Input id={`${fieldId}-1`} type="date" value={dateValue} onChange={e => {
          const val = e.target.value;
          if (val) {
            const [y, m, d] = val.split("-");
            setEditFechaRevision(`${d}/${m}/${y}`);
          } else {
            setEditFechaRevision("");
          }
        }} />
    </div>
      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground" htmlFor={`${fieldId}-2`}>{DESEMPENO.fields.observations}</Label>
        <Textarea id={`${fieldId}-2`} value={editObservaciones} onChange={e => setEditObservaciones(e.target.value)} placeholder="Observaciones adicionales..." />
    </div>
  </div>
    <ModalFooter onCancel={closeModal} onConfirm={saveModal} confirmIcon={<Check className="h-4 w-4" />} />
</ResponsiveShell>;
}
