"use client"

import React from "react"
import { Trash2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ResponsiveShell, ModalToolbar } from "@/components/ui/responsive-shell"

export interface CapConfirmClearDialogProps {
  open: boolean
  saving: boolean
  isReadOnly: boolean
  employeeCount: number
  error: string | null
  onClose: () => void
  onConfirm: () => void
}

export function CapConfirmClearDialog({ open, saving, isReadOnly, employeeCount, error, onClose, onConfirm }: CapConfirmClearDialogProps) {
  return (
    <ResponsiveShell open={open} onClose={onClose} maxWidth="sm:max-w-sm" title="Borrar historial" description="Confirmación de eliminación masiva">
      <ModalToolbar
        title="Borrar historial"
        saving={saving}
        onClose={onClose}
        onConfirm={onConfirm}
        confirmIcon={<Trash2 className="h-4 w-4" />}
        confirmVariant="destructive"
        confirmDisabled={isReadOnly}
      />

      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="px-4 py-5 space-y-4">
          <p className="text-sm text-muted-foreground">
            Se eliminarán <strong className="text-foreground">{employeeCount} empleados</strong> y
            todos sus registros de cursos tomados. Esta acción no se puede deshacer.
          </p>
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </ResponsiveShell>
  )
}
