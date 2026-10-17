"use client";

import { motion } from "framer-motion";
import { Clock3 } from "lucide-react";
import { type EmployeePending } from "@/lib/hooks/usePendingEvals";
import { itemV } from "./pending-presentation";
import { PendingCard, PendingCardFields, PendingCardStatus } from "./pending-card";
interface EmployeeBadgeProps {
  item: EmployeePending;
  isSelected: boolean;
  onSelect: () => void;
}
export function EmployeeBadge({
  item,
  isSelected,
  onSelect
}: EmployeeBadgeProps) {
  return <motion.div variants={itemV} layout className="min-w-0 self-start">
    <PendingCard asChild interactive variant={isSelected ? "selected" : item.hasVencida ? "urgent" : "default"}>
      <button type="button" onClick={onSelect} aria-expanded={isSelected} aria-haspopup="dialog" aria-label={`Ver detalle de ${item.nombre}, empleado ${item.numero ?? "sin número"}, ${item.evals.length} ${item.evals.length === 1 ? "evaluación pendiente" : "evaluaciones pendientes"}`} className="w-full select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <PendingCardFields
          number={item.numero}
          name={item.nombre}
          status={<PendingCardStatus tone={item.hasVencida ? "destructive" : "success"} icon={<Clock3 className="size-3.5 shrink-0" aria-hidden="true" />}>
            {item.evals.length} eval{item.evals.length !== 1 ? "s" : ""}
          </PendingCardStatus>}
        />
      </button>
    </PendingCard>
  </motion.div>;
}
