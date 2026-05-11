import type {
    ScheduleDefinition,
    PunchRow,
    PunchAnalysis,
    PunchStatus,
    RetardosSummary,
} from "./retardos-types"
import { SKIP_ANALYSIS_CODES } from "./retardos-constants"

// ─── Time utils ──────────────────────────────────────────────────────────────

function timeToMinutes(time: string): number {
    const [h, m] = time.split(":").map(Number)
    return h * 60 + m
}

export function minutesToHHMM(mins: number): string {
    const h = Math.floor(Math.abs(mins) / 60)
    const m = Math.abs(mins) % 60
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

function diffMinutes(from: string, to: string): number {
    return timeToMinutes(to) - timeToMinutes(from)
}

// ─── Analyze a single row ────────────────────────────────────────────────────

export function analyzeRow(
    row: PunchRow,
    schedules: ScheduleDefinition[],
): PunchAnalysis {
    const base: Pick<PunchAnalysis,
        "numero_empleado" | "nombre" | "turno" | "incidencia" | "observaciones" |
        "entrada1" | "salida1" | "entrada2" | "salida2"
    > = {
        numero_empleado: row.numero_empleado,
        nombre: row.nombre,
        turno: row.turno,
        incidencia: row.incidencia,
        observaciones: row.observaciones,
        entrada1: row.entrada1,
        salida1: row.salida1,
        entrada2: row.entrada2,
        salida2: row.salida2,
    }

    // Skip if non-work incidence
    if (SKIP_ANALYSIS_CODES.has(row.incidencia)) {
        return {
            ...base,
            hora_entrada_esperada: "--:--",
            hora_salida_esperada: "--:--",
            status: row.incidencia === "D" || row.incidencia === "DF" ? "day_off" : "incidence",
            minutos_trabajados: 0,
            minutos_comida: 0,
            minutos_retardo: 0,
            minutos_extra: 0,
            marcajes_faltantes: [],
        }
    }

    // Find matching schedule by turno number
    const schedule = schedules.find((s) => s.turnoNumber === row.turno)
    if (!schedule) {
        return {
            ...base,
            hora_entrada_esperada: "--:--",
            hora_salida_esperada: "--:--",
            status: "no_schedule",
            minutos_trabajados: 0,
            minutos_comida: 0,
            minutos_retardo: 0,
            minutos_extra: 0,
            marcajes_faltantes: [],
        }
    }

    // Check missing punches
    const faltantes: string[] = []
    if (!row.entrada1) faltantes.push("Entrada")
    if (!row.salida1) faltantes.push("Sal. comedor")
    if (!row.entrada2) faltantes.push("Ent. comedor")
    if (!row.salida2) faltantes.push("Salida")

    // Compute work time: (entrada1→salida1) + (entrada2→salida2)
    let minutosTrabajados = 0
    if (row.entrada1 && row.salida1) {
        minutosTrabajados += diffMinutes(row.entrada1, row.salida1)
    }
    if (row.entrada2 && row.salida2) {
        minutosTrabajados += diffMinutes(row.entrada2, row.salida2)
    }
    // If only entrada1 and salida2 exist (no lunch punches), count full span
    if (row.entrada1 && row.salida2 && !row.salida1 && !row.entrada2) {
        minutosTrabajados = diffMinutes(row.entrada1, row.salida2)
    }

    // Compute lunch time: salida1→entrada2
    let minutosComida = 0
    if (row.salida1 && row.entrada2) {
        minutosComida = diffMinutes(row.salida1, row.entrada2)
    }

    // Compute tardiness: entrada1 vs schedule entry
    let minutosRetardo = 0
    if (row.entrada1) {
        const diff = diffMinutes(schedule.entryTime, row.entrada1)
        if (diff > schedule.toleranceMinutes) {
            minutosRetardo = diff
        }
    }

    // Compute extra time: salida2 vs schedule exit
    let minutosExtra = 0
    if (row.salida2) {
        const diff = diffMinutes(schedule.exitTime, row.salida2)
        if (diff > 10) {
            minutosExtra = diff
        }
    }

    // Determine status
    let status: PunchStatus = "on_time"
    if (faltantes.length > 0) {
        status = "missing_punch"
    } else if (minutosRetardo > 0) {
        status = "late"
    }

    return {
        ...base,
        hora_entrada_esperada: schedule.entryTime,
        hora_salida_esperada: schedule.exitTime,
        status,
        minutos_trabajados: Math.max(minutosTrabajados, 0),
        minutos_comida: Math.max(minutosComida, 0),
        minutos_retardo: minutosRetardo,
        minutos_extra: minutosExtra,
        marcajes_faltantes: faltantes,
    }
}

// ─── Analyze all rows ────────────────────────────────────────────────────────

export function analyzeAllRows(
    rows: PunchRow[],
    schedules: ScheduleDefinition[],
): PunchAnalysis[] {
    return rows.map((r) => analyzeRow(r, schedules))
}

// ─── Summary ─────────────────────────────────────────────────────────────────

export function computeRetardosSummary(analyses: PunchAnalysis[]): RetardosSummary {
    const working = analyses.filter(
        (a) => a.status !== "day_off" && a.status !== "incidence",
    )
    const empleados = new Set(working.map((a) => a.numero_empleado))
    const retardos = working.filter((a) => a.status === "late").length
    const faltasMarcaje = working.filter((a) => a.status === "missing_punch").length
    const minutosExtra = working.reduce((sum, a) => sum + a.minutos_extra, 0)
    const minutosTrabajados = working.reduce((sum, a) => sum + a.minutos_trabajados, 0)

    const withLunch = working.filter((a) => a.minutos_comida > 0)
    const promedioComida = withLunch.length > 0
        ? Math.round(withLunch.reduce((s, a) => s + a.minutos_comida, 0) / withLunch.length)
        : 0

    const onTime = working.filter((a) => a.status === "on_time").length
    const pctPuntualidad = working.length > 0
        ? Math.round((onTime / working.length) * 100 * 100) / 100
        : 0

    return {
        total_empleados: empleados.size,
        total_registros: working.length,
        total_retardos: retardos,
        total_faltas_marcaje: faltasMarcaje,
        total_minutos_extra: minutosExtra,
        total_minutos_trabajados: minutosTrabajados,
        promedio_comida_minutos: promedioComida,
        pct_puntualidad: pctPuntualidad,
    }
}

// ─── Excel parsing ───────────────────────────────────────────────────────────

function normalizeString(value: unknown): string {
    if (value == null) return ""
    if (typeof value === "string") return value.trim()
    if (typeof value === "number") return String(value)
    return ""
}

function normalizeTime(value: unknown): string | null {
    if (value == null || value === "") return null
    if (typeof value === "string") {
        const trimmed = value.trim()
        if (!trimmed) return null
        if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(trimmed)) {
            const parts = trimmed.split(":")
            return `${parts[0].padStart(2, "0")}:${parts[1]}`
        }
        return trimmed
    }
    if (typeof value === "number") {
        const totalMinutes = Math.round(value * 24 * 60)
        const h = Math.floor(totalMinutes / 60) % 24
        const m = totalMinutes % 60
        return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
    }
    if (value instanceof Date) {
        return `${String(value.getHours()).padStart(2, "0")}:${String(value.getMinutes()).padStart(2, "0")}`
    }
    return null
}

