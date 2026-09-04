"use client";

import { GraduationCap, Calendar, Building2, Layers, Clock3, CalendarCheck, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { type EmployeePending } from "@/lib/hooks/usePendingEvals";
import { formatDate } from "@/lib/hooks/useNuevoIngreso";
import { dias } from "@/lib/hooks/useDashboardAlertas";
import { periodoLabel, PERIODO_BADGE } from "./pending-presentation";
interface DetailCardProps {
  item: EmployeePending;
  onClose: () => void;
}
function buildStats(item: EmployeePending) {
  const planStatus = () => {
    if (item.rg_rec_048 === "Entregado") {
      return <span className="font-bold text-success">Entregado</span>;
    }
    if (!item.fecha_vencimiento_rg || item.rg_dias_diff === null) {
      return <span className="italic text-muted-foreground">Pendiente (Sin fecha)</span>;
    }
    const vencida = item.rg_dias_diff < 0;
    return <span className="flex items-center gap-1 truncate">
      <span>{formatDate(item.fecha_vencimiento_rg)}</span>
      <span className={`text-xs ${vencida ? "font-bold text-destructive" : "text-muted-foreground"}`}>
          ({dias(item.rg_dias_diff)})
      </span>
    </span>;
  };
  return [{
    icon: <Building2 className="size-3" aria-hidden="true" />,
    label: "Departamento",
    value: item.departamento ?? "—"
  }, {
    icon: <Layers className="size-3" aria-hidden="true" />,
    label: "Área",
    value: item.area ?? "—"
  }, {
    icon: <Clock3 className="size-3" aria-hidden="true" />,
    label: "Turno",
    value: item.turno ?? "—"
  }, {
    icon: <CalendarCheck className="size-3" aria-hidden="true" />,
    label: "Ingreso",
    value: formatDate(item.fecha_ingreso)
  }, {
    icon: <Calendar className="size-3" aria-hidden="true" />,
    label: "Término",
    value: formatDate(item.termino_contrato)
  }, {
    icon: <FileText className="size-3" aria-hidden="true" />,
    label: "Plan Formación",
    value: planStatus()
  }] as const;
}
export function DetailModal({
  item
}: Omit<DetailCardProps, 'onClose'>) {
  const stats = buildStats(item);
  const router = useRouter();
  return <DialogContent className="max-h-dvh overflow-y-auto sm:max-h-[90dvh] sm:max-w-xl">
    <DialogHeader className="border-b border-border pb-4">
      <DialogTitle className="text-left text-lg">{item.nombre}</DialogTitle>
      <DialogDescription className="text-left">
          #{item.numero ?? "—"}
      </DialogDescription>
    </DialogHeader>

    <div className="flex flex-col gap-6 pb-2">
      {/* Info grid */}
      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        {stats.map(({
          icon,
          label,
          value
        }) => <div key={label} className="flex flex-col gap-1 rounded-xl border bg-muted/30 p-3 shadow-sm">
            <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {icon} {label}
            </dt>
            <dd className="break-words text-sm font-medium text-foreground">{value}</dd>
          </div>)}
      </dl>

      {/* Separador */}
      <div className="h-px w-full bg-border" />

      {/* Evaluaciones pendientes */}
      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Evaluaciones pendientes
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(["1er Mes", "2° Mes", "3er Mes"] as const).map(p => {
            const entry = item.evals.find(e => e.periodo === p);
            const vencida = entry && entry.diasDiff < 0;
            const {
              bg,
              text
            } = PERIODO_BADGE[p];
            return <div key={p} className="flex flex-col items-center gap-3 rounded-xl border bg-card p-4 text-center shadow-sm">
              <span className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-bold uppercase ${bg} ${text}`}>
                <GraduationCap className="size-3.5" aria-hidden="true" /> {p}
              </span>
              {entry ? <div className="flex flex-col items-center gap-1.5 mt-1">
                <span className="text-sm font-semibold tracking-tight text-foreground leading-tight">
                  {periodoLabel(entry.fecha)}
                </span>
                <span className="text-xs text-muted-foreground">{formatDate(entry.fecha)}</span>
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${vencida ? "text-destructive" : "text-success"}`}>
                  <Clock3 className="size-3.5" aria-hidden="true" /> {dias(entry.diasDiff)}
                </span>
              </div> : <span className="text-xs italic text-muted-foreground mt-3">Sin pendiente</span>}
            </div>;
          })}
        </div>
      </div>
    </div>
    <DialogFooter className="border-t border-border bg-transparent">
      <Button className="w-full sm:w-auto gap-2" onClick={() => {
        if (item.numero) {
          router.push(`/desempeno?q=${item.numero}`);
        }
      }} disabled={!item.numero}>
        <FileText className="size-4" aria-hidden="true" />
          Evaluar empleado
      </Button>
    </DialogFooter>
  </DialogContent>;
}
