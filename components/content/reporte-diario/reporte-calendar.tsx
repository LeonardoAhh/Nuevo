"use client"

import { cn } from "@/lib/utils"

interface ReporteCalendarProps {
    calendarCells: (string | null)[]
    daySummaries: Record<string, number>
    selectedDay: string
    selectedMonthHolidayLabels: Record<string, string>
    currentMonth: string
    onSelectDay: (day: string) => void
}

const WEEK_DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]

export default function ReporteCalendar({
    calendarCells,
    daySummaries,
    selectedDay,
    selectedMonthHolidayLabels,
    currentMonth,
    onSelectDay,
}: ReporteCalendarProps) {
    const monthPart = currentMonth.split("-")[1]

    return (
        <div>
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5 mb-1.5">
                {WEEK_DAY_NAMES.map((n) => (
                    <div key={n} className="py-1.5 text-center text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                        {n}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                {calendarCells.map((day, idx) => {
                    if (!day) return <div key={idx} />
                    const count = daySummaries[day] ?? 0
                    const active = day === selectedDay
                    const holidayLabel = selectedMonthHolidayLabels[`${monthPart}-${day}`]
                    return (
                        <button
                            key={`${idx}-${day}`}
                            type="button"
                            onClick={() => onSelectDay(day)}
                            className={cn(
                                "flex flex-col rounded-lg border p-1.5 sm:p-2 text-left text-xs",
                                "min-h-[56px] sm:min-h-[80px]",
                                "transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                active
                                    ? "border-foreground bg-foreground text-background shadow-md"
                                    : "border-border bg-background text-foreground hover:border-foreground/30 hover:bg-muted/30",
                            )}
                        >
                            <span className={cn(
                                "font-bold text-xs sm:text-sm leading-none",
                                active ? "text-background" : "text-foreground",
                            )}>
                                {parseInt(day, 10)}
                            </span>
                            {holidayLabel ? (
                                <span className="mt-1 hidden sm:inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                                    {holidayLabel}
                                </span>
                            ) : null}
                            {count > 0 ? (
                                <span className={cn(
                                    "mt-auto inline-flex items-center justify-center rounded-full",
                                    "text-[10px] font-semibold px-1.5 py-0.5 self-start leading-none",
                                    active
                                        ? "bg-background/20 text-background"
                                        : "bg-destructive/15 text-destructive",
                                )}>
                                    {count}
                                </span>
                            ) : (
                                <span className="mt-auto text-[10px] text-muted-foreground/30">—</span>
                            )}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
