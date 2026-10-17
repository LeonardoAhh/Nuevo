"use client"

import { CalendarDays } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ResponsiveShell } from "@/components/ui/responsive-shell"

export function MaintenanceNoticeDialog({
  open,
  onClose,
  isEvaluador,
}: {
  open: boolean
  onClose: () => void
  isEvaluador: boolean
}) {
  return (
    <ResponsiveShell
      open={open}
      onClose={onClose}
      size="xs"
      title="Aviso de mantenimiento programado"
      description="Del 20 de noviembre al 1 de diciembre de 2026, el sistema estará en mantenimiento por actualización de datos."
    >
      <div className="min-h-0 overflow-y-auto px-5 pb-5 pt-5 sm:px-6 sm:pb-6 sm:pt-6">
        <p className="flex items-center gap-2 font-mono text-xs font-medium uppercase leading-4 text-muted-foreground">
          <CalendarDays className="size-3.5 shrink-0" aria-hidden="true" />
          Aviso importante
        </p>
        <h2 className="mt-2 text-xl font-semibold leading-7 tracking-[-0.4px] text-foreground">
          Mantenimiento programado
        </h2>
        <p className="mt-2 text-sm leading-5 text-muted-foreground">
          Del <strong className="font-medium text-foreground">20 de noviembre</strong> al{" "}
          <strong className="font-medium text-foreground">1 de diciembre de 2026</strong>, realizaremos
          una actualización de datos del sistema.
        </p>
        <p className="mt-4 text-sm font-medium leading-5 text-foreground">¿Qué significa para ti?</p>
        {isEvaluador ? (
          <>
            <p className="mt-1 text-sm leading-5 text-muted-foreground">
              Durante esos días no podrás acceder al sistema para realizar, consultar o guardar evaluaciones.
            </p>
            <p className="mt-3 text-sm leading-5 text-muted-foreground">
              Revisa tus evaluaciones pendientes y planifica su captura antes del 20 de noviembre.
            </p>
          </>
        ) : (
          <>
            <p className="mt-1 text-sm leading-5 text-muted-foreground">
              Durante esos días no podrás acceder al sistema para consultar o gestionar información.
            </p>
            <p className="mt-3 text-sm leading-5 text-muted-foreground">
              Si necesitas información durante ese periodo, consúltala o descárgala antes del 20 de noviembre.
            </p>
          </>
        )}
        <div className="mt-5 border-t border-border pt-4">
          <Button type="button" onClick={onClose} className="min-h-11 w-full rounded-md sm:w-auto sm:px-6">
            Entendido
          </Button>
        </div>
      </div>
    </ResponsiveShell>
  )
}
