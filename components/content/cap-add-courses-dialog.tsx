"use client"

import { useState, useEffect, useId } from "react"
import { AlertCircle, Plus, Trash2, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ResponsiveShell, ModalHeader, ModalFooter } from "@/components/ui/responsive-shell"
import { PaginationBar } from "@/components/ui/pagination-bar"
import type { Employee, Course } from "@/lib/hooks"

type CourseRow = { id: number; course_id: string; course_name: string; fecha_aplicacion: string; calificacion: string }
type EditableCourseField = "course_id" | "fecha_aplicacion" | "calificacion"

const ROWS_PER_PAGE = 2
const emptyRow = (id: number): CourseRow => ({ id, course_id: '', course_name: '', fecha_aplicacion: '', calificacion: '' })

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
  const fieldId = useId()
  const [rows, setRows] = useState<CourseRow[]>([emptyRow(0)])
  const [page, setPage] = useState(1)
  const [nextRowId, setNextRowId] = useState(1)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setRows([emptyRow(0)])
      setPage(1)
      setNextRowId(1)
      setError(null)
    }
  }, [open])

  if (!employee) return null

  const totalPages = Math.max(1, Math.ceil(rows.length / ROWS_PER_PAGE))
  const visibleRows = rows.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE)

  const addRow = () => {
    const nextLength = rows.length + 1
    setRows(prev => [...prev, emptyRow(nextRowId)])
    setNextRowId(id => id + 1)
    setPage(Math.ceil(nextLength / ROWS_PER_PAGE))
  }
  const removeRow = (id: number) => {
    const nextLength = rows.length - 1
    setRows(prev => prev.filter(row => row.id !== id))
    setPage(current => Math.min(current, Math.max(1, Math.ceil(nextLength / ROWS_PER_PAGE))))
  }
  const updateRow = (id: number, field: EditableCourseField, value: string) =>
    setRows(prev => prev.map(r => {
      if (r.id !== id) return r
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
      calificacion: r.calificacion === '' ? null : Number(r.calificacion),
    })))
  }

  return (
    <ResponsiveShell open={open} onClose={onClose} title="Agregar cursos" description={employee.nombre}>
      <ModalHeader
        title="Agregar cursos"
        subtitle={`${employee.nombre}${employee.puesto ? ` · ${employee.puesto}` : ''}`}
        onClose={onClose}
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
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-foreground">Cursos <span className="text-muted-foreground">({rows.length})</span></p>
                <Button type="button" variant="outline" size="sm" onClick={addRow}>
                  <Plus aria-hidden="true" /> Agregar curso
                </Button>
              </div>
              <div className="space-y-3">
                {visibleRows.map((row, visibleIndex) => {
                  const rowNumber = (page - 1) * ROWS_PER_PAGE + visibleIndex + 1
                  const courseId = `${fieldId}-course-${row.id}`
                  const dateId = `${fieldId}-date-${row.id}`
                  const gradeId = `${fieldId}-grade-${row.id}`
                  return (
                    <div key={row.id} className="rounded-md border border-border bg-card p-4">
                      <div className="flex items-start gap-2">
                        <div className="min-w-0 flex-1 space-y-2">
                          <label htmlFor={courseId} className="text-sm font-medium text-foreground">Curso {rowNumber}</label>
                          <Select value={row.course_id} onValueChange={v => updateRow(row.id, 'course_id', v)}>
                            <SelectTrigger id={courseId} className="min-w-0 text-sm" title={row.course_name || undefined}><SelectValue placeholder="Selecciona un curso" /></SelectTrigger>
                            <SelectContent matchTriggerWidth className="max-h-60">
                              {courses.map(c => <SelectItem key={c.id} value={c.id} className="text-sm" title={c.name}>{c.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        {rows.length > 1 && (
                          <Button type="button" variant="ghost" size="icon" className="mt-6 h-10 w-10 shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => removeRow(row.id)} aria-label={`Quitar curso ${rowNumber}`}>
                            <Trash2 aria-hidden="true" />
                          </Button>
                        )}
                      </div>
                      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="min-w-0 space-y-2">
                          <label htmlFor={dateId} className="text-sm text-muted-foreground">Fecha de aplicación</label>
                          <Input id={dateId} type="date" value={row.fecha_aplicacion} onChange={e => updateRow(row.id, 'fecha_aplicacion', e.target.value)} className="min-w-0" />
                        </div>
                        <div className="min-w-0 space-y-2">
                          <label htmlFor={gradeId} className="text-sm text-muted-foreground">Calificación</label>
                          <Input id={gradeId} type="number" min={0} max={10} value={row.calificacion} onChange={e => updateRow(row.id, 'calificacion', e.target.value)} />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              {totalPages > 1 && <PaginationBar currentPage={page} totalPages={totalPages} onPageChange={setPage} />}
            </>
          )}
        </div>
      </div>
      <ModalFooter
        onCancel={onClose}
        onConfirm={handleConfirm}
        saving={saving}
        confirmDisabled={isReadOnly}
      />
    </ResponsiveShell>
  )
}
