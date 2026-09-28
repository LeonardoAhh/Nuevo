"use client"

import { useEffect, useId, useState } from "react"
import { AlertCircle, UserPlus } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ModalFooter, ModalHeader, ResponsiveShell } from "@/components/ui/responsive-shell"
import { CATALOGO_ORGANIZACIONAL, JEFES_DE_AREA, TURNOS } from "@/lib/catalogo"

interface NewEmployeeForm {
  numero: string
  nombre: string
  departamento: string
  area: string
  puesto: string
  turno: string
  fecha_ingreso: string
  jefe_directo: string
  evaluacion_desempeno: string
}

const EMPTY_EMPLOYEE_FORM: NewEmployeeForm = {
  numero: "",
  nombre: "",
  departamento: "",
  area: "",
  puesto: "",
  turno: "",
  fecha_ingreso: "",
  jefe_directo: "",
  evaluacion_desempeno: "",
}

export interface CapNewEmployeeDialogProps {
  open: boolean
  saving: boolean
  isReadOnly: boolean
  onClose: () => void
  onSave: (employee: NewEmployeeForm) => void
}

export function CapNewEmployeeDialog({
  open,
  saving,
  isReadOnly,
  onClose,
  onSave,
}: CapNewEmployeeDialogProps) {
  const fieldId = useId()
  const [form, setForm] = useState<NewEmployeeForm>(EMPTY_EMPLOYEE_FORM)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setForm(EMPTY_EMPLOYEE_FORM)
      setError(null)
    }
  }, [open])

  const areas = form.departamento ? (CATALOGO_ORGANIZACIONAL[form.departamento]?.areas ?? []) : []
  const positions = form.departamento ? (CATALOGO_ORGANIZACIONAL[form.departamento]?.puestos ?? []) : []

  const updateForm = (field: keyof NewEmployeeForm, value: string) => {
    setForm(current => ({ ...current, [field]: value }))
    if (field === "nombre" && value.trim()) setError(null)
  }

  const handleDepartmentChange = (department: string) => {
    setForm(current => ({ ...current, departamento: department, area: "", puesto: "" }))
  }

  const handleConfirm = () => {
    if (!form.nombre.trim()) {
      setError("El nombre del empleado es requerido.")
      return
    }

    setError(null)
    onSave(form)
  }

  return (
    <ResponsiveShell
      open={open}
      onClose={onClose}
      size="sm"
      title="Nuevo empleado"
      description="Registra los datos del empleado"
    >
      <ModalHeader title="Nuevo empleado" onClose={onClose} />

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="space-y-4 px-4 py-5 sm:px-6 sm:py-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle aria-hidden="true" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
            <div className="min-w-0 space-y-1.5">
              <Label htmlFor={`${fieldId}-number`}>N.N</Label>
              <Input
                id={`${fieldId}-number`}
                value={form.numero}
                onChange={event => updateForm("numero", event.target.value)}
              />
            </div>

            <div className="min-w-0 space-y-1.5">
              <Label htmlFor={`${fieldId}-date`}>Fecha de ingreso</Label>
              <Input
                id={`${fieldId}-date`}
                type="date"
                className="min-w-0"
                value={form.fecha_ingreso}
                onChange={event => updateForm("fecha_ingreso", event.target.value)}
              />
            </div>

            <div className="min-w-0 space-y-1.5 sm:col-span-2">
              <Label htmlFor={`${fieldId}-name`}>Nombre completo <span className="text-destructive">*</span></Label>
              <Input
                id={`${fieldId}-name`}
                value={form.nombre}
                onChange={event => updateForm("nombre", event.target.value)}
                aria-invalid={Boolean(error) || undefined}
                required
              />
            </div>

            <div className="min-w-0 space-y-1.5">
              <Label htmlFor={`${fieldId}-department`}>Departamento</Label>
              <Select value={form.departamento} onValueChange={handleDepartmentChange}>
                <SelectTrigger id={`${fieldId}-department`}><SelectValue placeholder="Selecciona departamento" /></SelectTrigger>
                <SelectContent matchTriggerWidth className="max-h-60">
                  {Object.keys(CATALOGO_ORGANIZACIONAL).map(department => (
                    <SelectItem key={department} value={department}>{department}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-0 space-y-1.5">
              <Label htmlFor={`${fieldId}-area`}>Área</Label>
              <Select value={form.area} onValueChange={value => updateForm("area", value)} disabled={areas.length === 0}>
                <SelectTrigger id={`${fieldId}-area`}><SelectValue placeholder="Selecciona área" /></SelectTrigger>
                <SelectContent matchTriggerWidth className="max-h-60">
                  {areas.map(area => <SelectItem key={area} value={area}>{area}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-0 space-y-1.5">
              <Label htmlFor={`${fieldId}-position`}>Puesto</Label>
              <Select value={form.puesto} onValueChange={value => updateForm("puesto", value)} disabled={positions.length === 0}>
                <SelectTrigger id={`${fieldId}-position`}><SelectValue placeholder="Selecciona puesto" /></SelectTrigger>
                <SelectContent matchTriggerWidth className="max-h-60">
                  {positions.map(position => <SelectItem key={position} value={position}>{position}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-0 space-y-1.5">
              <Label htmlFor={`${fieldId}-shift`}>Turno</Label>
              <Select value={form.turno} onValueChange={value => updateForm("turno", value)}>
                <SelectTrigger id={`${fieldId}-shift`}><SelectValue placeholder="Selecciona turno" /></SelectTrigger>
                <SelectContent matchTriggerWidth>
                  {TURNOS.map(shift => <SelectItem key={shift} value={shift}>{shift}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid min-w-0 gap-x-4 gap-y-4 sm:col-span-2 sm:grid-cols-[minmax(0,1fr)_auto]">
              <div className="min-w-0 space-y-1.5">
                <Label htmlFor={`${fieldId}-manager`}>Jefe directo</Label>
                <Select value={form.jefe_directo} onValueChange={value => updateForm("jefe_directo", value)}>
                  <SelectTrigger id={`${fieldId}-manager`}><SelectValue placeholder="Selecciona jefe" /></SelectTrigger>
                  <SelectContent matchTriggerWidth className="max-h-60">
                    {JEFES_DE_AREA.map(manager => <SelectItem key={manager} value={manager}>{manager}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="min-w-0 space-y-1.5 sm:w-24">
                <Label htmlFor={`${fieldId}-evaluation`}>Eval. desemp.</Label>
                <Input
                  id={`${fieldId}-evaluation`}
                  type="number"
                  min={0}
                  max={99}
                  className="text-center"
                  placeholder="00"
                  value={form.evaluacion_desempeno}
                  onChange={event => updateForm("evaluacion_desempeno", event.target.value.slice(0, 2))}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <ModalFooter
        onCancel={onClose}
        onConfirm={handleConfirm}
        saving={saving}
        confirmDisabled={isReadOnly}
        confirmLabel="Guardar"
        confirmIcon={<UserPlus aria-hidden="true" />}
      />
    </ResponsiveShell>
  )
}
