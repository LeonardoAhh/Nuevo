"use client";

import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DialogContent, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { type EmployeePending } from "@/lib/hooks/usePendingEvals";
import { formatDate } from "@/lib/hooks/useNuevoIngreso";
import { dias } from "@/lib/hooks/useDashboardAlertas";
import { getPeriodoActual } from "@/lib/catalogo";
import { periodoMensualDeFecha } from "@/lib/desempeno/evaluaciones-guardadas";
import { periodoLabel } from "./pending-presentation";

export function DetailModal({ item }: { item: EmployeePending }) {
  const router = useRouter();
  const planEntregado = item.rg_rec_048 === "Entregado";
  const tienePendienteVigente = item.evals.some(entry => periodoMensualDeFecha(entry.fecha) === getPeriodoActual("mensuales"));

  return <DialogContent
    className="sm:max-w-lg"
    footer={<DialogFooter>
      {tienePendienteVigente && item.numero ? <Button className="min-h-11 w-full sm:w-auto" onClick={() => {
        if (item.numero) router.push(`/desempeno?q=${encodeURIComponent(item.numero)}`);
      }}>
        Evaluar empleado
      </Button> : <p className="text-sm leading-5 text-muted-foreground">{!item.numero ? "Falta el número de empleado." : "No hay una evaluación pendiente del periodo vigente."}</p>}
    </DialogFooter>}
  >
    <div className="border-b pb-4 pr-12">
      <DialogDescription className="mb-1 text-xs leading-4">#{item.numero ?? "—"}</DialogDescription>
      <DialogTitle className="text-xl leading-7">{item.nombre}</DialogTitle>
    </div>

    <section className="mt-5" aria-labelledby="pending-detail-evaluations">
      <h3 id="pending-detail-evaluations" className="text-sm font-semibold leading-5 text-foreground">Evaluaciones pendientes</h3>
      {item.evals.length > 0 ? <ul className="mt-3 divide-y rounded-md border">
        {item.evals.map(entry => <li key={entry.periodo} className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium leading-5 text-foreground">{entry.periodo}</p>
            <p className="mt-0.5 break-words text-xs leading-4 text-muted-foreground">
              {periodoLabel(entry.fecha).toLocaleLowerCase("es-MX")} · {formatDate(entry.fecha)}
            </p>
          </div>
          <span className={`shrink-0 text-xs font-medium leading-5 ${entry.diasDiff < 0 ? "text-destructive" : "text-success"}`}>
            {dias(entry.diasDiff)}
          </span>
        </li>)}
      </ul> : <p className="mt-2 text-sm leading-5 text-muted-foreground">No hay evaluaciones pendientes. Revisa el plan de formación.</p>}
    </section>

    <details className="group mt-5 overflow-hidden rounded-md border">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 text-sm font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
        Datos adicionales
        <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      <dl className="grid gap-x-4 gap-y-3 border-t px-4 py-3 sm:grid-cols-2">
        <div>
          <dt className="text-xs leading-4 text-muted-foreground">Ingreso</dt>
          <dd className="mt-1 text-sm font-medium leading-5 text-foreground">{formatDate(item.fecha_ingreso)}</dd>
        </div>
        <div>
          <dt className="text-xs leading-4 text-muted-foreground">Término de contrato</dt>
          <dd className="mt-1 text-sm font-medium leading-5 text-foreground">{formatDate(item.termino_contrato)}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs leading-4 text-muted-foreground">Plan de formación</dt>
          <dd className={`mt-1 text-sm font-medium leading-5 ${planEntregado ? "text-success" : item.rg_dias_diff !== null && item.rg_dias_diff < 0 ? "text-destructive" : "text-foreground"}`}>
            {planEntregado ? "Entregado" : "Pendiente"}
            {!planEntregado && item.fecha_vencimiento_rg && item.rg_dias_diff !== null && <span className="ml-2 font-normal text-muted-foreground">
              {formatDate(item.fecha_vencimiento_rg)} · {dias(item.rg_dias_diff)}
            </span>}
          </dd>
        </div>
      </dl>
    </details>

  </DialogContent>;
}
