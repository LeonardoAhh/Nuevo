"use client"

import { useMemo, useState, useRef, useEffect } from "react"
import {
    Calendar,
    CheckCircle2,
    ChevronLeft,
    Clock,
    Loader2,
    Pencil,
    Save,
    Search,
    User,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    dias,
    formatDate,
} from "@/lib/hooks/useDashboardAlertas"
import { iniciales, periodoEval, type MobileStackEvalsProps, type MobileStackFechasProps } from "./utils"
import {
    DetalleStat,
    MasterListItem,
    type MasterHeaderProps,
} from "./shared"

const SIN_RESULTADOS = (
    <p className="px-4 py-6 text-center text-sm text-muted-foreground">
        Sin resultados con los filtros actuales.
    </p>
)

// ─── Mobile toolbar (sticky top): search + depto filter ──────────────────────

function MobileToolbar({
    total, filtrados, search, onSearchChange, depto, onDeptoChange, deptos,
}: MasterHeaderProps) {
    return (
        <div className="sticky top-0 z-10 flex flex-col gap-2 border-b bg-card/95 px-3 py-3 backdrop-blur supports-[backdrop-filter]:bg-card/80">
            <div className="relative">
                <Search
                    size={16}
                    aria-hidden
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Buscar..."
                    inputMode="search"
                    className="h-11 pl-9 text-sm"
                    aria-label="Buscar en alertas"
                />
            </div>
            <div className="flex items-center justify-between gap-2">
                <Select
                    value={depto || "__all__"}
                    onValueChange={(v) => onDeptoChange(v === "__all__" ? "" : v)}
                >
                    <SelectTrigger
                        aria-label="Filtrar por departamento"
                        className="h-10 max-w-[60%] flex-1 truncate rounded-md px-2 text-sm"
                    >
                        <SelectValue placeholder="Todos los departamentos" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="__all__">Deptos.</SelectItem>
                        {deptos.map((d) => (
                            <SelectItem key={d} value={d}>{d}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <span
                    aria-live="polite"
                    className="shrink-0 rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground"
                >
                    {filtrados}{filtrados !== total ? ` / ${total}` : ""}
                </span>
            </div>
        </div>
    )
}

function MobileDetailHeader({
    nombre, badgeLabel, badgeClass, onBack, action,
}: { nombre: string; badgeLabel: string; badgeClass: string; onBack: () => void; action?: React.ReactNode }) {
    return (
        <div className="sticky top-0 z-10 flex items-center gap-2 border-b bg-card/95 px-2 py-2 backdrop-blur supports-[backdrop-filter]:bg-card/80">
            <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onBack}
                aria-label="Volver a la lista"
                className="h-10 w-10"
            >
                <ChevronLeft size={20} aria-hidden />
            </Button>
            <p className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">{nombre}</p>
            {action ?? <Badge className={`shrink-0 ${badgeClass}`} variant="secondary">{badgeLabel}</Badge>}
        </div>
    )
}

// ─── Mobile stack: Evaluaciones ──────────────────────────────────────────────

export function MobileStackEvals({
    items, vencida, evalNum, onCalificar,
}: MobileStackEvalsProps) {
    const tone: "destructive" | "warning" = vencida ? "destructive" : "warning"
    const badgeLabel = vencida ? "Vencida" : "Por vencer"
    const badgeClass = vencida
        ? "bg-destructive/10 text-destructive"
        : "bg-warning/10 text-warning"
    const toneText = vencida ? "text-destructive" : "text-warning"

    const [search, setSearch] = useState("")
    const [depto, setDepto] = useState("")
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [calStr, setCalStr] = useState("")
    const [saving, setSaving] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

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
            return i.nombre.toLowerCase().includes(q) || dep.toLowerCase().includes(q)
        })
    }, [items, search, depto])

    const seleccionado = useMemo(
        () => items.find(i => i.id === selectedId) ?? null,
        [items, selectedId],
    )

    // Focus con delay para esperar animación del drawer antes de abrir teclado
    // Evita que iOS empuje el drawer encima de la status bar
    useEffect(() => {
        if (!seleccionado) return
        const timer = setTimeout(() => {
            inputRef.current?.focus()
        }, 300)
        return () => clearTimeout(timer)
    }, [seleccionado])

    function back() { setSelectedId(null); setCalStr("") }

    async function guardar() {
        if (!seleccionado) return
        const cal = parseInt(calStr, 10)
        if (isNaN(cal) || cal < 0 || cal > 100) return
        setSaving(true)
        try {
            await onCalificar(seleccionado.dbId, cal)
            setCalStr("")
            const idx = filtrados.findIndex(i => i.id === seleccionado.id)
            const next = filtrados[idx + 1] ?? filtrados[idx - 1] ?? null
            setSelectedId(next?.id ?? null)
        } finally {
            setSaving(false)
        }
    }

    if (seleccionado) {
        return (
            <div className="flex h-full flex-col">
                <MobileDetailHeader
                    nombre={seleccionado.nombre}
                    badgeLabel={badgeLabel}
                    badgeClass={badgeClass}
                    onBack={back}
                    action={
                        <Button
                            size="icon"
                            onClick={guardar}
                            disabled={saving || calStr === ""}
                            className="h-10 w-10 shrink-0"
                            aria-label="Guardar calificación"
                            title="Guardar calificación"
                        >
                            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        </Button>
                    }
                />
                <div className="scrollbar-thin flex-1 overflow-y-auto p-4">
                    <div className="mb-4 rounded-2xl border bg-muted/30 p-3">
                        <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                            <Pencil size={14} aria-hidden /> Capturar calificación
                        </h4>
                        <Input
                            ref={inputRef}
                            type="number"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            min={0}
                            max={100}
                            value={calStr}
                            onChange={(e) => setCalStr(e.target.value)}
                            placeholder="0 – 100"
                            // font-size mínimo 16px — evita zoom automático en iOS
                            className="h-11 text-base"
                            aria-label="Calificación"
                        />
                    </div>

                    <dl className="grid grid-cols-2 gap-2">
                        <DetalleStat label="No. Empleado" value={seleccionado.numero ?? "Sin número"} icon={<User size={12} aria-hidden />} />
                        <DetalleStat label="Fecha de Ingreso" value={seleccionado.fechaIngreso ? formatDate(seleccionado.fechaIngreso) : "Sin registro"} icon={<Calendar size={12} aria-hidden />} />
                        <DetalleStat label="Periodo" value={periodoEval(seleccionado.fechaIngreso, evalNum)} icon={<Calendar size={12} aria-hidden />} nota={`Vence: ${formatDate(seleccionado.fecha)}`} />
                        <DetalleStat label="Tiempo" value={dias(seleccionado.diasDiff)} icon={<Clock size={12} aria-hidden />} valueClass={toneText} />
                    </dl>
                </div>
            </div>
        )
    }

    return (
        <div className="flex h-full flex-col">
            <MobileToolbar
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
                        selected={false}
                        tone={tone}
                        onSelect={() => setSelectedId(i.id)}
                    />
                ))}
            </div>
        </div>
    )
}

