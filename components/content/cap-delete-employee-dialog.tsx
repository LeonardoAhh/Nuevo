"use client"

import React from "react"
import { Trash2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ResponsiveShell, ModalToolbar } from "@/components/ui/responsive-shell"
import type { Employee } from "@/lib/hooks"

export interface CapDeleteEmployeeDialogProps {
  employee: Employee | null
  open: boolean
  saving: boolean
  isReadOnly: boolean
  error: string | null
  onClose: () => void
  onConfirm: () => void
}

export function CapDeleteEmployeeDialog({ employee, open, saving, isReadOnly, error, onClose, onConfirm }: CapDeleteEmployeeDialogProps) {
  return (
    <ResponsiveShell open={open} onClose={onClose} maxWidth="sm:max-w-sm" title="Eliminar empleado" description="Confirmación de eliminación">
      <ModalToolbar
        title="Eliminar empleado"
        subtitle={employee?.nombre}
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
            Se eliminará a <strong className="text-foreground">{employee?.nombre}</strong> y
            todos sus datos del sistema: cursos, evaluaciones de desempeño, datos de promoción y nuevo ingreso.
            Esta acción no se puede deshacer.
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
