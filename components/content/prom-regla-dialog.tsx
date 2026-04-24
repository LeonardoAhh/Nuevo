"use client"

import React, { useMemo, useState } from "react"
import { Save } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { ResponsiveShell, ModalToolbar } from "@/components/ui/responsive-shell"
import type { ReglaPromocionInput, ReglaPromocionRow } from "@/lib/hooks/useReglasPromocionCRUD"

export interface PromReglaDialogProps {
  open: boolean
  regla: ReglaPromocionRow | null
  existingPuestos: string[]
  isReadOnly: boolean
  onClose: () => void
  onGuardar: (input: ReglaPromocionInput) => Promise<void>
}

export function PromReglaDialog({
  open,
  regla,
  existingPuestos,
  isReadOnly,
  onClose,
  onGuardar,
}: PromReglaDialogProps) {
  const isEdit = !!regla

  const [puesto, setPuesto] = useState(regla?.puesto ?? "")
  const [promocionA, setPromocionA] = useState(regla?.promocion_a ?? "")
  const [meses, setMeses] = useState(String(regla?.min_temporalidad_meses ?? 12))
  const [minExamen, setMinExamen] = useState(String(regla?.min_calificacion_examen ?? 80))
  const [minEval, setMinEval] = useState(String(regla?.min_calificacion_evaluacion ?? 70))
  const [minCursos, setMinCursos] = useState(String(regla?.min_porcentaje_cursos ?? 80))
  const [descripcion, setDescripcion] = useState(regla?.descripcion ?? "")
  const [activo, setActivo] = useState(regla?.activo ?? true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const puestoDuplicado = useMemo(() => {
    const p = puesto.trim().toUpperCase()
    if (!p) return false
    if (isEdit && regla?.puesto.trim().toUpperCase() === p) return false
    return existingPuestos.some((x) => x.trim().toUpperCase() === p)
  }, [puesto, existingPuestos, isEdit, regla])

  async function handleGuardar() {
    if (!puesto.trim()) {
      setError("Ingresa el puesto actual")
      return
    }
    if (puestoDuplicado) {
      setError("Ya existe una regla para ese puesto")
      return
    }
    const mesesN = parseInt(meses, 10)
    const minExamenN = parseFloat(minExamen)
    const minEvalN = parseFloat(minEval)
    const minCursosN = parseFloat(minCursos)
    if (isNaN(mesesN) || mesesN < 0) {
      setError("Temporalidad inválida")
      return
    }
    if (isNaN(minExamenN) || minExamenN < 0 || minExamenN > 100) {
      setError("Cal. examen debe estar entre 0 y 100")
      return
    }
    if (isNaN(minEvalN) || minEvalN < 0 || minEvalN > 100) {
      setError("Cal. evaluación debe estar entre 0 y 100")
      return
    }
    if (isNaN(minCursosN) || minCursosN < 0 || minCursosN > 100) {
      setError("% cursos debe estar entre 0 y 100")
      return
    }

    setGuardando(true)
    setError(null)
    try {
      await onGuardar({
        id: regla?.id,
        puesto: puesto.trim(),
        promocion_a: promocionA.trim() || null,
        min_temporalidad_meses: mesesN,
        min_calificacion_examen: minExamenN,
        min_calificacion_evaluacion: minEvalN,
        min_porcentaje_cursos: minCursosN,
        descripcion: descripcion.trim() || null,
        activo,
      })
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al guardar")
    } finally {
      setGuardando(false)
    }
  }

  return (
    <ResponsiveShell
      open={open}
      onClose={onClose}
      maxWidth="sm:max-w-lg"
      title={isEdit ? "Editar regla" : "Nueva regla"}
      description={regla?.puesto ?? "Regla de promoción"}
    >
      <ModalToolbar
        title={isEdit ? "Editar regla" : "Nueva regla"}
        subtitle={isEdit ? regla?.puesto : "Regla de promoción"}
        saving={guardando}
        onClose={onClose}
        onConfirm={handleGuardar}
        confirmIcon={<Save size={16} />}
        confirmDisabled={isReadOnly}
      />

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Puesto actual</Label>
            <Input
              type="text"
              placeholder="Ej. OPERADOR D"
              value={puesto}
              onChange={(e) => setPuesto(e.target.value)}
              disabled={isEdit}
              className="bg-muted"
            />
            {puestoDuplicado && (
              <p className="text-[11px] text-destructive">Ya existe una regla para ese puesto</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Promoción a (opcional)</Label>
            <Input
              type="text"
              placeholder="Ej. OPERADOR C"
              value={promocionA}
              onChange={(e) => setPromocionA(e.target.value)}
              className="bg-muted"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Temporalidad (meses)</Label>
            <Input
              type="number"
              min={0}
              step={1}
              value={meses}
              onChange={(e) => setMeses(e.target.value)}
              className="bg-muted"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Cal. examen mín.</Label>
            <Input
              type="number"
              min={0}
              max={100}
              step={0.01}
              value={minExamen}
              onChange={(e) => setMinExamen(e.target.value)}
              className="bg-muted"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Cal. evaluación mín.</Label>
            <Input
              type="number"
              min={0}
              max={100}
              step={0.01}
              value={minEval}
              onChange={(e) => setMinEval(e.target.value)}
              className="bg-muted"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">% cursos mín.</Label>
            <Input
              type="number"
              min={0}
              max={100}
              step={0.01}
              value={minCursos}
              onChange={(e) => setMinCursos(e.target.value)}
              className="bg-muted"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Descripción (opcional)</Label>
          <Input
            type="text"
            placeholder="Notas internas sobre la regla"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className="bg-muted"
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/40 px-3 py-2.5">
          <div className="space-y-0.5">
            <Label className="text-sm font-medium">Regla activa</Label>
            <p className="text-[11px] text-muted-foreground">
              Las reglas inactivas no se evalúan al calcular aptitud.
            </p>
          </div>
          <Switch checked={activo} onCheckedChange={setActivo} />
        </div>

        {error && (
          <div className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
      </div>
    </ResponsiveShell>
  )
}
