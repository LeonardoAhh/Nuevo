"use client"

import { useId } from "react"
import { CircleCheck, LockKeyhole, Wrench } from "lucide-react"
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
            className="relative size-11 rounded-full bg-card text-muted-foreground hover:text-foreground"
            aria-label={COPY.label}
            title={COPY.title}
          >
            <Wrench strokeWidth={1.75} aria-hidden="true" />
            <span className="absolute right-0 top-0 size-2.5 rounded-full border-2 border-card bg-warning" aria-hidden="true" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          side="top"
          align="end"
          sideOffset={8}
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          className="max-w-[calc(100vw-2rem)] overflow-hidden p-0"
        >
          <div className="flex items-start gap-3 p-4">
            <span className="grid size-8 shrink-0 place-items-center rounded-md border border-border bg-muted/40 text-foreground">
              <Wrench className="size-4" strokeWidth={1.75} aria-hidden="true" />
            </span>
            <div className="min-w-0 space-y-1">
              <h2 id={titleId} className="text-sm font-medium leading-5">{COPY.title}</h2>
              <p id={descriptionId} className="text-xs leading-5 text-muted-foreground">{COPY.description}</p>
            </div>
          </div>
          <dl className="divide-y divide-border border-t border-border text-xs">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3">
              <dt className="text-muted-foreground">{COPY.local}</dt>
              <dd className="flex items-center gap-2 font-medium text-foreground">
                <CircleCheck className="size-3.5 text-primary" strokeWidth={1.75} aria-hidden="true" />
                {COPY.localStatus}
              </dd>
            </div>
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3">
              <dt className="text-muted-foreground">{COPY.production}</dt>
              <dd className="flex items-center gap-2 font-medium text-foreground">
                <LockKeyhole className="size-3.5 text-muted-foreground" strokeWidth={1.75} aria-hidden="true" />
                {COPY.productionStatus}
              </dd>
            </div>
          </dl>
        </PopoverContent>
      </Popover>
    </div>
  )
}
