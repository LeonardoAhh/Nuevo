"use client"

import React, { useState, useEffect } from "react"
import { AlertCircle, UserPlus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ResponsiveShell, ModalToolbar } from "@/components/ui/responsive-shell"
import { addDays } from "@/lib/hooks"
import type { NuevoIngreso, TipoContrato } from "@/lib/hooks"
import { CATALOGO_ORGANIZACIONAL, TURNOS, ESCOLARIDAD, JEFES_DE_AREA_POR_DEPARTAMENTO } from "@/lib/catalogo"

// ─────────────────────────────────────────────────────────────────────────────

interface FormFieldProps {
  id: string
  label: string
  required?: boolean
  children: React.ReactNode
}

function FormField({ id, label, required = false, children }: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

interface NuevoEmpleadoForm {
  numero: string
  nombre: string
  puesto: string
  departamento: string
  area: string
  turno: string
  fecha_ingreso: string
  curp: string
  escolaridad: string
  jefe_area: string
  tipo_contrato: TipoContrato
}

const FORM_INICIAL: NuevoEmpleadoForm = {
  numero: '', nombre: '', puesto: '', departamento: '', area: '',
  turno: '', fecha_ingreso: new Date().toISOString().split('T')[0],
  curp: '', escolaridad: '', jefe_area: '',
  tipo_contrato: 'A prueba',
}

// ─────────────────────────────────────────────────────────────────────────────

export interface CreateEmployeeDialogProps {
  open: boolean
  saving: boolean
  onClose: () => void
  onCreate: (data: Omit<NuevoIngreso, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
}

export function CreateEmployeeDialog({ open, saving, onClose, onCreate }: CreateEmployeeDialogProps) {
  const [form, setForm] = useState<NuevoEmpleadoForm>(FORM_INICIAL)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (open) { setForm(FORM_INICIAL); setFormError(null) }
  }, [open])

  const set = (key: keyof NuevoEmpleadoForm, value: string) =>
    setForm(prev => ({ ...prev, [key]: value }))

  const departamentos = Object.keys(CATALOGO_ORGANIZACIONAL)
  const areasDisponibles = form.departamento ? (CATALOGO_ORGANIZACIONAL[form.departamento]?.areas || []) : []
  const puestosDisponibles = form.departamento ? (CATALOGO_ORGANIZACIONAL[form.departamento]?.puestos || []) : []

  const setDepartamento = (v: string) => {
    const jefe = JEFES_DE_AREA_POR_DEPARTAMENTO[v]?.[0] ?? ''
    setForm(prev => ({
      ...prev, departamento: v, area: '', puesto: '', jefe_area: jefe,
    }))
  }

  const handleCreate = async () => {
    if (!form.nombre.trim()) { setFormError('El nombre es obligatorio.'); return }
    if (!form.departamento) { setFormError('El departamento es obligatorio.'); return }
    if (!form.area) { setFormError('El área es obligatoria.'); return }
    if (!form.puesto) { setFormError('El puesto es obligatorio.'); return }
    if (!form.turno) { setFormError('El turno es obligatorio.'); return }
    if (!form.fecha_ingreso.trim()) { setFormError('La fecha de ingreso es obligatoria.'); return }
    setFormError(null)

    const fi = form.fecha_ingreso
    const data: Omit<NuevoIngreso, 'id' | 'created_at' | 'updated_at'> = {
      numero: form.numero.trim() || null,
      nombre: form.nombre.trim().toUpperCase(),
      puesto: form.puesto.trim() || null,
      departamento: form.departamento.trim() || null,
      area: form.area.trim() || null,
      turno: form.turno.trim() || null,
      fecha_ingreso: fi,
      curp: form.curp.trim() || null,
      escolaridad: form.escolaridad.trim() || null,
      jefe_area: form.jefe_area.trim() || null,
      eval_1_fecha: addDays(fi, 30),
      eval_1_calificacion: null,
      eval_2_fecha: addDays(fi, 60),
      eval_2_calificacion: null,
      eval_3_fecha: addDays(fi, 80),
      eval_3_calificacion: null,
      termino_contrato: addDays(fi, 90),
      tipo_contrato: form.tipo_contrato,
      rg_rec_048: 'Pendiente',
      fecha_vencimiento_rg: addDays(fi, 91),
    }
    await onCreate(data)
  }

  return (
    <ResponsiveShell
      open={open}
      onClose={onClose}
      maxWidth="sm:max-w-2xl"
      title="Nuevo Empleado"
      description="Formulario para registrar a un nuevo trabajador en el sistema."
    >
      <ModalToolbar
        title="Nuevo Empleado"
        saving={saving}
        onClose={onClose}
        onConfirm={handleCreate}
        confirmIcon={<UserPlus className="h-4 w-4" />}
        confirmDisabled={!form.nombre.trim()}
      />

      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="space-y-3 px-4 py-5">
          {formError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          {/* Identificación */}
          <fieldset className="space-y-2">
            <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Identificación</legend>
            <div className="grid grid-cols-[80px_1fr] gap-3">
              <FormField id="numero" label="N.N">
                <Input id="numero" value={form.numero}
                  onChange={e => set('numero', e.target.value)}
                  placeholder="001" className="bg-muted" />
              </FormField>
              <FormField id="nombre" label="Nombre completo" required>
                <Input id="nombre" value={form.nombre}
                  onChange={e => set('nombre', e.target.value)}
                  placeholder="PÉREZ GARCÍA JUAN" className="bg-muted" />
              </FormField>
            </div>
            <FormField id="curp" label="CURP">
              <Input id="curp" value={form.curp}
                onChange={e => set('curp', e.target.value.toUpperCase())}
                placeholder="PELJ900101HDFRZN09" className="bg-muted" />
            </FormField>
          </fieldset>

          {/* Organización */}
          <fieldset className="space-y-2">
            <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Organización</legend>
            <FormField id="departamento" label="Departamento" required>
              <Select value={form.departamento} onValueChange={setDepartamento}>
                <SelectTrigger id="departamento" className="bg-muted">
                  <SelectValue placeholder="Selecciona..." />
                </SelectTrigger>
                <SelectContent className="bg-card max-h-56">
                  {departamentos.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField id="area" label="Área" required>
                <Select value={form.area} onValueChange={v => set('area', v)} disabled={!form.departamento}>
                  <SelectTrigger id="area" className="bg-muted">
                    <SelectValue placeholder={form.departamento ? "Selecciona..." : "Elige depto"} />
                  </SelectTrigger>
                  <SelectContent className="bg-card max-h-56">
                    {areasDisponibles.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField id="puesto" label="Puesto" required>
                <Select value={form.puesto} onValueChange={v => set('puesto', v)} disabled={!form.departamento}>
                  <SelectTrigger id="puesto" className="bg-muted">
                    <SelectValue placeholder={form.departamento ? "Selecciona..." : "Elige depto"} />
                  </SelectTrigger>
                  <SelectContent className="bg-card max-h-56">
                    {puestosDisponibles.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField id="turno" label="Turno" required>
                <Select value={form.turno} onValueChange={v => set('turno', v)}>
                  <SelectTrigger id="turno" className="bg-muted">
                    <SelectValue placeholder="Selecciona..." />
                  </SelectTrigger>
                  <SelectContent className="bg-card max-h-56">
                    {TURNOS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField id="jefe_area" label="Jefe de área">
                <div className="flex items-center h-9 px-3 rounded-md border bg-muted/50 text-sm text-muted-foreground">
                  {form.jefe_area || <span className="italic opacity-50">Se asigna por departamento</span>}
                </div>
              </FormField>
            </div>
          </fieldset>

          {/* Contrato */}
          <fieldset className="space-y-2">
            <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contrato</legend>
            <div className="grid grid-cols-2 gap-3">
              <FormField id="fecha_ingreso" label="Fecha de ingreso" required>
                <Input id="fecha_ingreso" type="date"
                  value={form.fecha_ingreso}
                  onChange={e => set('fecha_ingreso', e.target.value)}
                  className="text-base md:text-sm bg-muted" />
              </FormField>
              <FormField id="tipo_contrato" label="Tipo de contrato">
                <div className="flex items-center h-9 px-3 rounded-md border bg-muted/50 text-sm text-muted-foreground">
                  A prueba
                </div>
              </FormField>
            </div>
            <FormField id="escolaridad" label="Escolaridad">
              <Select value={form.escolaridad} onValueChange={v => set('escolaridad', v)}>
                <SelectTrigger id="escolaridad" className="bg-muted">
                  <SelectValue placeholder="Selecciona..." />
                </SelectTrigger>
                <SelectContent className="bg-card max-h-56">
                  {ESCOLARIDAD.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>
          </fieldset>
        </div>
      </div>
    </ResponsiveShell>
  )
}
