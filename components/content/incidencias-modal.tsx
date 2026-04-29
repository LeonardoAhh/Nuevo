"use client"

import React, { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import {
  Calendar, Save, ChevronLeft, ChevronRight,
  AlertCircle, RotateCcw, Plus, Loader2,
} from "lucide-react"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  useIncidencias,
  INCIDENCIA_CATEGORIES,
  formatMes,
} from "@/lib/hooks/useIncidencias"
import type {
  IncidenciaCategory,
  IncidenciaRecord,
} from "@/lib/hooks/useIncidencias"

// ─────────────────────────────────────────────────────────────────────────────
// Category display helpers
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORY_META: Record<IncidenciaCategory, { color: string; shortLabel: string }> = {
  'FALTA INJUSTIFICADA': { color: 'text-destructive', shortLabel: 'F. Injust.' },
  'DIA FESTIVO':         { color: 'text-info', shortLabel: 'Festivo' },
  'FALTAS JUST':         { color: 'text-warning', shortLabel: 'F. Just.' },
  'SANCIÓN':             { color: 'text-destructive', shortLabel: 'Sanción' },
  'PERMISO':             { color: 'text-primary', shortLabel: 'Permiso' },
  'CAMBIO TURNO':        { color: 'text-info', shortLabel: 'C. Turno' },
  'INCAPACIDAD':         { color: 'text-warning', shortLabel: 'Incap.' },
  'VACACIÓN':            { color: 'text-success', shortLabel: 'Vacación' },
  'TXT':                 { color: 'text-muted-foreground', shortLabel: 'TXT' },
  'DESCANSO':            { color: 'text-success', shortLabel: 'Descanso' },
  'PERMISO HORAS':       { color: 'text-primary', shortLabel: 'Perm. Hrs' },
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function getCurrentMonth(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function shiftMonth(ym: string, delta: number): string {
  const [y, m] = ym.split('-').map(Number)
  const d = new Date(Date.UTC(y, m - 1 + delta, 1))
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

function emptyValues(): Record<IncidenciaCategory, number> {
  return Object.fromEntries(INCIDENCIA_CATEGORIES.map(c => [c, 0])) as Record<IncidenciaCategory, number>
}

function emptyNotas(): Record<IncidenciaCategory, string> {
  return Object.fromEntries(INCIDENCIA_CATEGORIES.map(c => [c, ''])) as Record<IncidenciaCategory, string>
}

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface IncidenciasModalProps {
  open: boolean
  onClose: () => void
  numeroEmpleado: string
  nombreEmpleado: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Component — Manual view/edit of incidencias per employee per month
// ─────────────────────────────────────────────────────────────────────────────

export function IncidenciasModal({
  open,
  onClose,
  numeroEmpleado,
  nombreEmpleado,
}: IncidenciasModalProps) {
  const {
    loading, saving, error,
    fetchByEmpleado, fetchByEmpleadoMes, saveMonth,
  } = useIncidencias()

  const [selectedMes, setSelectedMes] = useState(getCurrentMonth())
  const [allRecords, setAllRecords] = useState<IncidenciaRecord[]>([])
  const [values, setValues] = useState(emptyValues())
  const [notas, setNotas] = useState(emptyNotas())
  const [dirty, setDirty] = useState(false)

  // ── Data loading ─────────────────────────────────────────────────────────

  const loadAllRecords = useCallback(async () => {
    if (!numeroEmpleado) return
    const data = await fetchByEmpleado(numeroEmpleado)
    setAllRecords(data)
  }, [numeroEmpleado, fetchByEmpleado])

  const loadMonthData = useCallback(async () => {
    if (!numeroEmpleado) return
    const data = await fetchByEmpleadoMes(numeroEmpleado, selectedMes)
    const v = emptyValues()
    const n = emptyNotas()
    data.forEach(r => {
      if (INCIDENCIA_CATEGORIES.includes(r.categoria)) {
        v[r.categoria] = r.valor
        n[r.categoria] = r.notas ?? ''
      }
    })
    setValues(v)
    setNotas(n)
    setDirty(false)
  }, [numeroEmpleado, selectedMes, fetchByEmpleadoMes])

  useEffect(() => {
    if (open) {
      loadAllRecords()
      loadMonthData()
    }
  }, [open, loadAllRecords, loadMonthData])

  // ── Available months (from records) ──────────────────────────────────────

  const availableMonths = Array.from(new Set(allRecords.map(r => r.mes))).sort().reverse()

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleValueChange = (cat: IncidenciaCategory, val: string) => {
    const num = val === '' ? 0 : parseFloat(val)
    if (isNaN(num)) return
    setValues(prev => ({ ...prev, [cat]: num }))
    setDirty(true)
  }

  const handleNotaChange = (cat: IncidenciaCategory, val: string) => {
    setNotas(prev => ({ ...prev, [cat]: val }))
    setDirty(true)
  }

  const handleSave = async () => {
    const result = await saveMonth(numeroEmpleado, selectedMes, values, notas)
    if (result.success) {
      setDirty(false)
      loadAllRecords()
    }
  }

  const handlePrevMonth = () => setSelectedMes(prev => shiftMonth(prev, -1))
  const handleNextMonth = () => setSelectedMes(prev => shiftMonth(prev, 1))

  // Total incidencias for current month
  const totalMes = Object.values(values).reduce((a, b) => a + b, 0)

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-5 w-5 text-primary" />
            Incidencias
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
              #{numeroEmpleado}
            </span>
            <span className="truncate">{nombreEmpleado}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Month selector */}
          <div className="flex items-center justify-between gap-2">
            <Button variant="ghost" size="icon" onClick={handlePrevMonth} aria-label="Mes anterior">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-center">
              <h3 className="font-semibold text-sm">{formatMes(selectedMes)}</h3>
              {totalMes > 0 && (
                <Badge variant="secondary" className="text-xs mt-0.5">
                  {totalMes} incidencia{totalMes !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={handleNextMonth} aria-label="Mes siguiente">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Quick month chips */}
          {availableMonths.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {availableMonths.slice(0, 6).map(m => (
                <button
                  key={m}
                  onClick={() => setSelectedMes(m)}
                  className={`text-xs px-2 py-1 rounded-full transition-colors ${
                    m === selectedMes
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {formatMes(m)}
                </button>
              ))}
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Cargando...</span>
            </div>
          )}

          {/* Category grid */}
          {!loading && (
            <div className="grid grid-cols-2 gap-2">
              {INCIDENCIA_CATEGORIES.map(cat => {
                const meta = CATEGORY_META[cat]
                const hasValue = values[cat] > 0
                return (
                  <motion.div
                    key={cat}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                    className={`flex items-center gap-2 p-2.5 rounded-lg border transition-colors ${
                      hasValue
                        ? 'border-primary/30 bg-primary/5'
                        : 'border-border bg-card hover:bg-muted/30'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <span className={`text-xs font-medium ${meta.color}`}>
                        {meta.shortLabel}
                      </span>
                    </div>
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      value={values[cat] || ''}
                      onChange={(e) => handleValueChange(cat, e.target.value)}
                      placeholder="0"
                      className="w-16 h-8 text-center text-sm bg-background"
                      aria-label={`Valor ${cat}`}
                    />
                  </motion.div>
                )
              })}
            </div>
          )}

          {/* Notes section (expandable per category) */}
          {!loading && Object.values(values).some(v => v > 0) && (
            <details className="group">
              <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors flex items-center gap-1">
                <Plus className="h-3 w-3 group-open:rotate-45 transition-transform" />
                Agregar notas por categoría
              </summary>
              <div className="mt-2 space-y-2">
                {INCIDENCIA_CATEGORIES.filter(cat => values[cat] > 0).map(cat => (
                  <div key={cat} className="flex items-center gap-2">
                    <span className={`text-xs font-medium w-20 shrink-0 ${CATEGORY_META[cat].color}`}>
                      {CATEGORY_META[cat].shortLabel}
                    </span>
                    <Input
                      value={notas[cat]}
                      onChange={(e) => handleNotaChange(cat, e.target.value)}
                      placeholder="Nota opcional..."
                      className="h-8 text-xs bg-background"
                    />
                  </div>
                ))}
              </div>
            </details>
          )}

          {/* Error */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">{error}</AlertDescription>
            </Alert>
          )}

          {/* Save button */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadMonthData()}
              disabled={loading || saving}
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              Recargar
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!dirty || saving}
            >
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5 mr-1.5" />
              )}
              Guardar
            </Button>
          </div>
        </div>

        {/* Month history summary at bottom */}
        {allRecords.length > 0 && (
          <div className="mt-2 pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground mb-2 font-medium">Historial de meses</p>
            <div className="flex flex-wrap gap-1.5">
              {availableMonths.map(m => {
                const monthRecords = allRecords.filter(r => r.mes === m)
                const total = monthRecords.reduce((a, r) => a + r.valor, 0)
                return (
                  <button
                    key={m}
                    onClick={() => setSelectedMes(m)}
                    className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-colors ${
                      m === selectedMes
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80 text-foreground'
                    }`}
                  >
                    {formatMes(m)}
                    <span className={`font-mono text-[10px] ${
                      m === selectedMes ? 'opacity-80' : 'text-muted-foreground'
                    }`}>
                      ({total})
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
