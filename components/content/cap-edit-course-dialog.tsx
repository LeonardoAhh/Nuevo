"use client"

import React, { useState, useEffect } from "react"
import { AlertCircle, Clock } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ResponsiveShell, ModalToolbar } from "@/components/ui/responsive-shell"
import type { Course } from "@/lib/hooks"

export interface CapEditCourseDialogProps {
  course: Course | null
  open: boolean
  saving: boolean
  onClose: () => void
  onSave: (id: string, data: { name: string; duration_hours: number | null }) => void
}

export function CapEditCourseDialog({ course, open, saving, onClose, onSave }: CapEditCourseDialogProps) {
  const [name, setName] = useState('')
  const [duration, setDuration] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && course) {
      setName(course.name)
      setDuration(course.duration_hours != null ? String(course.duration_hours) : '')
      setError(null)
    }
  }, [open, course])

  const handleConfirm = () => {
    if (!course) return
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
    onSave(course.id, { name, duration_hours: durationHours })
  }

  return (
    <ResponsiveShell
      open={open}
      onClose={onClose}
      maxWidth="sm:max-w-md"
      title="Editar curso"
      description="Actualiza nombre y duración del curso"
    >
      <ModalToolbar
        title="Editar curso"
        saving={saving}
        onClose={onClose}
        onConfirm={handleConfirm}
      />

      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="space-y-4 px-4 py-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Nombre del curso</label>
            <Input
              data-testid="edit-course-name-input"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleConfirm() }}
              className="bg-muted"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-primary" />
              Duración (horas)
              <span className="text-xs text-muted-foreground font-normal">— alimenta el KPI</span>
            </label>
            <Input
              data-testid="edit-course-duration-input"
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
              Deja vacío para no contar este curso en el KPI de horas.
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="py-2" data-testid="edit-course-error">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </ResponsiveShell>
  )
}
