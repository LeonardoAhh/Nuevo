"use client"

import { Button } from "@/components/ui/button"
import { ResponsiveShell } from "@/components/ui/responsive-shell"

export function MaintenanceNoticeDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <ResponsiveShell
      open={open}
      onClose={onClose}
      size="xs"
      title="Aviso de mantenimiento programado"
      description="El sistema estará en mantenimiento del 20 de noviembre al 1 de diciembre de 2026 por actualización de datos."
    >
      <div className="min-h-0 overflow-y-auto px-5 pb-5 pt-5 sm:px-6 sm:pb-6 sm:pt-6">
        <p className="font-mono text-xs font-medium uppercase leading-4 text-muted-foreground">
          Aviso importante
        </p>
        <h2 className="mt-2 text-xl font-semibold leading-7 tracking-[-0.4px] text-foreground">
          Mantenimiento programado
        </h2>
        <p className="mt-2 text-sm leading-5 text-muted-foreground">
          Del <strong className="font-medium text-foreground">20 de noviembre</strong> al{" "}
          <strong className="font-medium text-foreground">1 de diciembre de 2026</strong>, el sistema
          se encontrará en mantenimiento por actualización de datos.
        </p>
        <div className="mt-5 border-t border-border pt-4">
          <Button type="button" onClick={onClose} className="min-h-11 w-full rounded-md sm:w-auto sm:px-6">
            Entendido
          </Button>
        </div>
      </div>
    </ResponsiveShell>
  )
}
