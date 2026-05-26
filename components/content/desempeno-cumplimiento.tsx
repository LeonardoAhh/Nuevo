"use client"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import {
  CheckCircle2,
  Clock,
  Building2,
  TrendingUp,
  Users,
  ClipboardCheck,
  RotateCcw,
  Loader2,
  AlertCircle,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  useCumplimientoDesempeno,
  useRole,
  PERIODOS_DISPONIBLES,
  type PeriodoCodigo,
  type CumplimientoRow,
} from "@/lib/hooks"

function statusBadge(row: CumplimientoRow) {
  if (row.entrega) {
    return (
      <Badge className="bg-success/15 text-success border-success/30 hover:bg-success/20">
        <CheckCircle2 className="h-3 w-3 mr-1" />
        Entregada
      </Badge>
    )
  }
  if (row.porcentaje >= 100) {
    return (
      <Badge className="bg-warning/15 text-warning border-warning/30 hover:bg-warning/20">
        <ClipboardCheck className="h-3 w-3 mr-1" />
        Completo sin entregar
      </Badge>
    )
  }
  if (row.porcentaje > 0) {
    return (
      <Badge variant="secondary">
        <Clock className="h-3 w-3 mr-1" />
        En progreso
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="text-muted-foreground">
      Pendiente
    </Badge>
  )
}

function barColor(pct: number): string {
  if (pct >= 100) return "bg-success"
  if (pct >= 80) return "bg-primary"
  if (pct >= 50) return "bg-warning"
  return "bg-destructive"
}

function formatFechaCorta(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })
}

