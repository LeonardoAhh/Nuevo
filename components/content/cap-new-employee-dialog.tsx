"use client"

import React, { useState, useEffect } from "react"
import { UserPlus, AlertCircle, Plus, Minus, Loader2, ChevronRight, ChevronLeft } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ResponsiveShell, ModalToolbar } from "@/components/ui/responsive-shell"
import { CATALOGO_ORGANIZACIONAL, TURNOS, JEFES_DE_AREA } from "@/lib/catalogo"
import type { Course } from "@/lib/hooks"

type CourseRow = { course_id: string; course_name: string; fecha_aplicacion: string; calificacion: string }

export interface CapNewEmployeeDialogProps {
  open: boolean
  saving: boolean
  isReadOnly: boolean
  courses: Course[]
  loadingCourses: boolean
  onClose: () => void
  onLoadCourses: () => void
  onSave: (
    emp: { numero: string; nombre: string; departamento: string; area: string; puesto: string; turno: string; fecha_ingreso: string; jefe_directo: string; evaluacion_desempeno: string },
    courseRows: { course_id: string; course_name: string; fecha_aplicacion: string | null; calificacion: number | null }[]
  ) => void
}

export function CapNewEmployeeDialog({ open, saving, isReadOnly, courses, loadingCourses, onClose, onLoadCourses, onSave }: CapNewEmployeeDialogProps) {
  const EMPTY = { numero: '', nombre: '', departamento: '', area: '', puesto: '', turno: '', fecha_ingreso: '', jefe_directo: '', evaluacion_desempeno: '' }
  const [step, setStep] = useState<1 | 2>(1)
  const [form, setForm] = useState(EMPTY)
  const [courseRows, setCourseRows] = useState<CourseRow[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) { setStep(1); setForm(EMPTY); setCourseRows([]); setError(null) }
  }, [open])

  const areas = form.departamento ? (CATALOGO_ORGANIZACIONAL[form.departamento]?.areas ?? []) : []
  const puestos = form.departamento ? (CATALOGO_ORGANIZACIONAL[form.departamento]?.puestos ?? []) : []

  const handleNext = () => {
    if (!form.nombre.trim()) { setError('El nombre del empleado es requerido'); return }
    setError(null); setStep(2)
    if (courses.length === 0) onLoadCourses()
  }

  const handleBack = () => { setStep(1) }

  const handleConfirm = () => {
    if (step === 1) { handleNext(); return }
    onSave(
      form,
      courseRows.filter(r => r.course_id).map(r => ({
        course_id: r.course_id,
        course_name: r.course_name,
        fecha_aplicacion: r.fecha_aplicacion || null,
        calificacion: r.calificacion ? (parseInt(r.calificacion) || null) : null,
      }))
    )
  }

  const addRow = () => setCourseRows(prev => [...prev, { course_id: '', course_name: '', fecha_aplicacion: '', calificacion: '' }])
  const removeRow = (i: number) => setCourseRows(prev => prev.filter((_, idx) => idx !== i))
  const updateRow = (i: number, field: keyof CourseRow, value: string) =>
    setCourseRows(prev => prev.map((r, idx) => {
      if (idx !== i) return r
      if (field === 'course_id') {
        const c = courses.find(c => c.id === value)
        return { ...r, course_id: value, course_name: c?.name ?? '' }
      }
      return { ...r, [field]: value }
    }))

  return (
    <ResponsiveShell open={open} onClose={onClose} title="Nuevo empleado" description={`Paso ${step} de 2`}>
      <ModalToolbar
        title="Nuevo empleado"
        subtitle={`Paso ${step} de 2 — ${step === 1 ? 'Datos' : 'Cursos (opcional)'}`}
        saving={saving}
        onClose={step === 2 ? handleBack : onClose}
        onConfirm={handleConfirm}
        confirmIcon={step === 1 ? <ChevronRight className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
        confirmDisabled={isReadOnly}
      />

      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="px-4 py-5">
          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-4">
            <div className={`h-1.5 flex-1 rounded-full transition-colors ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`h-1.5 flex-1 rounded-full transition-colors ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
          </div>

          {error && (
            <Alert variant="destructive" className="py-2 mb-3">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Step 1: Employee data */}
          {step === 1 && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">N.N</label>
                  <Input value={form.numero} onChange={e => setForm(f => ({ ...f, numero: e.target.value }))} className="bg-muted" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Fecha de ingreso</label>
                  <Input type="date" value={form.fecha_ingreso} onChange={e => setForm(f => ({ ...f, fecha_ingreso: e.target.value }))} className="bg-muted min-w-0" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Nombre completo <span className="text-destructive">*</span></label>
                <Input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} className="bg-muted" />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Departamento</label>
                <Select value={form.departamento} onValueChange={v => setForm(f => ({ ...f, departamento: v, area: '', puesto: '' }))}>
                  <SelectTrigger className="bg-muted"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card max-h-60">
                    {Object.keys(CATALOGO_ORGANIZACIONAL).map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Área</label>
                  <Select value={form.area} onValueChange={v => setForm(f => ({ ...f, area: v }))} disabled={areas.length === 0}>
                    <SelectTrigger className="bg-muted"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-card max-h-60">
                      {areas.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Turno</label>
                  <Select value={form.turno} onValueChange={v => setForm(f => ({ ...f, turno: v }))}>
                    <SelectTrigger className="bg-muted"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-card">
                      {TURNOS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Puesto</label>
                <Select value={form.puesto} onValueChange={v => setForm(f => ({ ...f, puesto: v }))} disabled={puestos.length === 0}>
                  <SelectTrigger className="bg-muted"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card max-h-60">
                    {puestos.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-[1fr_auto] gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Jefe directo</label>
                  <Select value={form.jefe_directo} onValueChange={v => setForm(f => ({ ...f, jefe_directo: v }))}>
                    <SelectTrigger className="bg-muted"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-card max-h-60">
                      {JEFES_DE_AREA.map(j => <SelectItem key={j} value={j}>{j}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1 w-20">
                  <label className="text-xs font-medium text-muted-foreground">Eval. desemp.</label>
                  <Input
                    type="number" min={0} max={99} maxLength={2}
                    className="bg-muted text-center" placeholder="00"
                    value={form.evaluacion_desempeno}
                    onChange={e => { const v = e.target.value.slice(0, 2); setForm(f => ({ ...f, evaluacion_desempeno: v })) }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Courses */}
          {step === 2 && (
            <div className="space-y-3">
              {loadingCourses ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  {courseRows.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Sin cursos agregados. Puedes guardar así o agregar cursos tomados.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {courseRows.map((row, i) => (
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
                            <button onClick={() => removeRow(i)} className="mt-5 p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                              <Minus className="h-4 w-4" />
                            </button>
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
                  )}
                  <Button variant="outline" size="icon" onClick={addRow} aria-label="Agregar curso" title="Agregar curso">
                    <Plus className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </ResponsiveShell>
  )
}
