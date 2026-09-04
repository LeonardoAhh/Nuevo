"use client";

import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldValue } from "./presentation";
export type ModalType = "objetivos" | "cumplimiento" | "competencias" | "compromisos" | null;
export const EditButton = ({
  section,
  canEdit,
  isDisabled,
  openModal
}: {
  section: ModalType;
  canEdit: boolean;
  isDisabled?: boolean;
  openModal: (s: ModalType) => void;
}) => {
  if (!canEdit) return null;
  return <Button variant="outline" size="sm" onClick={() => openModal(section)} disabled={isDisabled} aria-label={`Editar ${section}`}>
    <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
      Capturar
</Button>;
};
export function StepDots({
  total,
  current,
  onSelect
}: {
  total: number;
  current: number;
  onSelect?: (i: number) => void;
}) {
  return <div className="flex items-center justify-center gap-1.5 py-2" role="group" aria-label="Progreso">
    {Array.from({
      length: total
    }, (_, i) => <button key={i} type="button" aria-current={i === current ? "step" : undefined} aria-label={`Paso ${i + 1} de ${total}`} onClick={() => onSelect?.(i)} disabled={!onSelect} className={`size-9 rounded-md border text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${i === current ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>{i + 1}</button>)}
</div>;
}
export const InfoField = FieldValue;
