"use client"

import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Check, X, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ResponsiveShell, ModalToolbar } from "@/components/ui/responsive-shell"
import { formatDate } from "@/lib/hooks"
import type { NuevoIngreso, NuevoIngresoUpdate, TipoContrato, EstadoRG } from "@/lib/hooks"
import { ESCOLARIDAD } from "@/lib/catalogo"

export interface EditEmployeeDialogProps {
  record: NuevoIngreso | null
  open: boolean
  saving: boolean
  onClose: () => void
  onSave: (id: string, updates: NuevoIngresoUpdate) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export function EditEmployeeDialog({ record, open, saving, onClose, onSave, onDelete }: EditEmployeeDialogProps) {
  const [form, setForm] = useState<NuevoIngresoUpdate>({})
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (record) {
      setForm({
        escolaridad: record.escolaridad ?? '',
        eval_1_calificacion: record.eval_1_calificacion ?? undefined,
        eval_2_calificacion: record.eval_2_calificacion ?? undefined,
        eval_3_calificacion: record.eval_3_calificacion ?? undefined,
        tipo_contrato: record.tipo_contrato,
        rg_rec_048: record.rg_rec_048,
      })
      setConfirmDelete(false)
    }
  }, [record])

  // Reset delete-confirm state when the dialog is closed so reopening starts clean.
  useEffect(() => { if (!open) setConfirmDelete(false) }, [open])

  if (!record) return null

  const set = (key: keyof NuevoIngresoUpdate, value: unknown) =>
    setForm(prev => ({ ...prev, [key]: value === '' ? null : value }))

  return (
    <ResponsiveShell
      open={open}
      onClose={onClose}
      title={record.nombre}
      description={`${record.puesto} · ${record.departamento}`}
    >
      <ModalToolbar
        title={record.nombre}
        subtitle={`${record.puesto} · ${record.departamento}`}
        saving={saving}
        onClose={onClose}
        onConfirm={() => onSave(record.id, form)}
      />

      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="space-y-5 px-4 py-5">
          {/* Escolaridad */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Escolaridad</Label>
            <Select value={form.escolaridad ?? ''} onValueChange={v => set('escolaridad', v)}>
              <SelectTrigger className="bg-muted"><SelectValue placeholder="Selecciona..." /></SelectTrigger>
              <SelectContent className="bg-card max-h-56">
                {ESCOLARIDAD.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Evaluaciones */}
          <div className="grid grid-cols-3 gap-3">
            {([
              { label: '1er mes', key: 'eval_1_calificacion' as const, fecha: record.eval_1_fecha },
              { label: '2do mes', key: 'eval_2_calificacion' as const, fecha: record.eval_2_fecha },
              { label: '3er mes', key: 'eval_3_calificacion' as const, fecha: record.eval_3_fecha },
            ]).map(({ label, key, fecha }) => (
              <div key={key} className="space-y-1.5">
                <Label className="text-xs font-medium">
                  Eval. {label}
                  <span className="block text-muted-foreground font-normal">{formatDate(fecha)}</span>
                </Label>
                <Input
                  type="number" min={0} max={100} inputMode="numeric"
                  value={form[key] ?? ''}
                  onChange={e => {
                    const raw = e.target.value
                    if (raw === '') return set(key, null)
                    const n = parseInt(raw, 10)
                    if (Number.isNaN(n)) return
                    set(key, Math.max(0, Math.min(100, n)))
                  }}
                  className="text-base md:text-sm bg-muted"
                />
              </div>
            ))}
          </div>

          {/* Contrato + RG */}
          <div className="grid grid-cols-2 gap-3 items-end">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Tipo de contrato</Label>
              <Select value={form.tipo_contrato ?? record.tipo_contrato} onValueChange={v => set('tipo_contrato', v as TipoContrato)}>
                <SelectTrigger className="bg-muted"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-card">
                  <SelectItem value="A prueba">A prueba</SelectItem>
                  <SelectItem value="Indeterminado">Indeterminado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                RG-REC-048
                <span className="block text-xs font-normal text-muted-foreground">Vence: {formatDate(record.fecha_vencimiento_rg)}</span>
              </Label>
              <Select value={form.rg_rec_048 ?? record.rg_rec_048} onValueChange={v => set('rg_rec_048', v as EstadoRG)}>
                <SelectTrigger className="bg-muted"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-card">
                  <SelectItem value="Pendiente">Pendiente</SelectItem>
                  <SelectItem value="Entregado">Entregado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Delete zone */}
        <div className="px-4 pb-5 border-t pt-4">
          {confirmDelete ? (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center gap-3"
            >
              <span className="text-sm text-muted-foreground">¿Eliminar?</span>
              <motion.button
                type="button"
                whileTap={{ scale: 0.88 }}
                onClick={() => onDelete(record.id)}
                disabled={saving}
                className="h-9 w-9 rounded-full flex items-center justify-center bg-destructive text-destructive-foreground shadow-md shadow-destructive/30 disabled:opacity-50"
                aria-label="Confirmar eliminación"
              >
                {saving
                  ? <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                  : <Check className="h-4 w-4" />}
              </motion.button>
              <motion.button
                type="button"
                whileTap={{ scale: 0.88 }}
                onClick={() => setConfirmDelete(false)}
                disabled={saving}
                className="h-9 w-9 rounded-full flex items-center justify-center bg-muted border border-border/40 shadow-sm disabled:opacity-50"
                aria-label="Cancelar eliminación"
              >
                <X className="h-4 w-4" />
              </motion.button>
            </motion.div>
          ) : (
            <motion.button
              type="button"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setConfirmDelete(true)}
              disabled={saving}
              className="flex items-center justify-center gap-2 w-full h-9 rounded-full border border-destructive/30 text-destructive hover:border-destructive/60 hover:bg-destructive/5 transition-colors text-sm font-medium disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              Eliminar empleado
            </motion.button>
          )}
        </div>
      </div>
    </ResponsiveShell>
  )
}
