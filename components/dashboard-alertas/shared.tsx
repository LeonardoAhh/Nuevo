"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import {
    CheckCircle2,
    ChevronRight,
    Clock,
    Loader2,
    Minus,
    Pencil,
    Plus,
    Save,
    Search,
    UserRound,
    X,
    XCircle,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
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
    type EvalItem,
    type FechaItem,
} from "@/lib/hooks/useDashboardAlertas"
import { iniciales, periodoEval } from "./utils"

// ─── Métrica clickeable ──────────────────────────────────────────────────────

interface MetricaProps {
    label: string
    valor: number
    colorValor: string
    colorBorder: string
    onClick: () => void
    loading: boolean
}

export function Metrica({ label, valor, colorValor, colorBorder, onClick, loading }: MetricaProps) {
    return (
        <button
            onClick={e => {
                if (e.currentTarget instanceof HTMLElement) e.currentTarget.blur()
                onClick()
            }}
            disabled={loading || valor === 0}
            aria-label={`${label}: ${valor}`}
            className={`
        group flex items-center gap-2.5 p-2.5 sm:p-3 rounded-xl bg-primary/10 dark:bg-primary/20 transition-all duration-200
        ${valor > 0 && !loading
                    ? "cursor-pointer hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
                    : "cursor-default opacity-75"
                }
      `}
        >
            <div className="flex flex-col flex-1 min-w-0">
                {loading ? (
                    <div className="h-6 w-8 bg-current/10 rounded animate-pulse" />
                ) : (
                    <span className="text-xl font-bold leading-none text-foreground">{valor}</span>
                )}
                <span className="text-xs text-muted-foreground mt-0.5 leading-tight truncate">{label}</span>
            </div>
            {valor > 0 && !loading && (
                <ChevronRight size={13} className={`${colorValor} opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0`} />
            )}
        </button>
    )
}

// ─── Encabezado de sección ───────────────────────────────────────────────────

function SeccionHeader({ label }: { label: string }) {
    return (
        <div className="flex items-center gap-1.5 mb-2">
            <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                {label}
            </span>
        </div>
    )
}

// ─── Sección con dos métricas (vencidas + por vencer) ────────────────────────

interface SeccionProps {
    label: string
    vencidas: number; colorV: string; bordeV: string
    porVencer: number; colorP: string; bordeP: string
    umbrales: number
    onVencidas: () => void
    onPorVencer: () => void
    loading: boolean
}

export function Seccion({
    label,
    vencidas, colorV, bordeV,
    porVencer, colorP, bordeP,
    umbrales, onVencidas, onPorVencer, loading,
}: SeccionProps) {
    return (
        <div className="rounded-2xl border border-primary/10 bg-primary/5 dark:border-primary/20 dark:bg-primary/10 p-4">
            <SeccionHeader label={label} />
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
                <Metrica
                    label="Expired"
                    valor={vencidas}
                    colorValor={colorV}
                    colorBorder={bordeV}
                    onClick={onVencidas}
                    loading={loading}
                />
                <Metrica
                    label={`Expiring soon (${umbrales}d)`}
                    valor={porVencer}
                    colorValor={colorP}
                    colorBorder={bordeP}
                    onClick={onPorVencer}
                    loading={loading}
                />
            </div>
        </div>
    )
}

// ─── Encabezado de departamento dentro de lista ──────────────────────────────

export function DeptoHeader({ nombre, count }: { nombre: string; count: number }) {
    return (
        <div className="flex items-center gap-2 pb-1 pt-1.5">
            <span className="truncate text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                {nombre}
            </span>
            <span className="flex-shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                {count}
            </span>
            <div className="h-px flex-1 bg-border/70" />
        </div>
    )
}

// ─── Fila de evaluación (layout premium horizontal) ──────────────────────────

interface FilaEvalProps {
    item: EvalItem
    evalNum: 1 | 2 | 3
    colorDias: string
    colorBadge: string
    colorBorde: string
    badgeLabel: string
    onCalificar: (dbId: string, calificacion: number) => Promise<void>
}

