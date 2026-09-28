"use client"

import React, { useCallback, useRef, useState } from "react"
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  FileJson,
  Mail,
  CalendarDays,
} from "lucide-react"
import { ResponsiveShell, ModalHeader, ModalFooter } from "@/components/ui/responsive-shell"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { normalizeBirthdayDate } from "@/lib/cumpleanos"
import { notify } from "@/lib/notify"

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface JsonEntry {
  numero?: string | number | null
  fecha_nacimiento?: string | null
  email?: string | null
}

interface ValidRecord {
  numero: string
  fecha_nacimiento: string
  email: string
  // Resuelto despues de buscar en BD
  id?: string
  tabla?: "employees" | "nuevo_ingreso"
  nombre?: string
}

interface InvalidEntry {
  index: number
  numero: string | null
  reasons: string[]
}

interface NotFoundEntry {
  index: number
  numero: string
}

interface UpdateResult {
  numero: string
  nombre: string
  ok: boolean
  error?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function normalize(v: unknown): string | null {
  if (v == null) return null
  const s = String(v).trim()
  return s === "" ? null : s
}

/**
 * Acepta fecha en cualquiera de estos formatos y devuelve YYYY-MM-DD:
 *   YYYY-MM-DD  → sin cambio
 *   DD/MM/YYYY  → convierte
 *   DD-MM-YYYY  → convierte
 * Devuelve null si el valor no coincide con ningún patrón conocido.
 */
// ─── Props ────────────────────────────────────────────────────────────────────

interface CumpleanosImportModalProps {
  open: boolean
  onClose: () => void
  onImported: () => void
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function CumpleanosImportModal({
  open,
  onClose,
  onImported,
}: CumpleanosImportModalProps) {
  const fileRef = useRef<HTMLInputElement | null>(null)

  const [step, setStep] = useState<"upload" | "preview" | "done">("upload")
  const [loading, setLoading] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState<string | null>(null)

  const [validRecords, setValidRecords]     = useState<ValidRecord[]>([])
  const [invalidEntries, setInvalidEntries] = useState<InvalidEntry[]>([])
  const [notFound, setNotFound]             = useState<NotFoundEntry[]>([])
  const [updatedCount, setUpdatedCount]     = useState(0)

  // ── Reset ──────────────────────────────────────────────────────────────────

  const reset = useCallback(() => {
    setStep("upload")
    setLoading(false)
    setSaving(false)
    setError(null)
    setValidRecords([])
    setInvalidEntries([])
    setNotFound([])
    setUpdatedCount(0)
    if (fileRef.current) fileRef.current.value = ""
  }, [])

  const closeDialog = useCallback(() => {
    reset()
    onClose()
  }, [onClose, reset])

  // ── Validacion ─────────────────────────────────────────────────────────────

  function validateEntry(
    entry: JsonEntry,
    _index: number,
  ): { invalid: true; reasons: string[]; numero: string | null } | { invalid: false; record: Omit<ValidRecord, "id" | "tabla" | "nombre"> } {
    const reasons: string[] = []
    const numero    = normalize(entry.numero)
    const fechaRaw  = normalize(entry.fecha_nacimiento)
    const email     = normalize(entry.email)

    if (!numero) reasons.push('"numero" es obligatorio.')

    // Fecha: acepta YYYY-MM-DD, DD/MM/YYYY y DD-MM-YYYY
    let fechaISO: string | null = null
    if (!fechaRaw) {
      reasons.push('"fecha_nacimiento" es obligatorio. Formatos aceptados: YYYY-MM-DD o DD/MM/YYYY.')
    } else {
      const dateResult = normalizeBirthdayDate(fechaRaw)
      if ("error" in dateResult) reasons.push(dateResult.error)
      else fechaISO = dateResult.iso
    }

    if (!email) reasons.push('"email" es obligatorio.')
    else if (!EMAIL_RE.test(email)) reasons.push(`"email" no tiene formato válido: "${email}".`)

    if (reasons.length) return { invalid: true, reasons, numero }
    return { invalid: false, record: { numero: numero!, fecha_nacimiento: fechaISO!, email: email! } }
  }

  // ── Carga de archivo ───────────────────────────────────────────────────────

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (fileRef.current) fileRef.current.value = ""

    setError(null)
    setLoading(true)
    setValidRecords([])
    setInvalidEntries([])
    setNotFound([])

    try {
      // 1. Parsear JSON
      const text = await file.text()
      let parsed: unknown
      try { parsed = JSON.parse(text) } catch {
        throw new Error("El archivo no es un JSON válido.")
      }
      const items = Array.isArray(parsed) ? parsed : [parsed]
      if (!items.length) throw new Error("El JSON debe contener al menos un elemento.")

      // 2. Validar estructura
      const seenNums = new Set<string>()
      const candidates: Omit<ValidRecord, "id" | "tabla" | "nombre">[] = []
      const invalidList: InvalidEntry[] = []

      for (let i = 0; i < items.length; i++) {
        const item = items[i] as JsonEntry
        if (!item || typeof item !== "object") {
          invalidList.push({ index: i, numero: null, reasons: ["El elemento no es un objeto válido."] })
          continue
        }
        const result = validateEntry(item, i)
        if (result.invalid) { invalidList.push({ index: i, numero: result.numero, reasons: result.reasons }); continue }

        const num = result.record.numero
        if (seenNums.has(num)) {
          invalidList.push({ index: i, numero: num, reasons: [`Número duplicado en el archivo: "${num}".`] })
          continue
        }
        seenNums.add(num)
        candidates.push(result.record)
      }

      setInvalidEntries(invalidList)

      if (!candidates.length) {
        setStep("preview")
        setLoading(false)
        return
      }

      const response = await fetch("/api/cumpleanos/importar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "preview", registros: candidates }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error ?? "No se pudo validar el archivo")

      setValidRecords(payload.registros ?? [])
      setNotFound(
        (payload.noEncontrados ?? []).map((numero: string) => ({
          numero,
          index: candidates.findIndex((candidate) => candidate.numero === numero),
        })),
      )
      setStep("preview")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al procesar el archivo")
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Guardar ────────────────────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    if (!validRecords.length) return
    setSaving(true)
    setError(null)

    try {
      const response = await fetch("/api/cumpleanos/importar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save", registros: validRecords }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error ?? "No se pudo guardar la importación")
      const results = (payload.resultados ?? []) as UpdateResult[]
      const resetCount = Number(payload.estadosEnvioReiniciados ?? 0)

      const exitosos = results.filter((r) => r.ok).length
      setUpdatedCount(exitosos)
      setStep("done")
      onImported()

      if (exitosos < results.length) {
        const fallidos = results.filter((r) => !r.ok).length
        notify.warning(`${exitosos} actualizados, ${fallidos} con error`)
      } else {
        notify.success(
          `${exitosos} colaboradores actualizados${
            resetCount > 0
              ? `. ${resetCount} ${resetCount === 1 ? "envío reiniciado" : "envíos reiniciados"}`
              : ""
          }`,
        )
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar")
    } finally {
      setSaving(false)
    }
  }, [validRecords, onImported])

  // ── Counts ─────────────────────────────────────────────────────────────────

  const validCount   = validRecords.length
  const invalidCount = invalidEntries.length
  const nfCount      = notFound.length

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <ResponsiveShell
      open={open}
      onClose={closeDialog}
      title="Importar fechas de nacimiento y emails"
      description="Sube un JSON con numero, fecha_nacimiento y email para actualizar colaboradores."
      maxWidth="sm:max-w-3xl"
    >
      <ModalHeader
        title="Cargar datos de empleados"
        subtitle="Actualiza fecha de nacimiento y correo de colaboradores existentes."
        onClose={closeDialog}
      />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* ── Paso 1: upload ──────────────────────────────────────────────── */}
        {step === "upload" && (
          <div className="space-y-5">
            <Alert>
              <AlertDescription className="space-y-2">
                <p className="font-semibold text-sm">Estructura del archivo</p>
                <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">{`[
  {
    "numero": "1001",
    "fecha_nacimiento": "17/05/1990",
    "email": "juan.perez@gmail.com"
  },
  {
    "numero": "1002",
    "fecha_nacimiento": "1985-11-03",
    "email": "maria.lopez@hotmail.com"
  }
]`}</pre>
              </AlertDescription>
            </Alert>

            <input
              ref={fileRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={handleFileChange}
              aria-hidden="true"
            />

            <Button
              variant="outline"
              className="w-full border-dashed border-border py-8"
              onClick={() => fileRef.current?.click()}
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Procesando...
                </span>
              ) : (
                <span className="flex flex-col items-center gap-2 text-sm">
                  <FileJson className="h-6 w-6" />
                  Seleccionar archivo JSON
                </span>
              )}
            </Button>
          </div>
        )}

        {/* ── Paso 2: preview ─────────────────────────────────────────────── */}
        {step === "preview" && (
          <section className="space-y-5">
            {/* Resumen */}
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-[hsl(var(--success)/0.15)] text-[hsl(var(--success))] border-0 gap-1">
                <CheckCircle2 className="h-3 w-3" />
                {validCount} listo(s) para actualizar
              </Badge>
              {nfCount > 0 && (
                <Badge className="bg-[hsl(var(--warning)/0.15)] text-[hsl(var(--warning))] border-0">
                  {nfCount} numero(s) no encontrado(s)
                </Badge>
              )}
              {invalidCount > 0 && (
                <Badge className="bg-[hsl(var(--destructive)/0.15)] text-[hsl(var(--destructive))] border-0">
                  {invalidCount} inválido(s)
                </Badge>
              )}
            </div>

            {/* Registros válidos */}
            {validCount > 0 && (
              <article>
                <h2 className="text-sm font-semibold mb-3">
                  Colaboradores que se actualizarán
                </h2>
                <ul className="space-y-2">
                  {validRecords.map((r) => (
                    <li
                      key={r.numero}
                      className="rounded-lg border border-border bg-card p-3 space-y-2"
                    >
                      {/* Fila principal: nombre + badge tabla */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-sm leading-snug break-words">
                            {r.nombre}
                          </p>
                          <p className="font-mono text-[11px] text-muted-foreground mt-0.5">
                            #{r.numero}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className="shrink-0 text-[10px] h-5 px-1.5 mt-0.5"
                        >
                          {r.tabla === "employees" ? "Planta" : "Ingreso"}
                        </Badge>
                      </div>

                      {/* Detalles: fecha y email */}
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                          <span>{r.fecha_nacimiento}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Mail className="h-3.5 w-3.5 shrink-0" />
                          <span className="break-all">{r.email}</span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </article>
            )}

            {/* No encontrados */}
            {nfCount > 0 && (
              <article>
                <h3 className="text-sm font-semibold text-[hsl(var(--warning))] mb-2">
                  Números no encontrados en la base de datos
                </h3>
                <div className="rounded-lg border border-[hsl(var(--warning)/0.3)] bg-[hsl(var(--warning)/0.08)] p-3">
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {notFound.map((nf) => (
                      <li key={nf.numero} className="font-mono">#{nf.numero}</li>
                    ))}
                  </ul>
                </div>
              </article>
            )}

            {/* Inválidos */}
            {invalidCount > 0 && (
              <article>
                <h3 className="text-sm font-semibold text-destructive mb-2">
                  Registros inválidos
                </h3>
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                  <ul className="space-y-3 text-sm">
                    {invalidEntries.map((item) => (
                      <li key={item.index} className="space-y-1">
                        <p className="font-medium">
                          Fila {item.index + 1}
                          {item.numero && <span className="font-mono ml-1 text-muted-foreground">#{item.numero}</span>}
                        </p>
                        <ul className="list-disc list-inside text-xs text-destructive space-y-0.5">
                          {item.reasons.map((r, i) => <li key={i}>{r}</li>)}
                        </ul>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            )}
          </section>
        )}

        {/* ── Paso 3: done ────────────────────────────────────────────────── */}
        {step === "done" && (
          <div className="grid place-items-center gap-3 py-10">
            <CheckCircle2 className="h-12 w-12 text-[hsl(var(--success))]" />
            <p className="text-lg font-semibold">Importación completada</p>
            <p className="text-sm text-muted-foreground">
              Se actualizaron {updatedCount} colaborador(es) correctamente.
            </p>
          </div>
        )}
      </div>

      <ModalFooter
        onCancel={step === "preview" ? reset : closeDialog}
        cancelLabel={step === "preview" ? "Volver" : step === "done" ? "Cerrar" : "Cancelar"}
        onConfirm={step === "preview" ? handleSave : undefined}
        confirmLabel={`Actualizar ${validCount} colaborador${validCount !== 1 ? "es" : ""}`}
        confirmDisabled={saving || validCount === 0}
        saving={saving}
      />
    </ResponsiveShell>
  )
}
