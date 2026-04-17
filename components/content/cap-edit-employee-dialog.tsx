"use client"

import React, { useState, useEffect } from "react"
import { Pencil } from "lucide-react"
import { AlertCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ResponsiveShell, ModalToolbar } from "@/components/ui/responsive-shell"
import { CATALOGO_ORGANIZACIONAL, TURNOS, JEFES_DE_AREA } from "@/lib/catalogo"
import type { Employee } from "@/lib/hooks"

export interface CapEditEmployeeDialogProps {
  employee: Employee | null
  open: boolean
  saving: boolean
  isReadOnly: boolean
  onClose: () => void
  onSave: (form: {
    numero: string; nombre: string; departamento: string; area: string;
    puesto: string; turno: string; fecha_ingreso: string; jefe_directo: string;
    evaluacion_desempeno: string
  }) => void
}

export function CapEditEmployeeDialog({ employee, open, saving, isReadOnly, onClose, onSave }: CapEditEmployeeDialogProps) {
  const [form, setForm] = useState({ numero: '', nombre: '', departamento: '', area: '', puesto: '', turno: '', fecha_ingreso: '', jefe_directo: '', evaluacion_desempeno: '' })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (employee) {
      setForm({
        numero: employee.numero ?? '',
        nombre: employee.nombre,
        departamento: employee.departamento ?? '',
        area: employee.area ?? '',
        puesto: employee.puesto ?? '',
        turno: employee.turno ?? '',
        fecha_ingreso: employee.fecha_ingreso ?? '',
        jefe_directo: employee.jefe_directo ?? '',
        evaluacion_desempeno: employee.evaluacion_desempeno ?? '',
      })
      setError(null)
    }
  }, [employee])

  if (!employee) return null

  const areas = form.departamento ? (CATALOGO_ORGANIZACIONAL[form.departamento]?.areas ?? []) : []
  const puestos = form.departamento ? (CATALOGO_ORGANIZACIONAL[form.departamento]?.puestos ?? []) : []

  const handleConfirm = () => {
    if (!form.nombre.trim()) { setError('El nombre es requerido'); return }
    setError(null)
    onSave(form)
  }

  return (
    <ResponsiveShell open={open} onClose={onClose} title="Editar empleado" description={`Modifica los datos de ${employee.nombre}`}>
      <ModalToolbar
        title="Editar empleado"
        subtitle={employee.nombre}
        saving={saving}
        onClose={onClose}
        onConfirm={handleConfirm}
        confirmIcon={<Pencil className="h-4 w-4" />}
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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Departamento</label>
              <Select value={form.departamento} onValueChange={v => setForm(f => ({ ...f, departamento: v, area: '', puesto: '' }))}>
                <SelectTrigger className="bg-muted"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-card max-h-60">
                  {Object.keys(CATALOGO_ORGANIZACIONAL).map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Área</label>
              <Select value={form.area} onValueChange={v => setForm(f => ({ ...f, area: v }))} disabled={areas.length === 0}>
                <SelectTrigger className="bg-muted"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-card max-h-60">
                  {areas.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
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

          <div className="grid grid-cols-2 gap-3">
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
      </div>
    </ResponsiveShell>
  )
}
