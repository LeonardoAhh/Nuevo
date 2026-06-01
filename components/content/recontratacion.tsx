"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import {
  Search, X, AlertCircle, Printer, FileCheck2, CalendarClock,
  CheckCircle2, AlertTriangle, ShieldQuestion, Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import { useNuevoIngreso, formatDate, daysFromToday } from "@/lib/hooks"
import type { NuevoIngreso } from "@/lib/hooks"
import { useRecontratacion } from "@/lib/hooks/useRecontratacion"
import type { RecontratacionPrintData } from "@/components/content/recontratacion-print"
import { INCIDENCIA_COLUMNS, formatMesLargo } from "@/lib/recontratacion"

// ─────────────────────────────────────────────────────────────────────────────
// Recomendación (asesora la decisión, no la sustituye)
// ─────────────────────────────────────────────────────────────────────────────

type Recomendacion = "viable" | "revisar" | "no-viable" | "sin-datos"

const RECO_META: Record<Recomendacion, { label: string; icon: React.ElementType; classes: string }> = {
  viable: { label: "Viable", icon: CheckCircle2, classes: "bg-success/10 text-success border-success/30" },
  revisar: { label: "Revisar", icon: AlertTriangle, classes: "bg-warning/10 text-warning border-warning/30" },
  "no-viable": { label: "No recomendado", icon: AlertCircle, classes: "bg-destructive/10 text-destructive border-destructive/30" },
  "sin-datos": { label: "Sin datos", icon: ShieldQuestion, classes: "bg-muted text-muted-foreground border-border" },
}

