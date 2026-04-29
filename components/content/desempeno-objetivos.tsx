"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Plus, RotateCcw, Save, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { DEFAULT_OBJETIVOS_POR_TIPO, type DesempenoTipo, type Objetivo } from "@/lib/types/desempeno"

const TIPOS: DesempenoTipo[] = ["operativo", "administrativo", "jefe"]

export default function DesempenoObjetivos() {
  const [tipo, setTipo] = useState<DesempenoTipo>("operativo")
  const [objetivos, setObjetivos] = useState<Objetivo[]>(
    DEFAULT_OBJETIVOS_POR_TIPO["operativo"].map((obj) => ({ ...obj }))
  )

  useEffect(() => {
    setObjetivos(DEFAULT_OBJETIVOS_POR_TIPO[tipo].map((obj) => ({ ...obj })))
  }, [tipo])

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
    setObjetivos(DEFAULT_OBJETIVOS_POR_TIPO[tipo].map((obj) => ({ ...obj })))
  }

  return (
    <TooltipProvider>
    <div className="space-y-6 max-w-6xl mx-auto py-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Define plantillas de objetivos SMART por tipo de puesto.
          </p>
        </div>
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
              <Button variant="outline" size="icon" onClick={addObjetivo} aria-label="Agregar objetivo">
                <Plus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Agregar objetivo</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="secondary" size="icon" onClick={restorePlantilla} aria-label="Restaurar plantilla">
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

      <Card>
        <CardHeader>
          <CardTitle>Control de plantilla</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-[1fr_auto] items-end">
          <div className="space-y-2">
            <Label>Tipo de puesto</Label>
            <Select value={tipo} onValueChange={(value) => setTipo(value as DesempenoTipo)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                {TIPOS.map((item) => (
                  <SelectItem key={item} value={item}>{item.charAt(0).toUpperCase() + item.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="rounded-lg border border-border bg-muted p-4">
            <p className="text-sm text-muted-foreground">Plantilla vigente</p>
            <p className="mt-2 text-lg font-semibold">{tipo.charAt(0).toUpperCase() + tipo.slice(1)}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Objetivos SMART</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {objetivos.map((objetivo, index) => (
            <div key={index} className="grid gap-3 rounded-lg border border-border p-4 md:grid-cols-[1fr_1fr]">
              <div className="space-y-2 md:col-span-2">
                <div className="flex items-center justify-between gap-3">
                  <Label>Objetivo {objetivo.numero}</Label>
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
              <div>
                <Label>Resultado esperado</Label>
                <Input
                  value={objetivo.resultado}
                  onChange={(e) => updateObjetivo(index, "resultado", e.target.value)}
                  placeholder="NA"
                />
              </div>
              <div>
                <Label>% Obtenido</Label>
                <Input
                  value={objetivo.porcentaje}
                  onChange={(e) => updateObjetivo(index, "porcentaje", e.target.value)}
                  placeholder="NA"
                />
              </div>
              <div className="md:col-span-2">
                <Label>Comentarios</Label>
                <Textarea
                  value={objetivo.comentarios}
                  onChange={(e) => updateObjetivo(index, "comentarios", e.target.value)}
                  placeholder="Comentarios adicionales"
                  className="min-h-[120px]"
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

    </div>
    </TooltipProvider>
  )
}
