"use client"

import { CheckCircle2, Printer, UserRoundPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { UMBRAL_CALIFICACION_APROBATORIA } from "@/lib/types/desempeno"

interface DesempenoSaveSuccessProps {
  visible: boolean
  nombre?: string
  calificacion?: number
  onPrint: () => void
  onNew: () => void
}

export function DesempenoSaveSuccess({ visible, nombre, calificacion, onPrint, onNew }: DesempenoSaveSuccessProps) {
  if (!visible) return null
  const approved = calificacion !== undefined && calificacion >= UMBRAL_CALIFICACION_APROBATORIA
  return <Card role="status" aria-live="polite" className="border-primary/30 bg-primary/5 print:hidden">
    <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-primary" aria-hidden="true" />
        <div>
          <h2 className="font-semibold">Evaluación guardada</h2>
          <p className="text-sm text-muted-foreground">{nombre ? `${nombre} · ` : ""}{calificacion !== undefined ? `${calificacion}% · ${approved ? "Resultado aprobatorio" : "Requiere seguimiento"}` : "Lista para imprimir"}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:flex">
        <Button type="button" variant="outline" onClick={onNew} className="min-h-11"><UserRoundPlus className="mr-2 size-4" />Evaluar otra persona</Button>
        <Button type="button" onClick={onPrint} className="min-h-11"><Printer className="mr-2 size-4" />Imprimir</Button>
      </div>
    </CardContent>
  </Card>
}
