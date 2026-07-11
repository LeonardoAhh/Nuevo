"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

// ─── Constantes ────────────────────────────────────────────────────────────────

const WEEK_DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"] as const

/** Umbral de ausentismo en porcentaje. Por encima se considera crítico. */
export const AUSENTISMO_THRESHOLD = 2.5

// ─── Tipos ─────────────────────────────────────────────────────────────────────

export interface ReporteCalendarProps {
    calendarCells: (string | null)[]
    daySummaries: Record<string, number>
    dayAusentismoPct: Record<string, number>
    selectedDay: string
    selectedMonthHolidayLabels: Record<string, string>
    currentMonth: string
    ausentismoThreshold?: number
    onSelectDay: (day: string) => void
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getAusentismoBadgeClasses(ausPct: number, threshold: number, active: boolean): string {
    if (active) return "bg-white/20 text-white"
    if (ausPct > threshold * 2) return "bg-destructive/15 text-destructive"
    if (ausPct > threshold) return "bg-warning/15 text-warning"
    return "bg-success/15 text-success"
}

function getCellHeatClasses(ausPct: number | undefined, threshold: number, active: boolean): string {
    if (active || ausPct === undefined) return ""
    if (ausPct > threshold * 2) return "ring-1 ring-destructive/20"
    if (ausPct > threshold) return "ring-1 ring-warning/20"
    return "ring-1 ring-success/20"
}

// ─── Subcomponente: Cabecera de días ───────────────────────────────────────────

function WeekDayHeaders() {
    return (
        <div className="grid grid-cols-7 gap-1.5 mb-2" role="row">
            {WEEK_DAY_NAMES.map((n) => (
                <div
                    key={n}
                    role="columnheader"
                    aria-label={n}
                    className="py-2 text-center text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground/70 select-none"
                >
                    {n}
                </div>
            ))}
        </div>
    )
}

// ─── Subcomponente: Celda de día ───────────────────────────────────────────────

interface DayCellProps {
    day: string
    count: number
    ausPct: number | undefined
    active: boolean
    holidayLabel: string | undefined
    threshold: number
    onSelectDay: (day: string) => void
}

function DayCell({ day, count, ausPct, active, holidayLabel, threshold, onSelectDay }: DayCellProps) {
    const [revealed, setRevealed] = useState(false)

    const hasAus = ausPct !== undefined
    const dayNumber = parseInt(day, 10)
    const hasData = hasAus || count > 0

    const ariaLabel = [
        `Día ${dayNumber}`,
        holidayLabel ? `Festivo: ${holidayLabel}` : null,
        count > 0 ? `${count} incidencia${count !== 1 ? "s" : ""}` : "Sin incidencias",
        hasAus && revealed
            ? `Ausentismo: ${ausPct!.toFixed(1)}%`
            : hasAus
                ? "Ausentismo oculto, presiona ! para revelar"
                : null,
        !hasData ? "Sin información" : null
    ]
        .filter(Boolean)
        .join(", ")

    return (
        <div
            role="button"
            tabIndex={hasData ? 0 : -1}
            aria-label={ariaLabel}
            aria-pressed={active}
            aria-selected={active}
            aria-disabled={!hasData}
            onClick={() => {
                if (hasData) onSelectDay(day)
            }}
            onKeyDown={(e) => {
                if (!hasData) return
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    onSelectDay(day)
                }
            }}
            className={cn(
                "relative flex flex-col rounded-xl border p-2 sm:p-2.5 text-left text-xs",
                "min-h-[64px] sm:min-h-[88px]",
                "transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                !hasData ? "opacity-50 cursor-not-allowed bg-muted/20" : "cursor-pointer",
                active
                    ? "border-primary bg-primary text-primary-foreground shadow-md"
                    : [
                        !hasData ? "border-border/50 text-foreground/50" : "border-border bg-card text-foreground",
                        hasData && "hover:border-primary/25 hover:bg-muted/40 hover:shadow-sm",
                        revealed ? getCellHeatClasses(ausPct, threshold, active) : "",
                    ],
            )}
        >
            {/* Número del día */}
            <span className={cn(
                "font-bold text-sm sm:text-base leading-none",
                active ? "text-primary-foreground" : "text-foreground",
            )}>
                {dayNumber}
            </span>

            {/* Badge de festivo */}
            {holidayLabel && (
                <>
                    <span
                        title={holidayLabel}
                        className={cn(
                            "mt-1.5 rounded-md px-1.5 py-0.5 text-[9px] font-semibold leading-tight truncate max-w-full",
                            "hidden sm:inline-flex items-center",
                            active
                                ? "bg-white/20 text-white"
                                : "bg-success/10 text-success border border-success/20",
                        )}
                    >
                        {holidayLabel}
                    </span>
                    <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 rounded-full bg-success sm:hidden" />
                </>
            )}

            {/* Fila inferior: ausentismo + incidencias */}
            <div className="mt-auto flex items-end justify-between gap-1 w-full pt-1">

                {/* Ausentismo */}
                {hasAus && (
                    revealed ? (
                        <span
                            className={cn(
                                "inline-flex items-center justify-center rounded-md",
                                "text-[10px] font-bold px-1.5 py-0.5 leading-none",
                                "animate-in fade-in zoom-in-75 duration-300",
                                getAusentismoBadgeClasses(ausPct!, threshold, active),
                            )}
                        >
                            <span className="hidden sm:inline mr-0.5">Aus</span>
                            {ausPct!.toFixed(1)}%
                        </span>
                    ) : (
                        <button
                            type="button"
                            aria-label={`Revelar ausentismo del día ${dayNumber}`}
                            onClick={(e) => {
                                e.stopPropagation()
                                setRevealed(true)
                            }}
                            className={cn(
                                "inline-flex items-center justify-center",
                                "h-5 w-5 rounded-md text-[11px] font-black leading-none",
                                "transition-all duration-150 select-none",
                                "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                active
                                    ? "bg-white/20 text-white hover:bg-white/30"
                                    : "bg-muted/80 text-muted-foreground hover:bg-warning/15 hover:text-warning border border-border/50",
                            )}
                        >
                            !
                        </button>
                    )
                )}

                {/* Badge de incidencias */}
                {count > 0 ? (
                    <span className={cn(
                        "inline-flex items-center justify-center rounded-md",
                        "text-xs font-bold px-2 py-0.5 leading-none",
                        active
                            ? "bg-white/20 text-white"
                            : "bg-destructive/15 text-destructive",
                    )}>
                        {count}
                    </span>
                ) : (
                    <span aria-hidden="true" className="text-[10px] text-muted-foreground/20">—</span>
                )}
            </div>
        </div>
    )
}

