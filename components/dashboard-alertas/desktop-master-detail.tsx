"use client"

import { useMemo, useState } from "react"
import { Loader2, Minus, Plus, Save, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import {
    dias,
    formatDate,
    type EvalItem,
} from "@/lib/hooks/useDashboardAlertas"
import { periodoEval } from "./utils"
import { MasterHeader } from "./shared"

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
                            onClick={() => setSelected(item)}
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

            {/* Dialog de calificación */}
            <Dialog open={!!selected} onOpenChange={open => { if (!open) setSelected(null) }}>
                <DialogContent className="max-w-sm gap-0 p-0 overflow-hidden">
                    <VisuallyHidden><DialogTitle>{selected?.nombre ?? "Calificar"}</DialogTitle></VisuallyHidden>
                    {selected && (
                        <CalificarDialog
                            item={selected}
                            evalNum={evalNum}
                            toneText={toneText}
                            onCalificar={onCalificar}
                            onAfterSave={() => avanzar()}
                            onClose={() => setSelected(null)}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </>
    )
}

// ─── Dialog de calificación ───────────────────────────────────────────────────

interface CalificarDialogProps {
    item: EvalItem
    evalNum: 1 | 2 | 3
    toneText: string
    onCalificar: (dbId: string, cal: number) => Promise<void>
    onAfterSave: () => void
    onClose: () => void
}

function CalificarDialog({ item, evalNum, toneText, onCalificar, onAfterSave, onClose }: CalificarDialogProps) {
    const [cal, setCal] = useState(0)
    const [saving, setSaving] = useState(false)
    const periodo = periodoEval(item.fechaIngreso, evalNum)

    function adjust(delta: number) {
        setCal(v => Math.min(100, Math.max(0, v + delta)))
    }

    async function handleGuardar() {
        setSaving(true)
        try {
            await onCalificar(item.dbId, cal)
            onAfterSave()
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b px-5 py-4">
                <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{item.nombre}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {[item.departamento, item.turno ? `Turno ${item.turno}` : null]
                            .filter(Boolean).join(" · ") || "Sin departamento"}
                    </p>
                </div>
                <button onClick={onClose} className="mt-0.5 shrink-0 text-muted-foreground hover:text-foreground">
                    <X size={16} />
                </button>
            </div>

            {/* Info compacta */}
            <div className="flex items-center justify-between gap-4 px-5 py-3 text-xs text-muted-foreground border-b">
                <span>{periodo}</span>
                <span>Vence: {formatDate(item.fecha)}</span>
                <span className={`font-semibold ${toneText}`}>{dias(item.diasDiff)}</span>
            </div>

            {/* Captura */}
            <div className="flex flex-col items-center gap-4 px-5 py-6">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Calificación</p>

                {/* Stepper */}
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 rounded-full"
                        onClick={() => adjust(-1)}
                        aria-label="Restar"
                    >
                        <Minus size={16} />
                    </Button>

                    <input
                        type="number"
                        min={0}
                        max={100}
                        value={cal}
                        onChange={e => setCal(Math.min(100, Math.max(0, Number(e.target.value))))}
                        onKeyDown={e => { if (e.key === "Enter") handleGuardar() }}
                        className="h-14 w-20 rounded-xl border bg-muted/30 text-center text-2xl font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        aria-label="Calificación"
                    />

                    <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 rounded-full"
                        onClick={() => adjust(1)}
                        aria-label="Sumar"
                    >
                        <Plus size={16} />
                    </Button>
                </div>

                <p className="text-[11px] text-muted-foreground">
                    <kbd className="rounded border bg-background px-1 text-[10px]">Enter</kbd> para guardar
                </p>
            </div>

            {/* Footer */}
            <div className="border-t px-5 py-3">
                <Button
                    className="w-full gap-2"
                    onClick={handleGuardar}
                    disabled={saving}
                >
                    {saving
                        ? <Loader2 size={15} className="animate-spin" />
                        : <Save size={15} />
                    }
                    Guardar calificación
                </Button>
            </div>
        </div>
    )
}