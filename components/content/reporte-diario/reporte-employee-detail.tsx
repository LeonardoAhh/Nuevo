"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"
import { INCIDENCIA_LABELS } from "./constants"
import { isIncidence } from "./helpers"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import type { ReporteRow } from "./types"

interface ReporteEmployeeDetailProps {
    open: boolean
    onClose: () => void
    employee: ReporteRow | null
    dayHeaders: string[]
    currentMonth: string
}

const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]

function codeTone(code: string | undefined): string {
    if (!code || code === "-" || code === "X") return "text-muted-foreground"
    if (code === "A") return "text-success"
    if (code === "D" || code === "DF") return "text-info"
    return "text-destructive"
}

function codeBg(code: string | undefined): string {
    if (!code || code === "-" || code === "X") return ""
    if (code === "A") return "bg-success/10"
    if (code === "D" || code === "DF") return "bg-info/10"
    return "bg-destructive/10"
}

export default function ReporteEmployeeDetail({
    open,
    onClose,
    employee,
    dayHeaders,
    currentMonth,
}: ReporteEmployeeDetailProps) {
    const stats = useMemo(() => {
        if (!employee) return null
        let asistencias = 0
        let incidencias = 0
        let descansos = 0
        let tracked = 0
        const incidentDetail: { day: string; code: string }[] = []

        for (const day of dayHeaders) {
            const code = employee.days[day]
            if (!code || code === "-" || code === "X") continue
            tracked++
            if (code === "A") asistencias++
            else if (code === "D" || code === "DF") descansos++
            else if (isIncidence(code)) {
                incidencias++
                incidentDetail.push({ day, code })
            }
        }

        return { asistencias, incidencias, descansos, tracked, incidentDetail }
    }, [employee, dayHeaders])

    if (!employee || !stats) return null

    const [year, month] = currentMonth.split("-").map(Number)

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-card">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <span className="font-mono text-sm text-muted-foreground">#{employee.numero_empleado}</span>
                        <span>{employee.nombre}</span>
                    </DialogTitle>
                    <DialogDescription className="flex flex-wrap gap-2 mt-1">
                        {employee.puesto && <Badge variant="secondary">{employee.puesto}</Badge>}
                        {employee.departamento && <Badge variant="outline">{employee.departamento}</Badge>}
                        {employee.area && <Badge variant="outline">{employee.area}</Badge>}
                        {employee.turno && <Badge variant="outline">Turno {employee.turno}</Badge>}
                    </DialogDescription>
                </DialogHeader>

                {/* KPI row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                    {[
                        { label: "Asistencias", value: stats.asistencias, tone: "text-success" },
                        { label: "Incidencias", value: stats.incidencias, tone: stats.incidencias > 0 ? "text-destructive" : "text-muted-foreground" },
                        { label: "Descansos", value: stats.descansos, tone: "text-info" },
                        { label: "Tasa asist.", value: stats.tracked > 0 ? `${Math.round((stats.asistencias / stats.tracked) * 100)}%` : "—", tone: "text-foreground" },
                    ].map(({ label, value, tone }) => (
                        <div key={label} className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-center">
                            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
                            <p className={cn("text-lg font-bold", tone)}>{value}</p>
                        </div>
                    ))}
                </div>

                {/* Calendar grid */}
                <div className="mt-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Calendario del mes</p>
                    <div className="grid grid-cols-7 gap-1">
                        {DAY_NAMES.map((d) => (
                            <div key={d} className="text-center text-[10px] font-bold uppercase text-muted-foreground py-1">
                                {d}
                            </div>
                        ))}
                        {(() => {
                            const firstDay = new Date(year, month - 1, 1).getDay()
                            const cells: React.ReactNode[] = []
                            for (let i = 0; i < firstDay; i++) {
                                cells.push(<div key={`empty-${i}`} />)
                            }
                            for (const day of dayHeaders) {
                                const code = employee.days[day] ?? ""
                                const label = INCIDENCIA_LABELS[code] ?? code
                                cells.push(
                                    <div
                                        key={day}
                                        className={cn(
                                            "rounded-lg border border-border p-1.5 text-center transition-colors",
                                            codeBg(code),
                                        )}
                                        title={`Día ${parseInt(day, 10)}: ${label}`}
                                    >
                                        <span className="text-xs font-medium text-foreground">{parseInt(day, 10)}</span>
                                        <p className={cn("text-[10px] font-bold mt-0.5", codeTone(code))}>
                                            {code || "—"}
                                        </p>
                                    </div>
                                )
                            }
                            return cells
                        })()}
                    </div>
                </div>

                {/* Incident detail list */}
                {stats.incidentDetail.length > 0 && (
                    <div className="mt-4">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                            Detalle de incidencias ({stats.incidentDetail.length})
                        </p>
                        <div className="rounded-xl border border-border overflow-hidden">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border bg-muted/50">
                                        <th className="px-4 py-2 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Día</th>
                                        <th className="px-4 py-2 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Código</th>
                                        <th className="px-4 py-2 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Tipo</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {stats.incidentDetail.map(({ day, code }) => {
                                        const dayNum = parseInt(day, 10)
                                        const date = new Date(year, month - 1, dayNum)
                                        const weekday = DAY_NAMES[date.getDay()]
                                        return (
                                            <tr key={day} className="hover:bg-muted/20">
                                                <td className="px-4 py-2 font-mono text-xs">
                                                    {weekday} {dayNum}
                                                </td>
                                                <td className="px-4 py-2">
                                                    <Badge variant="destructive" className="text-xs">{code}</Badge>
                                                </td>
                                                <td className="px-4 py-2 text-foreground/80">
                                                    {INCIDENCIA_LABELS[code] ?? code}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Legend */}
                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                    {Object.entries(INCIDENCIA_LABELS).map(([code, label]) => (
                        <span key={code} className="flex items-center gap-1">
                            <span className={cn("font-bold", codeTone(code))}>{code}</span>
                            <span>{label}</span>
                        </span>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    )
}
