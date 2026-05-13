import { INCIDENT_TABS, INCIDENCIA_LABELS, NON_INCIDENT_CODES } from "./constants"
import type { IncidentTab, ReporteRow } from "./types"
import { daysInMonth, isIncidence, isIncidentTab } from "./helpers"

// ─────────────────────────────────────────────────────────────────────────────
// Tipos públicos
// ─────────────────────────────────────────────────────────────────────────────

export interface IncidenciaEvento {
    fecha: string // YYYY-MM-DD
    mes: string // YYYY-MM
    day: string // DD
    code: string
    numero_empleado: string
    nombre: string
    departamento: string
    area: string
    turno: string
    puesto: string
}

export interface EmployeeRanking {
    numero_empleado: string
    nombre: string
    departamento: string
    area: string
    turno: string
    puesto: string
    total: number
    porTipo: Record<IncidentTab, number>
    fechas: string[]
}

export interface GroupRanking {
    label: string
    total: number
    porTipo: Record<IncidentTab, number>
}

export interface PeriodoStats {
    eventos: IncidenciaEvento[]
    totalEventos: number
    totalEmpleadosConIncidencia: number
    totalAusencias: number // F + I + P (cuenta solo ausentismo "real")
    diasUnicos: number
    porTipo: Record<IncidentTab, number>
    porFecha: Record<string, number>
}

// ─────────────────────────────────────────────────────────────────────────────
// Date utils
// ─────────────────────────────────────────────────────────────────────────────

export function toISODate(mes: string, day: string): string {
    return `${mes}-${day}`
}

