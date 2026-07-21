"use client"

import React, { useState, useEffect } from "react"
import { UserPlus, AlertCircle, Plus, Minus, Loader2, ChevronRight, ChevronLeft } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ResponsiveShell } from "@/components/ui/responsive-shell"
import { RedesignModalHeader } from "./modal-header"
import { RedesignModalFooter } from "./modal-footer"
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
  const [form, setForm] = useState(EMPTY)

  const validationError = !form.nombre.trim() ? 'El nombre del empleado es requerido' : null

  useEffect(() => {
    if (open) { setForm(EMPTY) }
  }, [open])

  const areas = form.departamento ? (CATALOGO_ORGANIZACIONAL[form.departamento]?.areas ?? []) : []
  const puestos = form.departamento ? (CATALOGO_ORGANIZACIONAL[form.departamento]?.puestos ?? []) : []

  const handleConfirm = () => {
    if (validationError) return
    onSave(form, [])
  }

  return (
    <ResponsiveShell open={open} onClose={onClose} title="Nuevo empleado">
      <RedesignModalHeader
        title="Nuevo empleado"
        icon={<UserPlus className="h-5 w-5" />}
        onClose={onClose}
      />

      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="px-4 py-5">
          <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-normal text-muted-foreground">No. Empleado</label>
                  <Input value={form.numero} onChange={e => setForm(f => ({ ...f, numero: e.target.value }))} className="shadow-none rounded-md border-border/60" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-normal text-muted-foreground">Fecha de ingreso</label>
                  <Input type="date" value={form.fecha_ingreso} onChange={e => setForm(f => ({ ...f, fecha_ingreso: e.target.value }))} className="shadow-none rounded-md border-border/60 min-w-0" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-normal text-muted-foreground">Nombre completo <span className="text-destructive">*</span></label>
                <Input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} className="shadow-none rounded-md border-border/60" />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-normal text-muted-foreground">Departamento</label>
                <Select value={form.departamento} onValueChange={v => setForm(f => ({ ...f, departamento: v, area: '', puesto: '' }))}>
                  <SelectTrigger className="shadow-none rounded-md border-border/60"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card max-h-60">
                    {Object.keys(CATALOGO_ORGANIZACIONAL).map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-normal text-muted-foreground">Área</label>
                  <Select value={form.area} onValueChange={v => setForm(f => ({ ...f, area: v }))} disabled={areas.length === 0}>
                    <SelectTrigger className="shadow-none rounded-md border-border/60"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-card max-h-60">
                      {areas.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-normal text-muted-foreground">Turno</label>
                  <Select value={form.turno} onValueChange={v => setForm(f => ({ ...f, turno: v }))}>
                    <SelectTrigger className="shadow-none rounded-md border-border/60"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-card">
                      {TURNOS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-normal text-muted-foreground">Puesto</label>
                <Select value={form.puesto} onValueChange={v => setForm(f => ({ ...f, puesto: v }))} disabled={puestos.length === 0}>
                  <SelectTrigger className="shadow-none rounded-md border-border/60"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card max-h-60">
                    {puestos.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-[1fr_auto] gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-normal text-muted-foreground">Jefe directo</label>
                  <Select value={form.jefe_directo} onValueChange={v => setForm(f => ({ ...f, jefe_directo: v }))}>
                    <SelectTrigger className="shadow-none rounded-md border-border/60"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-card max-h-60">
                      {JEFES_DE_AREA.map(j => <SelectItem key={j} value={j}>{j}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1 w-20">
                  <label className="text-xs font-normal text-muted-foreground">Eval. desemp.</label>
                  <Input
                    type="number" min={0} max={99} maxLength={2}
                    className="text-center shadow-none rounded-md border-border/60" placeholder="00"
                    value={form.evaluacion_desempeno}
                    onChange={e => { const v = e.target.value.slice(0, 2); setForm(f => ({ ...f, evaluacion_desempeno: v })) }}
                  />
                </div>
              </div>
            </div>
        </div>
      </div>
      <RedesignModalFooter
        onCancel={onClose}
        onConfirm={handleConfirm}
        saving={saving}
        confirmDisabled={isReadOnly || !!validationError}
        confirmTooltip={validationError || undefined}
        confirmLabel="Guardar"
        confirmIcon={<UserPlus className="h-4 w-4" />}
      />
    </ResponsiveShell>
  )
}
