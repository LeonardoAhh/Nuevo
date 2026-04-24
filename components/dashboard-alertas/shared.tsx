"use client"

import { useState } from "react"
import {
  CheckCircle2,
  ChevronRight,
  Clock,
  Pencil,
  Search,
  XCircle,
} from "lucide-react"
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
  type EvalItem,
  type FechaItem,
} from "@/lib/hooks/useDashboardAlertas"
import { iniciales } from "./utils"

// ─── Métrica clickeable ──────────────────────────────────────────────────────

interface MetricaProps {
  icono: React.ReactNode
  label: string
  valor: number
  colorValor: string
  colorBorder: string
  onClick: () => void
  loading: boolean
}

export function Metrica({ icono, label, valor, colorValor, colorBorder, onClick, loading }: MetricaProps) {
  return (
    <button
      onClick={onClick}
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
      <span className="flex-shrink-0 p-1.5 rounded-lg text-primary bg-primary/5 dark:bg-primary/10">
        {icono}
      </span>
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

function SeccionHeader({ icono, label }: { icono: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5 mb-2">
      {icono}
      <span className="text-xs font-semibold text-primary uppercase tracking-wide">
        {label}
      </span>
    </div>
  )
}

// ─── Sección con dos métricas (vencidas + por vencer) ────────────────────────

interface SeccionProps {
  icono: React.ReactNode
  label: string
  vencidas: number;  colorV: string; bordeV: string
  porVencer: number; colorP: string; bordeP: string
  umbrales: number
  onVencidas: () => void
  onPorVencer: () => void
  loading: boolean
}

export function Seccion({
  icono, label,
  vencidas, colorV, bordeV,
  porVencer, colorP, bordeP,
  umbrales, onVencidas, onPorVencer, loading,
}: SeccionProps) {
  return (
    <div className="rounded-2xl border border-primary/10 bg-primary/5 dark:border-primary/20 dark:bg-primary/10 p-4">
      <SeccionHeader icono={icono} label={label} />
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
        <Metrica
          icono={<XCircle size={16} />}
          label="Vencidas"
          valor={vencidas}
          colorValor={colorV}
          colorBorder={bordeV}
          onClick={onVencidas}
          loading={loading}
        />
        <Metrica
          icono={<Clock size={16} />}
          label={`Por vencer (${umbrales}d)`}
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
  colorAvatar: string
  colorDias: string
  colorBadge: string
  colorBorde: string
  badgeLabel: string
  onCalificar: (dbId: string, calificacion: number) => Promise<void>
}

export function FilaEval({ item, colorDias, colorBadge, colorBorde, badgeLabel, onCalificar }: FilaEvalProps) {
  const [editando, setEditando] = useState(false)
  const [calStr, setCalStr]     = useState("")
  const [saving, setSaving]     = useState(false)

  async function handleGuardar() {
    const cal = parseInt(calStr, 10)
    if (isNaN(cal) || cal < 0 || cal > 100) return
    setSaving(true)
    try { await onCalificar(item.dbId, cal) } finally { setSaving(false) }
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

      {!editando ? (
        <button
          onClick={() => setEditando(true)}
          className="inline-flex w-fit items-center gap-1 rounded-md px-1 py-0.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
        >
          <Pencil size={11} /> Calificar
        </button>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="number" min={0} max={100} placeholder="0 – 100"
            value={calStr}
            onChange={e => setCalStr(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleGuardar(); if (e.key === "Escape") { setEditando(false); setCalStr("") } }}
            autoFocus
            aria-label="Calificación (0 a 100)"
            className="h-8 w-24 rounded-md border bg-muted px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            onClick={handleGuardar}
            disabled={saving || calStr === ""}
            className="h-8 rounded-md bg-primary px-2.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? "…" : "Guardar"}
          </button>
          <button
            onClick={() => { setEditando(false); setCalStr("") }}
            className="h-8 rounded-md px-2 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Fila genérica (RG / Término contrato) ───────────────────────────────────

interface FilaFechaProps {
  item: FechaItem
  colorAvatar: string
  colorBadge: string
  colorDias: string
  colorBorde: string
  onEntregado?:     (id: string) => Promise<void>
  onIndeterminado?: (id: string) => Promise<void>
}

export function FilaFecha({ item, colorBadge, colorDias, colorBorde, onEntregado, onIndeterminado }: FilaFechaProps) {
  const [saving, setSaving] = useState(false)

  async function handleEntregado() {
    setSaving(true)
    try { await onEntregado!(item.id) } finally { setSaving(false) }
  }

  async function handleIndeterminado() {
    setSaving(true)
    try { await onIndeterminado!(item.id) } finally { setSaving(false) }
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
          onClick={handleEntregado}
          disabled={saving}
          className="inline-flex w-fit items-center gap-1 rounded-md px-1 py-0.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10 disabled:opacity-50"
        >
          <CheckCircle2 size={11} /> {saving ? "Guardando…" : "Marcar entregado"}
        </button>
      )}

      {onIndeterminado && (
        <button
          onClick={handleIndeterminado}
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
          placeholder="Buscar por nombre o departamento…"
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
            <SelectValue placeholder="Todos los departamentos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todos los departamentos</SelectItem>
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
  const toneBgSel = tone === "destructive"
    ? "bg-destructive/5 border-l-destructive"
    : "bg-warning/5 border-l-warning"

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`
        group flex w-full items-start gap-3 border-l-2 px-3 py-2.5 text-left transition-colors
        ${selected ? toneBgSel : "border-l-transparent hover:bg-muted/60"}
      `}
    >
      <span
        aria-hidden
        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
          tone === "destructive"
            ? "bg-destructive/10 text-destructive"
            : "bg-warning/10 text-warning"
        }`}
      >
        {iniciales(nombre)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{nombre}</p>
        <p className="truncate text-[11px] text-muted-foreground">{meta}</p>
        <div className="mt-1 flex items-center justify-between gap-2">
          <span className={`text-[11px] font-medium ${toneText}`}>{diasLabel}</span>
          <span className="text-[11px] text-muted-foreground">{fechaLabel}</span>
        </div>
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
  label, value, icon, valueClass,
}: { label: string; value: string; icon: React.ReactNode; valueClass?: string }) {
  return (
    <div className="rounded-xl border bg-card p-3">
      <dt className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </dt>
      <dd className={`mt-1 text-sm font-semibold ${valueClass ?? "text-foreground"}`}>{value}</dd>
    </div>
  )
}
