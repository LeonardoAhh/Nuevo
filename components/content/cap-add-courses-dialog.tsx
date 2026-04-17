"use client"

import React, { useState, useEffect } from "react"
import { Check, AlertCircle, Plus, Minus, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ResponsiveShell, ModalToolbar } from "@/components/ui/responsive-shell"
import type { Employee, Course } from "@/lib/hooks"

type CourseRow = { course_id: string; course_name: string; fecha_aplicacion: string; calificacion: string }

export interface CapAddCoursesDialogProps {
  employee: Employee | null
  open: boolean
  saving: boolean
  isReadOnly: boolean
  courses: Course[]
  loadingCourses: boolean
  onClose: () => void
  onSave: (rows: { course_id: string; course_name: string; fecha_aplicacion: string | null; calificacion: number | null }[]) => void
}

export function CapAddCoursesDialog({ employee, open, saving, isReadOnly, courses, loadingCourses, onClose, onSave }: CapAddCoursesDialogProps) {
  const [rows, setRows] = useState<CourseRow[]>([{ course_id: '', course_name: '', fecha_aplicacion: '', calificacion: '' }])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setRows([{ course_id: '', course_name: '', fecha_aplicacion: '', calificacion: '' }])
      setError(null)
    }
  }, [open])

  if (!employee) return null

  const addRow = () => setRows(prev => [...prev, { course_id: '', course_name: '', fecha_aplicacion: '', calificacion: '' }])
  const removeRow = (i: number) => setRows(prev => prev.filter((_, idx) => idx !== i))
  const updateRow = (i: number, field: keyof CourseRow, value: string) =>
    setRows(prev => prev.map((r, idx) => {
      if (idx !== i) return r
      if (field === 'course_id') {
        const c = courses.find(c => c.id === value)
        return { ...r, course_id: value, course_name: c?.name ?? '' }
      }
      return { ...r, [field]: value }
    }))

  const handleConfirm = () => {
    const valid = rows.filter(r => r.course_id)
    if (valid.length === 0) { setError('Selecciona al menos un curso'); return }
    setError(null)
    onSave(valid.map(r => ({
      course_id: r.course_id,
      course_name: r.course_name,
      fecha_aplicacion: r.fecha_aplicacion || null,
      calificacion: r.calificacion ? (parseInt(r.calificacion) || null) : null,
    })))
  }

  return (
    <ResponsiveShell open={open} onClose={onClose} title="Agregar cursos" description={employee.nombre}>
      <ModalToolbar
        title="Agregar cursos"
        subtitle={`${employee.nombre}${employee.puesto ? ` · ${employee.puesto}` : ''}`}
        saving={saving}
        onClose={onClose}
        onConfirm={handleConfirm}
        confirmDisabled={isReadOnly}
      />

      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="space-y-3 px-4 py-5">
          {error && (
            <Alert variant="destructive" className="py-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loadingCourses ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {rows.map((row, i) => (
                  <div key={i} className="flex flex-col gap-2 p-3 rounded-xl border bg-muted/50">
                    <div className="flex items-start gap-2">
                      <div className="flex-1 space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Curso</label>
                        <Select value={row.course_id} onValueChange={v => updateRow(i, 'course_id', v)}>
                          <SelectTrigger className="bg-muted text-sm"><SelectValue /></SelectTrigger>
                          <SelectContent className="bg-card max-h-60">
                            {courses.map(c => <SelectItem key={c.id} value={c.id} className="text-sm">{c.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      {rows.length > 1 && (
                        <button onClick={() => removeRow(i)} className="mt-5 p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                          <Minus className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Fecha aplicación</label>
                        <Input type="date" value={row.fecha_aplicacion} onChange={e => updateRow(i, 'fecha_aplicacion', e.target.value)} className="bg-muted" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Calificación</label>
                        <Input type="number" min={0} max={100} value={row.calificacion} onChange={e => updateRow(i, 'calificacion', e.target.value)} className="text-sm bg-muted" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={addRow} className="w-full gap-2">
                <Plus className="h-4 w-4" /> Agregar otro curso
              </Button>
            </>
          )}
        </div>
      </div>
    </ResponsiveShell>
  )
}