// ─── Componente principal ──────────────────────────────────────────────────────

export default function ReporteCalendar({
    calendarCells,
    daySummaries,
    dayAusentismoPct,
    selectedDay,
    selectedMonthHolidayLabels,
    currentMonth,
    ausentismoThreshold = AUSENTISMO_THRESHOLD,
    onSelectDay,
}: ReporteCalendarProps) {
    const monthPart = currentMonth.split("-")[1]

    return (
        <div role="grid" aria-label="Calendario de reporte de asistencia" className="bg-card rounded-xl border border-border p-3 sm:p-4">
            <WeekDayHeaders />

            <div className="grid grid-cols-7 gap-1.5">
                {calendarCells.map((day, idx) => {
                    if (!day) {
                        return <div key={`empty-${idx}`} role="gridcell" aria-hidden="true" className="min-h-[64px] sm:min-h-[88px]" />
                    }

                    const count = daySummaries[day] ?? 0
                    const ausPct = dayAusentismoPct[day]
                    const active = day === selectedDay
                    const holidayLabel = selectedMonthHolidayLabels[`${monthPart}-${day}`]

                    return (
                        <DayCell
                            key={day}
                            day={day}
                            count={count}
                            ausPct={ausPct}
                            active={active}
                            holidayLabel={holidayLabel}
                            threshold={ausentismoThreshold}
                            onSelectDay={onSelectDay}
                        />
                    )
                })}
            </div>
        </div>
    )
}