function evaluarRecomendacion(data: RecontratacionPrintData): Recomendacion {
  const califs = data.evaluaciones.map(e => e.calificacion).filter((c): c is number => c != null)
  const faltasInjust = data.incidencias.reduce(
    (acc, m) => acc + (m.valores["FALTA INJUSTIFICADA"] ?? 0), 0,
  )
  if (califs.length === 0) return "sin-datos"
  const reprobada = califs.some(c => c < 70)
  if (reprobada || faltasInjust >= 3) return "no-viable"
  const promedio = califs.reduce((a, b) => a + b, 0) / califs.length
  if (promedio >= 85 && faltasInjust === 0) return "viable"
  return "revisar"
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente
// ─────────────────────────────────────────────────────────────────────────────

export default function RecontratacionContent() {
  const { loading, error, fetchAll } = useNuevoIngreso()
  const { buildRecontratacionData } = useRecontratacion()

  const [records, setRecords] = useState<NuevoIngreso[]>([])
  const [search, setSearch] = useState("")
  const [filterDept, setFilterDept] = useState("all")

  const [detalle, setDetalle] = useState<RecontratacionPrintData | null>(null)
  const [detalleOpen, setDetalleOpen] = useState(false)
  const [detalleLoading, setDetalleLoading] = useState(false)

  const load = useCallback(async () => {
    setRecords(await fetchAll())
  }, [fetchAll])

  useEffect(() => { load() }, [load])

  const departments = useMemo(
    () => Array.from(new Set(records.map(r => r.departamento).filter(Boolean))).sort() as string[],
    [records],
  )

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return records
      .filter(r => {
        const matchSearch = !q ||
          r.nombre.toLowerCase().includes(q) ||
          (r.numero ?? "").toLowerCase().includes(q) ||
          (r.puesto ?? "").toLowerCase().includes(q) ||
          (r.departamento ?? "").toLowerCase().includes(q)
        const matchDept = filterDept === "all" || r.departamento === filterDept
        return matchSearch && matchDept
      })
      // Prioriza contratos próximos a vencer
      .sort((a, b) => {
        const da = daysFromToday(a.termino_contrato) ?? Infinity
        const db = daysFromToday(b.termino_contrato) ?? Infinity
        return da - db
      })
  }, [records, search, filterDept])

  const abrirDetalle = useCallback(async (record: NuevoIngreso) => {
    setDetalleOpen(true)
    setDetalle(null)
    setDetalleLoading(true)
    try {
      const data = await buildRecontratacionData(record)
      setDetalle(data)
    } finally {
      setDetalleLoading(false)
    }
  }, [buildRecontratacionData])

  const imprimir = useCallback((numero: string) => {
    window.open(`/recontratacion/imprimir?numero=${encodeURIComponent(numero)}`, "_blank")
  }, [])

  const reco = detalle ? evaluarRecomendacion(detalle) : null

  return (
    <>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="bg-card mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck2 className="h-5 w-5 text-primary" />
            Recontratación
          </CardTitle>
          <CardDescription>
            Revisa el récord de incidencias y evaluaciones de empleados de nuevo ingreso para
            decidir la viabilidad de continuidad de contrato e imprimir el formato RG-REC-048.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar empleado..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className={`pl-9 bg-muted text-foreground ${search ? "pr-9" : ""}`}
              />
              {search && (
                <button
                  type="button"
                  aria-label="Limpiar búsqueda"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Select value={filterDept} onValueChange={setFilterDept}>
              <SelectTrigger className="min-w-[160px] bg-muted text-foreground text-sm">
                <SelectValue placeholder="Departamentos" />
              </SelectTrigger>
              <SelectContent className="bg-card">
                <SelectItem value="all">Todos los departamentos</SelectItem>
                {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Lista */}
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No hay empleados de nuevo ingreso que coincidan.
            </p>
          ) : (
            <ul className="grid gap-2">
              {filtered.map(r => {
                const diff = daysFromToday(r.termino_contrato)
                const urgent = diff != null && diff <= 15 && r.tipo_contrato !== "Indeterminado"
                const past = diff != null && diff < 0 && r.tipo_contrato !== "Indeterminado"
                return (
                  <li
                    key={r.id}
                    className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-background p-3 hover:bg-accent/40 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate text-foreground">{r.nombre}</span>
                        {r.numero && (
                          <Badge variant="outline" className="shrink-0 text-xs">#{r.numero}</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {r.puesto || "—"} · {r.departamento || "—"}
                        {r.turno ? ` · Turno ${r.turno}` : ""}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs">
                      <CalendarClock className={`h-3.5 w-3.5 ${past ? "text-destructive" : urgent ? "text-warning" : "text-muted-foreground"}`} />
                      <span className={past ? "text-destructive" : urgent ? "text-warning" : "text-muted-foreground"}>
                        {r.tipo_contrato === "Indeterminado"
                          ? "Indeterminado"
                          : r.termino_contrato
                            ? `Término ${formatDate(r.termino_contrato)}`
                            : "Sin término"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button variant="outline" size="sm" onClick={() => abrirDetalle(r)}>
                        Revisar
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => r.numero && imprimir(r.numero)}
                        disabled={!r.numero}
                        title={r.numero ? "Imprimir formato" : "El empleado no tiene número asignado"}
                      >
                        <Printer className="h-4 w-4 sm:mr-1.5" />
                        <span className="hidden sm:inline">Imprimir</span>
                      </Button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Detalle / preview */}
      <Dialog open={detalleOpen} onOpenChange={setDetalleOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {detalle?.nombre || "Detalle"}
              {reco && (
                <Badge variant="outline" className={`gap-1 ${RECO_META[reco].classes}`}>
                  {React.createElement(RECO_META[reco].icon, { className: "h-3.5 w-3.5" })}
                  {RECO_META[reco].label}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              Vista previa del formato de continuidad de contrato.
            </DialogDescription>
          </DialogHeader>

          {detalleLoading || !detalle ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Cargando…
            </div>
          ) : (
            <div className="space-y-5 text-sm">
              {/* Datos */}
              <section className="grid grid-cols-2 gap-x-4 gap-y-1">
                <Dato label="No." value={detalle.numero || "—"} />
                <Dato label="Puesto" value={detalle.puesto || "—"} />
                <Dato label="Departamento" value={detalle.departamento || "—"} />
                <Dato label="Turno" value={detalle.turno || "—"} />
                <Dato label="Fecha ingreso" value={formatDate(detalle.fechaIngresoISO)} />
                <Dato label="Término contrato" value={formatDate(detalle.terminoContratoISO)} />
                <Dato label="Jefe directo (auto)" value={detalle.jefeDirecto} />
                <Dato label="RG-REC-048" value={detalle.rgEntregado} />
              </section>

              {/* Incidencias 90 días */}
              <section>
                <h3 className="font-semibold mb-2 text-foreground">
                  Incidencias (ingreso + 90 días)
                </h3>
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/60 text-muted-foreground">
                      <tr>
                        <th className="px-2 py-1.5 text-left font-medium">Mes</th>
                        {INCIDENCIA_COLUMNS.map(c => (
                          <th key={c.header} className="px-2 py-1.5 text-center font-medium">{c.header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {detalle.incidencias.length === 0 ? (
                        <tr><td colSpan={INCIDENCIA_COLUMNS.length + 1} className="px-2 py-3 text-center text-muted-foreground">Sin periodo (falta fecha de ingreso)</td></tr>
                      ) : detalle.incidencias.map(m => (
                        <tr key={m.mes} className="border-t border-border">
                          <td className="px-2 py-1.5 text-left whitespace-nowrap">{formatMesLargo(m.mes)}</td>
                          {INCIDENCIA_COLUMNS.map(c => (
                            <td key={c.header} className="px-2 py-1.5 text-center">{m.valores[c.categoria] || ""}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Evaluaciones */}
              <section>
                <h3 className="font-semibold mb-2 text-foreground">Evaluación de desempeño (1 por mes)</h3>
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/60 text-muted-foreground">
                      <tr>
                        <th className="px-2 py-1.5 text-left font-medium">#</th>
                        <th className="px-2 py-1.5 text-left font-medium">Periodo</th>
                        <th className="px-2 py-1.5 text-center font-medium">Calificación</th>
                        <th className="px-2 py-1.5 text-center font-medium">Plan seguimiento</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detalle.evaluaciones.map((ev, i) => (
                        <tr key={i} className="border-t border-border">
                          <td className="px-2 py-1.5">{i + 1}</td>
                          <td className="px-2 py-1.5 whitespace-nowrap">{ev.periodo.label || "—"}</td>
                          <td className="px-2 py-1.5 text-center">
                            {ev.calificacion != null ? (
                              <span className={ev.calificacion >= 70 ? "text-success font-medium" : "text-destructive font-medium"}>
                                {ev.calificacion}
                              </span>
                            ) : "—"}
                          </td>
                          <td className="px-2 py-1.5 text-center">{ev.planSeguimiento || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <div className="flex justify-end pt-1">
                <Button onClick={() => detalle.numero && imprimir(detalle.numero)} disabled={!detalle.numero}>
                  <Printer className="h-4 w-4 mr-1.5" />
                  Imprimir formato
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

function Dato({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-foreground truncate">{value}</span>
    </div>
  )
}
