"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { RefreshCw, CheckCircle2, Clock3, Ban, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import {
  useSemestralPendientes,
  type SemestralEmployee,
} from "@/lib/hooks/useSemestralPendientes"

interface Props {
  periodo: string
  filterDepartamentos?: string[] | null
}

const containerV = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04, delayChildren: 0.04 } },
}

const itemV = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] as const } },
}

function EstadoBadge({ item }: { item: SemestralEmployee }) {
  if (item.estado === "completado") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[hsl(var(--success)/0.15)] px-2 py-0.5 text-[10px] font-bold text-[hsl(var(--success))]">
        <CheckCircle2 size={11} /> Completado · {item.calificacion}%
      </span>
    )
  }
  if (item.estado === "no_elegible") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
        <Ban size={11} /> No aplica (&lt; 3 meses)
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[hsl(var(--warning)/0.15)] px-2 py-0.5 text-[10px] font-bold text-[hsl(var(--warning))]">
      <Clock3 size={11} /> Pendiente
    </span>
  )
}

export default function DesempenoSemestralPendientes({ periodo, filterDepartamentos }: Props) {
  const { loading, deptGroups, totalEmployees, totalPendientes, cargar } = useSemestralPendientes(
    periodo,
    filterDepartamentos,
  )
  const [activeTab, setActiveTab] = useState<string | null>(null)

  const activeGroup = deptGroups.find((g) => g.departamento === activeTab) ?? deptGroups[0] ?? null

  if (!loading && deptGroups.length > 0 && activeTab === null) {
    setActiveTab(deptGroups[0].departamento)
  }

  return (
    <div className="space-y-4">
      <Alert className="flex items-center justify-between gap-2 [&>svg]:static [&>svg]:translate-y-0 [&>svg~*]:pl-0 bg-[hsl(var(--alert-info,var(--info)))] text-foreground border-border/60">
        <AlertDescription className="text-xs">
          Avance semestral · <strong>{periodo}</strong>
          {!loading && (
            <> · {totalPendientes} pendiente{totalPendientes !== 1 ? "s" : ""} de {totalEmployees}</>
          )}
        </AlertDescription>
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7 flex-shrink-0"
          onClick={cargar}
          disabled={loading}
          aria-label="Actualizar semestrales"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </Alert>

      {!loading && deptGroups.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-border/60 bg-muted/30 py-8 text-muted-foreground">
          <Users size={26} className="opacity-60" />
          <p className="text-sm font-medium">Sin personal de planta en tu área.</p>
        </div>
      )}

      {(loading || deptGroups.length > 0) && (
        <div className="space-y-4">
          {/* Dept tabs */}
          <div
            role="tablist"
            aria-label="Departamentos"
            className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin"
          >
            {loading
              ? Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-28 flex-shrink-0 rounded-md" />
              ))
              : deptGroups.map((g) => {
                const isActive = g.departamento === (activeTab ?? deptGroups[0]?.departamento)
                const pendCount = g.items.filter((i) => i.estado === "pendiente").length
                return (
                  <Button
                    key={g.departamento}
                    variant={isActive ? "secondary" : "outline"}
                    size="sm"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveTab(g.departamento)}
                    className="flex-shrink-0 gap-1.5"
                  >
                    {g.departamento}
                    <span className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold ${isActive
                      ? "bg-foreground/10 text-foreground"
                      : "bg-muted-foreground/15 text-muted-foreground"
                      }`}>
                      {pendCount}
                    </span>
                  </Button>
                )
              })}
          </div>

          {/* Employee list */}
          <AnimatePresence mode="wait">
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-xl" />
                ))}
              </div>
            ) : activeGroup ? (
              <motion.ul
                key={activeGroup.departamento}
                variants={containerV}
                initial="hidden"
                animate="show"
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
                className="space-y-2"
              >
                {activeGroup.items.map((item) => (
                  <motion.li
                    key={item.dbId}
                    variants={itemV}
                    className={`flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card px-3 py-2.5 ${item.estado === "no_elegible" ? "opacity-60" : ""
                      }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-foreground leading-tight">{item.nombre}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        #{item.numero ?? "—"}{item.puesto ? ` · ${item.puesto}` : ""}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <EstadoBadge item={item} />
                    </div>
                  </motion.li>
                ))}
              </motion.ul>
            ) : null}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
