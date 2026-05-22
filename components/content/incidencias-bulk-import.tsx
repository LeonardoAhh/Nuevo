"use client"

import React, { useState, useRef, useMemo } from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
  FileUp, Upload, RotateCcw, AlertCircle, CheckCircle2,
  Loader2, Users, ChevronDown, ChevronUp,
} from "lucide-react"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  useIncidencias,
  INCIDENCIA_CATEGORIES,
  parseIncidenciasJSON,
  formatMes,
} from "@/lib/hooks/useIncidencias"
import type {
  IncidenciaCategory,
  IncidenciaInsert,
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
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface EmployeeNameMap {
  [numero: string]: string
}

interface IncidenciasBulkImportProps {
  open: boolean
  onClose: () => void
  /** Map of numero_empleado → nombre for preview display */
  employeeNames: EmployeeNameMap
}

// ─────────────────────────────────────────────────────────────────────────────
// Preview group structure
// ─────────────────────────────────────────────────────────────────────────────

interface PreviewGroup {
  numero: string
  nombre: string | null
  months: {
    mes: string
    items: IncidenciaInsert[]
  }[]
  totalRecords: number
}

function buildPreviewGroups(
  records: IncidenciaInsert[],
  names: EmployeeNameMap,
): PreviewGroup[] {
  const map = new Map<string, Map<string, IncidenciaInsert[]>>()

  for (const r of records) {
    if (!map.has(r.numero_empleado)) map.set(r.numero_empleado, new Map())
    const empMap = map.get(r.numero_empleado)!
    if (!empMap.has(r.mes)) empMap.set(r.mes, [])
    empMap.get(r.mes)!.push(r)
  }

  const groups: PreviewGroup[] = []
  for (const [numero, monthsMap] of map) {
    const months = Array.from(monthsMap.entries())
      .map(([mes, items]) => ({ mes, items }))
      .sort((a, b) => a.mes.localeCompare(b.mes))
    groups.push({
      numero,
      nombre: names[numero] ?? null,
      months,
      totalRecords: months.reduce((a, m) => a + m.items.length, 0),
    })
  }

  return groups.sort((a, b) => {
    const na = parseInt(a.numero, 10)
    const nb = parseInt(b.numero, 10)
    if (isNaN(na) && isNaN(nb)) return a.numero.localeCompare(b.numero)
    if (isNaN(na)) return 1
    if (isNaN(nb)) return -1
    return na - nb
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Collapsible employee preview row
// ─────────────────────────────────────────────────────────────────────────────

function EmployeePreviewRow({ group }: { group: PreviewGroup }) {
  const [expanded, setExpanded] = useState(false)
  const isBaja = group.nombre === null

  return (
    <div className={`border rounded-lg overflow-hidden ${
      isBaja ? 'border-destructive/30 opacity-60' : 'border-border'
    }`}>
      {/* Header row */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
          isBaja ? 'bg-destructive/5' : 'hover:bg-muted/30'
        }`}
      >
        <span className="font-mono text-xs text-muted-foreground w-12 shrink-0">
          #{group.numero}
        </span>
        <span className={`text-sm font-medium flex-1 truncate ${
          isBaja ? 'line-through text-muted-foreground' : ''
        }`}>
          {isBaja
            ? <span className="text-destructive italic">Baja — excluido</span>
            : group.nombre
          }
        </span>
        {isBaja ? (
          <Badge className="text-xs shrink-0 bg-destructive/10 text-destructive border-destructive/30">
            Baja
          </Badge>
        ) : (
          <Badge variant="secondary" className="text-xs shrink-0">
            {group.months.length} mes{group.months.length !== 1 ? 'es' : ''} · {group.totalRecords} reg
          </Badge>
        )}
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
      </button>

      {/* Expanded detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border bg-muted/20 px-3 py-2 space-y-2">
              {group.months.map(({ mes, items }) => (
                <div key={mes}>
                  <p className="text-xs font-semibold text-foreground mb-1">
                    {formatMes(mes)}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {items.map((item, i) => {
                      const meta = CATEGORY_META[item.categoria]
                      return (
                        <span
                          key={i}
                          className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-card border border-border ${meta?.color ?? ''}`}
                        >
                          {meta?.shortLabel ?? item.categoria}
                          <span className="font-mono font-bold">{item.valor}</span>
                        </span>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export function IncidenciasBulkImport({
  open,
  onClose,
  employeeNames,
}: IncidenciasBulkImportProps) {
  const { saving, importBulk } = useIncidencias()

  const [jsonText, setJsonText] = useState('')
  const [parseResult, setParseResult] = useState<{
    records: IncidenciaInsert[]
    errors: string[]
  } | null>(null)
  const [importSuccess, setImportSuccess] = useState(false)
  const fileRef = useRef<HTMLInputElement | null>(null)

  // Build grouped preview
  const previewGroups = useMemo(() => {
    if (!parseResult || parseResult.records.length === 0) return []
    return buildPreviewGroups(parseResult.records, employeeNames)
  }, [parseResult, employeeNames])

  // Stats — separate matched (importable) from bajas (excluded)
  const stats = useMemo(() => {
    if (!previewGroups.length) return null
    const employees = previewGroups.length
    const matchedGroups = previewGroups.filter(g => g.nombre !== null)
    const matched = matchedGroups.length
    const bajas = employees - matched
    const importableRecords = matchedGroups.reduce((a, g) => a + g.totalRecords, 0)
    const totalMonths = matchedGroups.reduce((a, g) => a + g.months.length, 0)
    return { employees, matched, bajas, importableRecords, totalMonths }
  }, [previewGroups])

  // Records that will actually be imported (only matched employees)
  const importableRecords = useMemo(() => {
    if (!parseResult) return []
    const matchedNumbers = new Set(
      previewGroups.filter(g => g.nombre !== null).map(g => g.numero)
    )
    return parseResult.records.filter(r => matchedNumbers.has(r.numero_empleado))
  }, [parseResult, previewGroups])

  // ── Handlers ─────────────────────────────────────────────────────────────

  const tryParse = (text: string) => {
    setParseResult(null)
    setImportSuccess(false)
    if (!text.trim()) return
    try {
      const parsed = JSON.parse(text)
      const arr = Array.isArray(parsed) ? parsed : [parsed]
      if (arr.length === 0) {
        setParseResult({ records: [], errors: ['JSON vacío'] })
        return
      }
      setParseResult(parseIncidenciasJSON(arr))
    } catch {
      setParseResult({ records: [], errors: ['JSON inválido — verifica formato'] })
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      setJsonText(text)
      tryParse(text)
    }
    reader.readAsText(file)
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleImport = async () => {
    if (importableRecords.length === 0) return
    const result = await importBulk(importableRecords)
    if (result.success) {
      setImportSuccess(true)
      setJsonText('')
      setParseResult(null)
    }
  }

  const handleReset = () => {
    setJsonText('')
    setParseResult(null)
    setImportSuccess(false)
  }

  const handleClose = () => {
    handleReset()
    onClose()
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose() }}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <FileUp className="h-5 w-5 text-primary" />
            Importar Incidencias
          </DialogTitle>
          <DialogDescription>
            Carga masiva de incidencias por empleado y mes vía archivo JSON.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Upload + text area */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileRef.current?.click()}
              className="gap-1.5"
            >
              <Upload className="h-3.5 w-3.5" />
              Subir .json
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleFileUpload}
            />
            {jsonText && (
              <Button variant="ghost" size="sm" onClick={handleReset}>
                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                Limpiar
              </Button>
            )}
          </div>

          <textarea
            value={jsonText}
            onChange={(e) => { setJsonText(e.target.value); setParseResult(null); setImportSuccess(false) }}
            placeholder={`[\n  {\n    "numero_empleado": "123",\n    "mes": "2025-01",\n    "FALTA INJUSTIFICADA": 2,\n    "VACACIÓN": 1\n  },\n  {\n    "numero_empleado": "456",\n    "mes": "2025-01",\n    "INCAPACIDAD": 3\n  }\n]`}
            className="w-full h-36 text-xs font-mono bg-muted rounded-lg border border-border p-3 resize-y scrollbar-thin focus:outline-none focus:ring-2 focus:ring-ring"
          />

          <Button
            variant="secondary"
            size="sm"
            onClick={() => tryParse(jsonText)}
            disabled={!jsonText.trim()}
          >
            Validar JSON
          </Button>

          {/* ── Parse errors ──────────────────────────────────────────── */}
          {parseResult && parseResult.errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <ul className="text-xs space-y-0.5 mt-1">
                  {parseResult.errors.map((e, i) => (
                    <li key={i}>• {e}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* ── Preview ───────────────────────────────────────────────── */}
          <AnimatePresence mode="wait">
            {previewGroups.length > 0 && stats && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-3"
              >
                {/* Summary bar */}
                <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border">
                  <Users className="h-4 w-4 text-primary shrink-0" />
                  <div className="flex flex-wrap gap-2 text-xs">
                    <Badge variant="secondary">
                      {stats.employees} empleado{stats.employees !== 1 ? 's' : ''}
                    </Badge>
                    <Badge variant="secondary">
                      {stats.totalMonths} mes{stats.totalMonths !== 1 ? 'es' : ''}
                    </Badge>
                    <Badge variant="secondary">
                      {stats.importableRecords} registro{stats.importableRecords !== 1 ? 's' : ''}
                    </Badge>
                    {stats.matched > 0 && (
                      <Badge className="bg-success/10 text-success border-success/30">
                        {stats.matched} activo{stats.matched !== 1 ? 's' : ''}
                      </Badge>
                    )}
                    {stats.bajas > 0 && (
                      <Badge className="bg-destructive/10 text-destructive border-destructive/30">
                        {stats.bajas} baja{stats.bajas !== 1 ? 's' : ''} (excluido{stats.bajas !== 1 ? 's' : ''})
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Employee groups */}
                <div className="max-h-64 overflow-y-auto scrollbar-thin space-y-2 pr-1">
                  {previewGroups.map(group => (
                    <EmployeePreviewRow key={group.numero} group={group} />
                  ))}
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <Button variant="outline" size="sm" onClick={handleReset}>
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleImport}
                    disabled={saving || importableRecords.length === 0}
                    className="gap-1.5"
                  >
                    {saving ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <FileUp className="h-3.5 w-3.5" />
                    )}
                    Importar {stats.importableRecords} registros
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Import success */}
          {importSuccess && (
            <Alert className="border-success/30 bg-success/10">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <AlertDescription className="text-success text-xs">
                Incidencias importadas correctamente.
              </AlertDescription>
            </Alert>
          )}

          {/* Format help */}
          <details className="group">
            <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
              ¿Cómo formatear el JSON?
            </summary>
            <div className="mt-2 p-3 rounded-lg bg-muted/50 border border-border text-xs font-mono whitespace-pre-wrap text-muted-foreground leading-relaxed">
{`[
  {
    "numero_empleado": "123",
    "mes": "2025-01",
    "FALTA INJUSTIFICADA": 2,
    "DIA FESTIVO": 1,
    "VACACIÓN": 3
  },
  {
    "numero_empleado": "456",
    "mes": "2025-01",
    "INCAPACIDAD": 5,
    "PERMISO HORAS": 2
  },
  {
    "numero_empleado": "123",
    "mes": "2025-02",
    "SANCIÓN": 1,
    "DESCANSO": 4
  }
]`}
            </div>
            <div className="mt-2 text-xs text-muted-foreground space-y-1">
              <p><strong>Reglas:</strong></p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li><code>numero_empleado</code> y <code>mes</code> (YYYY-MM) obligatorios</li>
                <li>Múltiples empleados y meses en mismo archivo</li>
                <li>Solo incluir categorías con valor &gt; 0</li>
                <li>Categorías en MAYÚSCULAS</li>
              </ul>
              <p className="pt-1"><strong>Categorías:</strong> {INCIDENCIA_CATEGORIES.join(', ')}</p>
            </div>
          </details>
        </div>
      </DialogContent>
    </Dialog>
  )
}