export function CalificacionModal({
    open,
    item,
    evalNum,
    toneText,
    onCalificar,
    onClose,
    onAfterSave,
}: {
    open: boolean
    item: EvalItem | null
    evalNum: 1 | 2 | 3
    toneText: string
    onCalificar: (dbId: string, calificacion: number) => Promise<void>
    onClose: () => void
    onAfterSave?: () => void
}) {
    const [cal, setCal] = useState(100)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (open) setCal(100)
    }, [open, item?.id])

    function adjust(delta: number) {
        setCal(v => Math.min(100, Math.max(0, v + delta)))
    }

    function deferredClose() {
        window.requestAnimationFrame(() => onClose())
    }

    async function handleGuardar() {
        if (!item) return
        setSaving(true)
        try {
            await onCalificar(item.dbId, cal)
            window.requestAnimationFrame(() => onAfterSave?.())
        } finally {
            setSaving(false)
        }
    }

    useEffect(() => {
        if (!open) return
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose()
        }
        document.addEventListener("keydown", handler)
        const prevOverflow = document.body.style.overflow
        document.body.style.overflow = "hidden"
        return () => {
            document.removeEventListener("keydown", handler)
            document.body.style.overflow = prevOverflow
        }
    }, [open, onClose])

    if (!open || typeof document === "undefined") return null

    return createPortal(
        <div
            role="dialog"
            aria-modal="true"
            aria-label={item?.nombre ?? "Capturar calificación"}
            data-vaul-no-drag
            className="flex items-center justify-center p-4 calificacion-captura-modal-portal"
        >
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in-0"
                onClick={deferredClose}
                aria-hidden
            />
            <div
                className="relative z-10 w-full max-w-sm sm:max-w-md rounded-xl border bg-card shadow-xl overflow-hidden animate-in fade-in-0 zoom-in-95"
                onClick={(e) => e.stopPropagation()}
            >
                {item && (
                    <div className="flex flex-col bg-card">
                        <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={deferredClose}
                                disabled={saving}
                                className="h-8 px-2 text-muted-foreground"
                            >
                                <X size={14} />
                                Cerrar
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                onClick={handleGuardar}
                                disabled={saving}
                                className="h-8 gap-1.5 px-3"
                            >
                                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                Guardar
                            </Button>
                        </div>

                        <div className="space-y-2 px-3 py-3">
                            <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-foreground">{item.nombre}</p>
                                <p className="truncate text-[11px] text-muted-foreground">
                                    {[item.departamento, item.turno ? `Turno ${item.turno}` : null]
                                        .filter(Boolean).join(" · ") || "Sin departamento"}
                                </p>
                            </div>

                            <div className="grid grid-cols-3 gap-1.5 rounded-lg border bg-muted/25 px-2 py-1.5 text-[10px] text-muted-foreground">
                                <span className="truncate">{periodoEval(item.fechaIngreso, evalNum)}</span>
                                <span className="truncate text-center">Vence: {formatDate(item.fecha)}</span>
                                <span className={`truncate text-right font-semibold ${toneText}`}>{dias(item.diasDiff)}</span>
                            </div>

                            <div className="flex items-center justify-between gap-3 rounded-xl border bg-muted/20 p-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() => adjust(-1)}
                                    disabled={saving || cal <= 0}
                                    aria-label="Restar calificación"
                                    className="h-10 w-10 rounded-full"
                                >
                                    <Minus size={18} />
                                </Button>

                                <div className="flex min-w-0 flex-1 flex-col items-center">
                                    <div
                                        className="flex h-14 min-w-20 items-center justify-center rounded-xl border bg-background px-4 text-3xl font-bold tabular-nums text-foreground"
                                        aria-label={`Calificación ${cal}`}
                                    >
                                        {cal}
                                    </div>
                                    <span className="mt-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                                        Calificación
                                    </span>
                                </div>

                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() => adjust(1)}
                                    disabled={saving || cal >= 100}
                                    aria-label="Sumar calificación"
                                    className="h-10 w-10 rounded-full"
                                >
                                    <Plus size={18} />
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>,
        document.documentElement,
    )
}

export function FilaEval({ item, evalNum, colorDias, colorBadge, colorBorde, badgeLabel, onCalificar }: FilaEvalProps) {
    const [open, setOpen] = useState(false)

    function openModal() {
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
        window.setTimeout(() => setOpen(true), 0)
    }

    return (
        <div className={`flex flex-col gap-2 rounded-2xl border border-border/60 border-l-4 bg-card p-3.5 shadow-sm transition-colors ${colorBorde}`}>
            <div className="flex items-start justify-between gap-2.5">
                <p className="text-sm font-semibold leading-snug text-foreground">{item.nombre}</p>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${colorDias} bg-current/10`}>
                    {dias(item.diasDiff)}
                </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
                {[item.departamento, item.turno].filter(Boolean).join(" · ") || "Sin departamento"}
            </p>
            <div className="flex items-center justify-between gap-2">
                <span className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs font-medium ${colorBadge}`}>
                    {badgeLabel}
                </span>
                <span className="text-xs font-medium text-muted-foreground">{formatDate(item.fecha)}</span>
            </div>

            <button
                onClick={openModal}
                className="inline-flex w-fit items-center gap-1 rounded-md px-1 py-0.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
            >
                <Pencil size={11} /> Calificar
            </button>
            <CalificacionModal
                open={open}
                item={item}
                evalNum={evalNum}
                toneText={colorDias}
                onCalificar={onCalificar}
                onClose={() => setOpen(false)}
                onAfterSave={() => setOpen(false)}
            />
        </div>
    )
}

// ─── Fila genérica (RG / Término contrato) ───────────────────────────────────

interface FilaFechaProps {
    item: FechaItem
    colorBadge: string
    colorDias: string
    colorBorde: string
    onEntregado?: (id: string) => Promise<void>
    onIndeterminado?: (id: string) => Promise<void>
}

