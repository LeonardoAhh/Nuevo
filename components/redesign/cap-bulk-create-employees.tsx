"use client"

import React, { useCallback, useRef, useState } from "react"
import {
  Users,
  Upload,
  FileJson,
  AlertCircle,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowLeft,
} from "lucide-react"
import { ResponsiveShell } from "@/components/ui/responsive-shell"
import { RedesignModalHeader } from "./modal-header"
import { RedesignModalFooter } from "./modal-footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { supabase } from "@/lib/supabase/client"
import { notify } from "@/lib/notify"
import { CATALOGO_ORGANIZACIONAL, TURNOS } from "@/lib/catalogo"

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface JsonEntry {
  numero?: string | number | null
  nombre?: string
  puesto?: string | null
  departamento?: string | null
  area?: string | null
  turno?: string | null
  fecha_ingreso?: string | null
  jefe_directo?: string | null
  evaluacion_desempeno?: string | null
}

interface ValidEmployee {
  numero: string | null
  nombre: string
  puesto: string | null
  departamento: string | null
  area: string | null
  turno: string | null
  fecha_ingreso: string | null
  jefe_directo: string | null
  evaluacion_desempeno: string | null
}

interface InvalidEntry {
  index: number
  raw: JsonEntry
  reasons: string[]
}

interface DuplicateEntry {
  numero: string
  nombre: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Validation helpers
// ─────────────────────────────────────────────────────────────────────────────

const VALID_DEPTOS = new Set(Object.keys(CATALOGO_ORGANIZACIONAL))
const ALL_AREAS_BY_DEPTO = Object.fromEntries(
  Object.entries(CATALOGO_ORGANIZACIONAL).map(([dept, v]) => [dept, new Set(v.areas)]),
) as Record<string, Set<string>>
const ALL_PUESTOS_BY_DEPTO = Object.fromEntries(
  Object.entries(CATALOGO_ORGANIZACIONAL).map(([dept, v]) => [dept, new Set(v.puestos)]),
) as Record<string, Set<string>>
const VALID_TURNOS = new Set(TURNOS)
const VALID_TIPO_EVAL = new Set(["operativo", "administrativo", "jefe"])

function normStr(v: unknown): string | null {
  if (v == null) return null
  const s = String(v).trim()
  return s === "" ? null : s
}

function validateEntry(entry: JsonEntry, index: number): ValidEmployee | InvalidEntry {
  const reasons: string[] = []

  const nombre = normStr(entry.nombre)
  if (!nombre) reasons.push('"nombre" requerido')

  const numero = normStr(entry.numero)
  const puesto = normStr(entry.puesto)
  const departamento = normStr(entry.departamento)
  const area = normStr(entry.area)
  const turno = normStr(entry.turno)
  const fecha_ingreso = normStr(entry.fecha_ingreso)
  const jefe_directo = normStr(entry.jefe_directo)
  const evaluacion_desempeno = normStr(entry.evaluacion_desempeno)

  if (departamento && !VALID_DEPTOS.has(departamento)) {
    reasons.push(`departamento "${departamento}" no está en catálogo`)
  }

  if (area && departamento && VALID_DEPTOS.has(departamento)) {
    const validAreas = ALL_AREAS_BY_DEPTO[departamento]
    if (!validAreas.has(area)) {
      reasons.push(`area "${area}" no pertenece a "${departamento}"`)
    }
  }

  if (puesto && departamento && VALID_DEPTOS.has(departamento)) {
    const validPuestos = ALL_PUESTOS_BY_DEPTO[departamento]
    if (!validPuestos.has(puesto)) {
      reasons.push(`puesto "${puesto}" no pertenece a "${departamento}"`)
    }
  }

  if (turno && !VALID_TURNOS.has(turno)) {
    reasons.push(`turno "${turno}" no válido (esperado: ${[...VALID_TURNOS].join(", ")})`)
  }

  if (evaluacion_desempeno && !VALID_TIPO_EVAL.has(evaluacion_desempeno.toLowerCase())) {
    reasons.push(
      `evaluacion_desempeno "${evaluacion_desempeno}" debe ser: operativo, administrativo o jefe`,
    )
  }

  if (fecha_ingreso && !/^\d{4}-\d{2}-\d{2}$/.test(fecha_ingreso)) {
    reasons.push(`fecha_ingreso "${fecha_ingreso}" debe tener formato YYYY-MM-DD`)
  }

  if (reasons.length > 0) {
    return { index, raw: entry, reasons }
  }

  return {
    numero,
    nombre: nombre!,
    puesto,
    departamento,
    area,
    turno,
    fecha_ingreso,
    jefe_directo,
    evaluacion_desempeno: evaluacion_desempeno
      ? evaluacion_desempeno.toLowerCase()
      : null,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  open: boolean
  onClose: () => void
  onCreated: () => void
}

export function CapBulkCreateEmployees({ open, onClose, onCreated }: Props) {
  const [text, setText] = useState("")
  const [step, setStep] = useState<"upload" | "preview" | "done">("upload")
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [valid, setValid] = useState<ValidEmployee[]>([])
  const [invalid, setInvalid] = useState<InvalidEntry[]>([])
  const [duplicates, setDuplicates] = useState<DuplicateEntry[]>([])
  const [totalCreated, setTotalCreated] = useState(0)
  const fileRef = useRef<HTMLInputElement | null>(null)

  const reset = useCallback(() => {
    setStep("upload")
    setLoading(false)
    setSaving(false)
    setError(null)
    setValid([])
    setInvalid([])
    setDuplicates([])
    setTotalCreated(0)
    setText("")
  }, [])

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      setText(String(reader.result ?? ""))
      setError(null)
    }
    reader.onerror = () => setError("No se pudo leer el archivo JSON.")
    reader.readAsText(file)
    event.target.value = ""
  }