export function isoToday(): string {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

export function shiftIsoDays(iso: string, deltaDays: number): string {
    const [y, m, d] = iso.split("-").map(Number)
    const date = new Date(y, m - 1, d)
    date.setDate(date.getDate() + deltaDays)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

export function compareIso(a: string, b: string): number {
    return a.localeCompare(b)
}

export function formatIsoLargo(iso: string): string {
    const [y, m, d] = iso.split("-").map(Number)
    const date = new Date(y, m - 1, d)
    const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
    const meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]
    return `${dias[date.getDay()]} ${d} de ${meses[m - 1]} de ${y}`
}

export function formatIsoCorto(iso: string): string {
    const [, m, d] = iso.split("-")
    return `${d}/${m}`
}

// ─────────────────────────────────────────────────────────────────────────────
// Conversión de filas → eventos
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Aplana las filas mensuales en eventos de incidencia individuales (uno por
 * empleado/día con código distinto de asistencia normal). Solo conserva los
 * códigos clasificados como incidencia (`isIncidence`).
 */
export function rowsToEventos(rows: ReporteRow[]): IncidenciaEvento[] {
    const eventos: IncidenciaEvento[] = []
    for (const row of rows) {
        const total = daysInMonth(row.mes)
        for (let i = 1; i <= total; i++) {
            const day = String(i).padStart(2, "0")
            const code = row.days[day]
            if (!isIncidence(code)) continue
            eventos.push({
                fecha: toISODate(row.mes, day),
                mes: row.mes,
                day,
                code: code!,
                numero_empleado: row.numero_empleado,
                nombre: row.nombre,
                departamento: row.departamento,
                area: row.area,
                turno: row.turno || "-",
                puesto: row.puesto || "",
            })
        }
    }
    return eventos
}

// ─────────────────────────────────────────────────────────────────────────────
// Filtros y rankings
// ─────────────────────────────────────────────────────────────────────────────

function emptyPorTipo(): Record<IncidentTab, number> {
    return INCIDENT_TABS.reduce(
        (acc, c) => ({ ...acc, [c]: 0 }),
        {} as Record<IncidentTab, number>,
    )
}

export interface FiltroPeriodo {
    desde: string // YYYY-MM-DD inclusive
    hasta: string // YYYY-MM-DD inclusive
    departamento?: string
    area?: string
    turno?: string
    tipo?: IncidentTab | "TODOS"
    busqueda?: string
}

export function aplicarFiltro(
    eventos: IncidenciaEvento[],
    filtro: FiltroPeriodo,
): IncidenciaEvento[] {
    const q = (filtro.busqueda || "").trim().toLowerCase()
    return eventos.filter((e) => {
        if (e.fecha < filtro.desde || e.fecha > filtro.hasta) return false
        if (filtro.departamento && e.departamento !== filtro.departamento) return false
        if (filtro.area && e.area !== filtro.area) return false
        if (filtro.turno && e.turno !== filtro.turno) return false
        if (filtro.tipo && filtro.tipo !== "TODOS" && e.code !== filtro.tipo) return false
        if (q) {
            const target = `${e.nombre} ${e.numero_empleado} ${e.departamento} ${e.area}`.toLowerCase()
            if (!target.includes(q)) return false
        }
        return true
    })
}

export function computeStats(eventos: IncidenciaEvento[]): PeriodoStats {
    const porTipo = emptyPorTipo()
    const porFecha: Record<string, number> = {}
    const empleados = new Set<string>()
    let ausencias = 0

    for (const e of eventos) {
        if (isIncidentTab(e.code)) {
            porTipo[e.code]++
        }
        porFecha[e.fecha] = (porFecha[e.fecha] || 0) + 1
        empleados.add(e.numero_empleado)
        if (e.code === "F" || e.code === "I" || e.code === "P") ausencias++
    }

    return {
        eventos,
        totalEventos: eventos.length,
        totalEmpleadosConIncidencia: empleados.size,
        totalAusencias: ausencias,
        diasUnicos: Object.keys(porFecha).length,
        porTipo,
        porFecha,
    }
}

export function rankEmpleados(eventos: IncidenciaEvento[]): EmployeeRanking[] {
    const map = new Map<string, EmployeeRanking>()
    for (const e of eventos) {
        const key = e.numero_empleado
        const ranking = map.get(key) ?? {
            numero_empleado: e.numero_empleado,
            nombre: e.nombre,
            departamento: e.departamento,
            area: e.area,
            turno: e.turno,
            puesto: e.puesto,
            total: 0,
            porTipo: emptyPorTipo(),
            fechas: [],
        }
        ranking.total++
        if (isIncidentTab(e.code)) ranking.porTipo[e.code]++
        ranking.fechas.push(e.fecha)
        map.set(key, ranking)
    }
    return Array.from(map.values()).sort((a, b) => {
        if (b.total !== a.total) return b.total - a.total
        return a.nombre.localeCompare(b.nombre)
    })
}

export function rankGroup(
    eventos: IncidenciaEvento[],
    field: "area" | "departamento" | "turno",
): GroupRanking[] {
    const map = new Map<string, GroupRanking>()
    for (const e of eventos) {
        const label = e[field] || "—"
        const r = map.get(label) ?? { label, total: 0, porTipo: emptyPorTipo() }
        r.total++
        if (isIncidentTab(e.code)) r.porTipo[e.code]++
        map.set(label, r)
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total)
}

// ─────────────────────────────────────────────────────────────────────────────
// Etiquetas y colores
// ─────────────────────────────────────────────────────────────────────────────

export const INCIDENT_TAB_COLORS: Record<IncidentTab, string> = {
    F: "hsl(var(--destructive))",
    FJ: "hsl(var(--info))",
    S: "hsl(var(--warning))",
    P: "hsl(220 70% 55%)",
    CT: "hsl(280 60% 55%)",
    I: "hsl(340 75% 55%)",
    V: "hsl(160 60% 45%)",
    TXT: "hsl(35 80% 50%)",
    PH: "hsl(200 70% 50%)",
}

export function tipoLabel(code: string): string {
    return INCIDENCIA_LABELS[code] ?? code
}

export function isAusentismoCode(code: string): boolean {
    return code === "F" || code === "I" || code === "P"
}

export { INCIDENT_TABS, NON_INCIDENT_CODES }
