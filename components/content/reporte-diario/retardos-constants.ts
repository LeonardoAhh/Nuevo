import type { ScheduleDefinition } from "./retardos-types"

export const DEFAULT_SCHEDULES: ScheduleDefinition[] = [
    // ── Turno 1 ──────────────────────────────────────────
    {
        id: "turno-1",
        name: "1er Turno",
        turnoNumber: 1,
        entryTime: "06:00",
        exitTime: "14:00",
        lunchMinutes: 30,
        lunchToleranceMinutes: 5,
        workDays: [1, 2, 3, 4, 5, 6], // Lun-Sáb
        toleranceMinutes: 10,
    },
    // ── Turno 26 (1A) ────────────────────────────────────
    {
        id: "turno-26",
        name: "1A",
        turnoNumber: 26,
        entryTime: "07:00",
        exitTime: "15:00",
        lunchMinutes: 30,
        lunchToleranceMinutes: 5,
        workDays: [1, 2, 3, 4, 5, 6], // Lun-Sáb
        toleranceMinutes: 10,
    },
    // ── Turno 2 ──────────────────────────────────────────
    {
        id: "turno-2",
        name: "2do Turno",
        turnoNumber: 2,
        entryTime: "14:00",
        exitTime: "22:00",
        lunchMinutes: 30,
        lunchToleranceMinutes: 5,
        workDays: [0, 3, 4, 5, 6], // Mié-Dom
        toleranceMinutes: 10,
    },
    // ── Turno 13 (2A) L-V 14-22, Sáb 14-18 ─────────────
    {
        id: "turno-13",
        name: "2A (L-V 14-22, S 14-18)",
        turnoNumber: 13,
        entryTime: "14:00",
        exitTime: "22:00",
        lunchMinutes: 30,
        lunchToleranceMinutes: 5,
        workDays: [1, 2, 3, 4, 5, 6], // Lun-Sáb
        toleranceMinutes: 10,
    },
    // ── Turno 23 (2B) L-V 14-22, Sáb 10-14 ─────────────
    {
        id: "turno-23",
        name: "2B (L-V 14-22, S 10-14)",
        turnoNumber: 23,
        entryTime: "14:00",
        exitTime: "22:00",
        lunchMinutes: 30,
        lunchToleranceMinutes: 5,
        workDays: [1, 2, 3, 4, 5, 6], // Lun-Sáb
        toleranceMinutes: 10,
    },
    // ── Turno 7 (2C) L-S 14-22 ──────────────────────────
    {
        id: "turno-7",
        name: "2C",
        turnoNumber: 7,
        entryTime: "14:00",
        exitTime: "22:00",
        lunchMinutes: 30,
        lunchToleranceMinutes: 5,
        workDays: [1, 2, 3, 4, 5, 6], // Lun-Sáb
        toleranceMinutes: 10,
    },
    // ── Turno 6 (2D) L-V 14-22 ──────────────────────────
    {
        id: "turno-6",
        name: "2D",
        turnoNumber: 6,
        entryTime: "14:00",
        exitTime: "22:00",
        lunchMinutes: 30,
        lunchToleranceMinutes: 5,
        workDays: [1, 2, 3, 4, 5], // Lun-Vie
        toleranceMinutes: 10,
    },
    // ── Turno 3 ──────────────────────────────────────────
    {
        id: "turno-3",
        name: "3er Turno",
        turnoNumber: 3,
        entryTime: "22:00",
        exitTime: "06:00",
        lunchMinutes: 30,
        lunchToleranceMinutes: 5,
        workDays: [0, 1, 2, 5, 6], // Vie-Mar
        toleranceMinutes: 10,
    },
    // ── Turno 16 (3A) L-V 22-06 ─────────────────────────
    {
        id: "turno-16",
        name: "3A",
        turnoNumber: 16,
        entryTime: "22:00",
        exitTime: "06:00",
        lunchMinutes: 30,
        lunchToleranceMinutes: 5,
        workDays: [1, 2, 3, 4, 5], // Lun-Vie
        toleranceMinutes: 10,
    },
    // ── Turno 4 — sub-schedules por día ───────────────────
    // Domingo: 1er turno
    {
        id: "turno-4a",
        name: "4to (Do 06-14)",
        turnoNumber: 4,
        entryTime: "06:00",
        exitTime: "14:00",
        lunchMinutes: 30,
        lunchToleranceMinutes: 5,
        workDays: [0], // Dom
        toleranceMinutes: 10,
    },
    // Lunes, Martes: 2do turno
    {
        id: "turno-4b",
        name: "4to (L,Ma 14-22)",
        turnoNumber: 4,
        entryTime: "14:00",
        exitTime: "22:00",
        lunchMinutes: 30,
        lunchToleranceMinutes: 5,
        workDays: [1, 2], // Lun-Mar
        toleranceMinutes: 10,
    },
    // Miércoles, Jueves: 3er turno (nocturno)
    {
        id: "turno-4c",
        name: "4to (Mi,Ju 22-06)",
        turnoNumber: 4,
        entryTime: "22:00",
        exitTime: "06:00",
        lunchMinutes: 30,
        lunchToleranceMinutes: 5,
        workDays: [3, 4], // Mié-Jue
        toleranceMinutes: 10,
    },
    // ── Turno 5a (Mixto L-V) 08-18 ──────────────────────
    {
        id: "turno-5a",
        name: "Mixto (L-V 08-18)",
        turnoNumber: 5,
        entryTime: "08:00",
        exitTime: "18:00",
        lunchMinutes: 60,
        lunchToleranceMinutes: 5,
        workDays: [1, 2, 3, 4, 5], // Lun-Vie
        toleranceMinutes: 10,
    },
    // ── Turno 5b (Mixto S) 08-11 ──────────────────────
    {
        id: "turno-5b",
        name: "Mixto (S 08-11)",
        turnoNumber: 5,
        entryTime: "08:00",
        exitTime: "11:00",
        lunchMinutes: 0,
        lunchToleranceMinutes: 0,
        workDays: [6], // Sáb
        toleranceMinutes: 10,
    },
    // ── Turno 8 (Mixto 1) L-V 08-18 ─────────────────────
    {
        id: "turno-8",
        name: "Mixto 1",
        turnoNumber: 8,
        entryTime: "08:00",
        exitTime: "18:00",
        lunchMinutes: 60,
        lunchToleranceMinutes: 5,
        workDays: [1, 2, 3, 4, 5], // Lun-Vie
        toleranceMinutes: 10,
    },
    // ── Turno 25 (Mixto 2) Mi-Do 08-18 ──────────────────
    {
        id: "turno-25",
        name: "Mixto 2",
        turnoNumber: 25,
        entryTime: "08:00",
        exitTime: "18:00",
        lunchMinutes: 60,
        lunchToleranceMinutes: 5,
        workDays: [0, 3, 4, 5, 6], // Mié-Dom
        toleranceMinutes: 10,
    },
    // ── Turno 27 (Mixto 3) L-V 12-22, S 08-11 ──────────
    {
        id: "turno-27",
        name: "Mixto 3 (L-V 12-22, S 08-11)",
        turnoNumber: 27,
        entryTime: "12:00",
        exitTime: "22:00",
        lunchMinutes: 60,
        lunchToleranceMinutes: 5,
        workDays: [1, 2, 3, 4, 5, 6], // Lun-Sáb
        toleranceMinutes: 10,
    },
    // ── Turno 30 (Ciclados) 14-22 ───────────────────────
    {
        id: "turno-30",
        name: "Ciclados (L-V/L-S)",
        turnoNumber: 30,
        entryTime: "14:00",
        exitTime: "22:00",
        lunchMinutes: 30,
        lunchToleranceMinutes: 5,
        workDays: [1, 2, 3, 4, 5, 6], // Lun-Sáb
        toleranceMinutes: 10,
    },
    // ── Turno 31 (Ciclados) 14-22 ───────────────────────
    {
        id: "turno-31",
        name: "Ciclados (L-S/L-V)",
        turnoNumber: 31,
        entryTime: "14:00",
        exitTime: "22:00",
        lunchMinutes: 30,
        lunchToleranceMinutes: 5,
        workDays: [1, 2, 3, 4, 5, 6], // Lun-Sáb
        toleranceMinutes: 10,
    },
    // ── Turno 32 (2do) Dom-Jue 14-22, Dom 06-14 ────────
    {
        id: "turno-32",
        name: "2do (L-J 14-22, D 06-14)",
        turnoNumber: 32,
        entryTime: "14:00",
        exitTime: "22:00",
        lunchMinutes: 30,
        lunchToleranceMinutes: 5,
        workDays: [0, 1, 2, 3, 4], // Dom-Jue
        toleranceMinutes: 10,
    },
    // ── Turno 33 (Mixto) L 07-20, Ma-V 08-18 ───────────
    {
        id: "turno-33",
        name: "Mixto (L 07-20, Ma-V 08-18)",
        turnoNumber: 33,
        entryTime: "08:00",
        exitTime: "18:00",
        lunchMinutes: 60,
        lunchToleranceMinutes: 5,
        workDays: [1, 2, 3, 4, 5], // Lun-Vie
        toleranceMinutes: 10,
    },
    // ── Turno 34 (1er) Dom-Vie 06-14 ────────────────────
    {
        id: "turno-34",
        name: "1er (Dom-Vie)",
        turnoNumber: 34,
        entryTime: "06:00",
        exitTime: "14:00",
        lunchMinutes: 30,
        lunchToleranceMinutes: 5,
        workDays: [0, 1, 2, 3, 4, 5], // Dom-Vie
        toleranceMinutes: 10,
    },
    // ── Turno 35 (1er) Dom-Vie 06-14 ────────────────────
    {
        id: "turno-35",
        name: "1er (Dom-Vie) B",
        turnoNumber: 35,
        entryTime: "06:00",
        exitTime: "14:00",
        lunchMinutes: 30,
        lunchToleranceMinutes: 5,
        workDays: [0, 1, 2, 3, 4, 5], // Dom-Vie
        toleranceMinutes: 10,
    },
    // ── Turno 36 (2do) Sáb-Mié 14-22 ───────────────────
    {
        id: "turno-36",
        name: "2do (Sáb-Mié)",
        turnoNumber: 36,
        entryTime: "14:00",
        exitTime: "22:00",
        lunchMinutes: 30,
        lunchToleranceMinutes: 5,
        workDays: [0, 1, 2, 3, 6], // Sáb-Mié
        toleranceMinutes: 10,
    },
    // ── Turno 37 (3er) Sáb-Mié 22-06 ───────────────────
    {
        id: "turno-37",
        name: "3er (Sáb-Mié)",
        turnoNumber: 37,
        entryTime: "22:00",
        exitTime: "06:00",
        lunchMinutes: 30,
        lunchToleranceMinutes: 5,
        workDays: [0, 1, 2, 3, 6], // Sáb-Mié
        toleranceMinutes: 10,
    },
    // ── Turno 38 (1er) Dom-Vie 07-15 ────────────────────
    {
        id: "turno-38",
        name: "1er (Dom-Vie 07-15)",
        turnoNumber: 38,
        entryTime: "07:00",
        exitTime: "15:00",
        lunchMinutes: 30,
        lunchToleranceMinutes: 5,
        workDays: [0, 1, 2, 3, 4, 5], // Dom-Vie
        toleranceMinutes: 10,
    },
]

/** Incidences where no work is expected — skip retardo analysis */
export const SKIP_ANALYSIS_CODES = new Set(["-", "X", "D", "V", "DF", "I", "F", "FJ", "S", "B", "CT", "PH"])

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
