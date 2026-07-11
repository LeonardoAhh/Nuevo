"use client"

import React, { useCallback, useRef, useState } from "react"
import { AlertCircle, CheckCircle2, FileUp, Loader2, Upload, ArrowLeft } from "lucide-react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { supabase } from "@/lib/supabase/client"
import { useNuevoIngreso, addDays, type NuevoIngreso } from "@/lib/hooks"
import { CATALOGO_ORGANIZACIONAL, TURNOS } from "@/lib/catalogo"

interface JsonEntry {
  numero?: string | number | null
  nombre?: string | null
  puesto?: string | null
  departamento?: string | null
  area?: string | null
  turno?: string | number | null
  fecha_ingreso?: string | null
  curp?: string | null
  escolaridad?: string | null
  jefe_area?: string | null
  tipo_contrato?: string | null
  rg_rec_048?: string | null
}

interface ValidIngreso extends Omit<NuevoIngreso, "id" | "created_at" | "updated_at"> {}

interface InvalidEntry {
  index: number
  nombre: string | null
  reasons: string[]
}

interface DuplicateEntry {
  index: number
  numero: string
  nombre: string | null
  reason: string
}

interface IngresosBulkImportProps {
  open: boolean
  onClose: () => void
  onImported: () => void
}

const VALID_TURNOS = new Set(TURNOS)
const VALID_CONTRACTS = new Set(["A prueba", "Indeterminado"])
const VALID_RG_STATUS = new Set(["Pendiente", "Entregado"])
const VALID_DEPARTAMENTOS = new Set(Object.keys(CATALOGO_ORGANIZACIONAL))
const VALID_AREAS_BY_DEPT = Object.fromEntries(
  Object.entries(CATALOGO_ORGANIZACIONAL).map(([departamento, config]) => [departamento, new Set(config.areas)]),
) as Record<string, Set<string>>
const VALID_PUESTOS_BY_DEPT = Object.fromEntries(
  Object.entries(CATALOGO_ORGANIZACIONAL).map(([departamento, config]) => [departamento, new Set(config.puestos)]),
) as Record<string, Set<string>>

const normalizeString = (value: unknown): string | null => {
  if (value == null) return null
  const trimmed = String(value).trim()
  return trimmed === "" ? null : trimmed
}

const normalizeUpper = (value: unknown): string | null => {
  const normalized = normalizeString(value)
  return normalized ? normalized.toUpperCase() : null
}

const todayIso = (): string => new Date().toISOString().split("T")[0]

const buildIngresoRecord = (entry: ValidIngreso): ValidIngreso => {
  const fechaIngreso = entry.fecha_ingreso ?? todayIso()
  const fechaIngresoFormatted = fechaIngreso
  const calculaVencimiento = entry.departamento?.toUpperCase() === "CALIDAD"
    ? addDays(fechaIngresoFormatted, 7)
    : addDays(fechaIngresoFormatted, 60)

  return {
    ...entry,
    nombre: entry.nombre.toUpperCase(),
    fecha_ingreso: fechaIngresoFormatted,
    eval_1_fecha: addDays(fechaIngresoFormatted, 30),
    eval_1_calificacion: null,
    eval_2_fecha: addDays(fechaIngresoFormatted, 60),
    eval_2_calificacion: null,
    eval_3_fecha: addDays(fechaIngresoFormatted, 80),
    eval_3_calificacion: null,
    termino_contrato: addDays(fechaIngresoFormatted, 90),
    rg_rec_048: entry.rg_rec_048 ?? "Pendiente",
    fecha_vencimiento_rg: entry.fecha_vencimiento_rg ?? calculaVencimiento,
  }
}