export default function DesempenoCumplimiento() {
  const [periodo, setPeriodo] = useState<PeriodoCodigo>("ENE-JUN-2026")
  const { rows, resumen, loading, busy, marcarEntregada, revertirEntrega } =
    useCumplimientoDesempeno(periodo)
  const { role } = useRole()
  const isDev = role === "dev"

  const [marcarOpen, setMarcarOpen] = useState(false)
  const [marcarRow, setMarcarRow] = useState<CumplimientoRow | null>(null)
  const [nota, setNota] = useState("")

  const [revertirOpen, setRevertirOpen] = useState(false)
  const [revertirRow, setRevertirRow] = useState<CumplimientoRow | null>(null)

  const periodoLabel = useMemo(
    () => PERIODOS_DISPONIBLES.find((p) => p.codigo === periodo)?.short ?? periodo,
    [periodo],
  )

  const openMarcar = (row: CumplimientoRow) => {
    setMarcarRow(row)
    setNota("")
    setMarcarOpen(true)
  }

  const confirmMarcar = async () => {
    if (!marcarRow) return
    await marcarEntregada(marcarRow, nota.trim() || null)
    setMarcarOpen(false)
    setMarcarRow(null)
  }

  const openRevertir = (row: CumplimientoRow) => {
    setRevertirRow(row)
    setRevertirOpen(true)
  }

  const confirmRevertir = async () => {
    if (!revertirRow?.entrega) return
    await revertirEntrega(revertirRow.entrega.id)
    setRevertirOpen(false)
    setRevertirRow(null)
  }

  return (
    <Card className="print:hidden">
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              Cumplimiento por departamento
            </CardTitle>
            <CardDescription className="mt-1">
              Avance de evaluaciones semestrales y entrega al Departamento de Capacitación.
            </CardDescription>
          </div>
          <Tabs value={periodo} onValueChange={(v) => setPeriodo(v as PeriodoCodigo)}>
            <TabsList>
              {PERIODOS_DISPONIBLES.map((p) => (
                <TabsTrigger key={p.codigo} value={p.codigo}>
                  {p.short}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard
            icon={<Users className="h-3.5 w-3.5" />}
            label="Empleados"
            value={resumen.totalEsperadas}
            sub="universo activo"
            loading={loading}
          />
          <KpiCard
            icon={<ClipboardCheck className="h-3.5 w-3.5" />}
            label="Evaluaciones"
            value={resumen.totalRealizadas}
            sub={`de ${resumen.totalEsperadas} esperadas`}
            loading={loading}
          />
          <KpiCard
            icon={<TrendingUp className="h-3.5 w-3.5" />}
            label="% global"
            value={`${resumen.porcentajeGlobal}%`}
            sub={periodoLabel}
            tone={
              resumen.porcentajeGlobal >= 80
                ? "success"
                : resumen.porcentajeGlobal >= 50
                  ? "warning"
                  : "danger"
            }
            loading={loading}
          />
          <KpiCard
            icon={<CheckCircle2 className="h-3.5 w-3.5" />}
            label="Entregados"
            value={`${resumen.deptosEntregados} / ${resumen.deptosTotal}`}
            sub="departamentos"
            loading={loading}
          />
        </div>

        {/* Tabla / lista */}
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-muted-foreground">
            <AlertCircle className="h-6 w-6" />
            <p className="text-sm">No hay departamentos con datos para este periodo.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {rows.map((row, i) => (
              <motion.div
                key={row.departamento}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.35, delay: i * 0.03 }}
                className="rounded-lg border bg-card p-3 hover:border-primary/40 transition-colors"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1 min-w-[180px]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold truncate">{row.departamento}</span>
                      {statusBadge(row)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {row.realizadas} / {row.esperadas} evaluaciones · {row.porcentaje}%
                    </p>
                  </div>

                  {/* acciones dev */}
                  <div className="flex items-center gap-2">
                    {row.entrega ? (
                      <div className="text-right text-xs text-muted-foreground">
                        <span className="block">
                          {formatFechaCorta(row.entrega.entregada_at)}
                          {row.entrega.entregada_by_name
                            ? ` · ${row.entrega.entregada_by_name}`
                            : ""}
                        </span>
                        {row.entrega.nota && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-[10px] italic underline decoration-dotted cursor-help">
                                ver nota
                              </span>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p className="text-xs">{row.entrega.nota}</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    ) : null}

                    {isDev && !row.entrega && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openMarcar(row)}
                        disabled={busy || row.esperadas === 0}
                      >
                        <ClipboardCheck className="h-3.5 w-3.5 mr-1.5" />
                        Marcar entregada
                      </Button>
                    )}

                    {isDev && row.entrega && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openRevertir(row)}
                        disabled={busy}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                        Revertir
                      </Button>
                    )}
                  </div>
                </div>

                {/* barra de progreso */}
                <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className={`h-full ${barColor(row.porcentaje)}`}
                    initial={{ width: 0 }}
                    whileInView={{ width: `${Math.min(row.porcentaje, 100)}%` }}
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{ duration: 0.6, delay: 0.1 + i * 0.03, ease: "easeOut" }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {!isDev && (
          <p className="text-xs text-muted-foreground italic">
            Solo el rol <span className="font-mono">dev</span> puede marcar entregas.
          </p>
        )}
      </CardContent>

      {/* Dialog marcar entregada */}
      <Dialog open={marcarOpen} onOpenChange={setMarcarOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Marcar entrega · {marcarRow?.departamento}</DialogTitle>
            <DialogDescription>
              Confirma que las evaluaciones de <strong>{marcarRow?.departamento}</strong> del periodo{" "}
              <strong>{periodoLabel}</strong> fueron entregadas al Departamento de Capacitación.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-xs text-muted-foreground">Realizadas</span>
                <p className="font-semibold">{marcarRow?.realizadas ?? 0}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Esperadas</span>
                <p className="font-semibold">{marcarRow?.esperadas ?? 0}</p>
              </div>
            </div>
            {marcarRow && marcarRow.realizadas < marcarRow.esperadas && (
              <p className="text-xs text-warning flex items-start gap-1.5 mt-1">
                <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                Faltan {marcarRow.esperadas - marcarRow.realizadas} evaluaciones por capturar.
                Puedes marcar la entrega de todos modos; queda registro de cuántas se realizaron.
              </p>
            )}
            <div>
              <label className="text-xs text-muted-foreground" htmlFor="nota-entrega">
                Nota (opcional)
              </label>
              <Textarea
                id="nota-entrega"
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                placeholder="Ej. Faltan 3 evaluaciones de personal en vacaciones, se entregarán en julio."
                className="resize-none mt-1"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMarcarOpen(false)} disabled={busy}>
              Cancelar
            </Button>
            <Button onClick={confirmMarcar} disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirmar entrega
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog revertir entrega */}
      <Dialog open={revertirOpen} onOpenChange={setRevertirOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Revertir entrega · {revertirRow?.departamento}</DialogTitle>
            <DialogDescription>
              Esto eliminará el registro de entrega de{" "}
              <strong>{revertirRow?.departamento}</strong> para el periodo{" "}
              <strong>{periodoLabel}</strong>. Las evaluaciones no se borran, solo el marcado.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevertirOpen(false)} disabled={busy}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmRevertir} disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Revertir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

interface KpiCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  sub: string
  tone?: "success" | "warning" | "danger" | "default"
  loading?: boolean
}

function KpiCard({ icon, label, value, sub, tone = "default", loading }: KpiCardProps) {
  const toneCls =
    tone === "success"
      ? "text-success"
      : tone === "warning"
        ? "text-warning"
        : tone === "danger"
          ? "text-destructive"
          : "text-foreground"

  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      {loading ? (
        <Skeleton className="h-7 w-16 mt-1" />
      ) : (
        <p className={`mt-1 text-2xl font-bold ${toneCls}`}>{value}</p>
      )}
      <p className="mt-0.5 text-[11px] text-muted-foreground">{sub}</p>
    </div>
  )
}
