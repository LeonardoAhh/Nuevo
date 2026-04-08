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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { supabase } from "@/lib/supabase/client"
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
  nombre: string
  departamento: string | null
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
  colorFondo: string
  onClick: () => void
  loading: boolean
}

function Metrica({ icono, label, valor, colorValor, colorFondo, onClick, loading }: MetricaProps) {
  return (
    <button
      onClick={onClick}
      disabled={loading || valor === 0}
      className={`
        group flex items-center gap-2.5 p-2.5 sm:p-3 rounded-xl border transition-all duration-200
        ${colorFondo}
        ${valor > 0 && !loading
          ? "cursor-pointer hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
          : "cursor-default opacity-75"
        }
      `}
    >
      <span className={`flex-shrink-0 p-1.5 rounded-lg ${colorValor} bg-white/60 dark:bg-black/20`}>
        {icono}
      </span>
      <div className="flex flex-col flex-1 min-w-0">
        {loading ? (
          <div className="h-6 w-8 bg-current/10 rounded animate-pulse" />
        ) : (
          <span className={`text-xl font-bold leading-none ${colorValor}`}>{valor}</span>
        )}
        <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-tight truncate">{label}</span>
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
      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
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
}

function FilaEval({ item, colorAvatar, colorDias, colorBadge, colorBorde, badgeLabel }: FilaEvalProps) {
  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border-l-4 bg-white dark:bg-gray-800/60 shadow-sm ${colorBorde}`}>
      {/* Avatar */}
      <div className={`flex-shrink-0 h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-sm ${colorAvatar}`}>
        {item.nombre.charAt(0).toUpperCase()}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-sm dark:text-white leading-tight truncate">
            {item.nombre}
          </p>
          <span className={`text-xs font-bold shrink-0 ${colorDias}`}>{dias(item.diasDiff)}</span>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">
          {item.departamento ?? "Sin departamento"}
        </p>
        <div className="flex items-center justify-between mt-2">
          <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full w-fit ${colorBadge}`}>
            {badgeLabel}
          </span>
          <span className="text-xs text-gray-400 dark:text-gray-500">{formatDate(item.fecha)}</span>
        </div>
      </div>
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
}

function FilaFecha({ item, colorAvatar, colorBadge, colorDias, colorBorde }: FilaFechaProps) {
  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border-l-4 bg-white dark:bg-gray-800/60 shadow-sm ${colorBorde}`}>
      {/* Avatar */}
      <div className={`flex-shrink-0 h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-sm ${colorAvatar}`}>
        {item.nombre.charAt(0).toUpperCase()}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-sm dark:text-white leading-tight truncate">
            {item.nombre}
          </p>
          <span className={`text-xs font-bold shrink-0 ${colorDias}`}>{dias(item.diasDiff)}</span>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">
          {[item.puesto, item.departamento].filter(Boolean).join(" · ") || "Sin información"}
        </p>
        <div className="flex items-center justify-between mt-2">
          <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full w-fit ${colorBadge}`}>
            {item.etiqueta}
          </span>
          <span className="text-xs text-gray-400 dark:text-gray-500">{formatDate(item.fecha)}</span>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: lista con estado vacío
// ─────────────────────────────────────────────────────────────────────────────

