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
    if (ausPct > threshold * 2) return "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
    if (ausPct > threshold) return "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
}

function getCellHeatClasses(ausPct: number | undefined, threshold: number, active: boolean): string {
    if (active || ausPct === undefined) return ""
    if (ausPct > threshold * 2) return "ring-1 ring-red-200 dark:ring-red-800"
    if (ausPct > threshold) return "ring-1 ring-amber-200 dark:ring-amber-700"
    return "ring-1 ring-emerald-200 dark:ring-emerald-800"
}

// ─── Subcomponente: Cabecera de días ───────────────────────────────────────────

function WeekDayHeaders() {
    return (
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5 mb-1.5" role="row">
            {WEEK_DAY_NAMES.map((n) => (
                <div
                    key={n}
                    role="columnheader"
                    aria-label={n}
                    className="py-1.5 text-center text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-muted-foreground select-none"
                >
                    {n}
                </div>
            ))}
        </div>
    )
}

// ─── Subcomponente: Celda de día ───────────────────────────────────────────────
// Usamos <div> con role="button" en lugar de <button> para poder
// anidar el botón "!" de revelar sin violar las reglas de HTML.

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

    const ariaLabel = [
        `Día ${dayNumber}`,
        holidayLabel ? `Festivo: ${holidayLabel}` : null,
        count > 0 ? `${count} incidencia${count !== 1 ? "s" : ""}` : "Sin incidencias",
        hasAus && revealed
            ? `Ausentismo: ${ausPct!.toFixed(1)}%`
            : hasAus
                ? "Ausentismo oculto, presiona ! para revelar"
                : null,
    ]
        .filter(Boolean)
        .join(", ")

    return (
        // div con role="button" — permite anidar <button> dentro sin error de hidratación
        <div
            role="button"
            tabIndex={0}
            aria-label={ariaLabel}
            aria-pressed={active}
            aria-selected={active}
            onClick={() => onSelectDay(day)}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    onSelectDay(day)
                }
            }}
            className={cn(
                "relative flex flex-col rounded-lg border p-1.5 sm:p-2 text-left text-xs cursor-pointer",
                "min-h-[56px] sm:min-h-[80px]",
                "transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active
                    ? "border-foreground bg-foreground text-background shadow-md"
                    : [
                        "border-border bg-background text-foreground",
                        "hover:border-foreground/30 hover:bg-muted/30",
                        revealed ? getCellHeatClasses(ausPct, threshold, active) : "",
                    ],
            )}
        >
            {/* Número del día */}
            <span className={cn(
                "font-bold text-xs sm:text-sm leading-none",
                active ? "text-background" : "text-foreground",
            )}>
                {dayNumber}
            </span>

            {/* Badge de festivo */}
            {holidayLabel && (
                <>
                    <span
                        title={holidayLabel}
                        className={cn(
                            "mt-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold leading-tight truncate max-w-full",
                            "hidden sm:inline-flex items-center",
                            active
                                ? "bg-white/20 text-white"
                                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
                        )}
                    >
                        {holidayLabel}
                    </span>
                    <span aria-hidden="true" className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500 sm:hidden" />
                </>
            )}

            {/* Fila inferior: ausentismo + incidencias */}
            <div className="mt-auto flex items-center justify-between gap-1 w-full">

                {/* Ausentismo: "!" si oculto, badge con % si revelado */}
                {hasAus && (
                    revealed ? (
                        <span
                            className={cn(
                                "inline-flex items-center justify-center rounded-full",
                                "text-[10px] sm:text-xs font-semibold px-1.5 py-0.5 leading-none",
                                "animate-in fade-in zoom-in-75 duration-300",
                                getAusentismoBadgeClasses(ausPct!, threshold, active),
                            )}
                        >
                            <span className="hidden sm:inline">Aus&nbsp;</span>
                            {ausPct!.toFixed(1)}%
                        </span>
                    ) : (
                        // <button> válido aquí porque el padre es <div>, no <button>
                        <button
                            type="button"
                            aria-label={`Revelar ausentismo del día ${dayNumber}`}
                            onClick={(e) => {
                                e.stopPropagation()
                                setRevealed(true)
                            }}
                            className={cn(
                                "inline-flex items-center justify-center",
                                "h-5 w-5 rounded-full text-[11px] font-black leading-none",
                                "transition-all duration-150 select-none",
                                "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                active
                                    ? "bg-white/20 text-white hover:bg-white/35"
                                    : "bg-muted text-muted-foreground hover:bg-amber-100 hover:text-amber-700 dark:hover:bg-amber-900/30 dark:hover:text-amber-300",
                            )}
                        >
                            !
                        </button>
                    )
                )}

                {/* Badge de incidencias */}
                {count > 0 ? (
                    <span className={cn(
                        "inline-flex items-center justify-center rounded-full",
                        "text-xs font-semibold px-2 py-0.5 leading-none",
                        active
                            ? "bg-white/20 text-white"
                            : "bg-destructive/15 text-destructive",
                    )}>
                        {count}
                    </span>
                ) : (
                    <span aria-hidden="true" className="text-[10px] text-muted-foreground/30">—</span>
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
        <div role="grid" aria-label="Calendario de reporte de asistencia">
            <WeekDayHeaders />

            <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                {calendarCells.map((day, idx) => {
                    if (!day) {
                        return <div key={`empty-${idx}`} role="gridcell" aria-hidden="true" />
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
