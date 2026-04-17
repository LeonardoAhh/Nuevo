"use client"

import React, { useState, useEffect } from "react"
import { Check, AlertCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ResponsiveShell, ModalToolbar } from "@/components/ui/responsive-shell"

export interface CapNewCourseDialogProps {
  open: boolean
  saving: boolean
  onClose: () => void
  onSave: (name: string) => void
}

export function CapNewCourseDialog({ open, saving, onClose, onSave }: CapNewCourseDialogProps) {
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) { setName(''); setError(null) }
  }, [open])

  const handleConfirm = () => {
    if (!name.trim()) { setError('El nombre del curso es requerido'); return }
    setError(null)
    onSave(name)
  }

  return (
    <ResponsiveShell open={open} onClose={onClose} maxWidth="sm:max-w-md" title="Nuevo curso" description="Agrega un curso al catálogo">
      <ModalToolbar
        title="Nuevo curso"
        saving={saving}
        onClose={onClose}
        onConfirm={handleConfirm}
      />

      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="space-y-4 px-4 py-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Nombre del curso</label>
            <Input
              placeholder="Ej. Seguridad industrial básica"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleConfirm() }}
              className="bg-muted"
              autoFocus
            />
          </div>
          {error && (
            <Alert variant="destructive" className="py-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </ResponsiveShell>
  )
}
