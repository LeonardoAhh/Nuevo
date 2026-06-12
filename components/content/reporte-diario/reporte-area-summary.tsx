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
            {/* Grid de áreas */}
            <div className="grid gap-3 mb-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                {areas.map((area) => {
                    const active = selectedArea === area.area
                    const isDescanso = area.is_descanso
                    const asistenciaPct = area.personal_activo > 0
                        ? Math.round((area.personal_real / area.personal_activo) * 100)
                        : null

                    return (
                        <button
                            key={area.area}
                            type="button"
                            onClick={() => {
                                if (!isDescanso) onSelectArea(area.area)
                            }}
                            disabled={isDescanso}
                            className={cn(
                                "group text-left rounded-xl border p-4 transition-all duration-200 relative overflow-hidden",
                                "bg-card shadow-sm min-h-[220px]",
                                isDescanso
                                    ? "opacity-50 cursor-not-allowed border-dashed border-border/60 bg-muted/20"
                                    : "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                                !isDescanso && active
                                    ? "border-primary/60 ring-1 ring-primary/20 shadow-md"
                                    : !isDescanso && "border-border hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5",
                            )}
                        >
                            {/* Header de área */}
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-foreground/90 line-clamp-2 leading-tight">
                                    {area.area}
                                </p>
                                {active && (
                                    <span className="h-2 w-2 rounded-full bg-primary animate-pulse flex-shrink-0 ml-2" />
                                )}
                            </div>

                            {isDescanso ? (
                                <div className="flex h-[160px] items-center justify-center text-center px-4 rounded-lg bg-muted/30 border border-dashed border-border/50">
                                    <span className="text-xs font-bold uppercase tracking-widest text-foreground/70">
                                        Día de Descanso
                                    </span>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {/* Grid 2×2 de métricas — siempre estable */}
                                    <div className="grid grid-cols-2 gap-2">
                                        <MetricBox
                                            label="Autorizado"
                                            value={area.personal_autorizado}
                                        />
                                        <MetricBox
                                            label="Activo"
                                            value={area.personal_activo}
                                        />
                                        <MetricBox
                                            label="Incidencias"
                                            value={area.personal_incidencia}
                                            highlight={area.personal_incidencia > 0}
                                            variant="destructive"
                                        />
                                        <MetricBox
                                            label="Real"
                                            value={area.personal_real}
                                        />
                                    </div>

                                    {/* Barra de asistencia */}
                                    <div className="rounded-lg bg-muted/50 px-3 py-2.5">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-[10px] uppercase tracking-wider text-foreground/80 font-bold">
                                                Asistencia
                                            </span>
                                            <span className={cn(
                                                "text-xs font-bold tabular-nums",
                                                asistenciaPct === null ? "text-muted-foreground" :
                                                asistenciaPct >= 95 ? "text-success" :
                                                asistenciaPct >= 90 ? "text-warning" : "text-destructive"
                                            )}>
                                                {asistenciaPct !== null ? `${asistenciaPct}%` : "—"}
                                            </span>
                                        </div>
                                        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                                            <div
                                                className={cn(
                                                    "h-full rounded-full transition-all duration-500",
                                                    asistenciaPct === null ? "bg-muted-foreground/20" :
                                                    asistenciaPct >= 95 ? "bg-success" :
                                                    asistenciaPct >= 90 ? "bg-warning" : "bg-destructive"
                                                )}
                                                style={{ width: `${Math.min(asistenciaPct ?? 0, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </button>
                    )
                })}
            </div>

            {/* Dialog de detalle */}
            <Dialog open={Boolean(selectedArea)} onOpenChange={(v) => { if (!v) onSelectArea("") }}>
                <DialogContent className="sm:max-w-5xl bg-card border-border">
                    <DialogHeader className="space-y-1">
                        <DialogTitle className="text-lg font-semibold tracking-tight">
                            Detalle de {selectedArea}
                        </DialogTitle>
                        <DialogDescription className="text-sm text-muted-foreground">
                            {detailRows.length > 0
                                ? `${detailRows.length} empleado${detailRows.length === 1 ? "" : "s"} con incidencia en el día seleccionado.`
                                : "Sin incidencias registradas para esta área en el día seleccionado."}
                        </DialogDescription>
                    </DialogHeader>

                    {detailRows.length > 0 ? (
                        <div className="overflow-hidden rounded-xl border border-border shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border bg-muted/60 text-left">
                                            {["# Empleado", "Empleado", "Puesto", "Turno", "Tipo de incidencia"].map((h) => (
                                                <th key={h} className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border bg-card">
                                        {detailRows.map((row, i) => (
                                            <tr
                                                key={row.key}
                                                className={cn(
                                                    "transition-colors hover:bg-muted/40",
                                                    i % 2 !== 0 ? "bg-muted/20" : ""
                                                )}
                                            >
                                                <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground whitespace-nowrap tabular-nums">
                                                    {row.numero_empleado}
                                                </td>
                                                <td className="px-4 py-2.5 font-medium text-foreground">
                                                    {row.nombre}
                                                </td>
                                                <td className="px-4 py-2.5 text-sm text-muted-foreground">
                                                    {row.puesto ?? "—"}
                                                </td>
                                                <td className="px-4 py-2.5 text-sm text-muted-foreground whitespace-nowrap">
                                                    {row.turno ?? "—"}
                                                </td>
                                                <td className="px-4 py-2.5 whitespace-nowrap">
                                                    <span className="inline-flex items-center rounded-md bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive">
                                                        {INCIDENCIA_LABELS[row.tipo_incidencia] ?? row.tipo_incidencia}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-10 text-center">
                            <p className="text-sm text-muted-foreground">
                                Sin incidencias registradas para esta área en el día seleccionado.
                            </p>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}

// Subcomponente: caja de métrica individual
function MetricBox({
    label,
    value,
    highlight = false,
    variant = "default"
}: {
    label: string
    value: number
    highlight?: boolean
    variant?: "default" | "destructive"
}) {
    return (
        <div className={cn(
            "rounded-lg px-2.5 py-2.5 flex flex-col justify-center min-h-[52px]",
            highlight && variant === "destructive"
                ? "bg-destructive/10"
                : "bg-muted/50"
        )}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/80 leading-none mb-1">
                {label}
            </p>
            <p className={cn(
                "text-base font-bold tabular-nums leading-none",
                highlight && variant === "destructive" ? "text-destructive" : "text-foreground"
            )}>
                {value}
            </p>
        </div>
    )
}
