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
            exceso_comida: 0,
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
        h === "numero_empleado" || h === "numero_em" || h === "no_empleado" || h === "numero",
    )
    const colNombre = headers.findIndex((h) => h === "nombre" || h === "nombre_empleado")
    const colFecha = headers.findIndex((h) => h === "fecha" || h === "date" || h === "dia")
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

        const getTime = (cols: number[], idx: number): string | null => {
            if (idx >= cols.length) return null
            return normalizeTime(row.getCell(cols[idx]).value)
        }

        const obs = colObs >= 0 ? normalizeString(row.getCell(colObs).value) : ""

        rows.push({
            numero_empleado: numero,
            nombre,
            fecha,
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
            entrada5: getTime(entradaCols, 4),
            salida5: getTime(salidaCols, 4),
            observaciones: obs,
        })
    })

    return { rows, errors }
}