  const handleParseText = async () => {
    if (!text.trim()) {
      setError("Por favor, pega el contenido JSON")
      return
    }
    setError(null)
    setLoading(true)
    try {
      let entries: JsonEntry[]
      try {
        const parsed = JSON.parse(text)
        entries = Array.isArray(parsed) ? parsed : [parsed]
      } catch {
        throw new Error("El archivo no es JSON válido.")
      }

      if (entries.length === 0) {
        throw new Error("El JSON está vacío.")
      }

      // Validate locally first
      const validList: ValidEmployee[] = []
      const invalidList: InvalidEntry[] = []
      for (let i = 0; i < entries.length; i++) {
        const result = validateEntry(entries[i], i)
        if ("reasons" in result) invalidList.push(result)
        else validList.push(result)
      }

      // Check duplicates against existing employees (by numero)
      const numerosToCheck = validList
        .map((v) => v.numero)
        .filter((n): n is string => !!n)

      let existingNumeros = new Set<string>()
      if (numerosToCheck.length > 0) {
        const { data: existing, error: dbErr } = await supabase
          .from("employees")
          .select("numero")
          .in("numero", numerosToCheck)
        if (dbErr) throw new Error("Error consultando duplicados: " + dbErr.message)
        existingNumeros = new Set(
          (existing ?? []).map((e) => e.numero).filter((n): n is string => !!n),
        )
      }

      const duplicateList: DuplicateEntry[] = []
      const finalValid: ValidEmployee[] = []
      for (const v of validList) {
        if (v.numero && existingNumeros.has(v.numero)) {
          duplicateList.push({ numero: v.numero, nombre: v.nombre })
        } else {
          finalValid.push(v)
        }
      }

      setValid(finalValid)
      setInvalid(invalidList)
      setDuplicates(duplicateList)
      setStep("preview")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al procesar archivo")
    } finally {
      setLoading(false)
    }
  }

  const handleApply = async () => {
    if (valid.length === 0) return
    setSaving(true)
    setError(null)
    try {
      const { error: insertErr } = await supabase.from("employees").insert(valid)
      if (insertErr) throw new Error(insertErr.message)

      setTotalCreated(valid.length)
      setStep("done")
      notify.success(`${valid.length} empleado(s) creado(s)`)
      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear empleados")
    } finally {
      setSaving(false)
    }
  }

