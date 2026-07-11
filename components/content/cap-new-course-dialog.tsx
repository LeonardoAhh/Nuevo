"use client"

import React, { useState, useEffect } from "react"
import { AlertCircle, Clock } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ResponsiveShell, ModalToolbar } from "@/components/ui/responsive-shell"
import { TIPOS_CURSOS } from "@/lib/catalogo"

export interface CapNewCourseDialogProps {
  open: boolean
  saving: boolean
  onClose: () => void
  onSave: (name: string, tipo: string, durationHours: number | null) => void
}

export function CapNewCourseDialog({ open, saving, onClose, onSave }: CapNewCourseDialogProps) {
  const [name, setName] = useState('')
  const [tipo, setTipo] = useState<string>('INDUCCIÓN')
  const [duration, setDuration] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) { setName(''); setTipo('INDUCCIÓN'); setDuration(''); setError(null) }
  }, [open])

  const handleConfirm = () => {
    if (!name.trim()) { setError('El nombre del curso es requerido'); return }
    let durationHours: number | null = null
    if (duration.trim() !== '') {
      const n = Number(duration.replace(',', '.'))
      if (!Number.isFinite(n) || n <= 0) {
        setError('La duración debe ser un número mayor a 0')
        return
      }
      durationHours = Math.round(n * 100) / 100
    }
    setError(null)
    onSave(name, tipo, durationHours)
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
              data-testid="new-course-name-input"
              placeholder="Ej. Seguridad industrial básica"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleConfirm() }}
              className="bg-muted"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Tipo de curso</label>
            <select
              data-testid="new-course-tipo-select"
              value={tipo}
              onChange={e => setTipo(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {TIPOS_CURSOS.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-primary" />
              Duración (horas)
              <span className="text-xs text-muted-foreground font-normal">— opcional, alimenta el KPI</span>
            </label>
            <Input
              data-testid="new-course-duration-input"
              type="number"
              inputMode="decimal"
              step="0.25"
              min="0"
              placeholder="Ej. 1.5"
              value={duration}
              onChange={e => setDuration(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleConfirm() }}
              className="bg-muted"
            />
            <p className="text-[11px] text-muted-foreground">
              Solo los cursos con duración registrada contarán para el KPI de horas de capacitación por año.
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="py-2" data-testid="new-course-error">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </ResponsiveShell>
  )
}
