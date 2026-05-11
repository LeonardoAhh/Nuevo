import type { ScheduleDefinition } from "./retardos-types"

export const DEFAULT_SCHEDULES: ScheduleDefinition[] = [
    {
        id: "turno-1",
        name: "1er Turno",
        turnoNumber: 1,
        entryTime: "06:00",
        exitTime: "14:00",
        lunchMinutes: 30,
        workDays: [1, 2, 3, 4, 5],
        toleranceMinutes: 10,
    },
]

/** Incidences where no work is expected — skip retardo analysis */
export const SKIP_ANALYSIS_CODES = new Set(["-", "X", "D", "V", "DF", "I"])

export const PUNCH_STATUS_LABELS: Record<string, string> = {
    on_time: "Puntual",
    late: "Retardo",
    missing_punch: "Marcaje faltante",
    no_schedule: "Sin horario",
    day_off: "Descanso",
    incidence: "Incidencia",
}

export const PUNCH_STATUS_COLORS: Record<string, string> = {
    on_time: "text-emerald-600",
    late: "text-amber-600",
    missing_punch: "text-destructive",
    no_schedule: "text-muted-foreground",
    day_off: "text-muted-foreground",
    incidence: "text-blue-500",
}
