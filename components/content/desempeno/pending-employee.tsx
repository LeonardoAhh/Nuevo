"use client";

import { motion } from "framer-motion";
import { Clock3 } from "lucide-react";
import { type EmployeePending } from "@/lib/hooks/usePendingEvals";
import { itemV } from "./pending-presentation";
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
  return <motion.div variants={itemV} layout>
    <button type="button" onClick={onSelect} aria-expanded={isSelected} aria-haspopup="dialog" aria-label={`Empleado ${item.numero ?? item.nombre} — ${item.evals.length} pendiente${item.evals.length !== 1 ? "s" : ""}`} className={["relative flex w-full items-center justify-between gap-3 p-3", "rounded-xl border text-left shadow-sm", "select-none transition-all duration-200", "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", isSelected ? "border-primary bg-primary/5" : item.hasVencida ? "border-destructive/30 bg-destructive/5 hover:border-destructive/60 hover:bg-destructive/10 active:scale-100" : "border-border/60 bg-card hover:border-primary/30 hover:bg-muted/50 active:scale-100"].join(" ")}>
      <div className="min-w-0 flex-1">
        <p className={`break-words text-sm font-medium leading-tight ${isSelected ? "text-primary" : "text-foreground"}`}>
          {item.nombre}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
            #{item.numero ?? "—"}
        </p>
      </div>
      <div className="flex-shrink-0">
        <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-bold shadow-sm ${item.hasVencida ? "bg-destructive text-destructive-foreground" : "bg-success text-success-foreground"}`}>
          <Clock3 className="size-3.5" aria-hidden="true" />
          {item.evals.length} eval{item.evals.length !== 1 ? "s" : ""}
        </span>
      </div>
    </button>
  </motion.div>;
}
