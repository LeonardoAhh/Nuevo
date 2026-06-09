"use client"

import { cn } from "@/lib/utils"
import { INCIDENCIA_LABELS, ALLOWED_PUESTOS } from "./constants"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"

interface AreaDetailRow {
    key: string
    numero_empleado: string
    nombre: string
    puesto?: string
    turno?: string
    tipo_incidencia: string
}

interface AreaSummaryItem {
    area: string
    personal_autorizado: number
    personal_activo: number
    personal_incidencia: number
    personal_real: number
    is_descanso?: boolean
}

interface ReporteAreaSummaryProps {
    areas: AreaSummaryItem[]
    selectedArea: string
    onSelectArea: (area: string) => void
    detailRows: AreaDetailRow[]
}

export default function ReporteAreaSummary({
    areas,
    selectedArea,
    onSelectArea,
    detailRows,
}: ReporteAreaSummaryProps) {
    return (
        <div>
            <div className="grid gap-3 mb-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
                {areas.map((area) => {
                    const active = selectedArea === area.area
                    const isDescanso = area.is_descanso
                    
                    return (
                        <button
                            key={area.area}
                            type="button"
                            onClick={() => {
                                if (!isDescanso) onSelectArea(area.area)
                            }}
                            disabled={isDescanso}
                            className={cn(
                                "text-left rounded-2xl border p-4 transition-all relative overflow-hidden",
                                "bg-background shadow-sm",
                                isDescanso
                                    ? "opacity-60 cursor-not-allowed border-dashed bg-muted/30"
                                    : "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                !isDescanso && active
                                    ? "border-foreground bg-foreground/10"
                                    : !isDescanso && "border-border hover:border-foreground/40 hover:bg-muted/50",
                            )}
                        >
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                                {area.area}
                            </p>
                            
                            {isDescanso ? (
                                <div className="mt-3 flex h-[168px] items-center justify-center rounded-xl bg-muted/40 border border-border/50">
                                    <span className="text-sm font-medium uppercase tracking-widest text-muted-foreground/70">
                                        Día de Descanso
                                    </span>
                                </div>
                            ) : (
                                <div className="mt-3 grid gap-2 text-sm text-foreground">
                                    {[
                                        { label: "Autorizado", value: area.personal_autorizado },
                                        { label: "Activo", value: area.personal_activo },
                                        { label: "Incidencias", value: area.personal_incidencia },
                                        { label: "Personal real", value: area.personal_real },
                                        { label: "% Asistencia", value: area.personal_activo > 0 ? `${Math.round((area.personal_real / area.personal_activo) * 100)}%` : "—" },
                                    ].map(({ label, value }) => (
                                        <div key={label} className="flex items-center justify-between rounded-md bg-muted/70 px-3 py-2">
                                            <span>{label}</span>
                                            <span className="font-semibold">{value}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </button>
                    )
                })}
            </div>

            <Dialog open={Boolean(selectedArea)} onOpenChange={(v) => { if (!v) onSelectArea("") }}>
                <DialogContent className="sm:max-w-5xl bg-card">
                    <DialogHeader>
                        <DialogTitle>Detalle de {selectedArea}</DialogTitle>
                        <DialogDescription>
                            {detailRows.length > 0
                                ? `${detailRows.length} empleado${detailRows.length === 1 ? "" : "s"} con incidencia en el día seleccionado.`
                                : "Sin incidencias registradas para esta área en el día seleccionado."}
                        </DialogDescription>
                    </DialogHeader>

                    {detailRows.length > 0 ? (
                        <div className="overflow-x-auto rounded-xl border border-border shadow-sm">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border bg-muted/50 text-left">
                                        {["# Empleado", "Empleado", "Puesto", "Turno", "Tipo de incidencia"].map((h) => (
                                            <th key={h} className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border bg-card">
                                    {detailRows.map((row, i) => (
                                        <tr key={row.key} className={i % 2 !== 0 ? "bg-muted/20" : ""}>
                                            <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground whitespace-nowrap">{row.numero_empleado}</td>
                                            <td className="px-4 py-2.5 font-medium text-foreground">{row.nombre}</td>
                                            <td className="px-4 py-2.5 text-sm text-muted-foreground">{row.puesto ?? "—"}</td>
                                            <td className="px-4 py-2.5 text-sm text-muted-foreground whitespace-nowrap">{row.turno ?? "—"}</td>
                                            <td className="px-4 py-2.5 text-foreground/80 whitespace-nowrap">
                                                {INCIDENCIA_LABELS[row.tipo_incidencia] ?? row.tipo_incidencia}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="rounded-xl border border-dashed border-border bg-background px-4 py-8 text-center text-sm text-muted-foreground">
                            Sin incidencias registradas para esta área en el día seleccionado.
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
