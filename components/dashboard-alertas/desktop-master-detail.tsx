"use client"

import { useMemo, useState } from "react"
import {
    dias,
    formatDate,
    type EvalItem,
} from "@/lib/hooks/useDashboardAlertas"
import { CalificacionModal, MasterHeader } from "./shared"

// ─── Hook filtrado ────────────────────────────────────────────────────────────

function useMasterState<T extends { id: string; departamento?: string | null; nombre: string }>(
    items: T[],
    extraFilter: (item: T, q: string) => boolean,
) {
    const [search, setSearch] = useState("")
    const [depto, setDepto] = useState("")

    const deptos = useMemo(
        () => Array.from(new Set(items.map(i => i.departamento?.trim() || "Sin departamento"))).sort(),
        [items],
    )

    const filtrados = useMemo(() => {
        const q = search.trim().toLowerCase()
        return items.filter(i => {
            const dep = i.departamento?.trim() || "Sin departamento"
            if (depto && dep !== depto) return false
            if (!q) return true
            return i.nombre.toLowerCase().includes(q) || dep.toLowerCase().includes(q) || extraFilter(i, q)
        })
    }, [items, search, depto, extraFilter])

    return { search, setSearch, depto, setDepto, deptos, filtrados }
}

// ─── MasterDetailEvals ────────────────────────────────────────────────────────

interface MasterDetailEvalsProps {
    items: EvalItem[]
    vencida: boolean
    evalNum: 1 | 2 | 3
    onCalificar: (dbId: string, calificacion: number) => Promise<void>
}

export function MasterDetailEvals({ items, vencida, evalNum, onCalificar }: MasterDetailEvalsProps) {
    const toneText = vencida ? "text-destructive" : "text-warning"
    const accentBg = vencida ? "bg-destructive" : "bg-warning"

    const [selected, setSelected] = useState<EvalItem | null>(null)

    const { search, setSearch, depto, setDepto, deptos, filtrados } =
        useMasterState(items, (i, q) => (i.turno ?? "").toLowerCase().includes(q))

    function avanzar() {
        if (!selected) return
        const idx = filtrados.findIndex(i => i.id === selected.id)
        const next = filtrados[idx + 1] ?? filtrados[idx - 1] ?? null
        setSelected(next)
    }

    function openCalificacion(item: EvalItem) {
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
        window.setTimeout(() => setSelected(item), 0)
    }

    return (
        <>
            <div className="flex flex-1 flex-col overflow-hidden rounded-b-xl border-t min-h-0">
                <MasterHeader
                    total={items.length}
                    filtrados={filtrados.length}
                    search={search}
                    onSearchChange={setSearch}
                    depto={depto}
                    onDeptoChange={setDepto}
                    deptos={deptos}
                />

                <div className="scrollbar-thin flex-1 divide-y overflow-y-auto min-h-0">
                    {filtrados.length === 0 ? (
                        <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                            Sin resultados con los filtros actuales.
                        </p>
                    ) : filtrados.map(item => (
                        <button
                            key={item.id}
                            onClick={() => openCalificacion(item)}
                            className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/30"
                        >
                            {/* Acento de color */}
                            <span className={`h-8 w-1 shrink-0 rounded-full ${accentBg} opacity-75`} />

                            {/* Nombre + meta */}
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-foreground">{item.nombre}</p>
                                <p className="truncate text-xs text-muted-foreground">
                                    {[item.departamento, item.turno ? `Turno ${item.turno}` : null]
                                        .filter(Boolean).join(" · ") || "Sin departamento"}
                                </p>
                            </div>

                            {/* Días + fecha */}
                            <div className="shrink-0 text-right">
                                <p className={`text-xs font-semibold ${toneText}`}>{dias(item.diasDiff)}</p>
                                <p className="text-[11px] text-muted-foreground">{formatDate(item.fecha)}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            <CalificacionModal
                open={!!selected}
                item={selected}
                evalNum={evalNum}
                toneText={toneText}
                onCalificar={onCalificar}
                onAfterSave={avanzar}
                onClose={() => setSelected(null)}
            />
        </>
    )
}