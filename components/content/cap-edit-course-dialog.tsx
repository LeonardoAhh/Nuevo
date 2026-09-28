"use client"

import React, { useState, useEffect } from "react"
import { AlertCircle, Clock } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ResponsiveShell } from "@/components/ui/responsive-shell"
import { RedesignModalHeader } from "@/components/redesign/modal-header"
import { RedesignModalFooter } from "@/components/redesign/modal-footer"
import { TIPOS_CURSOS } from "@/lib/catalogo"
import type { Course } from "@/lib/hooks"

export interface CapEditCourseDialogProps {
  course: Course | null
  open: boolean
  saving: boolean
  onClose: () => void
  onSave: (id: string, data: { name: string; tipo: string; duration_hours: number | null }) => void
}

export function CapEditCourseDialog({ course, open, saving, onClose, onSave }: CapEditCourseDialogProps) {
  const [name, setName] = useState('')
  const [tipo, setTipo] = useState<string>('INDUCCIÓN')
  const [duration, setDuration] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && course) {
      setName(course.name)
      setTipo(course.tipo ?? 'INDUCCIÓN')
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
    onSave(course.id, { name, tipo, duration_hours: durationHours })
  }

  return (
    <ResponsiveShell
      open={open}
      onClose={onClose}
      maxWidth="sm:max-w-md"
      title="Editar curso"
    >
      <RedesignModalHeader
        title="Editar curso"
        subtitle="Actualiza nombre, tipo y duración del curso"
        onClose={onClose}
      />

      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="space-y-5 px-6 py-6">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-ink">Nombre del curso</label>
            <Input
              data-testid="edit-course-name-input"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleConfirm() }}
              className="h-11 rounded-md border-border/60 bg-transparent shadow-none focus-visible:ring-1 focus-visible:ring-primary text-base"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-ink">Tipo de curso</label>
              <select
                data-testid="edit-course-tipo-select"
                value={tipo}
                onChange={e => setTipo(e.target.value)}
                className="flex h-11 w-full rounded-md border border-border/60 bg-transparent px-3 py-2 text-base text-ink shadow-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              >
                {TIPOS_CURSOS.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-ink flex items-center gap-1.5">
                <Clock className="h-[14px] w-[14px] text-muted-foreground" />
                Duración (horas)
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
                className="h-11 rounded-md border-border/60 bg-transparent shadow-none focus-visible:ring-1 focus-visible:ring-primary text-base"
              />
            </div>
          </div>
          
          <p className="text-[11px] text-muted-foreground mt-1">
            Deja vacío para no contar este curso en el KPI de horas.
          </p>

          {error && (
            <Alert variant="destructive" className="py-2 border-destructive/30 bg-destructive/10 text-destructive" data-testid="edit-course-error">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      </div>
      <RedesignModalFooter
        onCancel={onClose}
        onConfirm={handleConfirm}
        saving={saving}
        confirmLabel="Guardar cambios"
      />
    </ResponsiveShell>
  )
}
