export interface ScheduleDefinition {
    id: string
    name: string
    turnoNumber: number
    entryTime: string       // "HH:mm"
    exitTime: string        // "HH:mm"
    lunchMinutes: number    // expected lunch duration
    workDays: number[]      // 0=Sun..6=Sat
    toleranceMinutes: number
}

export interface PunchRow {
    numero_empleado: string
    nombre: string
    turno: number
    incidencia: string              // "A", "X", "D", "V", etc.
    entrada1: string | null         // entry to shift
    salida1: string | null          // exit to lunch
    entrada2: string | null         // return from lunch
    salida2: string | null          // exit from shift
    entrada3: string | null
    salida3: string | null
    entrada4: string | null
    salida4: string | null
    horas_registradas: string       // "HH:mm" from Excel
    observaciones: string
}

export type PunchStatus =
    | "on_time"
    | "late"
    | "missing_punch"
    | "no_schedule"
    | "day_off"
    | "incidence"

export interface PunchAnalysis {
    numero_empleado: string
    nombre: string
    turno: number
    incidencia: string
    observaciones: string
    // raw punches
    entrada1: string | null
    salida1: string | null
    entrada2: string | null
    salida2: string | null
    // schedule
    hora_entrada_esperada: string
    hora_salida_esperada: string
    // computed
    status: PunchStatus
    minutos_trabajados: number
    minutos_comida: number
    minutos_retardo: number
    minutos_extra: number
    marcajes_faltantes: string[]    // which punches are missing
}

export interface RetardosSummary {
    total_empleados: number
    total_registros: number
    total_retardos: number
    total_faltas_marcaje: number
    total_minutos_extra: number
    total_minutos_trabajados: number
    promedio_comida_minutos: number
    pct_puntualidad: number
}
