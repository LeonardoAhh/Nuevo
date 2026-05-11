"use client"

import { cn } from "@/lib/utils"
import { INCIDENCIA_LABELS, ALLOWED_PUESTOS } from "./constants"

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
                    return (
                        <button
                            key={area.area}
                            type="button"
                            onClick={() => onSelectArea(area.area)}
                            className={cn(
                                "text-left rounded-2xl border p-4 transition-all",
                                "bg-background shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                active
                                    ? "border-foreground bg-foreground/10"
                                    : "border-border hover:border-foreground/40 hover:bg-muted/50",
                            )}
                        >
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                                {area.area}
                            </p>
                            <div className="mt-3 grid gap-2 text-sm text-foreground">
                                {[
                                    { label: "Autorizado", value: area.personal_autorizado },
                                    { label: "Activo", value: area.personal_activo },
                                    { label: "Incidencias", value: area.personal_incidencia },
                                    { label: "Personal real", value: area.personal_real },
                                ].map(({ label, value }) => (
                                    <div key={label} className="flex items-center justify-between rounded-md bg-muted/70 px-3 py-2">
                                        <span>{label}</span>
                                        <span className="font-semibold">{value}</span>
                                    </div>
                                ))}
                            </div>
                        </button>
                    )
                })}
            </div>

            {selectedArea ? (
                <div className="mb-4 rounded-2xl border border-border bg-background p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-foreground">Detalle de {selectedArea}</p>
                        <button
                            type="button"
                            onClick={() => onSelectArea("")}
                            className="rounded-md border border-border bg-muted px-3 py-1 text-xs text-muted-foreground transition hover:border-foreground/50 hover:text-foreground"
                        >
                            Limpiar
                        </button>
                    </div>

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
                                            <td className="px-4 py-2.5 font-medium text-foreground whitespace-nowrap">{row.nombre}</td>
                                            <td className="px-4 py-2.5 text-sm text-muted-foreground">{row.puesto ?? "—"}</td>
                                            <td className="px-4 py-2.5 text-sm text-muted-foreground">{row.turno ?? "—"}</td>
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
                </div>
            ) : null}
        </div>
    )
}
