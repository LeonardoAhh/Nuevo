"use client"

import { useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  RefreshCw, GraduationCap, Users, Calendar, Building2,
  Layers, Clock3, CheckCircle2, X, CalendarCheck, FileText,
  UserPlus, CalendarRange, ArrowLeft,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { useRouter } from "next/navigation"
import {
  usePendingEvals,
  type EmployeePending,
  type PendingEvalEntry,
} from "@/lib/hooks/usePendingEvals"
import { formatDate } from "@/lib/hooks/useNuevoIngreso"
import { dias } from "@/lib/hooks/useDashboardAlertas"
import { useRole } from "@/lib/hooks"
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
  "1er Mes": { bg: "bg-blue-600",   text: "text-white" },
  "2° Mes":  { bg: "bg-purple-600", text: "text-white" },
  "3er Mes": { bg: "bg-orange-600", text: "text-white" },
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

function DetailModal({ item }: Omit<DetailCardProps, 'onClose'>) {
  const stats = buildStats(item)
  const router = useRouter()

  return (
    <DialogContent className="sm:max-w-xl">
      <DialogHeader className="border-b border-border pb-4">
        <DialogTitle className="text-left text-lg">{item.nombre}</DialogTitle>
        <DialogDescription className="text-left">
          #{item.numero ?? "—"}
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-6 pb-2">
        {/* Info grid */}
        <dl className="grid grid-cols-2 gap-3 sm:gap-4">
          {stats.map(({ icon, label, value }) => (
            <div key={label} className="flex flex-col gap-1 rounded-xl border bg-muted/30 p-3 shadow-sm">
              <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {icon} {label}
              </dt>
              <dd className="truncate text-sm font-semibold text-foreground">{value}</dd>
            </div>
          ))}
        </dl>

        {/* Separador */}
        <div className="h-px w-full bg-border" />

        {/* Evaluaciones pendientes */}
        <div className="flex flex-col gap-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Evaluaciones pendientes
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(["1er Mes", "2° Mes", "3er Mes"] as const).map((p) => {
              const entry = item.evals.find((e) => e.periodo === p)
              const vencida = entry && entry.diasDiff < 0
              const { bg, text } = PERIODO_BADGE[p]

              return (
                <div
                  key={p}
                  className="flex flex-col items-center gap-3 rounded-xl border bg-card p-4 text-center shadow-sm"
                >
                  <span className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-bold uppercase ${bg} ${text}`}>
                    <GraduationCap size={14} /> {p}
                  </span>
                  {entry ? (
                    <div className="flex flex-col items-center gap-1.5 mt-1">
                      <span className="text-sm font-semibold tracking-tight text-foreground leading-tight">
                        {periodoLabel(entry.fecha)}
                      </span>
                      <span className="text-xs text-muted-foreground">{formatDate(entry.fecha)}</span>
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${vencida ? "text-destructive" : "text-emerald-600 dark:text-emerald-500"}`}>
                        <Clock3 size={14} /> {dias(entry.diasDiff)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs italic text-muted-foreground mt-3">Sin pendiente</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
      <DialogFooter className="border-t border-border bg-transparent">
        <Button 
          className="w-full sm:w-auto gap-2" 
          onClick={() => {
            if (item.numero) {
              router.push(`/desempeno?q=${item.numero}`)
            }
          }}
          disabled={!item.numero}
        >
          <FileText size={16} />
          Evaluar empleado
        </Button>
      </DialogFooter>
    </DialogContent>
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
          "relative flex w-full items-center justify-between gap-3 p-3",
          "rounded-xl border text-left shadow-sm",
          "select-none transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isSelected
            ? "scale-[1.02] border-primary bg-primary/5"
            : item.hasVencida
            ? "border-destructive/30 bg-destructive/5 hover:scale-[1.02] hover:border-destructive/60 hover:bg-destructive/10 active:scale-100"
            : "border-border/60 bg-card hover:scale-[1.02] hover:border-primary/30 hover:bg-muted/50 active:scale-100",
        ].join(" ")}
      >
        <div className="min-w-0 flex-1">
          <p className={`truncate text-xs font-bold leading-tight ${isSelected ? "text-primary" : "text-foreground"}`}>
            {item.nombre}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            #{item.numero ?? "—"}
          </p>
        </div>
        <div className="flex-shrink-0">
          <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-bold shadow-sm ${
            item.hasVencida 
              ? "bg-destructive text-destructive-foreground" 
              : "bg-emerald-600 text-white"
          }`}>
            <Clock3 size={14} />
            {item.evals.length} eval{item.evals.length !== 1 ? "s" : ""}
          </span>
        </div>
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
      variant={isActive ? "default" : "outline"}
      size="sm"
      role="tab"
      aria-selected={isActive}
      onClick={onClick}
      className="flex-shrink-0 gap-1.5"
    >
      {label}
      <span className={[
        "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-bold",
        isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground",
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-xl" />
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

                <div className="space-y-6">
                  {(() => {
                    const getGroupKey = (item: EmployeePending) => {
                      const cleanString = (str: string) => {
                        return str
                          .toUpperCase()
                          .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Quitar acentos
                          .replace(/[^A-Z0-9\s]/g, "") // Quitar puntuación (puntos, comas, guiones)
                          .replace(/\s+/g, " ") // Normalizar espacios
                          .trim()
                      }

                      const parts = []
                      if (item.area && item.area.trim() !== "" && item.area !== "N/A") {
                        parts.push(cleanString(item.area))
                      }
                      if (item.turno && item.turno.trim() !== "" && item.turno !== "N/A") {
                        const t = cleanString(item.turno)
                        parts.push(t.startsWith("TURNO") ? t : `TURNO ${t}`)
                      }
                      return parts.length > 0 ? parts.join(" · ") : "GENERAL"
                    }

                    const grouped = activeGroup.items.reduce((acc, item) => {
                      const key = getGroupKey(item)
                      if (!acc[key]) acc[key] = []
                      acc[key].push(item)
                      return acc
                    }, {} as Record<string, EmployeePending[]>)

                    const sortedKeys = Object.keys(grouped).sort((a, b) => {
                      if (a === "GENERAL") return 1
                      if (b === "GENERAL") return -1
                      return a.localeCompare(b, "es")
                    })

                    return sortedKeys.map((key) => (
                      <div key={key} className="space-y-2">
                        <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                          <Layers size={14} />
                          {key}
                          <span className="text-xs font-normal opacity-70">({grouped[key].length})</span>
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                          {grouped[key].map((item) => (
                            <EmployeeBadge
                              key={item.dbId}
                              item={item}
                              isSelected={selectedId === item.dbId}
                              onSelect={() => onSelectId(selectedId === item.dbId ? null : item.dbId)}
                            />
                          ))}
                        </div>
                      </div>
                    ))
                  })()}
                </div>

                <Dialog open={!!selectedId} onOpenChange={(open) => !open && onSelectId(null)}>
                  {(() => {
                    const current = activeGroup.items.find((i) => i.dbId === selectedId)
                    return current ? (
                      <DetailModal key={current.dbId} item={current} />
                    ) : null
                  })()}
                </Dialog>
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
  /** Department scope override; defaults to the role's departamentosScope. */
  filterDepartamentos?: string[] | null
  periodoSemestral?: string
}

export default function DesempenoPendientes({ filterDepartamentos, periodoSemestral }: Props = {}) {
  const { departamentosScope } = useRole()
  const { loading, deptGroups, totalEmployees, totalEvals, cargar } = usePendingEvals(
    filterDepartamentos ?? departamentosScope,
  )
  const [vista, setVista] = useState<Vista>("mensual")
  // First department acts as the default tab until the user picks one.
  const [activeTab, setActiveTab] = useState<string | null>(null)
  const currentTab = activeTab ?? deptGroups[0]?.departamento ?? null
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const handleTabChange = (dept: string) => {
    setActiveTab(dept)
    setSelectedId(null)
  }

  return (
    <Card className="min-h-full">
      {/* Header */}
      <CardHeader className="px-5 pb-3 pt-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-start gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              asChild
            >
              <Link href="/desempeno" aria-label="Volver a Desempeño">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div className="min-w-0">
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
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 px-5 pb-6 pt-2">
        {/* Toggle de vista */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={vista === "mensual" ? "default" : "outline"}
            size="sm"
            onClick={() => setVista("mensual")}
            className="gap-1.5"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Nuevo Ingreso
          </Button>
          <Button
            variant={vista === "semestral" ? "default" : "outline"}
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
          <Alert className="[&>svg~*]:pl-0 [&>svg]:static [&>svg]:translate-y-0 bg-warning/10 text-warning border-warning/30">
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
                activeTab={currentTab}
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