export function FilaFecha({ item, colorBadge, colorDias, colorBorde, onEntregado, onIndeterminado }: FilaFechaProps) {
    const [saving, setSaving] = useState(false)

    async function handle(action: (id: string) => Promise<void>) {
        setSaving(true)
        try { await action(item.id) } finally { setSaving(false) }
    }

    return (
        <div className={`flex flex-col gap-2 rounded-2xl border border-border/60 border-l-4 bg-card p-3.5 shadow-sm transition-colors ${colorBorde}`}>
            <div className="flex items-start justify-between gap-2.5">
                <p className="text-sm font-semibold leading-snug text-foreground">{item.nombre}</p>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${colorDias} bg-current/10`}>
                    {dias(item.diasDiff)}
                </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
                {[item.puesto, item.departamento].filter(Boolean).join(" · ") || "Sin información"}
            </p>
            <div className="flex items-center justify-between gap-2">
                <span className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs font-medium ${colorBadge}`}>
                    {item.etiqueta}
                </span>
                <span className="text-xs font-medium text-muted-foreground">{formatDate(item.fecha)}</span>
            </div>

            {onEntregado && (
                <button
                    onClick={() => handle(onEntregado!)}
                    disabled={saving}
                    className="inline-flex w-fit items-center gap-1 rounded-md px-1 py-0.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10 disabled:opacity-50"
                >
                    <CheckCircle2 size={11} /> {saving ? "Guardando…" : "Marcar entregado"}
                </button>
            )}

            {onIndeterminado && (
                <button
                    onClick={() => handle(onIndeterminado!)}
                    disabled={saving}
                    className="inline-flex w-fit items-center gap-1 rounded-md px-1 py-0.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10 disabled:opacity-50"
                >
                    <CheckCircle2 size={11} /> {saving ? "Guardando…" : "Marcar como Indeterminado"}
                </button>
            )}
        </div>
    )
}

// ─── Master-detail primitives (shared desktop + mobile) ──────────────────────

export interface MasterHeaderProps {
    total: number
    filtrados: number
    search: string
    onSearchChange: (v: string) => void
    depto: string
    onDeptoChange: (v: string) => void
    deptos: string[]
}

export function MasterHeader({
    total, filtrados, search, onSearchChange, depto, onDeptoChange, deptos,
}: MasterHeaderProps) {
    return (
        <div className="sticky top-0 z-10 flex flex-col gap-2 border-b bg-card/95 px-3 py-3 backdrop-blur supports-[backdrop-filter]:bg-card/80">
            <div className="relative">
                <Search
                    size={14}
                    aria-hidden
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Buscar..."
                    className="h-9 pl-8 text-sm"
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
                        className="h-8 max-w-[60%] flex-1 truncate rounded-md px-2 text-xs"
                    >
                        <SelectValue placeholder="Deptos." />
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
                    className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                >
                    {filtrados}{filtrados !== total ? ` / ${total}` : ""}
                </span>
            </div>
        </div>
    )
}

interface MasterListItemProps {
    nombre: string
    meta: string
    diasLabel: string
    fechaLabel: string
    selected: boolean
    tone: "destructive" | "warning"
    onSelect: () => void
}

export function MasterListItem({ nombre, meta, diasLabel, fechaLabel, selected, tone, onSelect }: MasterListItemProps) {
    const toneText = tone === "destructive" ? "text-destructive" : "text-warning"
    const toneIcon = tone === "destructive" ? "text-destructive/60" : "text-warning/60"
    const selectedBg = tone === "destructive" ? "bg-destructive/5" : "bg-warning/5"
    const selectedDot = tone === "destructive" ? "bg-destructive" : "bg-warning"

    return (
        <button
            type="button"
            onClick={onSelect}
            aria-pressed={selected}
            className={`group relative flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${selected ? selectedBg : "hover:bg-muted/40"
                }`}
        >
            {selected && (
                <span className={`absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-full ${selectedDot}`} aria-hidden />
            )}
            <span aria-hidden className={`shrink-0 ${toneIcon}`}>
                <UserRound size={20} strokeWidth={1.25} />
            </span>
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{nombre}</p>
                <p className="truncate text-[11px] text-muted-foreground/80">{meta}</p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-0.5">
                <span className={`text-[11px] font-medium ${toneText}`}>{diasLabel}</span>
                <span className="text-[10px] text-muted-foreground/60">{fechaLabel}</span>
            </div>
        </button>
    )
}

export function MasterEmpty({ mensaje }: { mensaje: string }) {
    return (
        <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-muted-foreground">
            <CheckCircle2 className="h-10 w-10 opacity-40" />
            <p className="text-sm">{mensaje}</p>
        </div>
    )
}

export function DetalleStat({
    label, value, icon, valueClass, nota,
}: { label: string; value: string; icon: React.ReactNode; valueClass?: string; nota?: string }) {
    return (
        <div className="rounded-xl border bg-card p-3">
            <dt className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {icon}
                {label}
            </dt>
            <dd className={`mt-1 text-sm font-semibold ${valueClass ?? "text-foreground"}`}>{value}</dd>
            {nota && <p className="mt-0.5 text-[11px] text-muted-foreground">{nota}</p>}
        </div>
    )
}
