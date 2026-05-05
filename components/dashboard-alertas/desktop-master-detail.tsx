"use client"

import { useMemo, useState } from "react"
import {
    Briefcase,
    Building2,
    Calendar,
    CheckCircle2,
    Clock,
    Loader2,
    Pencil,
    Save,
    User,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    dias,
    formatDate,
    type EvalItem,
    type FechaItem,
} from "@/lib/hooks/useDashboardAlertas"
import { iniciales, periodoEval } from "./utils"
import {
    DetalleStat,
    MasterEmpty,
    MasterHeader,
    MasterListItem,
} from "./shared"

// ─── Hook compartido: filtrado + selección ────────────────────────────────────

function useMasterState<T extends { id: string; departamento?: string | null; nombre: string }>(
    items: T[],
    extraFilter: (item: T, q: string) => boolean,
) {
    const [search, setSearch] = useState("")
    const [depto, setDepto] = useState("")
    const [selectedId, setSelectedId] = useState<string | null>(items[0]?.id ?? null)

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

    const seleccionado = useMemo(
        () => filtrados.find(i => i.id === selectedId) ?? filtrados[0] ?? null,
        [filtrados, selectedId],
    )

    function avanzar(currentId: string) {
        const idx = filtrados.findIndex(i => i.id === currentId)
        const next = filtrados[idx + 1] ?? filtrados[idx - 1] ?? null
        setSelectedId(next?.id ?? null)
    }

    return { search, setSearch, depto, setDepto, deptos, filtrados, seleccionado, setSelectedId, avanzar }
}

// ─── Layout compartido: aside + section ──────────────────────────────────────

const SIN_RESULTADOS = (
    <p className="px-4 py-6 text-center text-sm text-muted-foreground">
        Sin resultados con los filtros actuales.
    </p>
)

// ─── Master-Detail desktop: Evaluaciones ─────────────────────────────────────

interface MasterDetailEvalsProps {
    items: EvalItem[]
    vencida: boolean
    evalNum: 1 | 2 | 3
    onCalificar: (dbId: string, calificacion: number) => Promise<void>
}

export function MasterDetailEvals({ items, vencida, evalNum, onCalificar }: MasterDetailEvalsProps) {
    const tone: "destructive" | "warning" = vencida ? "destructive" : "warning"
    const badgeLabel = vencida ? "Vencida" : "Por vencer"
    const badgeClass = vencida ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"
    const toneText = vencida ? "text-destructive" : "text-warning"

    const { search, setSearch, depto, setDepto, deptos, filtrados, seleccionado, setSelectedId, avanzar } =
        useMasterState(items, (i, q) => (i.turno ?? "").toLowerCase().includes(q))

    return (
        <div className="grid h-[70vh] grid-cols-[minmax(0,280px)_1fr] overflow-hidden rounded-b-xl border-t">
            <aside className="flex h-full flex-col overflow-hidden border-r">
                <MasterHeader
                    total={items.length}
                    filtrados={filtrados.length}
                    search={search}
                    onSearchChange={setSearch}
                    depto={depto}
                    onDeptoChange={setDepto}
                    deptos={deptos}
                />
                <div className="scrollbar-thin flex-1 overflow-y-auto">
                    {filtrados.length === 0 ? SIN_RESULTADOS : filtrados.map(i => (
                        <MasterListItem
                            key={i.id}
                            nombre={i.nombre}
                            meta={[i.departamento, i.turno ? `Turno ${i.turno}` : null].filter(Boolean).join(" · ") || "Sin departamento"}
                            diasLabel={dias(i.diasDiff)}
                            fechaLabel={formatDate(i.fecha)}
                            selected={seleccionado?.id === i.id}
                            tone={tone}
                            onSelect={() => setSelectedId(i.id)}
                        />
                    ))}
                </div>
            </aside>

            <section className="scrollbar-thin h-full overflow-y-auto p-6">
                {!seleccionado ? (
                    <MasterEmpty mensaje="Selecciona una evaluación para ver el detalle." />
                ) : (
                    <DetalleEval
                        key={seleccionado.id}
                        item={seleccionado}
                        evalNum={evalNum}
                        badgeLabel={badgeLabel}
                        badgeClass={badgeClass}
                        toneText={toneText}
                        onCalificar={onCalificar}
                        onAfterSave={() => avanzar(seleccionado.id)}
                    />
                )}
            </section>
        </div>
    )
}

