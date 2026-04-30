"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Search, Printer, Download, AlertCircle, ClipboardList, Save, Loader2 } from "lucide-react"
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

export default function DesempenoSearch() {
  const [numeroBuscado, setNumeroBuscado] = useState("")

  const [periodoModo, setPeriodoModo] = useState<"semestrales" | "mensuales">("semestrales")
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState<DesempenoPeriodo>(PERIODOS_DESEMPENO.semestrales[0])
  const { data, setData, loading, saving, error, buscarEmpleado, guardar } = useDesempeno()

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
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href="/desempeno/objetivos">
                    <Button variant="outline" size="icon" className="h-8 w-8" aria-label="Objetivos por puesto">
                      <ClipboardList className="h-4 w-4" />
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>Objetivos por puesto</TooltipContent>
              </Tooltip>
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
                      <Button variant="outline" size="icon" className="h-8 w-8" disabled={bloqueado} aria-label="Descargar PDF">
                        <Download className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{bloqueado ? "Captura compromisos primero (calificación < 80%)" : "Descargar PDF"}</TooltipContent>
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
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            La calificación es menor a 80%. Es obligatorio capturar compromisos y acuerdos antes de guardar o imprimir.
          </AlertDescription>
        </Alert>
      )}

      <DesempenoForm data={previewData} onUpdate={data ? setData : undefined} />

      {data && (
        <div className="print-area hidden print:block">
          <DesempenoPrint data={data} />
        </div>
      )}
    </div>
    </TooltipProvider>
  )
}
