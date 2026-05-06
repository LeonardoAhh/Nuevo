"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  RefreshCw,
  GraduationCap,
  Users,
  Calendar,
  Building2,
  Layers,
  Clock3,
  CheckCircle2,
  X,
  CalendarCheck,
  FileText,
  Info,
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

// ─── Motion variants ─────────────────────────────────────────────────────────

const containerV = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
}

const itemV = {
  hidden: { opacity: 0, scale: 0.88, y: 6 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const },
  },
  exit: { opacity: 0, scale: 0.88, y: 4, transition: { duration: 0.18 } },
}

const detailV = {
  hidden: { opacity: 0, height: 0, marginTop: 0 },
  show: {
    opacity: 1,
    height: "auto",
    marginTop: "0.5rem",
    transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] as const },
  },
  exit: {
    opacity: 0,
    height: 0,
    marginTop: 0,
    transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] as const },
  },
}

// ─── Sub-components ──────────────────────────────────────────────────────────

const PERIODO_COLORS: Record<PendingEvalEntry["periodo"], string> = {
  "1er Mes": "bg-[hsl(var(--info)/0.15)] text-[hsl(var(--info))]",
  "2° Mes": "bg-[hsl(var(--chart-4)/0.15)] text-[hsl(var(--chart-4))]",
  "3er Mes": "bg-[hsl(var(--warning)/0.15)] text-[hsl(var(--warning))]",
}

// ─── Employee Detail Card ─────────────────────────────────────────────────────

interface DetailCardProps {
  item: EmployeePending
  onClose: () => void
}

