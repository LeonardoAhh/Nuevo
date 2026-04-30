"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Printer, Search, Loader2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { OBJETIVOS_POR_PUESTO, DEFAULT_OBJETIVOS_POR_TIPO, calcularPonderacion, type Objetivo } from "@/lib/types/desempeno"
import { CATALOGO_ORGANIZACIONAL, getTipoDesempenoByPuesto } from "@/lib/catalogo"
import { useDesempeno, type EvaluacionHistorial } from "@/lib/hooks/useDesempeno"
import DesempenoPrint from "./desempeno-print"

function getObjetivosForPuesto(puesto: string): Objetivo[] {
  if (OBJETIVOS_POR_PUESTO[puesto]) {
    return OBJETIVOS_POR_PUESTO[puesto]
  }
  const tipo = getTipoDesempenoByPuesto(puesto)
  return DEFAULT_OBJETIVOS_POR_TIPO[tipo]
}

function formatFecha(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })
}

function calificacionColor(cal: number): string {
  if (cal >= 80) return "text-success"
  if (cal >= 60) return "text-warning"
  return "text-destructive"
}

export default function DesempenoObjetivos() {
  const departamentos = useMemo(() => Object.entries(CATALOGO_ORGANIZACIONAL), [])
  const [puesto, setPuesto] = useState("")
  const [histSearch, setHistSearch] = useState("")

  const { historial, historialLoading, fetchHistorial, cargarEvaluacion, eliminarEvaluacion, data, loading } = useDesempeno()

  useEffect(() => {
    fetchHistorial()
  }, [fetchHistorial])

  const objetivos = puesto ? getObjetivosForPuesto(puesto) : []
  const hasPuestoObjetivos = puesto ? !!OBJETIVOS_POR_PUESTO[puesto] : false
  const tipoLabel = puesto ? getTipoDesempenoByPuesto(puesto) : null

  const requiereCompromisos = data ? calcularPonderacion(data).calificacionFinal < 80 : false
  const tieneCompromisos = !!(data?.compromisos?.trim())
  const bloqueado = requiereCompromisos && !tieneCompromisos

  const filteredHistorial = historial.filter((e) => {
    if (!histSearch) return true
    const q = histSearch.toLowerCase()
    return (
      e.numero_empleado.toLowerCase().includes(q) ||
      (e.nombre ?? "").toLowerCase().includes(q) ||
      (e.puesto ?? "").toLowerCase().includes(q) ||
      (e.periodo ?? "").toLowerCase().includes(q)
    )
  })

  const handleVerEvaluacion = (evalItem: EvaluacionHistorial) => {
    cargarEvaluacion(evalItem.id)
  }

  return (
    <TooltipProvider>
    <div className="space-y-4 max-w-7xl mx-auto py-4">
      {/* Two-column layout */}
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        {/* Left — selector */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Seleccionar puesto</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">Catálogo de objetivos SMART por puesto.</p>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link href="/desempeno">
                      <Button variant="outline" size="icon" className="h-8 w-8" aria-label="Volver a evaluación">
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>Volver a evaluación</TooltipContent>
                </Tooltip>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select value={puesto} onValueChange={setPuesto}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar puesto..." />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  {departamentos.map(([depto, { puestos }]) => (
                    <SelectGroup key={depto}>
                      <SelectLabel>{depto}</SelectLabel>
                      {puestos.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
              {puesto && (
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">
                    {tipoLabel ? tipoLabel.charAt(0).toUpperCase() + tipoLabel.slice(1) : ""}
                  </Badge>
                  <Badge variant={hasPuestoObjetivos ? "default" : "outline"}>
                    {hasPuestoObjetivos ? "Objetivos definidos" : "Genérico por tipo"}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {puesto && (
            <Card>
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground">
                  {hasPuestoObjetivos
                    ? "Este puesto tiene objetivos específicos definidos en el catálogo."
                    : "Este puesto usa objetivos genéricos del tipo. Defínelos en desempeno.ts para personalizarlos."}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right — objectives table + historial */}
        <div className="space-y-4">
          {puesto && objetivos.length > 0 ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{puesto}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 w-12">#</th>
                        <th className="text-left p-2">Descripción del objetivo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {objetivos.map((obj) => (
                        <tr key={obj.numero} className="border-b last:border-0">
                          <td className="px-2 py-3 font-semibold text-muted-foreground">{obj.numero}</td>
                          <td className="px-2 py-3">{obj.descripcion}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : !puesto ? null : (
            <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
              Sin objetivos para este puesto.
            </div>
          )}

          {/* Historial de evaluaciones */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base">Historial de evaluaciones</CardTitle>
                  <CardDescription>Evaluaciones guardadas. Selecciona para reimprimir.</CardDescription>
                </div>
                {data && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="icon" className="h-8 w-8 shrink-0" onClick={() => window.print()} disabled={bloqueado} aria-label="Imprimir">
                        <Printer className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{bloqueado ? "Captura compromisos primero (calificación < 80%)" : "Imprimir evaluación cargada"}</TooltipContent>
                  </Tooltip>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={histSearch}
                  onChange={(e) => setHistSearch(e.target.value)}
                  placeholder="Buscar por nombre, número o periodo..."
                  className="pl-9 bg-muted text-foreground"
                />
              </div>

              {historialLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : filteredHistorial.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  {histSearch ? "Sin resultados." : "No hay evaluaciones guardadas."}
                </div>
              ) : (
                <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">#</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead className="hidden md:table-cell">Puesto</TableHead>
                        <TableHead>Periodo</TableHead>
                        <TableHead className="text-center">Calif.</TableHead>
                        <TableHead className="hidden md:table-cell">Fecha</TableHead>
                        <TableHead className="w-10" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredHistorial.map((ev) => (
                        <TableRow
                          key={ev.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleVerEvaluacion(ev)}
                        >
                          <TableCell className="font-mono text-xs">{ev.numero_empleado}</TableCell>
                          <TableCell className="font-medium truncate max-w-[200px]">{ev.nombre ?? "—"}</TableCell>
                          <TableCell className="hidden md:table-cell text-muted-foreground truncate max-w-[160px]">{ev.puesto ?? "—"}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs">{ev.periodo ?? "—"}</Badge>
                          </TableCell>
                          <TableCell className={`text-center font-bold ${calificacionColor(ev.calificacion_final)}`}>
                            {ev.calificacion_final}%
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-xs text-muted-foreground">{formatFecha(ev.created_at)}</TableCell>
                          <TableCell>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                  onClick={(e) => { e.stopPropagation(); eliminarEvaluacion(ev.id) }}
                                  aria-label="Eliminar evaluación"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Eliminar</TooltipContent>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {loading && (
                <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Cargando evaluación...</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Print area for selected evaluation */}
      {data && !puesto && (
        <Card className="print:hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Evaluación cargada</CardTitle>
              <Button variant="outline" size="sm" onClick={() => window.print()} disabled={bloqueado}>
                <Printer className="h-4 w-4 mr-1.5" />
                {bloqueado ? "Captura compromisos" : "Imprimir"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground text-xs">Empleado</span>
                <p className="font-semibold">{data.numero_empleado} — {data.nombre}</p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">Puesto</span>
                <p className="font-semibold">{data.puesto}</p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">Periodo</span>
                <p className="font-semibold">{data.periodo || "—"}</p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">Calificación</span>
                <p className={`font-bold text-lg ${calificacionColor(data.calificacion_final)}`}>{data.calificacion_final}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Hidden print area */}
      {data && (
        <div className="print-area hidden print:block">
          <DesempenoPrint data={data} />
        </div>
      )}
    </div>
    </TooltipProvider>
  )
}
