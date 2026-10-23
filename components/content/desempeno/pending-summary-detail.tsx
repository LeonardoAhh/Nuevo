"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatDate } from "@/lib/hooks/useNuevoIngreso";
import { pendingEvalStatus, type DeptGroup, type EmployeePending, type PendingEvalStatus } from "@/lib/hooks/usePendingEvals";
import { DetailModal } from "./pending-detail";

const titles: Record<PendingEvalStatus, string> = {
  vencidas: "Evaluaciones vencidas",
  proximas: "Evaluaciones próximas",
  "a-tiempo": "Evaluaciones a tiempo",
};

export function PendingSummaryDetail({ status, groups, onOpenChange }: {
  status: PendingEvalStatus | null;
  groups: DeptGroup[];
  onOpenChange: (open: boolean) => void;
}) {
  const [selected, setSelected] = useState<EmployeePending | null>(null);
  const entries = groups.flatMap(group => group.items.flatMap(employee =>
    employee.evals.filter(entry => pendingEvalStatus(entry.diasDiff) === status)
      .map(entry => ({ employee, entry, departamento: group.departamento }))
  )).sort((a, b) => a.entry.diasDiff - b.entry.diasDiff || a.employee.nombre.localeCompare(b.employee.nombre, "es"));
  return <Dialog open={status !== null} onOpenChange={open => {
    if (!open) setSelected(null);
    onOpenChange(open);
  }}>
    {selected ? <DetailModal item={selected} onBack={() => setSelected(null)} /> : <DialogContent>
      <DialogHeader>
        <DialogTitle>{status ? titles[status] : "Evaluaciones pendientes"}</DialogTitle>
        <DialogDescription>{entries.length} {entries.length === 1 ? "evaluación pendiente" : "evaluaciones pendientes"} en este estado.</DialogDescription>
      </DialogHeader>
      {entries.length > 0 ? <ul className="divide-y rounded-lg border">
        {entries.map(({ employee, entry, departamento }) => <li key={`${employee.dbId}:${entry.periodo}:${entry.fecha}`}>
          <button type="button" onClick={() => setSelected(employee)} aria-label={`Ver detalle de ${employee.nombre}, ${entry.periodo}`} className="block min-h-11 w-full space-y-1 px-4 py-3 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
            <span className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <span className="min-w-0 break-words text-sm font-semibold text-foreground">{employee.nombre}</span>
              <span className="text-xs tabular-nums text-muted-foreground">#{employee.numero ?? "—"}</span>
            </span>
            <span className="block text-sm text-muted-foreground">{entry.periodo} · {departamento}</span>
            <span className="block text-xs text-muted-foreground">Fecha límite: <time dateTime={entry.fecha}>{formatDate(entry.fecha)}</time> · {entry.diasDiff < 0 ? `Hace ${-entry.diasDiff} ${entry.diasDiff === -1 ? "día" : "días"}` : entry.diasDiff === 0 ? "Hoy" : `En ${entry.diasDiff} ${entry.diasDiff === 1 ? "día" : "días"}`}</span>
          </button>
        </li>)}
      </ul> : <p role="status" className="rounded-lg border px-4 py-6 text-center text-sm text-muted-foreground">
        No hay evaluaciones pendientes en este estado.
      </p>}
    </DialogContent>}
  </Dialog>;
}