interface DetalleEvalProps {
    item: EvalItem
    evalNum: 1 | 2 | 3
    badgeLabel: string
    badgeClass: string
    toneText: string
    onCalificar: (dbId: string, calificacion: number) => Promise<void>
    onAfterSave: () => void
}

function DetalleEval({ item, evalNum, badgeLabel, badgeClass, toneText, onCalificar, onAfterSave }: DetalleEvalProps) {
    const [calStr, setCalStr] = useState("")
    const [saving, setSaving] = useState(false)
    const periodo = periodoEval(item.fechaIngreso, evalNum)

    async function handleGuardar() {
        const cal = parseInt(calStr, 10)
        if (isNaN(cal) || cal < 0 || cal > 100) return
        setSaving(true)
        try {
            await onCalificar(item.dbId, cal)
            setCalStr("")
            onAfterSave()
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="flex w-full flex-col gap-6">
            <header className="flex items-start gap-4">
                <div className="min-w-0 flex-1">
                    <h3 className="truncate text-xl font-semibold text-foreground">{item.nombre}</h3>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <Building2 size={14} aria-hidden />
                        <span>{item.departamento ?? "Sin departamento"}</span>
                        {item.turno && (
                            <>
                                <span aria-hidden>·</span>
                                <span>Turno {item.turno}</span>
                            </>
                        )}
                    </div>
                </div>
                <Badge className={`shrink-0 ${badgeClass}`} variant="secondary">{badgeLabel}</Badge>
            </header>

            <dl className="grid grid-cols-2 gap-3">
                <DetalleStat label="No. Empleado" value={item.numero ?? "Sin número"} icon={<User size={14} aria-hidden />} />
                <DetalleStat label="Fecha de Ingreso" value={item.fechaIngreso ? formatDate(item.fechaIngreso) : "Sin registro"} icon={<Calendar size={14} aria-hidden />} />
                <DetalleStat label="Periodo" value={periodo} icon={<Calendar size={14} aria-hidden />} nota={`Vence: ${formatDate(item.fecha)}`} />
                <DetalleStat label="Tiempo" value={dias(item.diasDiff)} icon={<Clock size={14} aria-hidden />} valueClass={toneText} />
            </dl>

            <div className="rounded-2xl border bg-muted/30 p-4">
                <h4 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                    <Pencil size={14} aria-hidden /> Capturar calificación
                </h4>
                <div className="flex flex-wrap items-center gap-2">
                    <Input
                        type="number"
                        min={0}
                        max={100}
                        value={calStr}
                        onChange={(e) => setCalStr(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleGuardar() }}
                        placeholder="Calificación 0 – 100"
                        className="h-10 w-40"
                        aria-label="Calificación"
                    />
                    <Button
                        size="icon"
                        onClick={handleGuardar}
                        disabled={saving || calStr === ""}
                        className="h-10 w-10"
                        aria-label="Guardar"
                        title="Guardar"
                    >
                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    </Button>
                    <p className="ml-auto text-xs text-muted-foreground">
                        Pulsa <kbd className="rounded border bg-background px-1 text-[10px]">Enter</kbd> para guardar.
                    </p>
                </div>
            </div>
        </div>
    )
}

// ─── Master-Detail desktop: Fechas (RG / Término) ────────────────────────────

interface MasterDetailFechasProps {
    items: FechaItem[]
    colorBadge: string
    colorDias: string
    onEntregado?: (id: string) => Promise<void>
    onIndeterminado?: (id: string) => Promise<void>
}

export function MasterDetailFechas({
    items, colorBadge, colorDias, onEntregado, onIndeterminado,
}: MasterDetailFechasProps) {
    const tone: "destructive" | "warning" =
        items.some(i => i.diasDiff < 0) ? "destructive" : "warning"

    const { search, setSearch, depto, setDepto, deptos, filtrados, seleccionado, setSelectedId, avanzar } =
        useMasterState(items, (i, q) => (i.puesto ?? "").toLowerCase().includes(q))

    return (
        <div className="grid h-[70vh] grid-cols-[minmax(0,280px)_1fr] overflow-hidden rounded-b-xl border-t">
            <aside className="flex h-full flex-col overflow-hidden border-r">
                <MasterHeader
                    total={items.length}
                    filtrados={filtrados.length}
                    search={search}
                    onSearchChange={setSearch}
                    depto={depto}
                    onDeptoChange={setDepto}
                    deptos={deptos}
                />
                <div className="scrollbar-thin flex-1 overflow-y-auto">
                    {filtrados.length === 0 ? SIN_RESULTADOS : filtrados.map(i => (
                        <MasterListItem
                            key={i.id}
                            nombre={i.nombre}
                            meta={[i.puesto, i.departamento].filter(Boolean).join(" · ") || "Sin información"}
                            diasLabel={dias(i.diasDiff)}
                            fechaLabel={formatDate(i.fecha)}
                            selected={seleccionado?.id === i.id}
                            tone={tone}
                            onSelect={() => setSelectedId(i.id)}
                        />
                    ))}
                </div>
            </aside>

            <section className="scrollbar-thin h-full overflow-y-auto p-6">
                {!seleccionado ? (
                    <MasterEmpty mensaje="Selecciona un registro para ver el detalle." />
                ) : (
                    <DetalleFecha
                        key={seleccionado.id}
                        item={seleccionado}
                        colorBadge={colorBadge}
                        colorDias={colorDias}
                        onEntregado={onEntregado}
                        onIndeterminado={onIndeterminado}
                        onAfterAction={() => avanzar(seleccionado.id)}
                    />
                )}
            </section>
        </div>
    )
}

interface DetalleFechaProps {
    item: FechaItem
    colorBadge: string
    colorDias: string
    onEntregado?: (id: string) => Promise<void>
    onIndeterminado?: (id: string) => Promise<void>
    onAfterAction: () => void
}

function DetalleFecha({
    item, colorBadge, colorDias, onEntregado, onIndeterminado, onAfterAction,
}: DetalleFechaProps) {
    const [saving, setSaving] = useState(false)

    async function handle(action?: (id: string) => Promise<void>) {
        if (!action) return
        setSaving(true)
        try { await action(item.id); onAfterAction() } finally { setSaving(false) }
    }

    return (
        <div className="flex w-full flex-col gap-6">
            <header className="flex items-start gap-4">
                <div className="min-w-0 flex-1">
                    <h3 className="truncate text-xl font-semibold text-foreground">{item.nombre}</h3>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <Briefcase size={14} aria-hidden />
                        <span>{item.puesto ?? "Sin puesto"}</span>
                        <span aria-hidden>·</span>
                        <Building2 size={14} aria-hidden />
                        <span>{item.departamento ?? "Sin departamento"}</span>
                    </div>
                </div>
                <Badge className={`shrink-0 ${colorBadge}`} variant="secondary">{item.etiqueta}</Badge>
            </header>

            <dl className="grid grid-cols-2 gap-3">
                <DetalleStat label="No. Empleado" value={item.numero ?? "Sin número"} icon={<User size={14} aria-hidden />} />
                <DetalleStat label="Fecha de Ingreso" value={item.fechaIngreso ? formatDate(item.fechaIngreso) : "Sin registro"} icon={<Calendar size={14} aria-hidden />} />
                <DetalleStat label="Fecha" value={formatDate(item.fecha)} icon={<Calendar size={14} aria-hidden />} />
                <DetalleStat label="Antigüedad" value={dias(item.diasDiff)} icon={<Clock size={14} aria-hidden />} valueClass={colorDias} />
            </dl>

            {(onEntregado || onIndeterminado) && (
                <div className="rounded-2xl border bg-muted/30 p-4">
                    <h4 className="mb-3 text-sm font-semibold text-foreground">Acción rápida</h4>
                    <div className="flex flex-wrap items-center gap-2">
                        {onEntregado && (
                            <Button size="icon" onClick={() => handle(onEntregado)} disabled={saving} className="h-10 w-10" aria-label="Marcar entregado" title="Marcar entregado">
                                {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                            </Button>
                        )}
                        {onIndeterminado && (
                            <Button size="icon" onClick={() => handle(onIndeterminado)} disabled={saving} className="h-10 w-10" aria-label="Marcar como Indeterminado" title="Marcar como Indeterminado">
                                {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
