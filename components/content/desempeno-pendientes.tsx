"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  RefreshCw, GraduationCap, Users, Calendar, Building2,
  Layers, Clock3, CheckCircle2, X, CalendarCheck, FileText,
  UserPlus, CalendarRange,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import {
  usePendingEvals,
  type EmployeePending,
  type PendingEvalEntry,
} from "@/lib/hooks/usePendingEvals"
import { formatDate } from "@/lib/hooks/useNuevoIngreso"
import { dias } from "@/lib/hooks/useDashboardAlertas"
import { PERIODOS_DESEMPENO } from "@/lib/catalogo"
import DesempenoSemestralPendientes from "./desempeno-semestral-pendientes"

// ─── Motion variants ──────────────────────────────────────────────────────────

const EASE_OUT = [0.22, 1, 0.36, 1] as const

const containerV = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
}

const itemV = {
  hidden: { opacity: 0, scale: 0.88, y: 6 },
  show: {
    opacity: 1, scale: 1, y: 0,
    transition: { duration: 0.28, ease: EASE_OUT },
  },
  exit: { opacity: 0, scale: 0.88, y: 4, transition: { duration: 0.18 } },
}

const detailV = {
  hidden: { opacity: 0, height: 0, marginTop: 0 },
  show: {
    opacity: 1, height: "auto", marginTop: "0.5rem",
    transition: { duration: 0.25, ease: EASE_OUT },
  },
  exit: {
    opacity: 0, height: 0, marginTop: 0,
    transition: { duration: 0.2, ease: EASE_OUT },
  },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MESES_ES = [
  "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO",
  "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE",
] as const

/** Devuelve "ABRIL - MAYO" dado "2024-05-15" */
function periodoLabel(fechaIso: string): string {
  const m = Number(fechaIso.split("-")[1]) // 1-indexed
  const start = m === 1 ? 12 : m - 1
  return `${MESES_ES[start - 1]} – ${MESES_ES[m - 1]}`
}

// ─── Tokens de período — clases semánticas del sistema ───────────────────────
// Evita hsl() inline; usa los tokens con opacidad vía Tailwind slash notation.
// Si necesitas añadir un cuarto período, solo edita este objeto.

type Periodo = PendingEvalEntry["periodo"]

const PERIODO_BADGE: Record<Periodo, { bg: string; text: string }> = {
  "1er Mes": { bg: "bg-info/15",    text: "text-info" },
  "2° Mes":  { bg: "bg-chart-4/15", text: "text-chart-4" },
  "3er Mes": { bg: "bg-warning/15", text: "text-warning" },
}

// Asegúrate de añadir en tu tailwind.config.js:
// theme.extend.colors: { info: "hsl(var(--info))", warning: "hsl(var(--warning))",
//   success: "hsl(var(--success))", "chart-4": "hsl(var(--chart-4))" }
// Así Tailwind genera las utilities bg-info, text-info, bg-info/15, etc.

// ─── DetailCard ───────────────────────────────────────────────────────────────

interface DetailCardProps {
  item: EmployeePending
  onClose: () => void
}

// Memoizable: extraer stats fuera del render evita recrear el array cada vez
function buildStats(item: EmployeePending) {
  const planStatus = () => {
    if (item.rg_rec_048 === "Entregado") {
      return <span className="font-bold text-success">Entregado</span>
    }
    if (!item.fecha_vencimiento_rg || item.rg_dias_diff === null) {
      return <span className="italic text-muted-foreground">Pendiente (Sin fecha)</span>
    }
    const vencida = item.rg_dias_diff < 0
    return (
      <span className="flex items-center gap-1 truncate">
        <span>{formatDate(item.fecha_vencimiento_rg)}</span>
        <span className={`text-xs ${vencida ? "font-bold text-destructive" : "text-muted-foreground"}`}>
          ({dias(item.rg_dias_diff)})
        </span>
      </span>
    )
  }

  return [
    { icon: <Building2 size={12} />, label: "Departamento", value: item.departamento ?? "—" },
    { icon: <Layers size={12} />,    label: "Área",          value: item.area ?? "—" },
    { icon: <Clock3 size={12} />,    label: "Turno",         value: item.turno ?? "—" },
    { icon: <CalendarCheck size={12} />, label: "Ingreso",   value: formatDate(item.fecha_ingreso) },
    { icon: <Calendar size={12} />,  label: "Término",       value: formatDate(item.termino_contrato) },
    { icon: <FileText size={12} />,  label: "Plan Formación",value: planStatus() },
  ] as const
}

function DetailCard({ item, onClose }: DetailCardProps) {
  const stats = buildStats(item)

  return (
    <motion.div variants={detailV} initial="hidden" animate="show" exit="exit" className="overflow-hidden">
      <div className="mt-2 rounded-xl border border-border bg-card p-3 shadow-sm">

        {/* Header */}
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold leading-tight text-foreground">{item.nombre}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">#{item.numero ?? "—"}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar detalle"
            className="flex-shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X size={12} />
          </button>
        </div>

        {/* Info grid */}
        <dl className="mb-3 grid grid-cols-2 gap-1.5">
          {stats.map(({ icon, label, value }) => (
            <div key={label} className="rounded-lg border border-border/50 bg-muted/40 px-2.5 py-2">
              <dt className="mb-0.5 flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {icon} {label}
              </dt>
              <dd className="truncate text-xs font-semibold text-foreground">{value}</dd>
            </div>
          ))}
        </dl>

        {/* Evaluaciones pendientes */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Evaluaciones pendientes
          </p>
          <div className="grid grid-cols-3 gap-2">
            {(["1er Mes", "2° Mes", "3er Mes"] as const).map((p) => {
              const entry = item.evals.find((e) => e.periodo === p)
              const vencida = entry && entry.diasDiff < 0
              const { bg, text } = PERIODO_BADGE[p]

              return (
                <div
                  key={p}
                  className="flex flex-col items-center gap-1.5 rounded-lg border border-border/50 bg-muted/20 p-2.5 text-center"
                >
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${bg} ${text}`}>
                    <GraduationCap size={11} /> {p}
                  </span>
                  {entry ? (
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-xs font-bold tracking-wide text-foreground">
                        {periodoLabel(entry.fecha)}
                      </span>
                      <span className="text-xs text-muted-foreground">{formatDate(entry.fecha)}</span>
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold ${vencida ? "text-destructive" : "text-success"}`}>
                        <Clock3 size={11} /> {dias(entry.diasDiff)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs italic text-muted-foreground">Sin pendiente</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── EmployeeBadge ────────────────────────────────────────────────────────────

interface EmployeeBadgeProps {
  item: EmployeePending
  isSelected: boolean
  onSelect: () => void
}

function EmployeeBadge({ item, isSelected, onSelect }: EmployeeBadgeProps) {
  return (
    <motion.div variants={itemV} layout>
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={isSelected}
        aria-label={`Empleado ${item.numero ?? item.nombre} — ${item.evals.length} pendiente${item.evals.length !== 1 ? "s" : ""}`}
        className={[
          "relative flex h-16 w-16 flex-col items-center justify-center",
          "rounded-2xl border-2 text-center",
          "select-none transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          // Estado activo: primary
          isSelected
            ? "scale-105 border-primary bg-primary text-primary-foreground shadow-lg"
            : item.hasVencida
            // Estado vencido: destructive sutil
            ? "border-destructive/30 bg-destructive/5 text-destructive hover:scale-105 hover:border-destructive/60 hover:bg-destructive/10 active:scale-100"
            // Estado normal
            : "border-border bg-card text-foreground hover:scale-105 hover:border-primary/50 hover:bg-primary/5 active:scale-100",
        ].join(" ")}
      >
        <span className="text-sm font-bold tabular-nums leading-none">{item.numero ?? "—"}</span>
        <span className={`mt-1 text-xs leading-none ${isSelected ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
          {item.evals.length} eval{item.evals.length !== 1 ? "s" : ""}
        </span>
        {/* Indicador de estado */}
        <span
          aria-hidden
          className={[
            "absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-background",
            item.hasVencida ? "bg-destructive" : "bg-success",
          ].join(" ")}
        />
      </button>
    </motion.div>
  )
}

// ─── DeptTab ──────────────────────────────────────────────────────────────────

interface DeptTabProps {
  label: string
  count: number
  isActive: boolean
  onClick: () => void
}

function DeptTab({ label, count, isActive, onClick }: DeptTabProps) {
  return (
    <Button
      variant={isActive ? "secondary" : "outline"}
      size="sm"
      role="tab"
      aria-selected={isActive}
      onClick={onClick}
      className="flex-shrink-0 gap-1.5"
    >
      {label}
      <span className={[
        "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-bold",
        isActive ? "bg-foreground/10 text-foreground" : "bg-muted text-muted-foreground",
      ].join(" ")}>
        {count}
      </span>
    </Button>
  )
}

// ─── Vista mensual (Nuevo Ingreso) ────────────────────────────────────────────

interface MensualProps {
  loading: boolean
  deptGroups: ReturnType<typeof usePendingEvals>["deptGroups"]
  totalEmployees: number
  activeTab: string | null
  onTabChange: (dept: string) => void
  selectedId: string | null
  onSelectId: (id: string | null) => void
}

function VistaMensual({ loading, deptGroups, totalEmployees, activeTab, onTabChange, selectedId, onSelectId }: MensualProps) {
  const activeGroup = deptGroups.find((g) => g.departamento === activeTab) ?? null

  return (
    <div className="space-y-4">
      {/* All-clear */}
      {!loading && totalEmployees === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-success/20 bg-success/5 py-8 text-success">
          <CheckCircle2 size={28} className="opacity-70" />
          <p className="text-sm font-medium">¡Todo al día! Sin evaluaciones pendientes.</p>
        </div>
      )}

      {(loading || deptGroups.length > 0) && (
        <div className="space-y-4">
          {/* Dept tabs */}
          <div
            role="tablist"
            aria-label="Departamentos con evaluaciones pendientes"
            className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin"
          >
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-28 flex-shrink-0 rounded-md" />
              ))
              : deptGroups.map((g) => (
                <DeptTab
                  key={g.departamento}
                  label={g.departamento}
                  count={g.items.length}
                  isActive={g.departamento === activeTab}
                  onClick={() => onTabChange(g.departamento)}
                />
              ))
            }
          </div>

          {/* Badge grid */}
          <AnimatePresence mode="wait">
            {loading ? (
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-16 rounded-2xl" />
                ))}
              </div>
            ) : activeGroup ? (
              <motion.div
                key={activeGroup.departamento}
                variants={containerV}
                initial="hidden"
                animate="show"
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
                className="space-y-3"
              >
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users size={12} />
                  <span>
                    {activeGroup.items.length} empleado{activeGroup.items.length !== 1 ? "s" : ""}
                    {" · "}
                    <span className="font-bold text-foreground">{activeGroup.departamento}</span>
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {activeGroup.items.map((item) => (
                    <EmployeeBadge
                      key={item.dbId}
                      item={item}
                      isSelected={selectedId === item.dbId}
                      onSelect={() => onSelectId(selectedId === item.dbId ? null : item.dbId)}
                    />
                  ))}
                </div>

                <AnimatePresence>
                  {(() => {
                    const current = activeGroup.items.find((i) => i.dbId === selectedId)
                    return current ? (
                      <DetailCard key={current.dbId} item={current} onClose={() => onSelectId(null)} />
                    ) : null
                  })()}
                </AnimatePresence>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      )}

      {/* Leyenda */}
      {!loading && totalEmployees > 0 && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-destructive" />
            Vencida
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-success" />
            Pendiente
          </span>
          <span className="text-xs font-semibold text-foreground sm:ml-auto">
            Toca un número para ver el detalle
          </span>
        </div>
      )}
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

type Vista = "mensual" | "semestral"

interface Props {
  onClose?: () => void
  filterDepartamentos?: string[] | null
  periodoSemestral?: string
}

export default function DesempenoPendientes({ onClose, filterDepartamentos, periodoSemestral }: Props = {}) {
  const { loading, deptGroups, totalEmployees, totalEvals, cargar } = usePendingEvals(filterDepartamentos)
  const [vista, setVista] = useState<Vista>("mensual")
  const [activeTab, setActiveTab] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Inicializa el tab activo cuando llegan los datos — useEffect, no durante render
  useEffect(() => {
    if (activeTab === null && deptGroups.length > 0) {
      setActiveTab(deptGroups[0].departamento)
    }
  }, [deptGroups, activeTab])

  const handleTabChange = (dept: string) => {
    setActiveTab(dept)
    setSelectedId(null)
  }

  return (
    <Card className="min-h-full rounded-none border-x-0 border-t-0 shadow-none">
      {/* Header */}
      <CardHeader className="px-5 pb-3 pt-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base font-bold uppercase tracking-widest text-foreground">
              Evaluaciones Pendientes
            </CardTitle>
            {vista === "mensual" && !loading && totalEmployees > 0 && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {totalEmployees} empleado{totalEmployees !== 1 ? "s" : ""}
                {" · "}
                {totalEvals} evaluación{totalEvals !== 1 ? "es" : ""}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={cargar}
              disabled={loading}
              aria-label="Actualizar evaluaciones"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
            {onClose && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onClose}
                aria-label="Cerrar panel"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 px-5 pb-6 pt-2">
        {/* Toggle de vista */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={vista === "mensual" ? "secondary" : "outline"}
            size="sm"
            onClick={() => setVista("mensual")}
            className="gap-1.5"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Nuevo Ingreso
          </Button>
          <Button
            variant={vista === "semestral" ? "secondary" : "outline"}
            size="sm"
            onClick={() => setVista("semestral")}
            className="gap-1.5"
          >
            <CalendarRange className="h-3.5 w-3.5" />
            Semestrales
          </Button>
        </div>

        {/* Info banner — solo en vista mensual */}
        {vista === "mensual" && (
          <Alert className="[&>svg~*]:pl-0 [&>svg]:static [&>svg]:translate-y-0 bg-[hsl(var(--alert-warning))] text-[hsl(var(--alert-warning-foreground))] border-[hsl(var(--alert-warning-border))]">
            <AlertDescription className="text-xs">
              Desglose por departamento de evaluaciones pendientes de nuevo ingreso
            </AlertDescription>
          </Alert>
        )}

        {/* Contenido por vista */}
        <AnimatePresence mode="wait">
          {vista === "semestral" ? (
            <motion.div
              key="semestral"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2, ease: EASE_OUT }}
            >
              <DesempenoSemestralPendientes
                periodo={periodoSemestral ?? PERIODOS_DESEMPENO.semestrales[0]}
                filterDepartamentos={filterDepartamentos}
              />
            </motion.div>
          ) : (
            <motion.div
              key="mensual"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2, ease: EASE_OUT }}
            >
              <VistaMensual
                loading={loading}
                deptGroups={deptGroups}
                totalEmployees={totalEmployees}
                activeTab={activeTab}
                onTabChange={handleTabChange}
                selectedId={selectedId}
                onSelectId={setSelectedId}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}
