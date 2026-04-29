"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { OBJETIVOS_POR_PUESTO, DEFAULT_OBJETIVOS_POR_TIPO, type Objetivo } from "@/lib/types/desempeno"
import { CATALOGO_ORGANIZACIONAL, getTipoDesempenoByPuesto } from "@/lib/catalogo"

function getObjetivosForPuesto(puesto: string): Objetivo[] {
  if (OBJETIVOS_POR_PUESTO[puesto]) {
    return OBJETIVOS_POR_PUESTO[puesto]
  }
  const tipo = getTipoDesempenoByPuesto(puesto)
  return DEFAULT_OBJETIVOS_POR_TIPO[tipo]
}

export default function DesempenoObjetivos() {
  const departamentos = useMemo(() => Object.entries(CATALOGO_ORGANIZACIONAL), [])
  const [puesto, setPuesto] = useState("")

  const objetivos = puesto ? getObjetivosForPuesto(puesto) : []
  const hasPuestoObjetivos = puesto ? !!OBJETIVOS_POR_PUESTO[puesto] : false
  const tipoLabel = puesto ? getTipoDesempenoByPuesto(puesto) : null

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

        {/* Right — objectives table */}
        <div>
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
          ) : (
            <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
              Selecciona un puesto para ver sus objetivos.
            </div>
          )}
        </div>
      </div>
    </div>
    </TooltipProvider>
  )
}
