"use client"

import { useCallback, useEffect, useId, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AlertTriangle, ArrowLeft, Check, ChevronLeft, ChevronRight, Loader2, NotebookPen } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CATEGORY_META } from "@/lib/constants/incidencias"
import {
  formatMes, INCIDENCIA_CATEGORIES, useIncidencias,
  type IncidenciaCategory, type IncidenciaRecord,
} from "@/lib/hooks/useIncidencias"
import { supabase } from "@/lib/supabase/client"
import { notify } from "@/lib/notify"

function currentMonth(): string {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
}

function shiftMonth(month: string, offset: number): string {
  const [year, number] = month.split("-").map(Number)
  const date = new Date(Date.UTC(year, number - 1 + offset, 1))
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`
}

function emptyByCategory<T>(value: T): Record<IncidenciaCategory, T> {
  return Object.fromEntries(INCIDENCIA_CATEGORIES.map(category => [category, value])) as Record<IncidenciaCategory, T>
}

export function IncidenciasPage({ numeroEmpleado, returnTo }: { numeroEmpleado: string; returnTo: string }) {
  const { loading, saving, error, fetchByEmpleado, saveMonth } = useIncidencias()
  const router = useRouter()
  const fieldId = useId()
  const [identity, setIdentity] = useState<{ nombre: string; puesto: string | null } | null>(null)
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const [records, setRecords] = useState<IncidenciaRecord[]>([])
  const [values, setValues] = useState(() => emptyByCategory(0))
  const [notes, setNotes] = useState(() => emptyByCategory(""))
  const [dirty, setDirty] = useState(false)

  const loadRecords = useCallback(async () => {
    setRecords(await fetchByEmpleado(numeroEmpleado))
  }, [fetchByEmpleado, numeroEmpleado])

  useEffect(() => {
    void loadRecords()
    let active = true
    const loadIdentity = async () => {
      const employee = await supabase.from("employees").select("nombre,puesto").eq("numero", numeroEmpleado).maybeSingle()
      if (employee.data) {
        if (active) setIdentity(employee.data)
        return
      }
      const recentHire = await supabase.from("nuevo_ingreso").select("nombre,puesto").eq("numero", numeroEmpleado).limit(1)
      if (active) setIdentity(recentHire.data?.[0] ?? null)
    }
    void loadIdentity()
    return () => { active = false }
  }, [loadRecords, numeroEmpleado])

  useEffect(() => {
    const monthValues = emptyByCategory(0)
    const monthNotes = emptyByCategory("")
    for (const record of records) {
      if (record.mes !== selectedMonth || !INCIDENCIA_CATEGORIES.includes(record.categoria)) continue
      monthValues[record.categoria] = record.valor
      monthNotes[record.categoria] = record.notas ?? ""
    }
    setValues(monthValues)
    setNotes(monthNotes)
    setDirty(false)
  }, [records, selectedMonth])

  const months = Array.from(new Set(records.map(record => record.mes))).sort().reverse()
  const total = Object.values(values).reduce((sum, value) => sum + value, 0)
  const notedCategories = INCIDENCIA_CATEGORIES.filter(category => values[category] > 0 || notes[category].trim())

  const changeValue = (category: IncidenciaCategory, raw: string) => {
    const value = raw === "" ? 0 : Number(raw)
    if (!Number.isInteger(value) || value < 0) return
    setValues(previous => ({ ...previous, [category]: value }))
    setDirty(true)
  }

  const save = async () => {
    if (!dirty) return
    const result = await saveMonth(numeroEmpleado, selectedMonth, values, notes)
    if (result.success) {
      setDirty(false)
      await loadRecords()
    }
  }

  const confirmDiscard = () => notify.confirm({
    title: "Descartar cambios",
    description: "Los cambios de este mes no se han guardado.",
    confirmLabel: "Descartar",
    tone: "warning",
    size: "xs",
  })

  const selectMonth = async (month: string) => {
    if (month === selectedMonth || saving) return
    if (dirty && !(await confirmDiscard())) return
    setSelectedMonth(month)
  }

  return (
    <div className="space-y-6">
      <Link
        href={returnTo}
        onClick={event => {
          if (!dirty) return
          event.preventDefault()
          void (async () => { if (await confirmDiscard()) router.push(returnTo) })()
        }}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft className="size-4" aria-hidden="true" /> Volver
      </Link>

      <header className="min-w-0 space-y-1">
        <p className="text-sm text-muted-foreground">Núm. {numeroEmpleado}</p>
        <h2 className="break-words text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{identity?.nombre ?? "Empleado"}</h2>
        {identity?.puesto && <p className="text-sm text-muted-foreground">{identity.puesto}</p>}
      </header>

      <section aria-labelledby="incidencias-periodo" className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex flex-wrap items-center gap-3">
            <h3 id="incidencias-periodo" className="text-xl font-semibold tracking-tight text-foreground">{formatMes(selectedMonth)}</h3>
            <Badge variant="outline" className="border-border bg-card font-medium text-muted-foreground">
              {total} {total === 1 ? "incidencia" : "incidencias"}
            </Badge>
          </div>
          <nav aria-label="Cambiar mes" className="flex items-center gap-2">
            <Button type="button" variant="outline" size="icon" className="h-11 w-11" disabled={saving} onClick={() => void selectMonth(shiftMonth(selectedMonth, -1))} aria-label="Mes anterior">
              <ChevronLeft aria-hidden="true" />
            </Button>
            <Button type="button" variant="outline" size="icon" className="h-11 w-11" disabled={saving} onClick={() => void selectMonth(shiftMonth(selectedMonth, 1))} aria-label="Mes siguiente">
              <ChevronRight aria-hidden="true" />
            </Button>
          </nav>
        </div>

        {error && (
          <Alert variant="destructive" role="alert">
            <AlertTriangle className="size-4" aria-hidden="true" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground" role="status">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Cargando incidencias...
          </div>
        ) : (
          <form onSubmit={event => { event.preventDefault(); void save() }} className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {INCIDENCIA_CATEGORIES.map((category, index) => {
                const id = `${fieldId}-${index}`
                return (
                  <div key={category} className="flex min-w-0 items-center justify-between gap-3 rounded-md border border-border bg-card p-4">
                    <Label htmlFor={id} className={`min-w-0 text-sm font-medium ${CATEGORY_META[category].color}`} title={category}>
                      {CATEGORY_META[category].shortLabel}
                    </Label>
                    <Input id={id} type="number" min={0} step={1} inputMode="numeric" value={values[category] || ""} onChange={event => changeValue(category, event.target.value)} placeholder="0" className="h-10 w-20 shrink-0 bg-background text-center" />
                  </div>
                )
              })}
            </div>

            {notedCategories.length > 0 && (
              <details className="group border-t border-border pt-5">
                <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <NotebookPen className="size-4 text-muted-foreground" aria-hidden="true" /> Notas por categoría
                </summary>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {notedCategories.map((category, index) => {
                    const id = `${fieldId}-note-${index}`
                    return (
                      <div key={category} className="space-y-2">
                        <Label htmlFor={id} className="text-sm">{CATEGORY_META[category].shortLabel}</Label>
                        <Input id={id} value={notes[category]} onChange={event => { setNotes(previous => ({ ...previous, [category]: event.target.value })); setDirty(true) }} placeholder="Nota opcional" />
                      </div>
                    )
                  })}
                </div>
              </details>
            )}

            <div className="flex justify-end border-t border-border pt-5">
              <Button type="submit" disabled={!dirty || saving} className="w-full sm:w-auto">
                {saving ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Check className="size-4" aria-hidden="true" />}
                Guardar cambios
              </Button>
            </div>
          </form>
        )}
      </section>

      {months.length > 0 && (
        <section aria-labelledby="incidencias-historial" className="space-y-3">
          <h3 id="incidencias-historial" className="text-base font-semibold text-foreground">Historial de meses</h3>
          <div className="flex flex-wrap gap-2">
            {months.map(month => {
              const monthTotal = records.filter(record => record.mes === month).reduce((sum, record) => sum + record.valor, 0)
              return (
                <Button key={month} type="button" variant={month === selectedMonth ? "default" : "outline"} size="sm" disabled={saving} onClick={() => void selectMonth(month)} aria-current={month === selectedMonth ? "date" : undefined}>
                  {formatMes(month)} <span className="opacity-70">({monthTotal})</span>
                </Button>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
