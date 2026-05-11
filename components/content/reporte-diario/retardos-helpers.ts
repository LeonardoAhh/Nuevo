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

/** diffMinutes that handles midnight crossover (e.g., 21:45→02:01 = 256 min) */
function diffMinutesOvernight(from: string, to: string): number {
    let diff = timeToMinutes(to) - timeToMinutes(from)
    if (diff < 0) diff += 1440
    return diff
}

// ─── Analyze a single row ────────────────────────────────────────────────────

export function analyzeRow(
    row: PunchRow,
    schedules: ScheduleDefinition[],
): PunchAnalysis {
    const base: Pick<PunchAnalysis,
        "numero_empleado" | "nombre" | "fecha" | "turno" | "incidencia" | "observaciones" |
        "entrada1" | "salida1" | "entrada2" | "salida2"
    > = {
        numero_empleado: row.numero_empleado,
        nombre: row.nombre,
        fecha: row.fecha,
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
            exceso_comida: 0,
            minutos_retardo: 0,
            minutos_extra: 0,
            marcajes_faltantes: [],
        }
    }

    // Find matching schedule by turno number (+ day of week for multi-schedule turnos)
    const dayOfWeek = new Date(row.fecha + "T12:00:00").getDay() // 0=Sun..6=Sat
    const candidates = schedules.filter((s) => s.turnoNumber === row.turno)
    const schedule = candidates.length > 1
        ? candidates.find((s) => s.workDays.includes(dayOfWeek)) ?? candidates[0]
        : candidates[0]
    if (!schedule) {
        return {
            ...base,
            hora_entrada_esperada: "--:--",
            hora_salida_esperada: "--:--",
            status: "no_schedule",
            minutos_trabajados: 0,
            minutos_comida: 0,
            exceso_comida: 0,
            minutos_retardo: 0,
            minutos_extra: 0,
            marcajes_faltantes: [],
        }
    }

    // Detect night shift (entry > exit means crossing midnight)
    const isNightShift = timeToMinutes(schedule.entryTime) > timeToMinutes(schedule.exitTime)

    // Night shifts: discard previous-day residual punches.
    // Find the first punch near entryTime; everything before it is from the prior shift.
    if (isNightShift) {
        const allPunches = [
            row.entrada1, row.salida1, row.entrada2, row.salida2,
            row.entrada3, row.salida3, row.entrada4, row.salida4,
            row.entrada5, row.salida5,
        ].filter((p): p is string => p != null)

        if (allPunches.length > 1) {
            const entryMin = timeToMinutes(schedule.entryTime)
            const threshold = entryMin - 120
            const startIdx = allPunches.findIndex((p) => timeToMinutes(p) >= threshold)
            if (startIdx > 0) {
                const cleaned = allPunches.slice(startIdx)
                row = {
                    ...row,
                    entrada1: cleaned[0] ?? null,
                    salida1: cleaned[1] ?? null,
                    entrada2: cleaned[2] ?? null,
                    salida2: cleaned[3] ?? null,
                    entrada3: cleaned[4] ?? null,
                    salida3: cleaned[5] ?? null,
                    entrada4: cleaned[6] ?? null,
                    salida4: cleaned[7] ?? null,
                    entrada5: cleaned[8] ?? null,
                    salida5: cleaned[9] ?? null,
                }
                base.entrada1 = row.entrada1
                base.salida1 = row.salida1
                base.entrada2 = row.entrada2
                base.salida2 = row.salida2
            }
        }
    }

    // Check missing punches
    // Night shifts: only entrada1 is required on the entry day;
    // comedor/salida punches may appear in the next day's report
    const faltantes: string[] = []
    if (!row.entrada1) faltantes.push("Entrada")
    if (!isNightShift) {
        if (!row.salida1) faltantes.push("Sal. comedor")
        if (!row.entrada2) faltantes.push("Ent. comedor")
        if (!row.salida2) faltantes.push("Salida")
    }
    const diff = isNightShift ? diffMinutesOvernight : diffMinutes

    // Compute work time
    let minutosTrabajados = 0
    if (isNightShift && row.entrada1) {
        // Night shift: compute from entrada1 to last available punch
        const lastPunch = row.salida2 || row.entrada2 || row.salida1
        if (lastPunch) {
            minutosTrabajados = diff(row.entrada1, lastPunch)
        }
    } else {
        // Day shift: (entrada1→salida1) + (entrada2→salida2)
        if (row.entrada1 && row.salida1) {
            minutosTrabajados += diff(row.entrada1, row.salida1)
        }
        if (row.entrada2 && row.salida2) {
            minutosTrabajados += diff(row.entrada2, row.salida2)
        }
        // If only entrada1 and salida2 exist (no lunch punches), count full span
        if (row.entrada1 && row.salida2 && !row.salida1 && !row.entrada2) {
            minutosTrabajados = diff(row.entrada1, row.salida2)
        }
    }

    // Compute lunch time: salida1→entrada2
    let minutosComida = 0
    if (row.salida1 && row.entrada2) {
        minutosComida = diff(row.salida1, row.entrada2)
    }

    // Exceso de comida
    let excesoComida = 0
    if (minutosComida > 0 && schedule) {
        const limiteComida = schedule.lunchMinutes + schedule.lunchToleranceMinutes
        if (minutosComida > limiteComida) {
            excesoComida = minutosComida - schedule.lunchMinutes
        }
    }

    // Compute tardiness: entrada1 vs schedule entry
    let minutosRetardo = 0
    if (row.entrada1) {
        const tardDiff = isNightShift
            ? diffMinutesOvernight(schedule.entryTime, row.entrada1)
            : diffMinutes(schedule.entryTime, row.entrada1)
        // For night shifts, if diff > 720 (12h) the person arrived early, not late
        const effectiveTard = isNightShift && tardDiff > 720 ? tardDiff - 1440 : tardDiff
        if (effectiveTard > schedule.toleranceMinutes) {
            minutosRetardo = effectiveTard
        }
    }

    // Compute extra time: salida2 vs schedule exit
    let minutosExtra = 0
    if (row.salida2) {
        const extraDiff = isNightShift
            ? diffMinutesOvernight(schedule.exitTime, row.salida2)
            : diffMinutes(schedule.exitTime, row.salida2)
        // For night shifts, if diff > 720 the person left early, not extra
        const effectiveExtra = isNightShift && extraDiff > 720 ? extraDiff - 1440 : extraDiff
        if (effectiveExtra > 10) {
            minutosExtra = effectiveExtra
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
        exceso_comida: excesoComida,
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

// ─── Excel export ────────────────────────────────────────────────────────────

export async function exportRetardosExcel(analyses: PunchAnalysis[]): Promise<void> {
    const ExcelJS = await import("exceljs")
    const wb = new ExcelJS.Workbook()
    const sheet = wb.addWorksheet("Retardos")

    sheet.columns = [
        { header: "No. Empleado", key: "numero_empleado", width: 14 },
        { header: "Nombre", key: "nombre", width: 30 },
        { header: "Fecha", key: "fecha", width: 12 },
        { header: "Turno", key: "turno", width: 8 },
        { header: "Incidencia", key: "incidencia", width: 12 },
        { header: "Estado", key: "status", width: 16 },
        { header: "Entrada", key: "entrada1", width: 10 },
        { header: "Sal. Comedor", key: "salida1", width: 12 },
        { header: "Ent. Comedor", key: "entrada2", width: 12 },
        { header: "Salida", key: "salida2", width: 10 },
        { header: "Hrs. Trabajadas", key: "hrs_trabajadas", width: 14 },
        { header: "Comida (min)", key: "minutos_comida", width: 12 },
        { header: "Exc. Comida (min)", key: "exceso_comida", width: 16 },
        { header: "Retardo (min)", key: "minutos_retardo", width: 14 },
        { header: "T. Extra", key: "tiempo_extra", width: 10 },
        { header: "Observaciones", key: "observaciones", width: 20 },
    ]

    const headerRow = sheet.getRow(1)
    headerRow.font = { bold: true }
    headerRow.alignment = { horizontal: "center" }

    const statusLabels: Record<string, string> = {
        on_time: "Puntual",
        late: "Retardo",
        missing_punch: "Marcaje faltante",
        no_schedule: "Sin horario",
        day_off: "Descanso",
        incidence: "Incidencia",
    }

    for (const a of analyses) {
        sheet.addRow({
            numero_empleado: a.numero_empleado,
            nombre: a.nombre,
            fecha: a.fecha,
            turno: a.turno,
            incidencia: a.incidencia,
            status: statusLabels[a.status] || a.status,
            entrada1: a.entrada1 || "",
            salida1: a.salida1 || "",
            entrada2: a.entrada2 || "",
            salida2: a.salida2 || "",
            hrs_trabajadas: minutesToHHMM(a.minutos_trabajados),
            minutos_comida: a.minutos_comida > 0 ? a.minutos_comida : "",
            exceso_comida: a.exceso_comida > 0 ? a.exceso_comida : "",
            minutos_retardo: a.minutos_retardo > 0 ? a.minutos_retardo : "",
            tiempo_extra: a.minutos_extra > 0 ? minutesToHHMM(a.minutos_extra) : "",
            observaciones: a.observaciones,
        })
    }

    const buffer = await wb.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `retardos_${new Date().toISOString().slice(0, 10)}.xlsx`
    link.click()
    URL.revokeObjectURL(url)
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
        if (!trimmed || trimmed === "-") return null
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

function normalizeDate(value: unknown): string {
    if (value == null || value === "") return ""
    if (value instanceof Date) {
        return value.toISOString().slice(0, 10)
    }
    if (typeof value === "string") {
        const trimmed = value.trim()
        if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10)
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
            const [d, m, y] = trimmed.split("/")
            return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`
        }
        return trimmed
    }
    if (typeof value === "number") {
        const epoch = new Date((value - 25569) * 86400 * 1000)
        return epoch.toISOString().slice(0, 10)
    }
    return ""
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
        h === "numero_empleado" || h === "numero_em" || h === "no_empleado" || h === "numero"
        || h === "núm. emp." || h === "num. emp.",
    )
    const colNombre = headers.findIndex((h) =>
        h === "nombre" || h === "nombre_empleado" || h === "nombre del empleado",
    )
    const colFecha = headers.findIndex((h) => h === "fecha" || h === "date" || h === "dia")
    const colTurno = headers.findIndex((h) => h === "turno" || h === "horario")
    const colIncidencia = headers.findIndex((h) =>
        h === "incidencia" || h === "incide" || h === "incidencias" || h === "tipo",
    )

    // Find all punch columns (entrada/salida) in column order
    const punchCols: number[] = []
    headers.forEach((h, i) => {
        if (h === "entrada" || h === "salida") punchCols.push(i)
    })

    const colObs = headers.findIndex((h) =>
        h === "observaciones" || h === "obs" || h === "observacion",
    )

    if (colNumero < 0) { errors.push("Columna 'numero_empleado' no encontrada."); return { rows, errors } }

    // headers[] is stored at 1-based indices (from eachCell colNumber).
    // findIndex returns those same 1-based positions, which getCell expects directly.
    sheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return

        const numero = normalizeString(row.getCell(colNumero).value)
        if (!numero) return

        const nombre = colNombre >= 0 ? normalizeString(row.getCell(colNombre).value) : ""
        const fecha = colFecha >= 0 ? normalizeDate(row.getCell(colFecha).value) : ""
        const turno = colTurno >= 0 ? parseInt(normalizeString(row.getCell(colTurno).value), 10) || 0 : 0
        const incidencia = colIncidencia >= 0 ? normalizeString(row.getCell(colIncidencia).value) : "A"

        // Read all punches in column order, filter invalid, reassign sequentially
        const rawPunches = punchCols.map((col) => normalizeTime(row.getCell(col).value))
        const validPunches = rawPunches.filter((p): p is string => p != null && p !== "00:00")

        const obs = colObs >= 0 ? normalizeString(row.getCell(colObs).value) : ""

        rows.push({
            numero_empleado: numero,
            nombre,
            fecha,
            turno,
            incidencia,
            entrada1: validPunches[0] ?? null,
            salida1: validPunches[1] ?? null,
            entrada2: validPunches[2] ?? null,
            salida2: validPunches[3] ?? null,
            entrada3: validPunches[4] ?? null,
            salida3: validPunches[5] ?? null,
            entrada4: validPunches[6] ?? null,
            salida4: validPunches[7] ?? null,
            entrada5: validPunches[8] ?? null,
            salida5: validPunches[9] ?? null,
            observaciones: obs,
        })
    })

    return { rows, errors }
}
