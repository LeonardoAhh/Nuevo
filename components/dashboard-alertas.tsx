"use client"

import { useMemo, useState } from "react"
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  User,
  Calendar,
  ChevronRight,
  ChevronLeft,
  GraduationCap,
  FileText,
  ShieldAlert,
  Pencil,
  Search,
  Briefcase,
  Building2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ResponsiveShell, ModalToolbar } from "@/components/ui/responsive-shell"
import Link from "next/link"
import {
  dias,
  formatDate,
  EVAL_UMBRAL_DIAS,
  RG_UMBRAL_DIAS,
  TERMINO_UMBRAL_DIAS,
  type EvalItem,
  type FechaItem,
  type DialogTipo,
} from "@/lib/hooks/useDashboardAlertas"
import { useDashboardAlertasShared } from "@/components/dashboard-alertas-context"

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
// Componente principal
// ─────────────────────────────────────────────────────────────────────────────

export default function DashboardAlertas() {
  const {
    loading, dialogTipo, setDialogTipo, cargarDatos,
    eval1Venc, eval1Prox, setEval1Venc, setEval1Prox,
    eval2Venc, eval2Prox, setEval2Venc, setEval2Prox,
    eval3Venc, eval3Prox, setEval3Venc, setEval3Prox,
    rgVenc, rgProx, setRgVenc, setRgProx,
    termVenc, termProx, setTermVenc, setTermProx,
    totalAlertas,
    calificarEval, marcarRgEntregado, marcarIndeterminado,
  } = useDashboardAlertasShared()

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

        <CardContent className="grid grid-cols-1 gap-3 pt-0 md:grid-cols-2 xl:grid-cols-3">

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

      <ResponsiveShell
        open={dialogTipo !== null}
        onClose={() => setDialogTipo(null)}
        title={dialogActivo?.titulo ?? ""}
        description={dialogActivo?.descripcion}
        maxWidth="sm:max-w-lg lg:max-w-6xl xl:max-w-7xl"
      >
        {dialogActivo && (
          <>
            <ModalToolbar
              title={dialogActivo.titulo}
              subtitle={dialogActivo.descripcion}
              saving={false}
              onClose={() => setDialogTipo(null)}
            />

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-0 sm:space-y-3 sm:overflow-y-auto sm:p-4 lg:flex lg:flex-col lg:space-y-0 lg:overflow-hidden lg:p-0">
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
                      await calificarEval(dbId, col, cal)
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
                    await marcarRgEntregado(id)
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
                    await marcarRgEntregado(id)
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
                    await marcarIndeterminado(id)
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
                    await marcarIndeterminado(id)
                    setTermProx(prev => prev.filter(i => i.id !== id))
                  }}
                />
              )}

              {/* Footer */}
              <div className="shrink-0 border-t px-4 py-3">
                <Link
                  href="/ingresos"
                  className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <User size={14} />
                  Ver todos en Nuevo Ingreso
                  <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          </>
        )}
      </ResponsiveShell>
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

  return (
    <>
      {/* Mobile (<sm): stack lista → detalle */}
      <div className="flex min-h-0 flex-1 flex-col sm:hidden">
        <MobileStackEvals items={items} vencida={vencida} onCalificar={onCalificar} />
      </div>

      {/* Tablet (sm–md): agrupado por departamento */}
      <div className="hidden space-y-3 sm:block lg:hidden">
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

      {/* Desktop (lg+): master-detail */}
      <div className="hidden lg:block">
        <MasterDetailEvals items={items} vencida={vencida} onCalificar={onCalificar} />
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
    <>
      {/* Mobile (<sm): stack lista → detalle */}
      <div className="flex min-h-0 flex-1 flex-col sm:hidden">
        <MobileStackFechas
          items={items}
          colorBadge={colorBadge}
          colorDias={colorDias}
          onEntregado={onEntregado}
          onIndeterminado={onIndeterminado}
        />
      </div>

      {/* Tablet (sm–md): agrupado por departamento */}
      <div className="hidden space-y-3 sm:block lg:hidden">
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

      {/* Desktop (lg+): master-detail */}
      <div className="hidden lg:block">
        <MasterDetailFechas
          items={items}
          colorBadge={colorBadge}
          colorDias={colorDias}
          onEntregado={onEntregado}
          onIndeterminado={onIndeterminado}
        />
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: iniciales para avatar
// ─────────────────────────────────────────────────────────────────────────────

function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean)
  if (partes.length === 0) return "?"
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-componentes compartidos master-detail
// ─────────────────────────────────────────────────────────────────────────────

