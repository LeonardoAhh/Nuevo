"use client"

import { useEffect, useState } from "react"
import { Search, Printer, AlertCircle, Save, Loader2, Sparkles, ClipboardList } from "lucide-react"
import { motion } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useDesempeno } from "@/lib/hooks/useDesempeno"
import { PERIODOS_DESEMPENO, type DesempenoPeriodo } from "@/lib/catalogo"
import { DEFAULT_OBJETIVOS_POR_TIPO, DEFAULT_CUMPLIMIENTO, DEFAULT_COMPETENCIAS, calcularPonderacion, type DesempenoData } from "@/lib/types/desempeno"
import DesempenoPrint from "./desempeno-print"
import { DesempenoForm } from "./desempeno-form-operativo"
import DesempenoPendientes from "./desempeno-pendientes"
import { DesempenoSaveSuccess } from "./desempeno-save-success"
import { DesempenoGuia, guiaYaVista } from "./desempeno-guia"
import { PendientesDrawer } from "./desempeno-pendientes-drawer"
import { useRole } from "@/lib/hooks"
import { usePendingEvals } from "@/lib/hooks/usePendingEvals"

export default function DesempenoSearch() {
  const [numeroBuscado, setNumeroBuscado] = useState("")

  const [periodoModo, setPeriodoModo] = useState<"semestrales" | "mensuales">("semestrales")
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState<DesempenoPeriodo>(PERIODOS_DESEMPENO.semestrales[0])
  const { data, setData, loading, saving, saveSuccess, resetSaveSuccess, error, buscarEmpleado, guardar } = useDesempeno()
  const { isEvaluador } = useRole()
  const { totalEvals } = usePendingEvals()
  const [guiaOpen, setGuiaOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Auto-show the guide on first visit for evaluadores
  useEffect(() => {
    if (!isEvaluador) return
    if (!guiaYaVista()) setGuiaOpen(true)
  }, [isEvaluador])

  useEffect(() => {
    setPeriodoSeleccionado(PERIODOS_DESEMPENO[periodoModo][0])
  }, [periodoModo])

  const handleSearch = () => {
    if (numeroBuscado) buscarEmpleado(numeroBuscado)
  }

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <div className="text-sm text-muted-foreground">Cargando...</div>
    </div>
  )

  const ponderacion = data ? calcularPonderacion(data) : null
  const requiereCompromisos = ponderacion !== null && ponderacion.calificacionFinal < 80
  const tieneCompromisos = !!(data?.compromisos?.trim())
  const bloqueado = requiereCompromisos && !tieneCompromisos

  const previewData: DesempenoData = {
    ...(data ?? {
      numero_empleado: "",
      nombre: "",
      puesto: "",
      evaluador_nombre: "",
      evaluador_puesto: "",
      tipo: "operativo",
      objetivos: DEFAULT_OBJETIVOS_POR_TIPO["operativo"],
      cumplimiento_responsabilidades: DEFAULT_CUMPLIMIENTO.map((c) => ({ ...c })),
      competencias: DEFAULT_COMPETENCIAS.map((c) => ({ ...c })),
      compromisos: "",
      fecha_revision: "",
      observaciones: "",
      calificacion_final: 0,
      incidencias: [],
    }),
    periodo: data?.periodo || periodoSeleccionado,
  }

  return (
    <TooltipProvider>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Buscador */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Buscar empleado</CardTitle>
              <div className="flex items-center gap-1.5">
                {/* ── Pendientes trigger ────────────────── */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="relative h-8 w-8"
                      onClick={() => setDrawerOpen(true)}
                      aria-label="Ver evaluaciones pendientes"
                    >
                      <ClipboardList className="h-4 w-4" />
                      {totalEvals > 0 && (
                        <motion.span
                          className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold tabular-nums text-destructive-foreground"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 420, damping: 14 }}
                        >
                          {totalEvals > 99 ? "99+" : totalEvals}
                        </motion.span>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {totalEvals > 0
                      ? `${totalEvals} evaluación${totalEvals !== 1 ? "es" : ""} pendiente${totalEvals !== 1 ? "s" : ""}`
                      : "Sin evaluaciones pendientes"}
                  </TooltipContent>
                </Tooltip>

                {/* ── Animated guide button ───────────────── */}
                <div className="relative">
                  {/* Pulse ring 1 */}
                  <motion.span
                    className="pointer-events-none absolute inset-0 rounded-xl bg-primary/25"
                    animate={{ scale: [1, 1.9], opacity: [0.5, 0] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
                  />
                  {/* Pulse ring 2 — staggered */}
                  <motion.span
                    className="pointer-events-none absolute inset-0 rounded-xl bg-primary/15"
                    animate={{ scale: [1, 1.9], opacity: [0.4, 0] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut", delay: 0.8 }}
                  />

                  <motion.button
                    className="relative flex h-8 items-center gap-1.5 overflow-hidden rounded-xl bg-primary px-3.5 text-xs font-bold text-primary-foreground shadow-md shadow-primary/30 transition-shadow hover:shadow-lg hover:shadow-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    whileHover={{ scale: 1.07 }}
                    whileTap={{ scale: 0.91 }}
                    transition={{ type: "spring", stiffness: 420, damping: 17 }}
                    onClick={() => setGuiaOpen(true)}
                    aria-label="Ver guía de evaluación"
                  >
                    {/* Shimmer sweep */}
                    <motion.span
                      className="pointer-events-none absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent"
                      initial={{ x: "-130%" }}
                      animate={{ x: "230%" }}
                      transition={{ duration: 1.3, repeat: Infinity, repeatDelay: 3.2, ease: "easeInOut" }}
                    />

                    {/* Icon with wobble */}
                    <motion.span
                      className="relative"
                      animate={{ rotate: [0, 14, -10, 0], scale: [1, 1.15, 1] }}
                      transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 2.8, ease: "easeInOut" }}
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                    </motion.span>

                    <span className="relative">Guía</span>
                  </motion.button>
                </div>
                {data && (
                  <>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => guardar({ ...data, periodo: data.periodo || periodoSeleccionado })}
                          disabled={saving || bloqueado}
                          aria-label="Guardar evaluación"
                        >
                          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{bloqueado ? "Captura compromisos primero (calificación < 80%)" : "Guardar evaluación"}</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button size="icon" className="h-8 w-8" onClick={() => window.print()} disabled={bloqueado} aria-label="Imprimir">
                          <Printer className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{bloqueado ? "Captura compromisos primero (calificación < 80%)" : "Imprimir"}</TooltipContent>
                    </Tooltip>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2 pb-4">
            <div className="grid gap-4 md:grid-cols-[1fr_auto]">
              <div>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={numeroBuscado}
                    onChange={(e) => setNumeroBuscado(e.target.value)}
                    placeholder="Buscar por número de empleado ej: 3204"
                    className="pl-10"
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                </div>
                <div className="mt-4 grid gap-2 md:grid-cols-[1fr_auto] items-end">
                  <div className="space-y-2">
                    <div className="text-sm font-semibold">Periodo de evaluación</div>
                    <div className="grid grid-cols-2 gap-2">
                      {(["semestrales", "mensuales"] as const).map((modo) => (
                        <Button
                          key={modo}
                          variant={periodoModo === modo ? "secondary" : "outline"}
                          onClick={() => setPeriodoModo(modo)}
                        >
                          {modo === "semestrales" ? "Semestral" : "Mensual"}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">Seleccionar periodo</label>
                    <Select
                      value={periodoSeleccionado}
                      onValueChange={(value) => setPeriodoSeleccionado(value as DesempenoPeriodo)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar periodo" />
                      </SelectTrigger>
                      <SelectContent>
                        {PERIODOS_DESEMPENO[periodoModo].map((periodo) => (
                          <SelectItem key={periodo} value={periodo}>{periodo}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <div className="flex items-end justify-end">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button onClick={handleSearch} size="icon" aria-label="Buscar Empleado">
                      <Search className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Buscar Empleado</TooltipContent>
                </Tooltip>
              </div>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {bloqueado && (
          <Alert className="flex items-center gap-2 [&>svg]:static [&>svg]:translate-y-0 [&>svg~*]:pl-0 bg-[hsl(var(--alert-warning))] text-[hsl(var(--alert-warning-foreground))] border-[hsl(var(--alert-warning-border))]">
            <AlertDescription>
              La calificación es menor a <strong>80%.</strong> No puedes guardar, imprimir o descargar el PDF hasta que captures los compromisos de mejora.
            </AlertDescription>
          </Alert>
        )}

        <DesempenoForm data={previewData} onUpdate={data ? setData : undefined} />

        {data && (
          <div className="print-area hidden print:block">
            <DesempenoPrint data={data} />
          </div>
        )}

        {/* ── Save success animation ────────────────────────────────── */}
        <DesempenoSaveSuccess
          visible={saveSuccess}
          nombre={data?.nombre}
          calificacion={ponderacion?.calificacionFinal}
          onDone={resetSaveSuccess}
        />

        <DesempenoGuia open={guiaOpen} onClose={() => setGuiaOpen(false)} />
        <PendientesDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      </div>
    </TooltipProvider>
  )
}
