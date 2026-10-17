"use client"

import { useEffect, useRef } from "react"
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
  onEdit?: () => void
}

export function DesempenoSaveSuccess({ visible, nombre, calificacion, onPrint, onNew, onEdit }: DesempenoSaveSuccessProps) {
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!visible) return
    const frame = requestAnimationFrame(() => cardRef.current?.focus({ preventScroll: true }))
    return () => cancelAnimationFrame(frame)
  }, [visible])

  if (!visible) return null
  const approved = calificacion !== undefined && calificacion >= UMBRAL_CALIFICACION_APROBATORIA
  return <Card ref={cardRef} tabIndex={-1} role="status" aria-live="polite" className="border-border bg-card outline-none print:hidden">
    <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div className="flex min-w-0 items-start gap-3">
        <CheckCircle2 className="mt-1 size-5 shrink-0 text-foreground" aria-hidden="true" />
        <div className="min-w-0">
          <h2 className="text-xl font-semibold leading-7 tracking-tight text-foreground">Evaluación guardada</h2>
          <p className="break-words text-sm font-normal leading-5 text-muted-foreground">{nombre ? `${nombre} · ` : ""}{calificacion !== undefined ? `${calificacion}% · ${approved ? "Resultado aprobatorio" : "Requiere seguimiento"}` : "Lista para imprimir"}</p>
          {onEdit && <button type="button" onClick={onEdit} className="mt-2 rounded-sm text-sm font-medium leading-5 text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Corregir datos</button>}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:flex sm:shrink-0">
        <Button type="button" variant="outline" onClick={onNew} className="min-h-11"><UserRoundPlus className="mr-2 size-4" />Evaluar otra persona</Button>
        <Button type="button" onClick={onPrint} className="min-h-11"><Printer className="mr-2 size-4" />Imprimir</Button>
      </div>
    </CardContent>
  </Card>
}
