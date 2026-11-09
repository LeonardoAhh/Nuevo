"use client"

import { useState } from "react"
import {
    dias,
    formatDate,
    type EvalItem,
} from "@/lib/hooks/useDashboardAlertas"
import { CalificacionModal } from "./shared"

// ─── MasterDetailEvals ────────────────────────────────────────────────────────

interface MasterDetailEvalsProps {
    items: EvalItem[]
    vencida: boolean
    evalNum: 1 | 2 | 3
    onCalificar: (dbId: string, calificacion: number) => Promise<void>
}

export function MasterDetailEvals({ items, vencida, evalNum, onCalificar }: MasterDetailEvalsProps) {
    const toneText = vencida ? "text-destructive" : "text-warning"

    const [selected, setSelected] = useState<EvalItem | null>(null)

    function avanzar() {
        if (!selected) return
        const idx = items.findIndex(i => i.id === selected.id)
        const next = items[idx + 1] ?? items[idx - 1] ?? null
        setSelected(next)
    }

    function openCalificacion(item: EvalItem) {
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
        window.setTimeout(() => setSelected(item), 0)
    }

    return (
        <>
            <div className="flex flex-1 flex-col overflow-hidden rounded-b-xl border-t min-h-0">
                <div className="scrollbar-thin flex-1 divide-y overflow-y-auto min-h-0">
                    {items.length === 0 ? (
                        <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                            Sin resultados.
                        </p>
                    ) : items.map(item => (
                        <button
                            key={item.id}
                            onClick={() => openCalificacion(item)}
                            className="flex min-h-11 w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                        >
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