interface MasterHeaderProps {
  total: number
  filtrados: number
  search: string
  onSearchChange: (v: string) => void
  depto: string
  onDeptoChange: (v: string) => void
  deptos: string[]
}

function MasterHeader({
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

function MasterListItem({ nombre, meta, diasLabel, fechaLabel, selected, tone, onSelect }: MasterListItemProps) {
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

function MasterEmpty({ mensaje }: { mensaje: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-muted-foreground">
      <CheckCircle2 className="h-10 w-10 opacity-40" />
      <p className="text-sm">{mensaje}</p>
    </div>
  )
}

function DetalleStat({
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

// ─────────────────────────────────────────────────────────────────────────────
// Master-Detail desktop: Evaluaciones
// ─────────────────────────────────────────────────────────────────────────────

interface MasterDetailEvalsProps {
  items: EvalItem[]
  vencida: boolean
  onCalificar: (dbId: string, calificacion: number) => Promise<void>
}

function MasterDetailEvals({ items, vencida, onCalificar }: MasterDetailEvalsProps) {
  const tone: "destructive" | "warning" = vencida ? "destructive" : "warning"
  const badgeLabel = vencida ? "Vencida" : "Por vencer"
  const badgeClass = vencida
    ? "bg-destructive/10 text-destructive"
    : "bg-warning/10 text-warning"
  const toneText = vencida ? "text-destructive" : "text-warning"

  const [search, setSearch] = useState("")
  const [depto, setDepto]   = useState("")
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
      return (
        i.nombre.toLowerCase().includes(q) ||
        dep.toLowerCase().includes(q) ||
        (i.turno ?? "").toLowerCase().includes(q)
      )
    })
  }, [items, search, depto])

  const seleccionado = useMemo(
    () => filtrados.find(i => i.id === selectedId) ?? filtrados[0] ?? null,
    [filtrados, selectedId],
  )

  return (
    <div className="grid h-[70vh] grid-cols-[minmax(0,360px)_1fr] overflow-hidden rounded-b-xl border-t">
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
          {filtrados.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              Sin resultados con los filtros actuales.
            </p>
          ) : (
            filtrados.map(i => (
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
            ))
          )}
        </div>
      </aside>

      <section className="scrollbar-thin h-full overflow-y-auto p-6">
        {!seleccionado ? (
          <MasterEmpty mensaje="Selecciona una evaluación para ver el detalle." />
        ) : (
          <DetalleEval
            key={seleccionado.id}
            item={seleccionado}
            badgeLabel={badgeLabel}
            badgeClass={badgeClass}
            toneText={toneText}
            onCalificar={onCalificar}
            onAfterSave={() => {
              const idx = filtrados.findIndex(i => i.id === seleccionado.id)
              const next = filtrados[idx + 1] ?? filtrados[idx - 1] ?? null
              setSelectedId(next?.id ?? null)
            }}
          />
        )}
      </section>
    </div>
  )
}

interface DetalleEvalProps {
  item: EvalItem
  badgeLabel: string
  badgeClass: string
  toneText: string
  onCalificar: (dbId: string, calificacion: number) => Promise<void>
  onAfterSave: () => void
}

