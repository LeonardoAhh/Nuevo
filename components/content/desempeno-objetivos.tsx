"use client"

import { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import { ArrowLeft, Plus, RotateCcw, Save, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { OBJETIVOS_POR_PUESTO, DEFAULT_OBJETIVOS_POR_TIPO, type Objetivo } from "@/lib/types/desempeno"
import { CATALOGO_ORGANIZACIONAL, getTipoDesempenoByPuesto } from "@/lib/catalogo"

function getObjetivosForPuesto(puesto: string): Objetivo[] {
  if (OBJETIVOS_POR_PUESTO[puesto]) {
    return OBJETIVOS_POR_PUESTO[puesto].map((obj) => ({ ...obj }))
  }
  const tipo = getTipoDesempenoByPuesto(puesto)
  return DEFAULT_OBJETIVOS_POR_TIPO[tipo].map((obj) => ({ ...obj }))
}

export default function DesempenoObjetivos() {
  const departamentos = useMemo(() => Object.entries(CATALOGO_ORGANIZACIONAL), [])
  const [puesto, setPuesto] = useState("")
  const [objetivos, setObjetivos] = useState<Objetivo[]>([])

  useEffect(() => {
    if (puesto) {
      setObjetivos(getObjetivosForPuesto(puesto))
    }
  }, [puesto])

  const updateObjetivo = (index: number, field: keyof Objetivo, value: string) => {
    setObjetivos((current) => {
      const next = [...current]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  const addObjetivo = () => {
    setObjetivos((current) => [
      ...current,
      {
        numero: current.length + 1,
        descripcion: "",
        resultado: "NA",
        porcentaje: "NA",
        comentarios: "",
      },
    ])
  }

  const removeObjetivo = (index: number) => {
    setObjetivos((current) => {
      const next = current.filter((_, idx) => idx !== index)
      return next.map((item, idx) => ({ ...item, numero: idx + 1 }))
    })
  }

  const restorePlantilla = () => {
    if (puesto) setObjetivos(getObjetivosForPuesto(puesto))
  }

  const hasPuestoObjetivos = puesto ? !!OBJETIVOS_POR_PUESTO[puesto] : false
  const tipoLabel = puesto ? getTipoDesempenoByPuesto(puesto) : null

  return (
    <TooltipProvider>
    <div className="space-y-4 max-w-6xl mx-auto py-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Objetivos SMART por puesto.{" "}
          {tipoLabel && (
            <span className="font-medium text-foreground">
              Tipo: {tipoLabel.charAt(0).toUpperCase() + tipoLabel.slice(1)}
            </span>
          )}
        </p>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/desempeno">
                <Button variant="outline" size="icon" aria-label="Volver a evaluación">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent>Volver a evaluación</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={addObjetivo} disabled={!puesto} aria-label="Agregar objetivo">
                <Plus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Agregar objetivo</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="secondary" size="icon" onClick={restorePlantilla} disabled={!puesto} aria-label="Restaurar plantilla">
                <RotateCcw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Restaurar plantilla</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" disabled aria-label="Guardar plantilla">
                <Save className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Guardar plantilla (pendiente backend)</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Selector de puesto */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto] items-center">
            <div className="space-y-1">
              <Label>Puesto</Label>
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
            </div>
            {puesto && (
              <div className="rounded-lg border border-border bg-muted px-4 py-2 text-center">
                <p className="text-xs text-muted-foreground">Fuente</p>
                <p className="text-sm font-semibold">
                  {hasPuestoObjetivos ? "Puesto" : "Tipo (genérico)"}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Objetivos */}
      {puesto && objetivos.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Objetivos SMART — {puesto}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {objetivos.map((objetivo, index) => (
              <div key={index} className="grid gap-2 rounded-lg border border-border p-3 md:grid-cols-[1fr_1fr]">
                <div className="space-y-1.5 md:col-span-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label className="text-sm">Objetivo {objetivo.numero}</Label>
                    {objetivos.length > 1 && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => removeObjetivo(index)}
                            aria-label="Eliminar objetivo"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Eliminar</TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                  <Input
                    value={objetivo.descripcion}
                    onChange={(e) => updateObjetivo(index, "descripcion", e.target.value)}
                    placeholder="Descripción del objetivo"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">Resultado esperado</Label>
                  <Input
                    value={objetivo.resultado}
                    onChange={(e) => updateObjetivo(index, "resultado", e.target.value)}
                    placeholder="NA"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">% Obtenido</Label>
                  <Input
                    value={objetivo.porcentaje}
                    onChange={(e) => updateObjetivo(index, "porcentaje", e.target.value)}
                    placeholder="NA"
                  />
                </div>
                <div className="md:col-span-2 space-y-1">
                  <Label className="text-sm">Comentarios</Label>
                  <Textarea
                    value={objetivo.comentarios}
                    onChange={(e) => updateObjetivo(index, "comentarios", e.target.value)}
                    placeholder="Comentarios adicionales"
                    className="min-h-[80px]"
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {!puesto && (
        <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
          Selecciona un puesto para ver sus objetivos.
        </div>
      )}
    </div>
    </TooltipProvider>
  )
}
