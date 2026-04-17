"use client"

import React, { useState, useEffect } from "react"
import { Check, AlertCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ResponsiveShell, ModalToolbar } from "@/components/ui/responsive-shell"
import type { Department } from "@/lib/hooks"

export interface CapNewPositionDialogProps {
  open: boolean
  saving: boolean
  departments: Department[]
  onClose: () => void
  onSave: (name: string, departmentId: string) => void
}

export function CapNewPositionDialog({ open, saving, departments, onClose, onSave }: CapNewPositionDialogProps) {
  const [name, setName] = useState('')
  const [deptId, setDeptId] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) { setName(''); setDeptId(''); setError(null) }
  }, [open])

  const handleConfirm = () => {
    if (!name.trim()) { setError('El nombre del puesto es requerido'); return }
    if (!deptId) { setError('Selecciona un departamento'); return }
    setError(null)
    onSave(name, deptId)
  }

  return (
    <ResponsiveShell open={open} onClose={onClose} maxWidth="sm:max-w-md" title="Nuevo puesto" description="Agrega un puesto al catálogo">
      <ModalToolbar
        title="Nuevo puesto"
        saving={saving}
        onClose={onClose}
        onConfirm={handleConfirm}
      />

      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="space-y-4 px-4 py-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Nombre del puesto</label>
            <Input
              placeholder="Ej. Operador de producción"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleConfirm() }}
              className="bg-muted"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Departamento</label>
            <Select value={deptId} onValueChange={setDeptId}>
              <SelectTrigger className="bg-muted"><SelectValue placeholder="Selecciona departamento" /></SelectTrigger>
              <SelectContent className="bg-card">
                {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
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