function DetalleEval({ item, badgeLabel, badgeClass, toneText, onCalificar, onAfterSave }: DetalleEvalProps) {
  const [calStr, setCalStr] = useState("")
  const [saving, setSaving] = useState(false)

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
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <header className="flex items-start gap-4">
        <span
          aria-hidden
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-lg font-semibold ${badgeClass}`}
        >
          {iniciales(item.nombre)}
        </span>
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
        <DetalleStat label="Fecha programada" value={formatDate(item.fecha)} icon={<Calendar size={14} aria-hidden />} />
        <DetalleStat label="Antigüedad" value={dias(item.diasDiff)} icon={<Clock size={14} aria-hidden />} valueClass={toneText} />
      </dl>

      <div className="rounded-2xl border bg-muted/30 p-4">
        <h4 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <Pencil size={14} aria-hidden /> Calificar evaluación
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
            onClick={handleGuardar}
            disabled={saving || calStr === ""}
            className="h-10"
          >
            {saving ? "Guardando…" : "Guardar"}
          </Button>
          <p className="ml-auto text-xs text-muted-foreground">
            Pulsa <kbd className="rounded border bg-background px-1 text-[10px]">Enter</kbd> para guardar.
          </p>
        </div>
      </div>

      <Link
        href={`/ingresos?id=${item.dbId}`}
        className="inline-flex items-center gap-1.5 self-start text-sm font-medium text-primary hover:underline"
      >
        <User size={14} aria-hidden />
        Ver expediente completo
        <ChevronRight size={14} aria-hidden />
      </Link>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Master-Detail desktop: Fechas (RG / Término)
// ─────────────────────────────────────────────────────────────────────────────

interface MasterDetailFechasProps {
  items: FechaItem[]
  colorBadge: string
  colorDias: string
  onEntregado?:     (id: string) => Promise<void>
  onIndeterminado?: (id: string) => Promise<void>
}

function MasterDetailFechas({
  items, colorBadge, colorDias, onEntregado, onIndeterminado,
}: MasterDetailFechasProps) {
  const tone: "destructive" | "warning" =
    items.some(i => i.diasDiff < 0) ? "destructive" : "warning"

  const [search, setSearch] = useState("")
  const [depto, setDepto]   = useState("")
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
      return (
        i.nombre.toLowerCase().includes(q) ||
        dep.toLowerCase().includes(q) ||
        (i.puesto ?? "").toLowerCase().includes(q)
      )
    })
  }, [items, search, depto])

  const seleccionado = useMemo(
    () => filtrados.find(i => i.id === selectedId) ?? filtrados[0] ?? null,
    [filtrados, selectedId],
  )

  function avanzar() {
    if (!seleccionado) return
    const idx = filtrados.findIndex(i => i.id === seleccionado.id)
    const next = filtrados[idx + 1] ?? filtrados[idx - 1] ?? null
    setSelectedId(next?.id ?? null)
  }

  return (
    <div className="grid h-[70vh] grid-cols-[minmax(0,360px)_1fr] overflow-hidden rounded-b-xl border-t">
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
          {filtrados.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              Sin resultados con los filtros actuales.
            </p>
          ) : (
            filtrados.map(i => (
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
            ))
          )}
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
            onAfterAction={avanzar}
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
  onEntregado?:     (id: string) => Promise<void>
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
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <header className="flex items-start gap-4">
        <span
          aria-hidden
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-lg font-semibold ${colorBadge}`}
        >
          {iniciales(item.nombre)}
        </span>
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
        <DetalleStat label="Fecha" value={formatDate(item.fecha)} icon={<Calendar size={14} aria-hidden />} />
        <DetalleStat label="Antigüedad" value={dias(item.diasDiff)} icon={<Clock size={14} aria-hidden />} valueClass={colorDias} />
      </dl>

      {(onEntregado || onIndeterminado) && (
        <div className="rounded-2xl border bg-muted/30 p-4">
          <h4 className="mb-3 text-sm font-semibold text-foreground">Acción rápida</h4>
          <div className="flex flex-wrap items-center gap-2">
            {onEntregado && (
              <Button onClick={() => handle(onEntregado)} disabled={saving} className="h-10 gap-1.5">
                <CheckCircle2 size={14} aria-hidden />
                {saving ? "Guardando…" : "Marcar entregado"}
              </Button>
            )}
            {onIndeterminado && (
              <Button onClick={() => handle(onIndeterminado)} disabled={saving} className="h-10 gap-1.5">
                <CheckCircle2 size={14} aria-hidden />
                {saving ? "Guardando…" : "Marcar como Indeterminado"}
              </Button>
            )}
          </div>
        </div>
      )}

      <Link
        href={`/ingresos?id=${item.id}`}
        className="inline-flex items-center gap-1.5 self-start text-sm font-medium text-primary hover:underline"
      >
        <User size={14} aria-hidden />
        Ver expediente completo
        <ChevronRight size={14} aria-hidden />
      </Link>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Mobile stack: toolbar + lista → detalle. Reutiliza piezas master-detail.
// ─────────────────────────────────────────────────────────────────────────────

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
          placeholder="Buscar nombre o depto…"
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
            <SelectItem value="__all__">Todos los departamentos</SelectItem>
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
  nombre, badgeLabel, badgeClass, onBack,
}: { nombre: string; badgeLabel: string; badgeClass: string; onBack: () => void }) {
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
      <Badge className={`shrink-0 ${badgeClass}`} variant="secondary">{badgeLabel}</Badge>
    </div>
  )
}

