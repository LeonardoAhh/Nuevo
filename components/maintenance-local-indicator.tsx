"use client"

import { useId } from "react"
import { Wrench } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

const COPY = {
  label: "Mantenimiento activo: ver estado del entorno local",
  title: "Mantenimiento activo",
  description: "Puedes seguir trabajando en este entorno local.",
  local: "Local",
  localStatus: "Acceso permitido",
  production: "Producción",
  productionStatus: "Acceso bloqueado",
} as const

export function MaintenanceLocalIndicator() {
  const titleId = useId()
  const descriptionId = useId()

  return (
    <div className="fixed bottom-24 right-4 z-30 mb-[env(safe-area-inset-bottom)] md:bottom-4 print:hidden">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-11 rounded-full bg-card text-muted-foreground shadow-sm hover:text-foreground"
            aria-label={COPY.label}
            title={COPY.title}
          >
            <Wrench aria-hidden="true" />
            <span className="absolute right-0 top-0 size-2.5 rounded-full border-2 border-card bg-warning" aria-hidden="true" />
          </Button>
        </PopoverTrigger>
        <PopoverContent side="top" align="end" aria-labelledby={titleId} aria-describedby={descriptionId} className="max-w-[calc(100vw-2rem)] space-y-3">
          <div className="space-y-1">
            <h2 id={titleId} className="text-sm font-semibold">{COPY.title}</h2>
            <p id={descriptionId} className="text-sm leading-relaxed text-muted-foreground">{COPY.description}</p>
          </div>
          <dl className="space-y-2 border-t pt-3 text-xs">
            <div className="flex flex-wrap justify-between gap-2">
              <dt className="text-muted-foreground">{COPY.local}</dt>
              <dd className="font-medium">{COPY.localStatus}</dd>
            </div>
            <div className="flex flex-wrap justify-between gap-2">
              <dt className="text-muted-foreground">{COPY.production}</dt>
              <dd className="font-medium">{COPY.productionStatus}</dd>
            </div>
          </dl>
        </PopoverContent>
      </Popover>
    </div>
  )
}
