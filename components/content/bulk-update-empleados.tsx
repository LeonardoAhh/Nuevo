"use client"

import React, { useState, useRef, useCallback } from "react"
import {
    FileUp, Upload, RotateCcw, AlertCircle, CheckCircle2,
    Loader2, ArrowRight, Minus,
} from "lucide-react"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { supabase } from "@/lib/supabase/client"
import { notify } from "@/lib/notify"

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface BulkUpdateEntry {
    numero: string
    turno?: string
    departamento?: string
    area?: string
}

interface FieldDiff {
    field: string
    oldValue: string | null
    newValue: string
}

interface EmployeeChange {
    numero: string
    nombre: string
    source: "ambos" | "solo_ingresos" | "solo_capacitacion"
    niId: string | null
    empId: string | null
    changes: FieldDiff[]
}

interface EmployeeNoChange {
    numero: string
    nombre: string
}

interface EmployeeNotFound {
    numero: string
}

interface BulkUpdateEmpleadosProps {
    open: boolean
    onClose: () => void
    onUpdated: () => void
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function BulkUpdateEmpleados({ open, onClose, onUpdated }: BulkUpdateEmpleadosProps) {
    const fileRef = useRef<HTMLInputElement>(null)
    const [step, setStep] = useState<"upload" | "preview" | "done">("upload")
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [withChanges, setWithChanges] = useState<EmployeeChange[]>([])
    const [noChanges, setNoChanges] = useState<EmployeeNoChange[]>([])
    const [notFound, setNotFound] = useState<EmployeeNotFound[]>([])
    const [totalUpdated, setTotalUpdated] = useState(0)

    const reset = useCallback(() => {
        setStep("upload")
        setLoading(false)
        setSaving(false)
        setError(null)
        setWithChanges([])
        setNoChanges([])
        setNotFound([])
        setTotalUpdated(0)
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
            let entries: BulkUpdateEntry[]
            try {
                entries = JSON.parse(text)
            } catch {
                throw new Error("El archivo no es JSON válido.")
            }

            if (!Array.isArray(entries) || entries.length === 0) {
                throw new Error("El JSON debe ser un array con al menos un elemento.")
            }

            const invalid = entries.filter(e => !e.numero)
            if (invalid.length > 0) {
                throw new Error(`${invalid.length} registro(s) sin campo "numero".`)
            }

            const numeros = entries.map(e => String(e.numero).trim())

            const [niRes, empRes] = await Promise.all([
                supabase.from("nuevo_ingreso").select("id, numero, nombre, turno, departamento, area").in("numero", numeros),
                supabase.from("employees").select("id, numero, nombre, turno, departamento, area").in("numero", numeros),
            ])

            if (niRes.error) throw new Error("Error cargando nuevo_ingreso: " + niRes.error.message)
            if (empRes.error) throw new Error("Error cargando employees: " + empRes.error.message)

            const niMap = new Map<string, { id: string; nombre: string; turno: string | null; departamento: string | null; area: string | null }>()
            for (const r of niRes.data ?? []) {
                if (r.numero) niMap.set(r.numero, r)
            }

            const empMap = new Map<string, { id: string; nombre: string; turno: string | null; departamento: string | null; area: string | null }>()
            for (const r of empRes.data ?? []) {
                if (r.numero) empMap.set(r.numero, r)
            }

            const changes: EmployeeChange[] = []
            const unchanged: EmployeeNoChange[] = []
            const missing: EmployeeNotFound[] = []

            for (const entry of entries) {
                const num = String(entry.numero).trim()
                const ni = niMap.get(num)
                const emp = empMap.get(num)

                if (!ni && !emp) {
                    missing.push({ numero: num })
                    continue
                }

                const nombre = ni?.nombre ?? emp?.nombre ?? num
                const diffs: FieldDiff[] = []
                const fields: (keyof Pick<BulkUpdateEntry, "turno" | "departamento" | "area">)[] = ["turno", "departamento", "area"]

                for (const field of fields) {
                    const newVal = entry[field]
                    if (newVal === undefined || newVal === null || newVal === "") continue
                    const newStr = String(newVal).trim()

                    const currentNi = ni?.[field] ?? null
                    const currentEmp = emp?.[field] ?? null
                    const current = currentNi ?? currentEmp

                    if (current !== newStr) {
                        diffs.push({ field, oldValue: current, newValue: newStr })
                    }
                }

                if (diffs.length === 0) {
                    unchanged.push({ numero: num, nombre })
                    continue
                }

                let source: EmployeeChange["source"] = "ambos"
                if (ni && !emp) source = "solo_ingresos"
                else if (!ni && emp) source = "solo_capacitacion"

                changes.push({
                    numero: num,
                    nombre,
                    source,
                    niId: ni?.id ?? null,
                    empId: emp?.id ?? null,
                    changes: diffs,
                })
            }

            setWithChanges(changes)
            setNoChanges(unchanged)
            setNotFound(missing)
            setStep("preview")
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error al procesar archivo")
        } finally {
            setLoading(false)
        }
    }

    const handleApply = async () => {
        if (withChanges.length === 0) return
        setSaving(true)
        setError(null)

        try {
            let updated = 0

            for (const emp of withChanges) {
                const updateData: Record<string, string> = {}
                for (const diff of emp.changes) {
                    updateData[diff.field] = diff.newValue
                }

                if (emp.niId) {
                    const { error } = await supabase
                        .from("nuevo_ingreso")
                        .update({ ...updateData, updated_at: new Date().toISOString() })
                        .eq("id", emp.niId)
                    if (error) throw new Error(`Error actualizando nuevo_ingreso #${emp.numero}: ${error.message}`)
                }

                if (emp.empId) {
                    const { error } = await supabase
                        .from("employees")
                        .update(updateData)
                        .eq("id", emp.empId)
                    if (error) throw new Error(`Error actualizando employees #${emp.numero}: ${error.message}`)
                }

                updated++
            }

            setTotalUpdated(updated)
            setStep("done")
            notify.success(`${updated} empleado(s) actualizado(s)`)
            onUpdated()
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error al aplicar cambios")
        } finally {
            setSaving(false)
        }
    }

    const FIELD_LABEL: Record<string, string> = {
        turno: "Turno",
        departamento: "Departamento",
        area: "Área",
    }

    return (
        <Dialog open={open} onOpenChange={v => { if (!v) handleClose() }}>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-card">
                <DialogHeader>
                    <DialogTitle>Actualización de empleados</DialogTitle>
                    <DialogDescription>
                        Selecciona un archivo valido.
                    </DialogDescription>
                </DialogHeader>

                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {step === "upload" && (
                    <div className="space-y-4">
                        <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={handleFile} />
                        <Button
                            variant="ghost"
                            onClick={() => fileRef.current?.click()}
                            disabled={loading}
                            className="border border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/[0.03]"
                        >
                            {loading ? (
                                <><Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />Procesando…</>
                            ) : (
                                <><Upload className="h-3.5 w-3.5 mr-2" />Seleccionar archivo JSON</>
                            )}
                        </Button>
                    </div>
                )}

                {/* ── Step: Preview ────────────────────────────────────────────── */}
                {step === "preview" && (
                    <div className="space-y-4">
                        {/* Summary badges */}
                        <div className="flex flex-wrap gap-2">
                            <Badge variant="default" className="bg-primary text-primary-foreground">
                                {withChanges.length} con cambios
                            </Badge>
                            <Badge variant="secondary">
                                {noChanges.length} sin cambios
                            </Badge>
                            {notFound.length > 0 && (
                                <Badge variant="destructive">
                                    {notFound.length} no encontrado(s)
                                </Badge>
                            )}
                        </div>

                        {/* Changes table */}
                        {withChanges.length > 0 && (
                            <div className="rounded-xl border overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-background/50">
                                            <TableHead className="w-16">N.N.</TableHead>
                                            <TableHead>Empleado</TableHead>
                                            <TableHead>Campo</TableHead>
                                            <TableHead>Actual</TableHead>
                                            <TableHead className="w-8"></TableHead>
                                            <TableHead>Nuevo</TableHead>
                                            <TableHead className="w-24">Origen</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {withChanges.map(emp => (
                                            emp.changes.map((diff, idx) => (
                                                <TableRow key={`${emp.numero}-${diff.field}`} className={idx > 0 ? "border-t-0" : ""}>
                                                    {idx === 0 && (
                                                        <>
                                                            <TableCell rowSpan={emp.changes.length} className="font-mono text-xs text-muted-foreground align-top">
                                                                {emp.numero}
                                                            </TableCell>
                                                            <TableCell rowSpan={emp.changes.length} className="font-medium text-sm align-top">
                                                                {emp.nombre}
                                                            </TableCell>
                                                        </>
                                                    )}
                                                    <TableCell>
                                                        <Badge variant="outline" className="text-xs">
                                                            {FIELD_LABEL[diff.field] ?? diff.field}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-sm text-muted-foreground">
                                                        {diff.oldValue ?? <span className="italic">vacío</span>}
                                                    </TableCell>
                                                    <TableCell>
                                                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                                    </TableCell>
                                                    <TableCell className="text-sm font-medium text-primary">
                                                        {diff.newValue}
                                                    </TableCell>
                                                    {idx === 0 && (
                                                        <TableCell rowSpan={emp.changes.length} className="align-top">
                                                            <Badge variant="secondary" className="text-[10px]">
                                                                {emp.source === "ambos" ? "Ambos"
                                                                    : emp.source === "solo_ingresos" ? "Ingresos"
                                                                        : "Capacitación"}
                                                            </Badge>
                                                        </TableCell>
                                                    )}
                                                </TableRow>
                                            ))
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}

                        {/* No changes */}
                        {noChanges.length > 0 && (
                            <details className="group">
                                <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5">
                                    <Minus className="h-3.5 w-3.5" />
                                    {noChanges.length} empleado(s) sin cambios
                                </summary>
                                <div className="mt-2 rounded-lg border p-3 text-sm space-y-1 max-h-40 overflow-y-auto">
                                    {noChanges.map(e => (
                                        <div key={e.numero} className="flex gap-2 text-muted-foreground">
                                            <span className="font-mono text-xs w-12 shrink-0">#{e.numero}</span>
                                            <span>{e.nombre}</span>
                                        </div>
                                    ))}
                                </div>
                            </details>
                        )}

                        {/* Not found */}
                        {notFound.length > 0 && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                    No encontrados: {notFound.map(e => `#${e.numero}`).join(", ")}
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Actions */}
                        <div className="flex justify-end gap-2 pt-2">
                            <Button variant="outline" onClick={reset} disabled={saving}>
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Reiniciar
                            </Button>
                            <Button
                                onClick={handleApply}
                                disabled={saving || withChanges.length === 0}
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Aplicando…
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="h-4 w-4 mr-2" />
                                        Aplicar {withChanges.length} cambio(s)
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                )}

                {/* ── Step: Done ───────────────────────────────────────────────── */}
                {step === "done" && (
                    <div className="text-center py-8 space-y-4">
                        <CheckCircle2 className="h-12 w-12 mx-auto text-success" />
                        <p className="text-lg font-medium">{totalUpdated} empleado(s) actualizado(s)</p>
                        <p className="text-sm text-muted-foreground">
                            Los cambios se aplicaron en Ingresos y Capacitación (Historial).
                        </p>
                        <Button onClick={handleClose}>Cerrar</Button>
                    </div>
                )}
            </DialogContent>
        </Dialog >
    )
}