function DetailCard({ item, onClose }: DetailCardProps) {
  const planFormacionStatus = () => {
    if (item.rg_rec_048 === "Entregado") {
      return <span className="text-[hsl(var(--success))] font-bold">Entregado</span>
    }
    if (!item.fecha_vencimiento_rg || item.rg_dias_diff === null) {
      return <span className="text-muted-foreground font-medium italic">Pendiente (Sin fecha)</span>
    }
    const isVencida = item.rg_dias_diff < 0
    return (
      <span className="flex items-center gap-1.5 truncate">
        <span>{formatDate(item.fecha_vencimiento_rg)}</span>
        <span className={`text-[10px] ${isVencida ? "text-destructive font-bold" : "text-muted-foreground font-medium"}`}>
          ({dias(item.rg_dias_diff)})
        </span>
      </span>
    )
  }

  const stats: { icon: React.ReactNode; label: string; value: React.ReactNode }[] = [
    { icon: <Building2 size={12} />, label: "Departamento", value: item.departamento ?? "—" },
    { icon: <Layers size={12} />, label: "Área", value: item.area ?? "—" },
    { icon: <Clock3 size={12} />, label: "Turno", value: item.turno ?? "—" },
    { icon: <CalendarCheck size={12} />, label: "Fecha ingreso", value: formatDate(item.fecha_ingreso) },
    { icon: <Calendar size={12} />, label: "Término contrato", value: formatDate(item.termino_contrato) },
    { icon: <FileText size={12} />, label: "Plan Formación", value: planFormacionStatus() },
  ]

  return (
    <motion.div variants={detailV} initial="hidden" animate="show" exit="exit" className="overflow-hidden">
      <div className="rounded-2xl border border-border/60 bg-card shadow-sm p-3 mt-2">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-foreground truncate leading-tight">{item.nombre}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">#{item.numero ?? "—"}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar detalle"
            className="flex-shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X size={12} />
          </button>
        </div>

        {/* Info grid */}
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-3">
          {stats.map(({ icon, label, value }) => (
            <div key={label} className="rounded-lg border border-border/50 bg-muted/40 px-2.5 py-2">
              <dt className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
                {icon} {label}
              </dt>
              <dd className="text-xs font-semibold text-foreground truncate">{value}</dd>
            </div>
          ))}
        </dl>

        {/* Pending evals — 3 columns for 3 periods */}
        <div className="space-y-1.5 mt-4">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
            Evaluaciones pendientes
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {(["1er Mes", "2° Mes", "3er Mes"] as const).map((p) => {
              const entry = item.evals.find((e) => e.periodo === p)
              const isVencida = entry && entry.diasDiff < 0
              return (
                <div key={p} className="flex items-center justify-between gap-2 rounded-lg border border-border/50 bg-muted/20 px-3 py-2 sm:p-3 min-w-0">
                  <span className={`inline-flex items-center gap-1 sm:gap-1.5 rounded-full px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs font-semibold shrink-0 ${PERIODO_COLORS[p]}`}>
                    <GraduationCap size={12} /> {p}
                  </span>
                  {entry ? (
                    <div className="flex flex-col items-end gap-0.5 sm:gap-1 text-right min-w-0">
                      <span className="text-[11px] sm:text-xs font-medium text-foreground truncate">{formatDate(entry.fecha)}</span>
                      <span className={`flex items-center gap-1 text-[11px] font-semibold ${isVencida ? "text-destructive" : "text-[hsl(var(--success))]"}`}>
                        <Clock3 size={11} /> {dias(entry.diasDiff)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground/60 italic text-right">Sin pendiente</span>
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

// ─── Employee Badge ───────────────────────────────────────────────────────────

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
        className={`
          relative flex flex-col items-center justify-center
          w-16 sm:w-18 h-16 sm:h-18 rounded-2xl border-2 transition-all duration-200
          text-center select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
          ${isSelected
            ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-105"
            : item.hasVencida
              ? "border-destructive/30 bg-destructive/5 text-destructive hover:border-destructive/60 hover:bg-destructive/10 hover:scale-105 active:scale-100"
              : "border-border bg-card text-foreground hover:border-primary/50 hover:bg-primary/5 hover:scale-105 active:scale-100"
          }
        `}
      >
        <span className="text-sm font-bold leading-none tabular-nums">{item.numero ?? "—"}</span>
        <span className={`mt-1 text-[9px] font-medium leading-none ${isSelected ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
          {item.evals.length} eval{item.evals.length !== 1 ? "s" : ""}
        </span>
        <span
          aria-hidden
          className={`absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full border-2 border-background ${item.hasVencida ? "bg-destructive" : "bg-[hsl(var(--success))]"}`}
        />
      </button>
    </motion.div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function DesempenoPendientes() {
  const { loading, deptGroups, totalEmployees, totalEvals, cargar } = usePendingEvals()
  const [activeTab, setActiveTab] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const activeGroup = deptGroups.find((g) => g.departamento === activeTab) ?? deptGroups[0] ?? null
  const activeKey = activeGroup?.departamento ?? null

  if (!loading && deptGroups.length > 0 && activeTab === null) {
    setActiveTab(deptGroups[0].departamento)
  }

  const handleTabChange = (dept: string) => {
    setActiveTab(dept)
    setSelectedId(null)
  }

  const currentSelected = activeGroup?.items.find((i) => i.dbId === selectedId) ?? null

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold uppercase tracking-wide">
              EVALUACIONES PENDIENTES
            </CardTitle>
            {!loading && totalEmployees > 0 && (
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {totalEmployees} empleado{totalEmployees !== 1 ? "s" : ""} · {totalEvals} evaluación{totalEvals !== 1 ? "es" : ""}
              </p>
            )}
          </div>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={cargar}
            disabled={loading}
            aria-label="Actualizar evaluaciones"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-2 pb-4 space-y-4">
        {/* Info banner */}
        <Alert className="flex items-center gap-2 [&>svg]:static [&>svg]:translate-y-0 [&>svg~*]:pl-0 bg-[hsl(var(--alert-warning))] text-[hsl(var(--alert-warning-foreground))] border-[hsl(var(--alert-warning-border))]">
          <AlertDescription>
            Desgloce por departamento de evaluaciones pendientes
          </AlertDescription>
        </Alert>

        {/* All-clear state */}
        {!loading && totalEmployees === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-[hsl(var(--success)/0.2)] bg-[hsl(var(--success)/0.05)] py-8 text-[hsl(var(--success))]">
            <CheckCircle2 size={28} className="opacity-70" />
            <p className="text-sm font-medium">¡Todo al día! Sin evaluaciones pendientes.</p>
          </div>
        )}

        {/* Dept tabs */}
        {(loading || deptGroups.length > 0) && (
          <div className="space-y-4">
            {/* Scrollable tab row using Button */}
            <div
              role="tablist"
              aria-label="Departamentos con evaluaciones pendientes"
              className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin"
            >
              {loading
                ? Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-28 flex-shrink-0 rounded-md" />
                ))
                : deptGroups.map((g) => {
                  const isActive = g.departamento === (activeTab ?? deptGroups[0]?.departamento)
                  return (
                    <Button
                      key={g.departamento}
                      variant={isActive ? "secondary" : "outline"}
                      size="sm"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => handleTabChange(g.departamento)}
                      className="flex-shrink-0 gap-1.5"
                    >
                      {g.departamento}
                      <span className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold ${isActive
                        ? "bg-foreground/10 text-foreground"
                        : "bg-muted-foreground/15 text-muted-foreground"
                        }`}>
                        {g.items.length}
                      </span>
                    </Button>
                  )
                })}
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
                  key={activeKey}
                  variants={containerV}
                  initial="hidden"
                  animate="show"
                  exit={{ opacity: 0, transition: { duration: 0.15 } }}
                  className="space-y-3"
                >
                  {/* Employee count */}
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <Users size={12} />
                    <span>
                      {activeGroup.items.length} empleado{activeGroup.items.length !== 1 ? "s" : ""}
                      {" "}·{" "}
                      <span className="text-foreground font-bold">{activeGroup.departamento}</span>
                    </span>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2">
                    {activeGroup.items.map((item) => (
                      <div key={item.dbId} className="flex flex-col items-center">
                        <EmployeeBadge
                          item={item}
                          isSelected={selectedId === item.dbId}
                          onSelect={() => setSelectedId((prev) => (prev === item.dbId ? null : item.dbId))}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Detail card */}
                  <AnimatePresence>
                    {currentSelected && (
                      <DetailCard
                        key={currentSelected.dbId}
                        item={currentSelected}
                        onClose={() => setSelectedId(null)}
                      />
                    )}
                  </AnimatePresence>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        )}

        {/* Legend */}
        {!loading && totalEmployees > 0 && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] sm:text-[13px] text-muted-foreground pt-1">
            <span className="flex items-center gap-1">
              <span className="h-3 w-3 rounded-full bg-destructive inline-block" />
              Vencida
            </span>
            <span className="flex items-center gap-1">
              <span className="h-3 w-3 rounded-full bg-[hsl(var(--success))] inline-block" />
              Pendiente
            </span>
            <span className="sm:ml-auto font-bold text-foreground">Clic en No. Empleado para ver el detalle</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}