export interface ParsePunchResult {
    rows: PunchRow[]
    errors: string[]
}

export async function parseExcelPunches(file: File): Promise<ParsePunchResult> {
    const ExcelJS = await import("exceljs")
    const workbook = new ExcelJS.Workbook()
    const buffer = await file.arrayBuffer()
    await workbook.xlsx.load(buffer)

    const rows: PunchRow[] = []
    const errors: string[] = []

    const sheet = workbook.worksheets[0]
    if (!sheet) {
        errors.push("No se encontró ninguna hoja en el archivo.")
        return { rows, errors }
    }

    // Read headers from row 1
    const headerRow = sheet.getRow(1)
    const headers: string[] = []
    headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        headers[colNumber] = normalizeString(cell.value).toLowerCase()
    })

    // Find column indices
    const colNumero = headers.findIndex((h) =>
        h === "numero_empleado" || h === "numero_em" || h === "no_empleado" || h === "numero",
    )
    const colNombre = headers.findIndex((h) => h === "nombre" || h === "nombre_empleado")
    const colTurno = headers.findIndex((h) => h === "turno")
    const colIncidencia = headers.findIndex((h) =>
        h === "incidencia" || h === "incide" || h === "incidencias",
    )

    // Find entrada/salida pairs by looking for repeated headers
    const entradaCols: number[] = []
    const salidaCols: number[] = []
    headers.forEach((h, i) => {
        if (h === "entrada") entradaCols.push(i)
        if (h === "salida") salidaCols.push(i)
    })

    const colHoras = headers.findIndex((h) => h === "horas" || h === "horas_registradas")
    const colObs = headers.findIndex((h) =>
        h === "observaciones" || h === "obs" || h === "observacion",
    )

    if (colNumero < 0) { errors.push("Columna 'numero_empleado' no encontrada."); return { rows, errors } }

    sheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return

        const numero = normalizeString(row.getCell(colNumero + 1).value)
        if (!numero) return

        const nombre = colNombre >= 0 ? normalizeString(row.getCell(colNombre + 1).value) : ""
        const turno = colTurno >= 0 ? parseInt(normalizeString(row.getCell(colTurno + 1).value), 10) || 0 : 0
        const incidencia = colIncidencia >= 0 ? normalizeString(row.getCell(colIncidencia + 1).value) : "A"

        const getTime = (cols: number[], idx: number): string | null => {
            if (idx >= cols.length) return null
            return normalizeTime(row.getCell(cols[idx] + 1).value)
        }

        const horas = colHoras >= 0 ? normalizeString(row.getCell(colHoras + 1).value) : "00:00"
        const obs = colObs >= 0 ? normalizeString(row.getCell(colObs + 1).value) : ""

        rows.push({
            numero_empleado: numero,
            nombre,
            turno,
            incidencia,
            entrada1: getTime(entradaCols, 0),
            salida1: getTime(salidaCols, 0),
            entrada2: getTime(entradaCols, 1),
            salida2: getTime(salidaCols, 1),
            entrada3: getTime(entradaCols, 2),
            salida3: getTime(salidaCols, 2),
            entrada4: getTime(entradaCols, 3),
            salida4: getTime(salidaCols, 3),
            horas_registradas: horas,
            observaciones: obs,
        })
    })

    return { rows, errors }
}
