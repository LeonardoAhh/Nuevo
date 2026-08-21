// Pure helpers used across dashboard-alertas.
import type { EvalItem, FechaItem } from "@/lib/hooks/useDashboardAlertas"

// ─── Interfaces de props con callbacks ────────────────────────────────────────
// Se definen aquí (fuera de "use client") para evitar el warning ts 71007
// del plugin TypeScript de Next.js, que lo emite en entry points de cliente.

export interface ListaEvalsProps {
    items: EvalItem[]
    vencida: boolean
    vacio: string
    evalNum: 1 | 2 | 3
    onCalificar: (dbId: string, calificacion: number) => Promise<void>
}

export interface ListaFechasProps {
    items: FechaItem[]
    vacio: string
    colorAvatar?: string
    colorBadge: string
    colorDias: string
    colorBorde: string
    onEntregado?: (id: string) => Promise<void>
    onIndeterminado?: (id: string) => Promise<void>
}

export interface MobileStackEvalsProps {
    items: EvalItem[]
    vencida: boolean
    evalNum: 1 | 2 | 3
    onCalificar: (dbId: string, calificacion: number) => Promise<void>
}

export interface MobileStackFechasProps {
    items: FechaItem[]
    colorBadge: string
    colorDias: string
    onEntregado?: (id: string) => Promise<void>
    onIndeterminado?: (id: string) => Promise<void>
}

export function agruparPorDepto<T extends { departamento: string | null }>(
    items: T[],
): [string, T[]][] {
    const map = new Map<string, T[]>()
    for (const item of items) {
        const key = item.departamento?.trim() || "Sin departamento"
        if (!map.has(key)) map.set(key, [])
        map.get(key)!.push(item)
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
}

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"] as const

export function periodoEval(fechaIngreso: string | null, evalNum: 1 | 2 | 3): string {
    if (!fechaIngreso) return "Sin registro"
    const base = new Date(fechaIngreso + "T00:00:00")
    if (isNaN(base.getTime())) return "Sin registro"
    const inicio = new Date(base)
    inicio.setMonth(inicio.getMonth() + evalNum - 1)
    const fin = new Date(base)
    fin.setMonth(fin.getMonth() + evalNum)
    const fmt = (d: Date) => `${MESES[d.getMonth()]} ${d.getFullYear()}`
    return `${fmt(inicio)} – ${fmt(fin)}`
}

export function iniciales(nombre: string): string {
    const partes = nombre.trim().split(/\s+/).filter(Boolean)
    if (partes.length === 0) return "?"
    if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
}
