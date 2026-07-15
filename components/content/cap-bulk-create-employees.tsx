"use client"

import React, { useCallback, useRef, useState } from "react"
import {
  Users,
  Upload,
  AlertCircle,
  CheckCircle2,
  Loader2,
  XCircle,
  AlertTriangle,
  ArrowLeft,
} from "lucide-react"
import { ResponsiveShell, ModalHeader, ModalFooter } from "@/components/ui/responsive-shell"
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
  const fileRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<"upload" | "preview" | "done">("upload")
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [valid, setValid] = useState<ValidEmployee[]>([])
  const [invalid, setInvalid] = useState<InvalidEntry[]>([])
  const [duplicates, setDuplicates] = useState<DuplicateEntry[]>([])
  const [totalCreated, setTotalCreated] = useState(0)

  const reset = useCallback(() => {
    setStep("upload")
    setLoading(false)
    setSaving(false)
    setError(null)
    setValid([])
    setInvalid([])
    setDuplicates([])
    setTotalCreated(0)
    if (fileRef.current) fileRef.current.value = ""
  }, [])

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    setLoading(true)
    try {
      const text = await file.text()
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
      title="Carga masiva de empleados"
      description="Crea múltiples empleados desde un archivo JSON. Skip duplicados por número, validación estricta contra catálogo."
      maxWidth="sm:max-w-3xl"
    >
      <ModalHeader
        title="Carga masiva de empleados"
        subtitle="Crea múltiples empleados desde un archivo JSON. Skip duplicados por número, validación estricta contra catálogo."
      />
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {step === "upload" && (
          <div className="space-y-4">
            <Alert>
              <AlertDescription className="space-y-2">
                <p className="font-semibold">Estructura esperada:</p>
                <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
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
                <p className="text-xs text-muted-foreground">
                  Solo <code>nombre</code> es obligatorio. <code>departamento</code>,{" "}
                  <code>puesto</code>, <code>area</code> y <code>turno</code> deben coincidir con el
                  catálogo organizacional. <code>evaluacion_desempeno</code> ∈ {`{ operativo, administrativo, jefe }`}.
                </p>
              </AlertDescription>
            </Alert>

            <input
              ref={fileRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={handleFile}
            />
            <Button
              variant="ghost"
              onClick={() => fileRef.current?.click()}
              disabled={loading}
              className="w-full border border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/[0.03] py-8"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Procesando...
                </span>
              ) : (
                <span className="flex flex-col items-center gap-1">
                  <Upload className="h-5 w-5" />
                  <span>Seleccionar archivo JSON</span>
                </span>
              )}
            </Button>
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
                <div className="rounded-lg border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
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
                <div className="rounded-lg border border-[hsl(var(--warning)/0.3)] bg-[hsl(var(--warning)/0.05)] overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
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
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
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

      <ModalFooter
        onCancel={handleClose}
        cancelLabel={step === "done" ? "Cerrar" : "Cancelar"}
        onConfirm={step === "preview" ? handleApply : undefined}
        confirmLabel={`Crear ${valid.length} empleado(s)`}
        confirmDisabled={saving || valid.length === 0}
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
        saving={saving}
      />
    </ResponsiveShell>
  )
}
