"use client"

import { useState, useEffect, useCallback } from "react"
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  User,
  Calendar,
  ChevronRight,
  GraduationCap,
  FileText,
  ShieldAlert,
  Pencil,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { supabase } from "@/lib/supabase/client"
import Link from "next/link"
import { daysFromToday, formatDate } from "@/lib/hooks/useNuevoIngreso"
import type { NuevoIngreso } from "@/lib/hooks/useNuevoIngreso"

// ─────────────────────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────────────────────

type DialogTipo =
  | "eval1_vencidas" | "eval1_por_vencer"
  | "eval2_vencidas" | "eval2_por_vencer"
  | "eval3_vencidas" | "eval3_por_vencer"
  | "rg_vencidas"    | "rg_por_vencer"
  | "termino_vencidos" | "termino_por_vencer"
  | null

interface EvalItem {
  id: string
  dbId: string
  nombre: string
  departamento: string | null
  turno: string | null
  fecha: string
  diasDiff: number
}

interface FechaItem {
  id: string
  nombre: string
  departamento: string | null
  puesto: string | null
  etiqueta: string
  fecha: string
  diasDiff: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Umbrales
// ─────────────────────────────────────────────────────────────────────────────

const EVAL_UMBRAL_DIAS    = 7
const RG_UMBRAL_DIAS      = 14
const TERMINO_UMBRAL_DIAS = 30

// ─────────────────────────────────────────────────────────────────────────────
// Helpers de presentación
// ─────────────────────────────────────────────────────────────────────────────

function dias(diff: number): string {
  if (diff === 0) return "Hoy"
  if (diff < 0)  return `Hace ${Math.abs(diff)} día${Math.abs(diff) !== 1 ? "s" : ""}`
  return `En ${diff} día${diff !== 1 ? "s" : ""}`
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-componente: métrica clickeable
// ─────────────────────────────────────────────────────────────────────────────

interface MetricaProps {
  icono: React.ReactNode
  label: string
  valor: number
  colorValor: string
  colorBorder: string
  onClick: () => void
  loading: boolean
}

function Metrica({ icono, label, valor, colorValor, colorBorder, onClick, loading }: MetricaProps) {
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

// ─────────────────────────────────────────────────────────────────────────────
// Sub-componente: encabezado de sección
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// Sub-componente: fila de evaluación en el dialog (layout premium horizontal)
// ─────────────────────────────────────────────────────────────────────────────

interface FilaEvalProps {
  item: EvalItem
  colorAvatar: string
  colorDias: string
  colorBadge: string
  colorBorde: string
  badgeLabel: string
  onCalificar: (dbId: string, calificacion: number) => Promise<void>
}

function FilaEval({ item, colorAvatar, colorDias, colorBadge, colorBorde, badgeLabel, onCalificar }: FilaEvalProps) {
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

      {/* Acción rápida: calificar */}
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

// ─────────────────────────────────────────────────────────────────────────────
// Sub-componente: fila genérica (RG / Término contrato) — mismo estilo premium
// ─────────────────────────────────────────────────────────────────────────────

interface FilaFechaProps {
  item: FechaItem
  colorAvatar: string
  colorBadge: string
  colorDias: string
  colorBorde: string
  onEntregado?:     (id: string) => Promise<void>
  onIndeterminado?: (id: string) => Promise<void>
}

function FilaFecha({ item, colorAvatar, colorBadge, colorDias, colorBorde, onEntregado, onIndeterminado }: FilaFechaProps) {
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

      {/* Acción rápida: marcar entregado (RG) */}
      {onEntregado && (
        <button
          onClick={handleEntregado}
          disabled={saving}
          className="inline-flex w-fit items-center gap-1 rounded-md px-1 py-0.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10 disabled:opacity-50"
        >
          <CheckCircle2 size={11} /> {saving ? "Guardando…" : "Marcar entregado"}
        </button>
      )}

      {/* Acción rápida: marcar como indeterminado (Término de Contrato) */}
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

// ─────────────────────────────────────────────────────────────────────────────
// Utilidad: lógica de clasificación para una evaluación
// ─────────────────────────────────────────────────────────────────────────────

function clasificarEval(
  registros: NuevoIngreso[],
  fechaKey: keyof NuevoIngreso,
  calKey: keyof NuevoIngreso,
  sufijo: string,
): { vencidas: EvalItem[]; porVencer: EvalItem[] } {
  const vencidas:  EvalItem[] = []
  const porVencer: EvalItem[] = []

  for (const r of registros) {
    const fecha = r[fechaKey] as string | null
    const cal   = r[calKey]  as number | null
    if (!fecha || cal != null) continue
    const diff = daysFromToday(fecha)
    if (diff === null) continue

    const item: EvalItem = {
      id: `${r.id}-${sufijo}`,
      dbId: r.id,
      nombre: r.nombre,
      departamento: r.departamento,
      turno: r.turno,
      fecha,
      diasDiff: diff,
    }
    if (diff < 0)                      vencidas.push(item)
    else if (diff <= EVAL_UMBRAL_DIAS)  porVencer.push(item)
  }

  vencidas.sort((a, b)  => a.diasDiff - b.diasDiff)
  porVencer.sort((a, b) => a.diasDiff - b.diasDiff)
  return { vencidas, porVencer }
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────────────────────────

export default function DashboardAlertas() {
  const [loading, setLoading]       = useState(true)
  const [dialogTipo, setDialogTipo] = useState<DialogTipo>(null)

  // Evaluación 1er mes
  const [eval1Venc,  setEval1Venc]  = useState<EvalItem[]>([])
  const [eval1Prox,  setEval1Prox]  = useState<EvalItem[]>([])
  // Evaluación 2o mes
  const [eval2Venc,  setEval2Venc]  = useState<EvalItem[]>([])
  const [eval2Prox,  setEval2Prox]  = useState<EvalItem[]>([])
  // Evaluación 3er mes
  const [eval3Venc,  setEval3Venc]  = useState<EvalItem[]>([])
  const [eval3Prox,  setEval3Prox]  = useState<EvalItem[]>([])
  // RG-REC-048
  const [rgVenc,     setRgVenc]     = useState<FechaItem[]>([])
  const [rgProx,     setRgProx]     = useState<FechaItem[]>([])
  // Término de Contrato
  const [termVenc,   setTermVenc]   = useState<FechaItem[]>([])
  const [termProx,   setTermProx]   = useState<FechaItem[]>([])

  // ── Carga de datos ─────────────────────────────────────────────────────────

  const cargarDatos = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("nuevo_ingreso")
        .select("*")
        .order("nombre")

      if (error) throw new Error(error.message)
      const registros = (data ?? []) as unknown as NuevoIngreso[]

      // Evaluaciones por mes
      const e1 = clasificarEval(registros, "eval_1_fecha", "eval_1_calificacion", "e1")
      const e2 = clasificarEval(registros, "eval_2_fecha", "eval_2_calificacion", "e2")
      const e3 = clasificarEval(registros, "eval_3_fecha", "eval_3_calificacion", "e3")

      setEval1Venc(e1.vencidas);  setEval1Prox(e1.porVencer)
      setEval2Venc(e2.vencidas);  setEval2Prox(e2.porVencer)
      setEval3Venc(e3.vencidas);  setEval3Prox(e3.porVencer)

      // RG-REC-048 (solo Pendientes)
      const _rgVenc: FechaItem[] = []
      const _rgProx: FechaItem[] = []
      for (const r of registros) {
        if (r.rg_rec_048 === "Entregado") continue
        const fecha = r.fecha_vencimiento_rg
        if (!fecha) continue
        const diff = daysFromToday(fecha)
        if (diff === null) continue
        const item: FechaItem = {
          id: r.id, nombre: r.nombre, departamento: r.departamento,
          puesto: r.puesto, etiqueta: "Pendiente", fecha, diasDiff: diff,
        }
        if (diff < 0)             _rgVenc.push(item)
        else if (diff <= RG_UMBRAL_DIAS) _rgProx.push(item)
      }
      _rgVenc.sort((a, b) => a.diasDiff - b.diasDiff)
      _rgProx.sort((a, b) => a.diasDiff - b.diasDiff)
      setRgVenc(_rgVenc); setRgProx(_rgProx)

      // Término de Contrato
      const _termVenc: FechaItem[] = []
      const _termProx: FechaItem[] = []
      for (const r of registros) {
        if (r.tipo_contrato === "Indeterminado") continue
        const fecha = r.termino_contrato
        if (!fecha) continue
        const diff = daysFromToday(fecha)
        if (diff === null) continue
        const item: FechaItem = {
          id: r.id, nombre: r.nombre, departamento: r.departamento,
          puesto: r.puesto, etiqueta: r.tipo_contrato ?? "A prueba", fecha, diasDiff: diff,
        }
        if (diff < 0)                    _termVenc.push(item)
        else if (diff <= TERMINO_UMBRAL_DIAS) _termProx.push(item)
      }
      _termVenc.sort((a, b) => a.diasDiff - b.diasDiff)
      _termProx.sort((a, b) => a.diasDiff - b.diasDiff)
      setTermVenc(_termVenc); setTermProx(_termProx)

    } catch (err) {
      console.error("DashboardAlertas error:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { cargarDatos() }, [cargarDatos])

  // ── Config de dialogs ──────────────────────────────────────────────────────

  const n = (arr: unknown[]) => arr.length
  const s = (arr: unknown[], word: string) =>
    `${n(arr)} ${word}${n(arr) !== 1 ? "s" : ""}`

  const dialogConfig: Record<NonNullable<DialogTipo>, {
    titulo: string; descripcion: string; icono: React.ReactNode
  }> = {
    eval1_vencidas:     { titulo: "Evaluación 1er Mes — Vencidas",
                          descripcion: `${s(eval1Venc,"evaluación")} con fecha pasada sin calificación`,
                          icono: <XCircle className="h-5 w-5 text-red-500" /> },
    eval1_por_vencer:   { titulo: `Evaluación 1er Mes — Por vencer (${EVAL_UMBRAL_DIAS}d)`,
                          descripcion: `${s(eval1Prox,"evaluación")} próximas a vencer`,
                          icono: <Clock className="h-5 w-5 text-amber-500" /> },
    eval2_vencidas:     { titulo: "Evaluación 2° Mes — Vencidas",
                          descripcion: `${s(eval2Venc,"evaluación")} con fecha pasada sin calificación`,
                          icono: <XCircle className="h-5 w-5 text-red-500" /> },
    eval2_por_vencer:   { titulo: `Evaluación 2° Mes — Por vencer (${EVAL_UMBRAL_DIAS}d)`,
                          descripcion: `${s(eval2Prox,"evaluación")} próximas a vencer`,
                          icono: <Clock className="h-5 w-5 text-amber-500" /> },
    eval3_vencidas:     { titulo: "Evaluación 3er Mes — Vencidas",
                          descripcion: `${s(eval3Venc,"evaluación")} con fecha pasada sin calificación`,
                          icono: <XCircle className="h-5 w-5 text-red-500" /> },
    eval3_por_vencer:   { titulo: `Evaluación 3er Mes — Por vencer (${EVAL_UMBRAL_DIAS}d)`,
                          descripcion: `${s(eval3Prox,"evaluación")} próximas a vencer`,
                          icono: <Clock className="h-5 w-5 text-amber-500" /> },
    rg_vencidas:        { titulo: "RG-REC-048 — Pendientes vencidos",
                          descripcion: `${s(rgVenc,"registro")} con RG pendiente y fecha vencida`,
                          icono: <ShieldAlert className="h-5 w-5 text-purple-500" /> },
    rg_por_vencer:      { titulo: `RG-REC-048 — Por vencer (${RG_UMBRAL_DIAS}d)`,
                          descripcion: `${s(rgProx,"registro")} con RG próximo a vencer`,
                          icono: <Clock className="h-5 w-5 text-violet-500" /> },
    termino_vencidos:   { titulo: "Término de Contrato — Vencidos",
                          descripcion: `${s(termVenc,"contrato")} con fecha de término pasada`,
                          icono: <AlertTriangle className="h-5 w-5 text-orange-500" /> },
    termino_por_vencer: { titulo: `Término de Contrato — Por vencer (${TERMINO_UMBRAL_DIAS}d)`,
                          descripcion: `${s(termProx,"contrato")} próximos a vencer`,
                          icono: <Calendar className="h-5 w-5 text-blue-500" /> },
  }

  const dialogActivo = dialogTipo ? dialogConfig[dialogTipo] : null

  const totalAlertas =
    n(eval1Venc) + n(eval1Prox) + n(eval2Venc) + n(eval2Prox) +
    n(eval3Venc) + n(eval3Prox) + n(rgVenc)    + n(rgProx)    +
    n(termVenc)  + n(termProx)

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <Card className="bg-card">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-primary" />
              Alertas de Vencimiento
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Haz clic en una métrica para ver el detalle
            </p>
          </div>
          <Button
            variant="ghost" size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={cargarDatos} disabled={loading} title="Actualizar"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </CardHeader>

        <CardContent className="grid grid-cols-1 gap-3 pt-0 lg:grid-cols-2 xl:grid-cols-3">

          {/* ── Eval 1er Mes ──────────────────────────────────────────────── */}
          <Seccion
            icono={<GraduationCap className="h-3.5 w-3.5 text-primary" />}
            label="Evaluación 1er Mes"
            vencidas={n(eval1Venc)}   colorV="text-red-600 dark:text-red-400"
            bordeV="border-red-100 dark:border-red-800/30"
            porVencer={n(eval1Prox)}  colorP="text-amber-600 dark:text-amber-400"
            bordeP="border-amber-100 dark:border-amber-800/30"
            umbrales={EVAL_UMBRAL_DIAS}
            onVencidas={() => setDialogTipo("eval1_vencidas")}
            onPorVencer={() => setDialogTipo("eval1_por_vencer")}
            loading={loading}
          />
          {/* ── Eval 2° Mes ───────────────────────────────────────────────── */}
          <Seccion
            icono={<GraduationCap className="h-3.5 w-3.5 text-primary" />}
            label="Evaluación 2° Mes"
            vencidas={n(eval2Venc)}   colorV="text-red-600 dark:text-red-400"
            bordeV="border-red-100 dark:border-red-800/30"
            porVencer={n(eval2Prox)}  colorP="text-amber-600 dark:text-amber-400"
            bordeP="border-amber-100 dark:border-amber-800/30"
            umbrales={EVAL_UMBRAL_DIAS}
            onVencidas={() => setDialogTipo("eval2_vencidas")}
            onPorVencer={() => setDialogTipo("eval2_por_vencer")}
            loading={loading}
          />
          {/* ── Eval 3er Mes ──────────────────────────────────────────────── */}
          <Seccion
            icono={<GraduationCap className="h-3.5 w-3.5 text-primary" />}
            label="Evaluación 3er Mes"
            vencidas={n(eval3Venc)}   colorV="text-red-600 dark:text-red-400"
            bordeV="border-red-100 dark:border-red-800/30"
            porVencer={n(eval3Prox)}  colorP="text-amber-600 dark:text-amber-400"
            bordeP="border-amber-100 dark:border-amber-800/30"
            umbrales={EVAL_UMBRAL_DIAS}
            onVencidas={() => setDialogTipo("eval3_vencidas")}
            onPorVencer={() => setDialogTipo("eval3_por_vencer")}
            loading={loading}
          />
          {/* ── RG-REC-048 ────────────────────────────────────────────────── */}
          <Seccion
            icono={<ShieldAlert className="h-3.5 w-3.5 text-primary" />}
            label="RG-REC-048"
            vencidas={n(rgVenc)}     colorV="text-purple-600 dark:text-purple-400"
            bordeV="border-purple-100 dark:border-purple-800/30"
            porVencer={n(rgProx)}    colorP="text-violet-600 dark:text-violet-400"
            bordeP="border-violet-100 dark:border-violet-800/30"
            umbrales={RG_UMBRAL_DIAS}
            onVencidas={() => setDialogTipo("rg_vencidas")}
            onPorVencer={() => setDialogTipo("rg_por_vencer")}
            loading={loading}
          />
          {/* ── Término de Contrato ───────────────────────────────────────── */}
          <Seccion
            icono={<FileText className="h-3.5 w-3.5 text-primary" />}
            label="Término de Contrato"
            vencidas={n(termVenc)}   colorV="text-orange-600 dark:text-orange-400"
            bordeV="border-orange-100 dark:border-orange-800/30"
            porVencer={n(termProx)}  colorP="text-blue-600 dark:text-blue-400"
            bordeP="border-blue-100 dark:border-blue-800/30"
            umbrales={TERMINO_UMBRAL_DIAS}
            onVencidas={() => setDialogTipo("termino_vencidos")}
            onPorVencer={() => setDialogTipo("termino_por_vencer")}
            loading={loading}
          />

          {/* ── Sin alertas ───────────────────────────────────────────────── */}
          {!loading && totalAlertas === 0 && (
            <div className="flex items-center justify-center gap-2 py-3 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-100 dark:border-green-800/30">
              <CheckCircle2 size={16} />
              <span>Sin alertas pendientes. ¡Todo al día!</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Dialog de detalle ──────────────────────────────────────────────── */}

      <Dialog open={dialogTipo !== null} onOpenChange={(open) => !open && setDialogTipo(null)}>
        {dialogActivo && (
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {dialogActivo.icono}
                {dialogActivo.titulo}
              </DialogTitle>
              <DialogDescription>{dialogActivo.descripcion}</DialogDescription>
            </DialogHeader>



              {/* ── Evaluaciones ────────────────────────────────────────── */}
              {([
                { tipo: "eval1_vencidas",    items: eval1Venc, setter: setEval1Venc, vencida: true,  col: "eval_1_calificacion", vacio: "No hay evaluaciones de 1er mes vencidas" },
                { tipo: "eval1_por_vencer",  items: eval1Prox, setter: setEval1Prox, vencida: false, col: "eval_1_calificacion", vacio: "No hay evaluaciones de 1er mes por vencer" },
                { tipo: "eval2_vencidas",    items: eval2Venc, setter: setEval2Venc, vencida: true,  col: "eval_2_calificacion", vacio: "No hay evaluaciones de 2° mes vencidas" },
                { tipo: "eval2_por_vencer",  items: eval2Prox, setter: setEval2Prox, vencida: false, col: "eval_2_calificacion", vacio: "No hay evaluaciones de 2° mes por vencer" },
                { tipo: "eval3_vencidas",    items: eval3Venc, setter: setEval3Venc, vencida: true,  col: "eval_3_calificacion", vacio: "No hay evaluaciones de 3er mes vencidas" },
                { tipo: "eval3_por_vencer",  items: eval3Prox, setter: setEval3Prox, vencida: false, col: "eval_3_calificacion", vacio: "No hay evaluaciones de 3er mes por vencer" },
              ] as const).map(({ tipo, items, setter, vencida, col, vacio }) =>
                dialogTipo === tipo && (
                  <ListaEvals key={tipo} items={items} vencida={vencida} vacio={vacio}
                    onCalificar={async (dbId, cal) => {
                      await supabase.from("nuevo_ingreso").update({ [col]: cal }).eq("id", dbId)
                      setter(prev => prev.filter(i => i.dbId !== dbId))
                    }}
                  />
                )
              )}

              {/* ── RG-REC-048 ──────────────────────────────────────────── */}
              {dialogTipo === "rg_vencidas" && (
                <ListaFechasPorDepto items={rgVenc} vacio="No hay RG-REC-048 pendientes vencidos"
                  colorAvatar="bg-purple-500"
                  colorBadge="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                  colorDias="text-purple-600 dark:text-purple-400"
                  colorBorde="border-purple-400"
                  onEntregado={async (id) => {
                    await supabase.from("nuevo_ingreso").update({ rg_rec_048: "Entregado" }).eq("id", id)
                    setRgVenc(prev => prev.filter(i => i.id !== id))
                  }}
                />
              )}
              {dialogTipo === "rg_por_vencer" && (
                <ListaFechasPorDepto items={rgProx} vacio="No hay RG-REC-048 próximos a vencer"
                  colorAvatar="bg-violet-500"
                  colorBadge="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400"
                  colorDias="text-violet-600 dark:text-violet-400"
                  colorBorde="border-violet-400"
                  onEntregado={async (id) => {
                    await supabase.from("nuevo_ingreso").update({ rg_rec_048: "Entregado" }).eq("id", id)
                    setRgProx(prev => prev.filter(i => i.id !== id))
                  }}
                />
              )}

              {/* ── Término de Contrato ─────────────────────────────────── */}
              {dialogTipo === "termino_vencidos" && (
                <ListaFechasPorDepto items={termVenc} vacio="No hay términos de contrato vencidos"
                  colorAvatar="bg-orange-500"
                  colorBadge="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                  colorDias="text-orange-600 dark:text-orange-400"
                  colorBorde="border-orange-400"
                  onIndeterminado={async (id) => {
                    await supabase.from("nuevo_ingreso").update({ tipo_contrato: "Indeterminado" }).eq("id", id)
                    setTermVenc(prev => prev.filter(i => i.id !== id))
                  }}
                />
              )}
              {dialogTipo === "termino_por_vencer" && (
                <ListaFechasPorDepto items={termProx} vacio="No hay términos de contrato próximos a vencer"
                  colorAvatar="bg-blue-500"
                  colorBadge="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                  colorDias="text-blue-600 dark:text-blue-400"
                  colorBorde="border-blue-400"
                  onIndeterminado={async (id) => {
                    await supabase.from("nuevo_ingreso").update({ tipo_contrato: "Indeterminado" }).eq("id", id)
                    setTermProx(prev => prev.filter(i => i.id !== id))
                  }}
                />
              )}

            {/* Footer */}
            <div className="pt-2 border-t">
              <Link
                href="/nuevo-ingreso"
                className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <User size={14} />
                Ver todos en Nuevo Ingreso
                <ChevronRight size={14} />
              </Link>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-componente compuesto: sección con dos métricas (vencidas + por vencer)
// ─────────────────────────────────────────────────────────────────────────────

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

function Seccion({
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

// ─────────────────────────────────────────────────────────────────────────────
// Utilidad: agrupar por departamento
// ─────────────────────────────────────────────────────────────────────────────

function agruparPorDepto<T extends { departamento: string | null }>(items: T[]): [string, T[]][] {
  const map = new Map<string, T[]>()
  for (const item of items) {
    const key = item.departamento?.trim() || "Sin departamento"
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(item)
  }
  return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-componente: encabezado de departamento dentro del dialog
// ─────────────────────────────────────────────────────────────────────────────

function DeptoHeader({ nombre, count }: { nombre: string; count: number }) {
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

// ─────────────────────────────────────────────────────────────────────────────
// Listas especializadas
// ─────────────────────────────────────────────────────────────────────────────

function ListaEvals({ items, vencida, vacio, onCalificar }: {
  items: EvalItem[]
  vencida: boolean
  vacio: string
  onCalificar: (dbId: string, calificacion: number) => Promise<void>
}) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2">
        <CheckCircle2 className="h-8 w-8 opacity-40" />
        <p className="text-sm">{vacio}</p>
      </div>
    )
  }

  const grupos = agruparPorDepto(items)
  const TAB_ALL = "__all__"
  const compactDepto = (nombre: string) => (nombre.length > 14 ? `${nombre.slice(0, 12)}…` : nombre)

  return (
    <>
      {/* Mobile: tabs por departamento (solo muestra los que tienen evaluaciones) */}
      <div className="sm:hidden">
        <Tabs defaultValue={TAB_ALL} className="w-full">
          <div className="sticky top-0 z-10 -mx-1 rounded-xl bg-card/95 px-1 pb-1.5 backdrop-blur supports-[backdrop-filter]:bg-card/80">
            <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 overflow-visible rounded-xl p-1">
              <TabsTrigger value={TAB_ALL} className="min-h-8 gap-1 px-2 py-1 text-[11px] leading-none">
                Todo
                <Badge variant="secondary" className="h-4 min-w-4 rounded-full px-1 text-[10px]">
                  {items.length}
                </Badge>
              </TabsTrigger>
              {grupos.map(([depto, miembros]) => (
                <TabsTrigger
                  key={depto}
                  value={depto}
                  aria-label={`${depto}: ${miembros.length} evaluaciones`}
                  className="min-h-8 max-w-[48%] gap-1 px-2 py-1 text-[11px] leading-none"
                >
                  <span className="truncate">{compactDepto(depto)}</span>
                  <Badge variant="secondary" className="h-4 min-w-4 rounded-full px-1 text-[10px]">
                    {miembros.length}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value={TAB_ALL} className="mt-2 space-y-2">
            {items.map((item) => (
              <FilaEval
                key={item.id}
                item={item}
                colorAvatar={vencida ? "bg-red-500" : "bg-amber-500"}
                colorDias={vencida ? "text-red-500 dark:text-red-400" : "text-amber-500 dark:text-amber-400"}
                colorBadge={vencida
                  ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"}
                colorBorde={vencida ? "border-red-400" : "border-amber-400"}
                badgeLabel={vencida ? "Vencida" : "Por vencer"}
                onCalificar={onCalificar}
              />
            ))}
          </TabsContent>

          {grupos.map(([depto, miembros]) => (
            <TabsContent key={depto} value={depto} className="mt-2 space-y-2">
              {miembros.map((item) => (
                <FilaEval
                  key={item.id}
                  item={item}
                  colorAvatar={vencida ? "bg-red-500" : "bg-amber-500"}
                  colorDias={vencida ? "text-red-500 dark:text-red-400" : "text-amber-500 dark:text-amber-400"}
                  colorBadge={vencida
                    ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"}
                  colorBorde={vencida ? "border-red-400" : "border-amber-400"}
                  badgeLabel={vencida ? "Vencida" : "Por vencer"}
                  onCalificar={onCalificar}
                />
              ))}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Desktop: agrupado por departamento */}
      <div className="hidden space-y-3 sm:block">
        {grupos.map(([depto, miembros]) => (
          <div key={depto}>
            <DeptoHeader nombre={depto} count={miembros.length} />
            <div className="mt-1.5 space-y-2">
              {miembros.map((item) => (
                <FilaEval
                  key={item.id}
                  item={item}
                  colorAvatar={vencida ? "bg-red-500" : "bg-amber-500"}
                  colorDias={vencida ? "text-red-500 dark:text-red-400" : "text-amber-500 dark:text-amber-400"}
                  colorBadge={vencida
                    ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"}
                  colorBorde={vencida ? "border-red-400" : "border-amber-400"}
                  badgeLabel={vencida ? "Vencida" : "Por vencer"}
                  onCalificar={onCalificar}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

function ListaFechasPorDepto({
  items, vacio,
  colorAvatar, colorBadge, colorDias, colorBorde,
  onEntregado, onIndeterminado,
}: {
  items: FechaItem[]; vacio: string
  colorAvatar: string; colorBadge: string; colorDias: string; colorBorde: string
  onEntregado?:     (id: string) => Promise<void>
  onIndeterminado?: (id: string) => Promise<void>
}) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2">
        <CheckCircle2 className="h-8 w-8 opacity-40" />
        <p className="text-sm">{vacio}</p>
      </div>
    )
  }

  const grupos = agruparPorDepto(items)

  return (
    <div className="space-y-3">
      {grupos.map(([depto, miembros]) => (
        <div key={depto}>
          <DeptoHeader nombre={depto} count={miembros.length} />
          <div className="space-y-2 mt-1.5">
            {miembros.map((item) => (
              <FilaFecha key={item.id} item={item}
                colorAvatar={colorAvatar}
                colorBadge={colorBadge}
                colorDias={colorDias}
                colorBorde={colorBorde}
                onEntregado={onEntregado}
                onIndeterminado={onIndeterminado}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}