// ─── Mobile stack: Fechas (RG / Término) ─────────────────────────────────────

export function MobileStackFechas({
    items, colorBadge, colorDias, onEntregado, onIndeterminado,
}: MobileStackFechasProps) {
    const tone: "destructive" | "warning" =
        items.some(i => i.diasDiff < 0) ? "destructive" : "warning"

    const [search, setSearch] = useState("")
    const [depto, setDepto] = useState("")
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)

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
            return (
                i.nombre.toLowerCase().includes(q) ||
                dep.toLowerCase().includes(q) ||
                (i.puesto ?? "").toLowerCase().includes(q)
            )
        })
    }, [items, search, depto])

    const seleccionado = useMemo(
        () => items.find(i => i.id === selectedId) ?? null,
        [items, selectedId],
    )

    function back() { setSelectedId(null) }

    async function ejecutar(action?: (id: string) => Promise<void>) {
        if (!seleccionado || !action) return
        setSaving(true)
        try {
            await action(seleccionado.id)
            const idx = filtrados.findIndex(i => i.id === seleccionado.id)
            const next = filtrados[idx + 1] ?? filtrados[idx - 1] ?? null
            setSelectedId(next?.id ?? null)
        } finally {
            setSaving(false)
        }
    }

    if (seleccionado) {
        return (
            <div className="flex h-full flex-col">
                <MobileDetailHeader
                    nombre={seleccionado.nombre}
                    badgeLabel={seleccionado.etiqueta}
                    badgeClass={colorBadge}
                    onBack={back}
                />
                <div className="scrollbar-thin flex-1 overflow-y-auto p-4">
                    <dl className="grid grid-cols-2 gap-2">
                        <DetalleStat label="No. Empleado" value={seleccionado.numero ?? "Sin número"} icon={<User size={12} aria-hidden />} />
                        <DetalleStat label="Fecha de Ingreso" value={seleccionado.fechaIngreso ? formatDate(seleccionado.fechaIngreso) : "Sin registro"} icon={<Calendar size={12} aria-hidden />} />
                        <DetalleStat label="Fecha" value={formatDate(seleccionado.fecha)} icon={<Calendar size={12} aria-hidden />} />
                        <DetalleStat label="Antigüedad" value={dias(seleccionado.diasDiff)} icon={<Clock size={12} aria-hidden />} valueClass={colorDias} />
                    </dl>
                </div>

                {(onEntregado || onIndeterminado) && (
                    <div className="sticky bottom-0 flex flex-col gap-2 border-t bg-card/95 p-3 backdrop-blur supports-[backdrop-filter]:bg-card/80 safe-bottom-content">
                        {onEntregado && (
                            <Button
                                size="icon"
                                onClick={() => ejecutar(onEntregado)}
                                disabled={saving}
                                className="h-12 w-12"
                                aria-label="Marcar entregado"
                                title="Marcar entregado"
                            >
                                {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                            </Button>
                        )}
                        {onIndeterminado && (
                            <Button
                                size="icon"
                                onClick={() => ejecutar(onIndeterminado)}
                                disabled={saving}
                                className="h-12 w-12"
                                aria-label="Marcar como Indeterminado"
                                title="Marcar como Indeterminado"
                            >
                                {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                            </Button>
                        )}
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="flex h-full flex-col">
            <MobileToolbar
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
                        selected={false}
                        tone={tone}
                        onSelect={() => setSelectedId(i.id)}
                    />
                ))}
            </div>
        </div>
    )
}