function Lista({ children, vacio }: { children: React.ReactNode[]; vacio: string }) {
  if (children.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-gray-400 dark:text-gray-500 gap-2">
        <CheckCircle2 className="h-8 w-8 opacity-40" />
        <p className="text-sm">{vacio}</p>
      </div>
    )
  }
  return <div className="space-y-2">{children}</div>
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
      nombre: r.nombre,
      departamento: r.departamento,
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
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-semibold dark:text-white flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Alertas de Vencimiento
            </CardTitle>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Haz clic en una métrica para ver el detalle
            </p>
          </div>
          <Button
            variant="ghost" size="icon"
            className="h-8 w-8 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            onClick={cargarDatos} disabled={loading} title="Actualizar"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </CardHeader>

        <CardContent className="space-y-3 pt-0">

          {/* ── Eval 1er Mes ──────────────────────────────────────────────── */}
          <Seccion
            icono={<GraduationCap className="h-3.5 w-3.5 text-gray-400" />}
            label="Evaluación 1er Mes"
            vencidas={n(eval1Venc)}   colorV="text-red-600 dark:text-red-400"
            fondoV="bg-red-50 border-red-100 dark:bg-red-900/10 dark:border-red-800/30"
            porVencer={n(eval1Prox)}  colorP="text-amber-600 dark:text-amber-400"
            fondoP="bg-amber-50 border-amber-100 dark:bg-amber-900/10 dark:border-amber-800/30"
            umbrales={EVAL_UMBRAL_DIAS}
            onVencidas={() => setDialogTipo("eval1_vencidas")}
            onPorVencer={() => setDialogTipo("eval1_por_vencer")}
            loading={loading}
          />
          <hr className="border-gray-100 dark:border-gray-700" />
          {/* ── Eval 2° Mes ───────────────────────────────────────────────── */}
          <Seccion
            icono={<GraduationCap className="h-3.5 w-3.5 text-gray-400" />}
            label="Evaluación 2° Mes"
            vencidas={n(eval2Venc)}   colorV="text-red-600 dark:text-red-400"
            fondoV="bg-red-50 border-red-100 dark:bg-red-900/10 dark:border-red-800/30"
            porVencer={n(eval2Prox)}  colorP="text-amber-600 dark:text-amber-400"
            fondoP="bg-amber-50 border-amber-100 dark:bg-amber-900/10 dark:border-amber-800/30"
            umbrales={EVAL_UMBRAL_DIAS}
            onVencidas={() => setDialogTipo("eval2_vencidas")}
            onPorVencer={() => setDialogTipo("eval2_por_vencer")}
            loading={loading}
          />
          <hr className="border-gray-100 dark:border-gray-700" />
          {/* ── Eval 3er Mes ──────────────────────────────────────────────── */}
          <Seccion
            icono={<GraduationCap className="h-3.5 w-3.5 text-gray-400" />}
            label="Evaluación 3er Mes"
            vencidas={n(eval3Venc)}   colorV="text-red-600 dark:text-red-400"
            fondoV="bg-red-50 border-red-100 dark:bg-red-900/10 dark:border-red-800/30"
            porVencer={n(eval3Prox)}  colorP="text-amber-600 dark:text-amber-400"
            fondoP="bg-amber-50 border-amber-100 dark:bg-amber-900/10 dark:border-amber-800/30"
            umbrales={EVAL_UMBRAL_DIAS}
            onVencidas={() => setDialogTipo("eval3_vencidas")}
            onPorVencer={() => setDialogTipo("eval3_por_vencer")}
            loading={loading}
          />
          <hr className="border-gray-100 dark:border-gray-700" />
          {/* ── RG-REC-048 ────────────────────────────────────────────────── */}
          <Seccion
            icono={<ShieldAlert className="h-3.5 w-3.5 text-gray-400" />}
            label="RG-REC-048"
            vencidas={n(rgVenc)}     colorV="text-purple-600 dark:text-purple-400"
            fondoV="bg-purple-50 border-purple-100 dark:bg-purple-900/10 dark:border-purple-800/30"
            porVencer={n(rgProx)}    colorP="text-violet-600 dark:text-violet-400"
            fondoP="bg-violet-50 border-violet-100 dark:bg-violet-900/10 dark:border-violet-800/30"
            umbrales={RG_UMBRAL_DIAS}
            onVencidas={() => setDialogTipo("rg_vencidas")}
            onPorVencer={() => setDialogTipo("rg_por_vencer")}
            loading={loading}
          />
          <hr className="border-gray-100 dark:border-gray-700" />
          {/* ── Término de Contrato ───────────────────────────────────────── */}
          <Seccion
            icono={<FileText className="h-3.5 w-3.5 text-gray-400" />}
            label="Término de Contrato"
            vencidas={n(termVenc)}   colorV="text-orange-600 dark:text-orange-400"
            fondoV="bg-orange-50 border-orange-100 dark:bg-orange-900/10 dark:border-orange-800/30"
            porVencer={n(termProx)}  colorP="text-blue-600 dark:text-blue-400"
            fondoP="bg-blue-50 border-blue-100 dark:bg-blue-900/10 dark:border-blue-800/30"
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
          <DialogContent className="sm:max-w-lg dark:bg-gray-900 dark:border-gray-700">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 dark:text-white">
                {dialogActivo.icono}
                {dialogActivo.titulo}
              </DialogTitle>
              <DialogDescription>{dialogActivo.descripcion}</DialogDescription>
            </DialogHeader>

            {/* ── Evaluaciones ──────────────────────────────────────────── */}
            {dialogTipo === "eval1_vencidas" && (
              <ListaEvals items={eval1Venc} vencida vacio="No hay evaluaciones de 1er mes vencidas" />
            )}
            {dialogTipo === "eval1_por_vencer" && (
              <ListaEvals items={eval1Prox} vencida={false} vacio="No hay evaluaciones de 1er mes por vencer" />
            )}
            {dialogTipo === "eval2_vencidas" && (
              <ListaEvals items={eval2Venc} vencida vacio="No hay evaluaciones de 2° mes vencidas" />
            )}
            {dialogTipo === "eval2_por_vencer" && (
              <ListaEvals items={eval2Prox} vencida={false} vacio="No hay evaluaciones de 2° mes por vencer" />
            )}
            {dialogTipo === "eval3_vencidas" && (
              <ListaEvals items={eval3Venc} vencida vacio="No hay evaluaciones de 3er mes vencidas" />
            )}
            {dialogTipo === "eval3_por_vencer" && (
              <ListaEvals items={eval3Prox} vencida={false} vacio="No hay evaluaciones de 3er mes por vencer" />
            )}

            {/* ── RG-REC-048 ────────────────────────────────────────────── */}
            {dialogTipo === "rg_vencidas" && (
              <Lista vacio="No hay RG-REC-048 pendientes vencidos">
                {rgVenc.map((item) => (
                  <FilaFecha key={item.id} item={item}
                    colorAvatar="bg-purple-500"
                    colorBadge="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                    colorDias="text-purple-600 dark:text-purple-400"
                    colorBorde="border-purple-400"
                  />
                ))}
              </Lista>
            )}
            {dialogTipo === "rg_por_vencer" && (
              <Lista vacio="No hay RG-REC-048 próximos a vencer">
                {rgProx.map((item) => (
                  <FilaFecha key={item.id} item={item}
                    colorAvatar="bg-violet-500"
                    colorBadge="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400"
                    colorDias="text-violet-600 dark:text-violet-400"
                    colorBorde="border-violet-400"
                  />
                ))}
              </Lista>
            )}

            {/* ── Término de Contrato ───────────────────────────────────── */}
            {dialogTipo === "termino_vencidos" && (
              <Lista vacio="No hay términos de contrato vencidos">
                {termVenc.map((item) => (
                  <FilaFecha key={item.id} item={item}
                    colorAvatar="bg-orange-500"
                    colorBadge="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                    colorDias="text-orange-600 dark:text-orange-400"
                    colorBorde="border-orange-400"
                  />
                ))}
              </Lista>
            )}
            {dialogTipo === "termino_por_vencer" && (
              <Lista vacio="No hay términos de contrato próximos a vencer">
                {termProx.map((item) => (
                  <FilaFecha key={item.id} item={item}
                    colorAvatar="bg-blue-500"
                    colorBadge="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    colorDias="text-blue-600 dark:text-blue-400"
                    colorBorde="border-blue-400"
                  />
                ))}
              </Lista>
            )}

            {/* Footer */}
            <div className="pt-2 border-t dark:border-gray-700">
              <a
                href="/nuevo-ingreso"
                className="flex items-center justify-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                <User size={14} />
                Ver todos en Nuevo Ingreso
                <ChevronRight size={14} />
              </a>
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
  vencidas: number;  colorV: string; fondoV: string
  porVencer: number; colorP: string; fondoP: string
  umbrales: number
  onVencidas: () => void
  onPorVencer: () => void
  loading: boolean
}

function Seccion({
  icono, label,
  vencidas, colorV, fondoV,
  porVencer, colorP, fondoP,
  umbrales, onVencidas, onPorVencer, loading,
}: SeccionProps) {
  return (
    <div>
      <SeccionHeader icono={icono} label={label} />
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <Metrica
          icono={<XCircle size={16} />}
          label="Vencidas"
          valor={vencidas}
          colorValor={colorV}
          colorFondo={fondoV}
          onClick={onVencidas}
          loading={loading}
        />
        <Metrica
          icono={<Clock size={16} />}
          label={`Por vencer (${umbrales}d)`}
          valor={porVencer}
          colorValor={colorP}
          colorFondo={fondoP}
          onClick={onPorVencer}
          loading={loading}
        />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Listas especializadas
// ─────────────────────────────────────────────────────────────────────────────

function ListaEvals({ items, vencida, vacio }: { items: EvalItem[]; vencida: boolean; vacio: string }) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-gray-400 dark:text-gray-500 gap-2">
        <CheckCircle2 className="h-8 w-8 opacity-40" />
        <p className="text-sm">{vacio}</p>
      </div>
    )
  }
  return (
    <div className="space-y-2">
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
        />
      ))}
    </div>
  )
}