  return (
    <ResponsiveShell
      open={open}
      onClose={handleClose}
      title="Carga empleados"
      maxWidth={step === "preview" ? "sm:max-w-4xl" : "sm:max-w-2xl"}
      mobileVariant="dialog"
    >
      <RedesignModalHeader
        title="Carga masiva de empleados"
        icon={<Users className="h-5 w-5" />}
        onClose={handleClose}
      />
      <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 bg-surface-card">

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {step === "upload" && (
          <div className="space-y-5">
            <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/20 p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border/60 bg-background">
                <FileJson className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-ink">Importar empleados desde JSON</p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Pega el contenido o selecciona un archivo. Antes de crear empleados podrás revisar válidos, duplicados y errores.
                </p>
              </div>
            </div>

            <details className="group overflow-hidden rounded-md border border-border/60">
              <summary className="cursor-pointer select-none px-4 py-3 text-sm font-medium text-ink hover:bg-muted/30">
                Ver estructura esperada
              </summary>
              <pre className="max-h-64 overflow-auto border-t border-border/60 bg-muted/20 p-4 text-xs text-muted-foreground">
{`[
  {
    "numero": "1234",
    "nombre": "JUAN PEREZ GARCIA",
    "puesto": "OPERADOR DE MÁQUINA A",
    "departamento": "PRODUCCIÓN",
    "area": "PRODUCCIÓN 1ER TURNO",
    "turno": "1",
    "fecha_ingreso": "2026-01-15",
    "jefe_directo": "MARIA LOPEZ",
    "evaluacion_desempeno": "operativo"
  }
]`}
              </pre>
            </details>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <label htmlFor="employees-json-input" className="text-sm font-medium text-ink">Datos de empleados</label>
                <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                  <Upload className="mr-2 h-4 w-4" />
                  Seleccionar JSON
                </Button>
                <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={handleFile} />
              </div>
              <textarea
                id="employees-json-input"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Pega tu JSON aquí..."
                rows={8}
                className="w-full min-h-48 rounded-md border border-border/60 bg-transparent text-foreground p-4 text-sm font-mono resize-y focus:outline-none focus:ring-1 focus:ring-primary shadow-none placeholder:text-muted-foreground/60 transition-shadow"
                aria-label="Contenido JSON"
              />
            </div>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4">
            {/* Summary badges */}
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-[hsl(var(--success)/0.15)] text-[hsl(var(--success))] border-0 gap-1">
                <CheckCircle2 className="h-3 w-3" />
                {valid.length} válido(s)
              </Badge>
              {duplicates.length > 0 && (
                <Badge className="bg-[hsl(var(--warning)/0.15)] text-[hsl(var(--warning))] border-0 gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {duplicates.length} duplicado(s)
                </Badge>
              )}
              {invalid.length > 0 && (
                <Badge className="bg-[hsl(var(--destructive)/0.15)] text-[hsl(var(--destructive))] border-0 gap-1">
                  <XCircle className="h-3 w-3" />
                  {invalid.length} inválido(s)
                </Badge>
              )}
            </div>

            {/* Valid */}
            {valid.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Empleados a crear ({valid.length})
                </p>
                <div className="rounded-md border border-border/60 bg-surface-card shadow-none overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-transparent hover:bg-transparent">
                        <TableHead className="w-20">Número</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Puesto</TableHead>
                        <TableHead>Depto</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {valid.map((v, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-mono text-xs">{v.numero ?? "—"}</TableCell>
                          <TableCell className="text-xs">{v.nombre}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{v.puesto ?? "—"}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{v.departamento ?? "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Duplicates */}
            {duplicates.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-[hsl(var(--warning))] uppercase tracking-wide">
                  Duplicados — se omitirán ({duplicates.length})
                </p>
                <div className="rounded-md border border-[hsl(var(--warning)/0.3)] bg-[hsl(var(--warning)/0.05)] shadow-none overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-transparent hover:bg-transparent">
                        <TableHead className="w-20">Número</TableHead>
                        <TableHead>Nombre (JSON)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {duplicates.map((d, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-mono text-xs">{d.numero}</TableCell>
                          <TableCell className="text-xs">{d.nombre}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Invalid */}
            {invalid.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-destructive uppercase tracking-wide">
                  Inválidos — se omitirán ({invalid.length})
                </p>
                <div className="rounded-md border border-destructive/30 bg-destructive/5 shadow-none overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-transparent hover:bg-transparent">
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Errores</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invalid.map((inv) => (
                        <TableRow key={inv.index}>
                          <TableCell className="font-mono text-xs">{inv.index + 1}</TableCell>
                          <TableCell className="text-xs">{inv.raw.nombre ?? "—"}</TableCell>
                          <TableCell className="text-xs text-destructive">
                            <ul className="list-disc list-inside space-y-0.5">
                              {inv.reasons.map((r, i) => (
                                <li key={i}>{r}</li>
                              ))}
                            </ul>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        )}

        {step === "done" && (
          <div className="flex flex-col items-center justify-center gap-3 py-8">
            <CheckCircle2 className="h-12 w-12 text-[hsl(var(--success))]" />
            <p className="text-lg font-semibold">¡Listo!</p>
            <p className="text-sm text-muted-foreground">
              {totalCreated} empleado(s) creado(s) correctamente.
            </p>
          </div>
        )}
      </div>

      <RedesignModalFooter
        onCancel={handleClose}
        cancelLabel={step === "done" ? "Cerrar" : "Cancelar"}
        onConfirm={
          step === "upload" ? handleParseText :
          step === "preview" ? handleApply :
          undefined
        }
        confirmLabel={
          step === "upload" ? "Analizar JSON" :
          `Crear ${valid.length} empleado(s)`
        }
        confirmDisabled={
          step === "upload" ? (!text.trim() || loading) :
          (saving || valid.length === 0)
        }
        secondaryAction={
          step === "preview"
            ? {
                label: "Volver",
                onClick: reset,
                disabled: saving,
                icon: <ArrowLeft className="h-4 w-4" />
              }
            : undefined
        }
        saving={saving || loading}
      />
    </ResponsiveShell>
  )
}