export function IngresosBulkImport({ open, onClose, onImported }: IngresosBulkImportProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const { saving, importRecords, error: importError } = useNuevoIngreso()
  const [step, setStep] = useState<"upload" | "preview" | "done">("upload")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [validRecords, setValidRecords] = useState<ValidIngreso[]>([])
  const [invalidEntries, setInvalidEntries] = useState<InvalidEntry[]>([])
  const [duplicateEntries, setDuplicateEntries] = useState<DuplicateEntry[]>([])
  const [createdCount, setCreatedCount] = useState(0)

  const reset = useCallback(() => {
    setStep("upload")
    setLoading(false)
    setError(null)
    setValidRecords([])
    setInvalidEntries([])
    setDuplicateEntries([])
    setCreatedCount(0)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }, [])

  const closeDialog = useCallback(() => {
    reset()
    onClose()
  }, [onClose, reset])

  type ValidationResult =
    | { invalid: true; index: number; nombre: string | null; reasons: string[] }
    | { invalid: false; record: ValidIngreso }

  const validateEntry = (entry: JsonEntry, index: number): ValidationResult => {
    const reasons: string[] = []
    const nombre = normalizeUpper(entry.nombre)
    if (!nombre) {
      reasons.push('El campo "nombre" es obligatorio.')
    }

    const numero = normalizeString(entry.numero)
    const turno = normalizeString(entry.turno)
    const departamento = normalizeUpper(entry.departamento)
    const area = normalizeUpper(entry.area)
    const puesto = normalizeUpper(entry.puesto)
    const fecha_ingreso = normalizeString(entry.fecha_ingreso) ?? todayIso()
    const tipo_contrato = normalizeString(entry.tipo_contrato) ?? "A prueba"
    const rg_rec_048 = normalizeString(entry.rg_rec_048) ?? "Pendiente"

    if (turno && !VALID_TURNOS.has(turno)) {
      reasons.push(`Turno "${turno}" no válido.`)
    }

    if (tipo_contrato && !VALID_CONTRACTS.has(tipo_contrato)) {
      reasons.push(`Tipo de contrato "${tipo_contrato}" debe ser A prueba o Indeterminado.`)
    }

    if (rg_rec_048 && !VALID_RG_STATUS.has(rg_rec_048)) {
      reasons.push(`RG-REC-048 "${rg_rec_048}" debe ser Pendiente o Entregado.`)
    }

    if (departamento && !VALID_DEPARTAMENTOS.has(departamento)) {
      reasons.push(`Departamento "${departamento}" no existe en el catálogo.`)
    }

    if (area && departamento && !VALID_AREAS_BY_DEPT[departamento]?.has(area)) {
      reasons.push(`Área "${area}" no coincide con el departamento ${departamento}.`)
    }

    if (puesto && departamento && !VALID_PUESTOS_BY_DEPT[departamento]?.has(puesto)) {
      reasons.push(`Puesto "${puesto}" no coincide con el departamento ${departamento}.`)
    }

    if (fecha_ingreso && !/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(fecha_ingreso)) {
      reasons.push(`Fecha de ingreso "${fecha_ingreso}" debe tener formato YYYY-MM-DD.`)
    }

    if (reasons.length > 0) {
      return { invalid: true, index, nombre: nombre ?? normalizeString(entry.nombre), reasons }
    }

    const validRecord: ValidIngreso = buildIngresoRecord({
      numero: numero ? numero : null,
      nombre: nombre!,
      puesto: puesto ?? null,
      departamento: departamento ?? null,
      area: area ?? null,
      turno: turno ?? null,
      fecha_ingreso,
      curp: normalizeUpper(entry.curp),
      escolaridad: normalizeUpper(entry.escolaridad),
      jefe_area: normalizeUpper(entry.jefe_area),
      tipo_contrato: tipo_contrato as ValidIngreso["tipo_contrato"],
      rg_rec_048: rg_rec_048 as ValidIngreso["rg_rec_048"],
      fecha_vencimiento_rg: null,
      eval_1_fecha: "",
      eval_1_calificacion: null,
      eval_2_fecha: "",
      eval_2_calificacion: null,
      eval_3_fecha: "",
      eval_3_calificacion: null,
      termino_contrato: "",
    })

    return { invalid: false, record: validRecord }
  }

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setError(null)
    setLoading(true)
    setValidRecords([])
    setInvalidEntries([])
    setDuplicateEntries([])

    try {
      const text = await file.text()
      let parsed: unknown
      try {
        parsed = JSON.parse(text)
      } catch {
        throw new Error("El archivo no es JSON válido.")
      }

      const items = Array.isArray(parsed) ? parsed : [parsed]
      if (items.length === 0) {
        throw new Error("El JSON debe contener al menos un elemento.")
      }

      const seenNumbers = new Set<string>()
      const candidateRecords: ValidIngreso[] = []
      const invalidList: InvalidEntry[] = []
      const duplicateList: DuplicateEntry[] = []

      for (let index = 0; index < items.length; index += 1) {
        const entry = items[index] as JsonEntry
        if (entry == null || typeof entry !== "object") {
          invalidList.push({ index, nombre: null, reasons: ["El elemento no es un objeto válido."] })
          continue
        }

        const result = validateEntry(entry, index)
        if (result.invalid) {
          invalidList.push(result)
          continue
        }

        const numero = normalizeString(entry.numero)
        if (numero) {
          const normalizedNumero = numero
          if (seenNumbers.has(normalizedNumero)) {
            duplicateList.push({ index, numero: normalizedNumero, nombre: normalizeUpper(entry.nombre), reason: "Duplicado en el archivo JSON." })
            continue
          }
          seenNumbers.add(normalizedNumero)
        }

        candidateRecords.push(result.record)
      }

      const numbersToCheck = candidateRecords
        .map((record) => record.numero)
        .filter((numero): numero is string => !!numero)

      if (numbersToCheck.length > 0) {
        const { data, error: existingError } = await supabase
          .from("nuevo_ingreso")
          .select("numero")
          .in("numero", numbersToCheck)

        if (existingError) throw new Error(existingError.message)

        const existingNumbers = new Set((data ?? []).map((item: { numero: string | null }) => item.numero).filter((n): n is string => !!n))
        const filteredRecords: ValidIngreso[] = []

        for (const [idx, record] of candidateRecords.entries()) {
          if (record.numero && existingNumbers.has(record.numero)) {
            duplicateList.push({
              index: idx,
              numero: record.numero,
              nombre: record.nombre,
              reason: "Ya existe un registro con ese número en la base de datos.",
            })
            continue
          }
          filteredRecords.push(record)
        }

        setValidRecords(filteredRecords)
      } else {
        setValidRecords(candidateRecords)
      }

      setInvalidEntries(invalidList)
      setDuplicateEntries(duplicateList)
      setStep("preview")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al procesar el archivo")
    } finally {
      setLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }, [])

  const handleImport = useCallback(async () => {
    if (validRecords.length === 0) return
    setError(null)
    const result = await importRecords(validRecords)
    if (result.success) {
      setCreatedCount(validRecords.length)
      setStep("done")
      onImported()
    } else {
      setError(result.error ?? "Error al importar los registros")
    }
  }, [importRecords, onImported, validRecords])

  const validCount = validRecords.length
  const invalidCount = invalidEntries.length
  const duplicateCount = duplicateEntries.length

  return (
    <Dialog open={open} onOpenChange={(openState) => { if (!openState) closeDialog() }}>
      <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-y-auto bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileUp className="h-5 w-5 text-primary" />
            Importar empleados desde JSON
          </DialogTitle>
          <DialogDescription>
            Selecciona un archivo <strong>JSON</strong> para crear nuevos registros de ingresos.
          </DialogDescription>
        </DialogHeader>

        {(error || importError) && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error ?? importError}</AlertDescription>
          </Alert>
        )}

        {step === "upload" && (
          <div className="space-y-5">
            <Alert>
              <AlertDescription className="space-y-2">
                <p className="font-semibold">Estructura esperada</p>
                <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
{`[
  {
    "numero": "1001",
    "nombre": "JUAN PÉREZ",
    "puesto": "OPERADOR",
    "departamento": "PRODUCCIÓN",
    "area": "LÍNEA 1",
    "turno": "1",
    "fecha_ingreso": "2026-07-01",
    "curp": "PERE800101HDFRZN09",
    "escolaridad": "BACHILLERATO",
    "jefe_area": "MARÍA LÓPEZ",
    "tipo_contrato": "A prueba"
  }
]`}
                </pre>
                <p className="text-sm text-muted-foreground">
                  <strong>Todos los datos son obligatorios.</strong>
                </p>
              </AlertDescription>
            </Alert>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={handleFileUpload}
              aria-hidden="true"
            />

            <Button
              variant="outline"
              className="w-full border-dashed border-border py-8"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading || saving}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Procesando archivo...
                </span>
              ) : (
                <span className="flex flex-col items-center gap-2 text-sm">
                  <Upload className="h-5 w-5" />
                  Seleccionar archivo JSON
                </span>
              )}
            </Button>
          </div>
        )}

        {step === "preview" && (
          <section aria-labelledby="preview-title" className="space-y-5">
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-[hsl(var(--success)/0.15)] text-[hsl(var(--success))] border-0">
                <CheckCircle2 className="h-3 w-3" /> {validCount} válido(s)
              </Badge>
              <Badge className="bg-[hsl(var(--warning)/0.15)] text-[hsl(var(--warning))] border-0">
                {duplicateCount} duplicado(s)
              </Badge>
              <Badge className="bg-[hsl(var(--destructive)/0.15)] text-[hsl(var(--destructive))] border-0">
                {invalidCount} inválido(s)
              </Badge>
            </div>

            <div className="space-y-5" aria-live="polite">
              {validCount > 0 && (
                <article>
                  <h2 id="preview-title" className="text-sm font-semibold">Empleados listos para crear</h2>
                  <div className="mt-3 overflow-hidden rounded-lg border border-border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-20">Número</TableHead>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Departamento</TableHead>
                          <TableHead>Turno</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {validRecords.map((record, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-mono text-xs">{record.numero ?? "—"}</TableCell>
                            <TableCell className="text-sm">{record.nombre}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{record.departamento ?? "—"}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{record.turno ?? "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </article>
              )}

              {duplicateCount > 0 && (
                <article>
                  <h3 className="text-sm font-semibold text-[hsl(var(--warning))]">Duplicados omitidos</h3>
                  <div className="mt-3 rounded-lg border border-[hsl(var(--warning)/0.3)] bg-[hsl(var(--warning)/0.08)] p-3">
                    <ul className="space-y-2 text-sm">
                      {duplicateEntries.map((item) => (
                        <li key={`${item.index}-${item.numero}`}>
                          <strong className="font-medium">#{item.numero}</strong>
                          <span className="text-muted-foreground"> — {item.nombre ?? "Sin nombre"}</span>
                          <div className="text-xs text-muted-foreground">{item.reason}</div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              )}

              {invalidCount > 0 && (
                <article>
                  <h3 className="text-sm font-semibold text-destructive">Registros inválidos</h3>
                  <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                    <ul className="space-y-3 text-sm">
                      {invalidEntries.map((item) => (
                        <li key={item.index} className="space-y-1">
                          <p className="font-medium">Registro {item.index + 1}</p>
                          <p className="text-muted-foreground">{item.nombre ?? "Nombre no disponible"}</p>
                          <ul className="list-disc list-inside text-xs text-destructive space-y-1">
                            {item.reasons.map((reason, reasonIndex) => (
                              <li key={reasonIndex}>{reason}</li>
                            ))}
                          </ul>
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              )}
            </div>
          </section>
        )}

        {step === "done" && (
          <div className="grid place-items-center gap-3 py-10">
            <CheckCircle2 className="h-12 w-12 text-[hsl(var(--success))]" />
            <p className="text-lg font-semibold">Carga completada</p>
            <p className="text-sm text-muted-foreground">Se importaron {createdCount} empleado(s) correctamente.</p>
          </div>
        )}

        <DialogFooter>
          {step === "preview" ? (
            <>
              <Button variant="outline" onClick={reset} disabled={saving}>
                <ArrowLeft className="h-4 w-4" />
                Volver
              </Button>
              <Button onClick={handleImport} disabled={saving || validCount === 0}>
                {saving ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Importando...
                  </span>
                ) : (
                  `Importar ${validCount} empleado(s)`
                )}
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={closeDialog} disabled={saving || loading}>
              {step === "done" ? "Cerrar" : "Cancelar"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