function MobileStackEvals({
  items, vencida, onCalificar,
}: {
  items: EvalItem[]
  vencida: boolean
  onCalificar: (dbId: string, calificacion: number) => Promise<void>
}) {
  const tone: "destructive" | "warning" = vencida ? "destructive" : "warning"
  const badgeLabel = vencida ? "Vencida" : "Por vencer"
  const badgeClass = vencida
    ? "bg-destructive/10 text-destructive"
    : "bg-warning/10 text-warning"
  const toneText = vencida ? "text-destructive" : "text-warning"

  const [search, setSearch] = useState("")
  const [depto, setDepto]   = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [calStr, setCalStr] = useState("")
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
      return i.nombre.toLowerCase().includes(q) || dep.toLowerCase().includes(q)
    })
  }, [items, search, depto])

  const seleccionado = useMemo(
    () => items.find(i => i.id === selectedId) ?? null,
    [items, selectedId],
  )

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
        />
        <div className="scrollbar-thin flex-1 space-y-4 overflow-y-auto p-4">
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className={`flex h-12 w-12 items-center justify-center rounded-2xl text-base font-semibold ${badgeClass}`}
            >
              {iniciales(seleccionado.nombre)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-semibold text-foreground">{seleccionado.nombre}</p>
              <p className="truncate text-xs text-muted-foreground">
                {[seleccionado.departamento, seleccionado.turno && `Turno ${seleccionado.turno}`]
                  .filter(Boolean).join(" · ") || "Sin departamento"}
              </p>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-2">
            <DetalleStat label="Fecha" value={formatDate(seleccionado.fecha)} icon={<Calendar size={12} aria-hidden />} />
            <DetalleStat label="Antigüedad" value={dias(seleccionado.diasDiff)} icon={<Clock size={12} aria-hidden />} valueClass={toneText} />
          </dl>

          <div className="rounded-2xl border bg-muted/30 p-3">
            <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <Pencil size={14} aria-hidden /> Calificación
            </h4>
            <Input
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              min={0}
              max={100}
              value={calStr}
              onChange={(e) => setCalStr(e.target.value)}
              placeholder="0 – 100"
              className="h-11 text-base"
              aria-label="Calificación"
              autoFocus
            />
          </div>
        </div>

        <div
          className="sticky bottom-0 border-t bg-card/95 p-3 backdrop-blur supports-[backdrop-filter]:bg-card/80"
          style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
        >
          <Button
            onClick={guardar}
            disabled={saving || calStr === ""}
            className="h-12 w-full text-base"
          >
            {saving ? "Guardando…" : "Guardar calificación"}
          </Button>
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
        {filtrados.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">
            Sin resultados con los filtros actuales.
          </p>
        ) : (
          filtrados.map(i => (
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
          ))
        )}
      </div>
    </div>
  )
}

function MobileStackFechas({
  items, colorBadge, colorDias, onEntregado, onIndeterminado,
}: {
  items: FechaItem[]
  colorBadge: string
  colorDias: string
  onEntregado?:     (id: string) => Promise<void>
  onIndeterminado?: (id: string) => Promise<void>
}) {
  const tone: "destructive" | "warning" =
    items.some(i => i.diasDiff < 0) ? "destructive" : "warning"

  const [search, setSearch] = useState("")
  const [depto, setDepto]   = useState("")
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
        <div className="scrollbar-thin flex-1 space-y-4 overflow-y-auto p-4">
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className={`flex h-12 w-12 items-center justify-center rounded-2xl text-base font-semibold ${colorBadge}`}
            >
              {iniciales(seleccionado.nombre)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-semibold text-foreground">{seleccionado.nombre}</p>
              <p className="truncate text-xs text-muted-foreground">
                {[seleccionado.puesto, seleccionado.departamento].filter(Boolean).join(" · ") || "Sin información"}
              </p>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-2">
            <DetalleStat label="Fecha" value={formatDate(seleccionado.fecha)} icon={<Calendar size={12} aria-hidden />} />
            <DetalleStat label="Antigüedad" value={dias(seleccionado.diasDiff)} icon={<Clock size={12} aria-hidden />} valueClass={colorDias} />
          </dl>
        </div>

        {(onEntregado || onIndeterminado) && (
          <div
            className="sticky bottom-0 flex flex-col gap-2 border-t bg-card/95 p-3 backdrop-blur supports-[backdrop-filter]:bg-card/80"
            style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
          >
            {onEntregado && (
              <Button
                onClick={() => ejecutar(onEntregado)}
                disabled={saving}
                className="h-12 w-full gap-1.5 text-base"
              >
                <CheckCircle2 size={16} aria-hidden />
                {saving ? "Guardando…" : "Marcar entregado"}
              </Button>
            )}
            {onIndeterminado && (
              <Button
                onClick={() => ejecutar(onIndeterminado)}
                disabled={saving}
                className="h-12 w-full gap-1.5 text-base"
              >
                <CheckCircle2 size={16} aria-hidden />
                {saving ? "Guardando…" : "Marcar como Indeterminado"}
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
        {filtrados.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">
            Sin resultados con los filtros actuales.
          </p>
        ) : (
          filtrados.map(i => (
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
          ))
        )}
      </div>
    </div>
  )
}


